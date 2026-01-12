"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronRight, Inbox } from "lucide-react";
import { apiClient } from "@/lib/fetcher";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

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

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(
    async (page = 1, currentFilter = filter) => {
      try {
        setLoading(true);
        const data = await apiClient.get<NotificationsResponse>(
          `/notifications?limit=20&page=${page}${
            currentFilter === "unread" ? "&read=false" : ""
          }`
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
    fetchNotifications(1, filter);
  }, [filter, fetchNotifications]);

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">System activity and user alerts.</p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-[#9F13FB] border-[#9F13FB]/20 hover:bg-[#9F13FB]/5 rounded-full px-4"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-semibold transition-colors relative ${
            filter === "all"
              ? "text-[#9F13FB]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Notifications
          {filter === "all" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9F13FB]" />
          )}
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 text-sm font-semibold transition-colors relative ${
            filter === "unread"
              ? "text-[#9F13FB]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="ml-1.5 bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
          {filter === "unread" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9F13FB]" />
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading && notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#9F13FB] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No notifications
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              {filter === "unread"
                ? "You've read all your notifications!"
                : "There are no notifications to show."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  p-4 md:p-5 hover:bg-gray-50/80 transition-all cursor-pointer group flex gap-4
                  ${!notification.read ? "bg-blue-50/30" : ""}
                `}
              >
                <div className="shrink-0 mt-1">
                  <div
                    className={`
                    w-2.5 h-2.5 rounded-full 
                    ${
                      !notification.read
                        ? "bg-[#9F13FB] shadow-[0_0_8px_rgba(159,19,251,0.5)]"
                        : "bg-gray-200"
                    }
                  `}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          !notification.read ? "text-gray-900" : "text-gray-700"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-gray-400 whitespace-nowrap">
                      {getRelativeTime(notification.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="text-[11px] font-bold text-[#9F13FB] hover:underline mr-4"
                      >
                        Mark as read
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#9F13FB] transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {currentPage < totalPages && (
          <div className="p-4 text-center border-t border-gray-100 bg-gray-50/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNotifications(currentPage + 1)}
              disabled={loading}
              className="text-gray-600 font-bold hover:text-[#9F13FB]"
            >
              {loading ? "Loading..." : "Load more notifications"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
