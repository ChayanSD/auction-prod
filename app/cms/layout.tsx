"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { apiClient } from "@/lib/fetcher";
import toast, { Toaster } from "react-hot-toast";
import {
  Home,
  Hammer,
  Users,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MessageSquare,
  Package,
  Briefcase,
} from "lucide-react";
import AdminBidNotification from "@/components/admin/AdminBidNotification";
import NotificationDropdown from "@/components/admin/NotificationDropdown";

interface CMSLayoutProps {
  children: React.ReactNode;
}

interface CMSCounts {
  listingRequests: number;
  activeBids: number;
  pendingLogistics: number;
  users: number;
  auctions: number;
  contacts: number;
  unpaidPayments: number;
  pendingSellers: number;
}

export default function CMSLayout({ children }: CMSLayoutProps) {
  const { user, logout, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [counts, setCounts] = useState<CMSCounts>({
    listingRequests: 0,
    activeBids: 0,
    pendingLogistics: 0,
    users: 0,
    auctions: 0,
    contacts: 0,
    unpaidPayments: 0,
    pendingSellers: 0,
  });
  const [countsLoading, setCountsLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    if (!loading && user && user.accountType !== "Admin") {
      router.push("/");
    }
  }, [user, loading, router]);

  // Fetch counts for sidebar
  useEffect(() => {
    const fetchCounts = async () => {
      if (!user || user.accountType !== "Admin") return;

      try {
        setCountsLoading(true);
        const data = await apiClient.get<CMSCounts>("/cms/counts");
        setCounts(data);
      } catch (error) {
        console.error("Error fetching CMS counts:", error);
      } finally {
        setCountsLoading(false);
      }
    };

    fetchCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const menuItems = [
    { name: "Dashboard", href: "/cms/pannel", icon: Home, count: null },
    {
      name: "Auction Lot",
      href: "/cms/pannel/auctions",
      icon: Hammer,
      count: counts.auctions,
    },
    {
      name: "Bids",
      href: "/cms/pannel/bids",
      icon: Hammer,
      count: counts.activeBids,
    },
    {
      name: "Payments",
      href: "/cms/pannel/payments",
      icon: CreditCard,
      count: counts.unpaidPayments,
    },
    {
      name: "Users",
      href: "/cms/pannel/users",
      icon: Users,
      count: counts.users,
    },
    {
      name: "Sellers",
      href: "/cms/pannel/sellers",
      icon: Briefcase,
      count: counts.pendingSellers,
    },
    {
      name: "Listing Requests",
      href: "/cms/pannel/auction-requests",
      icon: MessageSquare,
      count: counts.listingRequests,
    },
    {
      name: "Logistics",
      href: "/cms/pannel/logistics",
      icon: Package,
      count: counts.pendingLogistics,
    },
    {
      name: "Contacts",
      href: "/cms/pannel/contacts",
      icon: MessageSquare,
      count: counts.contacts,
    },
    // { name: 'Settings', href: '/cms/pannel/settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9F13FB] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.accountType !== "Admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access this page.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-[#9F13FB] text-white rounded-full hover:bg-[#E95AFF] transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminBidNotification />
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30  z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${sidebarOpen ? "w-64" : "w-16"}
        bg-white shadow-xl border-r border-gray-200
        transition-all duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        overflow-hidden
      `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div
            className={`flex items-center space-x-3 ${!sidebarOpen && "justify-center"}`}
          >
            <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            {sidebarOpen && (
              <h2 className="font-bold text-xl text-gray-800">Admin CMS</h2>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon as any;
            const isActive = pathname === item.href;
            const showCount = item.count !== null && item.count !== undefined;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  relative flex items-center justify-start px-3 py-3 mb-1 rounded-xl transition-all duration-200
                  ${
                    isActive
                      ? "bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }
                  ${sidebarOpen ? "justify-start" : "justify-center"}
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="font-medium ml-3 flex-1 truncate">
                      {item.name}
                    </span>
                    {showCount && (
                      <span
                        className={`
                        ml-2 px-2 py-0.5 rounded-full text-xs font-bold min-w-6 text-center shrink-0
                        ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-purple-100 text-purple-700"
                        }
                      `}
                      >
                        {countsLoading ? "..." : item.count}
                      </span>
                    )}
                    {isActive && !showCount && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full shrink-0" />
                    )}
                  </>
                )}
                {!sidebarOpen && showCount && (
                  <span
                    className={`
                    absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                    bg-purple-500 text-white whitespace-nowrap shadow-lg border-2 border-white
                    min-w-[18px] h-[18px] flex items-center justify-center
                  `}
                  >
                    {countsLoading
                      ? "..."
                      : item.count && item.count > 99
                        ? "99+"
                        : item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Home and Logout Buttons */}
        <div className="absolute bottom-4 left-3 right-3 space-y-2">
          <Link
            href="/"
            className={`
              flex items-center justify-start w-full px-3 py-3 rounded-xl transition-all duration-200
              text-gray-700 hover:bg-gray-100 hover:text-gray-900
              ${sidebarOpen ? "justify-start" : "justify-center"}
            `}
          >
            <Home className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="font-medium ml-3">Home</span>}
          </Link>
          <button
            onClick={handleLogout}
            className={`
              flex items-center justify-start w-full px-3 py-3 rounded-xl transition-all duration-200
              text-red-600 hover:bg-red-50 hover:text-red-700
              ${sidebarOpen ? "justify-start" : "justify-center"}
            `}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="font-medium ml-3">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? "lg:ml-0" : "lg:ml-0"}`}
      >
        {/* Top Navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-800 truncate">
                Admin Panel
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-gray-600 font-medium text-sm">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </span>
                </div>
                <span className="text-gray-600 font-medium truncate max-w-32">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="hidden md:flex border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium items-center space-x-2 shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
              <button
                onClick={handleLogout}
                className="md:hidden p-2 rounded-lg hover:bg-gray-50 transition-all duration-200 text-gray-600 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shrink-0"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
