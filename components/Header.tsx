"use client";
// components/Header.js
import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  LogOut,
  Bell,
} from "lucide-react";
import NotificationDropdown from "./Header/NotificationDropdown";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/fetcher";
import { pusherClient } from "@/lib/pusher-client";

interface SearchResult {
  id: string;
  name: string;
  imageUrl: string | null;
  currentBid: number;
  bidCount: number;
  auctionName: string;
  auctionStatus: string;
}

const Header = () => {
  const { user, logout, loading } = useUser();
  // console.log("Current User:", user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const desktopNotificationButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNotificationButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Fetch unread notification count
  useEffect(() => {
    if (!user || loading) {
      if (!user) {
        // Use setTimeout to avoid synchronous setState
        setTimeout(() => setUnreadCount(0), 0);
      }
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const response = await apiClient.get<{ unreadCount: number }>(
          "/notifications?limit=1"
        );
        setUnreadCount(response.unreadCount || 0);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time updates
    const channelName = `user-${user.id}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("outbid", () => {
      fetchUnreadCount(); // Refresh count on new notification
    });

    channel.bind("invoice-created", () => {
      fetchUnreadCount(); // Refresh count on new invoice
    });

    channel.bind("payment-success", () => {
      fetchUnreadCount(); // Refresh count on payment success
    });

    if (user.accountType === "Admin") {
      const adminChannel = pusherClient.subscribe("admin-notifications");
      adminChannel.bind("new-bid", () => {
        fetchUnreadCount();
      });
      adminChannel.bind("invoice-created", () => {
        fetchUnreadCount();
      });
      adminChannel.bind("payment-success", () => {
        fetchUnreadCount();
      });
    }

    // Poll fallback every 60s
    const interval = setInterval(fetchUnreadCount, 60000);

    return () => {
      pusherClient.unsubscribe(channelName);
      if (user.accountType === "Admin") {
        pusherClient.unsubscribe("admin-notifications");
      }
      clearInterval(interval);
    };
  }, [user, loading]);

  // Refresh count when notification dropdown closes
  useEffect(() => {
    if (!isNotificationOpen && user && !loading) {
      const fetchUnreadCount = async () => {
        try {
          const response = await apiClient.get<{ unreadCount: number }>(
            "/notifications?limit=1"
          );
          setUnreadCount(response.unreadCount || 0);
        } catch (error) {
          console.error("Error fetching unread count:", error);
        }
      };
      fetchUnreadCount();
    }
  }, [isNotificationOpen, user, loading]);

  // Disable body scroll when sidebar is open
  useEffect(() => {
    if (isMenuOpen) {
      // Save the current scroll position
      const scrollY = window.scrollY;
      // Disable scrolling
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      // Re-enable scrolling
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    // Cleanup function
    return () => {
      if (isMenuOpen) {
        const scrollY = document.body.style.top;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || "0") * -1);
        }
      }
    };
  }, [isMenuOpen]);

  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/");
  };

  // Search functionality with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await apiClient.get<SearchResult[]>(
          `/search?q=${encodeURIComponent(searchQuery)}&limit=8`
        );
        setSearchResults(results || []);
        setIsSearchOpen(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  const handleSearchResultClick = (itemId: string) => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchOpen(false);
    router.push(`/auction-item/${itemId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      {/* Fixed Header with width constraint */}
      <div className=" flex justify-center w-full bg-[#F7F7F7] fixed top-0 left-0 z-[9999]">
        <div className="w-full max-w-6xl px-8 xl:max-w-310 xl:px-0">
          <div className="py-3 container mx-auto  ">
            {/* Desktop layout - hidden on mobile */}
            <div className="hidden lg:flex flex-col items-center justify-end h-full w-full">
              <div className="flex items-center justify-between w-full space-x-4">
                {/* Logo */}
                <div className="relative flex items-center shrink-0">
                  <Link
                    href="/"
                    className="text-2xl text-[#0E0E0E] font-bold mr-5 cursor-pointer w-20"
                  >
                    <img src="/logo.png" alt="SMBros Logo" />
                  </Link>
                </div>

                {/* Navigation Links - Centered */}
                <nav className="flex items-center space-x-6 xl:space-x-8 shrink-0">
                  <Link
                    href="/"
                    className="text-[#0E0E0E] text-[16px] font-semibold cursor-pointer hover:text-purple-600 transition-colors whitespace-nowrap"
                  >
                    Home
                  </Link>
                  <Link
                    href="/categories"
                    className="text-[#0E0E0E] text-[16px] font-semibold cursor-pointer hover:text-purple-600 transition-colors whitespace-nowrap"
                  >
                    Auctions
                  </Link>
                  <Link
                    href="/about"
                    className="text-[#0E0E0E] text-[16px] font-semibold cursor-pointer hover:text-purple-600 transition-colors whitespace-nowrap"
                  >
                    About us
                  </Link>
                  <Link
                    href="/contact"
                    className="text-[#0E0E0E] text-[16px] font-semibold cursor-pointer hover:text-purple-600 transition-colors whitespace-nowrap"
                  >
                    Contact Us
                  </Link>
                </nav>

                {/* Search Bar - Desktop */}
                <div className="relative flex-1 max-w-xs xl:max-w-md mx-2 xl:mx-4">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (searchQuery.trim().length > 0) {
                          setIsSearchOpen(true);
                        }
                      }}
                      className="w-full px-4 py-2 pl-10 pr-4 rounded-full border border-gray-300 bg-white text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    {isSearching ? (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : searchQuery ? (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>

                  {/* Search Results Dropdown */}
                  {isSearchOpen && (
                    <div
                      ref={searchResultsRef}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-[99999]"
                    >
                      {isSearching ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="inline-block w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="mt-2 text-sm">Searching...</p>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <>
                          <div className="p-2 border-b border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 uppercase">
                              {searchResults.length} result
                              {searchResults.length !== 1 ? "s" : ""} found
                            </p>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {searchResults.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleSearchResultClick(item.id)}
                                className="w-full p-3 hover:bg-gray-50 transition-colors text-left flex items-center space-x-3"
                              >
                                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "/placeholder.jpg";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                      No Image
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {item.auctionName}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs font-semibold text-purple-600">
                                      {formatCurrency(item.currentBid)}
                                    </span>
                                    {item.bidCount > 0 && (
                                      <span className="text-xs text-gray-500">
                                        • {item.bidCount} bid
                                        {item.bidCount !== 1 ? "s" : ""}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <p className="text-sm">No products found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User action buttons */}
                <div className="flex space-x-4 items-center">
                  {loading ? (
                    // Show nothing or a placeholder while loading
                    <div className="w-10 h-10"></div>
                  ) : user ? (
                    <>
                      {/* Notification Icon */}
                      <div className="relative">
                        <button
                          ref={desktopNotificationButtonRef}
                          onClick={() =>
                            setIsNotificationOpen(!isNotificationOpen)
                          }
                          className="bg-white hover:bg-gray-50 rounded-full p-2.5 shadow-lg border border-gray-200 w-10 h-10 flex items-center justify-center transition-colors cursor-pointer relative"
                          aria-label="Notifications"
                        >
                          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                          {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => router.push("/profile")}
                        className="bg-white hover:bg-gray-50 rounded-full p-2.5 shadow-lg border border-gray-200 w-10 h-10 flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="My Account"
                      >
                        <User className="w-5 h-5 text-gray-600" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push("/login")}
                        className="text-[#0E0E0E] text-[16px] font-semibold cursor-pointer hover:text-purple-600 transition-colors"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => router.push("/signup")}
                        className="text-white text-[16px] font-semibold px-6 py-3 rounded-full bg-[#0E0E0E] hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                  {/* <button className="bg-white hover:bg-gray-50 rounded-full p-2.5 shadow-lg border border-gray-200 w-10 h-10 flex items-center justify-center transition-colors cursor-pointer">
                    <ShoppingCart className="w-5 h-5 text-gray-600" />
                  </button> */}
                </div>
              </div>
            </div>

            {/* Mobile layout - visible only on mobile */}
            <div className="lg:hidden flex items-center justify-between w-full">
              {/* Logo on left */}
              <Link
                href="/"
                className="text-2xl text-[#0E0E0E] font-bold mr-5 ml-4 cursor-pointer w-20"
              >
                <img src="/logo.png" alt="SMBros Logo" />
              </Link>

              {/* User action buttons - Mobile */}
              <div className="flex items-center space-x-2">
                {loading ? (
                  <div className="w-10 h-10"></div>
                ) : user ? (
                  <>
                    {/* Notification Icon - Mobile */}
                    <div className="relative">
                      <button
                        ref={mobileNotificationButtonRef}
                        onClick={() =>
                          setIsNotificationOpen(!isNotificationOpen)
                        }
                        className="bg-white hover:bg-gray-50 rounded-full p-2.5 shadow-lg border border-gray-200 w-10 h-10 flex items-center justify-center transition-colors cursor-pointer relative"
                        aria-label="Notifications"
                      >
                        <Bell className="w-4 h-4 text-gray-600" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => router.push("/profile")}
                      className="bg-white hover:bg-gray-50 rounded-full p-2.5 shadow-lg border border-gray-200 w-10 h-10 flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="My Account"
                    >
                      <User className="w-4 h-4 text-gray-600" />
                    </button>
                  </>
                ) : null}
                {/* Hamburger button */}
                <button
                  onClick={toggleMenu}
                  className="bg-white hover:bg-gray-50 rounded-full p-2.5 shadow-lg border border-gray-200 w-10 h-10 flex items-center justify-center transition-colors"
                >
                  {isMenuOpen ? (
                    <X className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Menu className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header - adjusted height */}
      <div className="h-16 lg:h-20"></div>

      {/* Single NotificationDropdown - handles both desktop and mobile */}
      <NotificationDropdown
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        desktopButtonRef={desktopNotificationButtonRef}
        mobileButtonRef={mobileNotificationButtonRef}
      />

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[10000] bg-black/40 sidebar-overlay"
          onClick={toggleMenu}
        >
          <div
            className="absolute right-0 top-0 h-full w-full sm:w-80 md:w-1/2 lg:w-1/2 bg-white shadow-lg p-6 overflow-y-auto z-[10001] sidebar-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo and Close button */}
            <div className="flex items-center justify-between mb-6">
              {/* <Link href="/" onClick={toggleMenu} className='text-2xl text-[#0E0E0E] font-bold cursor-pointer'>
                <img src="/logo.png" alt="SMBros Logo" className="h-16" />
              </Link> */}
              <button
                onClick={toggleMenu}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Search - Mobile */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) {
                      setIsSearchOpen(true);
                    }
                  }}
                  className="px-4 py-3 pl-10 pr-4 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 w-full text-sm text-gray-700 placeholder-gray-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                {isSearching ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              {/* Search Results - Mobile */}
              {isSearchOpen && (
                <div className="mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="inline-block w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-2 text-sm">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="p-2 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 uppercase">
                          {searchResults.length} result
                          {searchResults.length !== 1 ? "s" : ""} found
                        </p>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {searchResults.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              handleSearchResultClick(item.id);
                              toggleMenu();
                            }}
                            className="w-full p-3 hover:bg-gray-50 transition-colors text-left flex items-center space-x-3"
                          >
                            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "/placeholder.jpg";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {item.auctionName}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs font-semibold text-purple-600">
                                  {formatCurrency(item.currentBid)}
                                </span>
                                {item.bidCount > 0 && (
                                  <span className="text-xs text-gray-500">
                                    • {item.bidCount} bid
                                    {item.bidCount !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No products found</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Menu items */}
            <div className="space-y-4">
              {/* Navigation Links */}
              <div className="space-y-2 pb-4 border-b border-gray-200">
                <Link
                  href="/"
                  onClick={toggleMenu}
                  className="block w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors text-gray-700 font-semibold"
                >
                  Home
                </Link>
                <Link
                  href="/auction"
                  onClick={toggleMenu}
                  className="block w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors text-gray-700 font-semibold"
                >
                  Auctions
                </Link>
                <Link
                  href="/about"
                  onClick={toggleMenu}
                  className="block w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors text-gray-700 font-semibold"
                >
                  About us
                </Link>
                <Link
                  href="/contact"
                  onClick={toggleMenu}
                  className="block w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors text-gray-700 font-semibold"
                >
                  Contact Us
                </Link>
              </div>

              {loading ? null : user ? ( // Show nothing while loading
                <>
                  <button
                    onClick={() => {
                      router.push("/profile");
                      toggleMenu();
                    }}
                    className="flex items-center space-x-3 w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">My Account</span>
                  </button>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="px-3 py-2 text-sm text-gray-600 mb-2">
                      Logged in as: {user.firstName || user.email}
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        toggleMenu();
                      }}
                      className="flex items-center space-x-3 w-full p-3 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      router.push("/login");
                      toggleMenu();
                    }}
                    className="flex items-center space-x-3 w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Login</span>
                  </button>
                  <button
                    onClick={() => {
                      router.push("/signup");
                      toggleMenu();
                    }}
                    className="block w-full mt-2 text-white font-semibold px-6 py-3 rounded-full bg-[#0E0E0E] hover:bg-gray-800 transition-colors"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
