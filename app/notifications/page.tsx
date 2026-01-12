"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Calendar, Clock, ChevronRight, Inbox } from "lucide-react";
import { apiClient } from "@/lib/fetcher";
import { useUser } from "@/contexts/UserContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  type: "Invoice" | "BidUpdate" | "AuctionEnded" | "Outbid";
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}

export default function NotificationsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const fetchNotifications = useCallback(
    async (page = 1, currentFilter = filter) => {
      try {
        setLoading(true);
        // Only clear notifications if we are fetching the first page of a NEW filter
        if (page === 1) {
          // If we already have notifications, don't clear them immediately to avoid flash of loader
          // unless it's the very first load
        }

        let readParam = "";
        if (currentFilter === "unread") readParam = "&read=false";
        else if (currentFilter === "read") readParam = "&read=true";

        const data = await apiClient.get<NotificationsResponse>(
          `/notifications?limit=15&page=${page}${readParam}`
        );

        if (data) {
          if (page === 1) {
            setNotifications(data.notifications);
          } else {
            setNotifications((prev) => [...prev, ...data.notifications]);
          }
          setUnreadCount(data.unreadCount);
          setTotalPages(data.totalPages);
          setCurrentPage(data.page);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchNotifications(1, filter);
    }
  }, [user, userLoading, router, filter, fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.patch("/notifications", {
        notificationId: id,
        read: true,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.patch("/notifications", { markAllRead: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  if (userLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="grow container mx-auto px-4 py-8 mt-24">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Notifications
              </h1>
              <p className="text-gray-500 mt-1">
                Stay updated with your latest bids, invoices, and activity.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-[#9F13FB] hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-3 text-sm font-semibold transition-colors relative ${
                filter === "all"
                  ? "text-[#9F13FB]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All Activity
              {filter === "all" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9F13FB]" />
              )}
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
                filter === "unread"
                  ? "text-[#9F13FB]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
              {filter === "unread" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9F13FB]" />
              )}
            </button>
            <button
              onClick={() => setFilter("read")}
              className={`px-4 py-3 text-sm font-semibold transition-colors relative ${
                filter === "read"
                  ? "text-[#9F13FB]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Read
              {filter === "read" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9F13FB]" />
              )}
            </button>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading && notifications.length === 0 ? (
              <div className="py-20 text-center">
                <div className="animate-spin w-8 h-8 border-3 border-[#9F13FB] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm font-medium">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-20 px-4 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Inbox className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  No notifications yet
                </h3>
                <p className="text-gray-500 mt-2 max-w-xs mx-auto text-sm">
                  {filter === "unread"
                    ? "You have no unread notifications at the moment."
                    : filter === "read"
                    ? "You haven't read any notifications yet."
                    : "When you have activity on your account, you'll see it here."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      relative p-5 md:p-6 hover:bg-gray-50/80 transition-all cursor-pointer group
                      ${!notification.read ? "bg-[#9F13FB]/5" : ""}
                    `}
                  >
                    <div className="flex gap-4 md:gap-6">
                      {/* Indicator */}
                      <div className="mt-1.5 shrink-0">
                        <div
                          className={`
                          w-3 h-3 rounded-full 
                          ${
                            !notification.read
                              ? "bg-[#9F13FB] ring-4 ring-[#9F13FB]/10 shadow-[0_0_10px_rgba(159,19,251,0.3)]"
                              : "bg-gray-200"
                          }
                        `}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3
                              className={`text-base md:text-lg font-bold tracking-tight ${
                                !notification.read
                                  ? "text-gray-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <p className="text-gray-600 mt-1 leading-relaxed text-sm md:text-base">
                              {notification.message}
                            </p>
                          </div>

                          <div className="shrink-0 text-right hidden sm:block">
                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" />
                              {getRelativeTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-400 sm:hidden flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {getRelativeTime(notification.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="text-xs font-semibold text-[#9F13FB] hover:underline px-2 py-1"
                              >
                                Mark as read
                              </button>
                            )}
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#9F13FB] transform group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination / Load More */}
            {currentPage < totalPages && (
              <div className="p-6 text-center border-t border-gray-100 bg-gray-50/30">
                <button
                  onClick={() => fetchNotifications(currentPage + 1)}
                  disabled={loading}
                  className="px-8 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load more notifications"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
