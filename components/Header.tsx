"use client";
// components/Header.js
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, User, Search, Menu, X, LogOut, Bell } from 'lucide-react';
import NotificationDropdown from './Header/NotificationDropdown';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/fetcher';

const Header = () => {
  const { user, logout, loading } = useUser();
  // console.log("Current User:", user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const desktopNotificationButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNotificationButtonRef = useRef<HTMLButtonElement>(null);

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
        const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
        setUnreadCount(response.count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, loading]);

  // Refresh count when notification dropdown closes
  useEffect(() => {
    if (!isNotificationOpen && user && !loading) {
      const fetchUnreadCount = async () => {
        try {
          const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
          setUnreadCount(response.count || 0);
        } catch (error) {
          console.error('Error fetching unread count:', error);
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
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable scrolling
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup function
    return () => {
      if (isMenuOpen) {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      }
    };
  }, [isMenuOpen]);

  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <>
      {/* Fixed Header with width constraint */}
      <div className=" flex justify-center w-full bg-[#F7F7F7] fixed top-0 left-0 z-[9999]">
        <div className="w-full max-w-6xl px-8 xl:max-w-310 xl:px-0 overflow-hidden">
          <div className="py-3 container mx-auto  ">
            {/* Desktop layout - hidden on mobile */}
            <div className="hidden lg:flex flex-col items-center justify-end h-full w-full">
              <div className="flex items-center justify-between w-full   space-x-3">
                {/* Logo */}
                <div className="relative flex items-center">
                  <Link href="/" className='text-2xl text-[#0E0E0E] font-bold mr-5 cursor-pointer w-20'>
                    <img src="/logo.png" alt="SMBros Logo" />
                  </Link>
                </div>

                {/* Navigation Links - Centered */}
                <nav className="flex items-center space-x-8 flex-1 justify-center">
                  <Link href="/" className='text-[#0E0E0E] text-[16px] font-semibold cursor-pointer hover:text-purple-600 transition-colors'>
                    Home
                  </Link>
                  <Link href="/auction" className='text-[#0E0E0E] text-[16px] font-semibold cursor-pointer hover:text-purple-600 transition-colors'>
                    Auctions
                  </Link>
                  <Link href="/about" className='text-[#0E0E0E] text-[16px] font-semibold cursor-pointer hover:text-purple-600 transition-colors'>
                    About us
                  </Link>
                  <Link href="/contact" className='text-[#0E0E0E] text-[16px] font-semibold cursor-pointer hover:text-purple-600 transition-colors'>
                    Contact Us
                  </Link>
                </nav>

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
                          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                          className="bg-white hover:bg-gray-50 rounded-full p-2.5 shadow-lg border border-gray-200 w-10 h-10 flex items-center justify-center transition-colors cursor-pointer relative"
                          aria-label="Notifications"
                        >
                          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                          {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => router.push('/profile')}
                        className="bg-white hover:bg-gray-50 rounded-full p-2.5 shadow-lg border border-gray-200 w-10 h-10 flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="My Account"
                      >
                        <User className="w-5 h-5 text-gray-600" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => router.push('/login')} className='text-[#0E0E0E] text-[16px] font-semibold cursor-pointer hover:text-purple-600 transition-colors'>
                        Login
                      </button>
                      <button onClick={() => router.push('/signup')} className='text-white text-[16px] font-semibold px-6 py-3 rounded-full bg-[#0E0E0E] hover:bg-gray-800 cursor-pointer transition-colors'>
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
              <Link href="/" className='text-2xl text-[#0E0E0E] font-bold mr-5 ml-4 cursor-pointer w-20'>
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
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className="bg-white hover:bg-gray-50 rounded-full p-2.5 shadow-lg border border-gray-200 w-10 h-10 flex items-center justify-center transition-colors cursor-pointer relative"
                        aria-label="Notifications"
                      >
                        <Bell className="w-4 h-4 text-gray-600" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => router.push('/profile')}
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

            {/* Search */}
            <div className="mb-6">
              {/* <div className="relative">
                <input
                  type="text"
                  placeholder="Search auctions"
                  className="px-4 py-3 pr-24 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 w-full text-sm text-gray-700 placeholder-gray-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  <select className="text-sm bg-transparent border-none focus:outline-none text-gray-600 pr-1 cursor-pointer">
                    <option></option>
                    <option>Upcoming</option>
                    <option>Live</option>
                    <option>Ended</option>
                  </select>
                  <button className="bg-purple-500 hover:bg-purple-600 text-white rounded-full p-1.5 w-7 h-7 flex items-center justify-center transition-colors">
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div> */}
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

              {loading ? (
                // Show nothing while loading
                null
              ) : user ? (
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