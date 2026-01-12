"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, Check, X, Clock } from "lucide-react";
import { apiClient } from "@/lib/fetcher";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { pusherClient } from "@/lib/pusher-client";

interface Notification {
  id: string;
  type: "Invoice" | "BidUpdate" | "AuctionEnded" | "Outbid";
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  desktopButtonRef?: React.RefObject<HTMLButtonElement | null>;
  mobileButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  desktopButtonRef,
  mobileButtonRef,
}) => {
  const { user } = useUser();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false); // Default to false to avoid flash
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const [isCalculating, setIsCalculating] = useState(false);
  const loadingRef = useRef(false);

  const fetchNotifications = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial || notifications.length === 0) {
          setLoading(true);
        }
        loadingRef.current = true;

        const response = await apiClient.get<
          | { notifications: Notification[]; unreadCount: number }
          | Notification[]
        >("/notifications?limit=10");

        if (Array.isArray(response)) {
          setNotifications(response);
          const unread = response.filter((n: Notification) => !n.read).length;
          setUnreadCount(unread);
        } else if (response && response.notifications) {
          setNotifications(response.notifications);
          setUnreadCount(response.unreadCount || 0);
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [notifications.length]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(notifications.length === 0);
    }
  }, [isOpen, fetchNotifications, notifications.length]);

  const getActiveButtonRef = useCallback(() => {
    if (typeof window === "undefined") return null;
    const width = window.innerWidth;
    return width >= 1024 ? desktopButtonRef : mobileButtonRef;
  }, [desktopButtonRef, mobileButtonRef]);

  useEffect(() => {
    if (!user) return;
    const channelName = `user-${user.id}`;
    const channel = pusherClient.subscribe(channelName);
    const handleNewNotification = () => fetchNotifications();

    channel.bind("outbid", handleNewNotification);
    channel.bind("invoice-created", handleNewNotification);
    channel.bind("payment-success", handleNewNotification);

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      setIsCalculating(true);
      const updatePosition = () => {
        const activeButtonRef = getActiveButtonRef();
        if (activeButtonRef?.current) {
          const rect = activeButtonRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setPosition({
              top: rect.bottom + 8,
              right: window.innerWidth - rect.right,
            });
            setIsCalculating(false);
            return true;
          }
        }
        return false;
      };

      if (!updatePosition()) {
        const timeoutId = setTimeout(updatePosition, 10);
        return () => clearTimeout(timeoutId);
      }

      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    } else {
      setPosition({ top: 0, right: 0 });
      setIsCalculating(false);
    }
  }, [isOpen, getActiveButtonRef]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const activeButtonRef = getActiveButtonRef();
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        activeButtonRef?.current &&
        !activeButtonRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, getActiveButtonRef]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.patch("/notifications", { markAllRead: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id, {
        stopPropagation: () => {},
      } as React.MouseEvent);
    }
    onClose();
    if (notification.link) router.push(notification.link);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
  });
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setScreenSize({ isMobile: w < 640, isTablet: w >= 640 && w < 1024 });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!isOpen || !mounted) return null;

  const getStyles = (): React.CSSProperties => {
    if (screenSize.isMobile) {
      return {
        top: "4.5rem",
        right: "0.5rem",
        width: "calc(100vw - 1rem)",
        maxHeight: "calc(100vh - 5rem)",
      };
    }
    if (position.top > 0 && position.right > 0 && !isCalculating) {
      return {
        top: `${position.top}px`,
        right: `${position.right}px`,
        width: "24rem",
        maxWidth: "calc(100vw - 2rem)",
      };
    }
    return {
      top: "4.5rem",
      right: "1rem",
      width: "24rem",
      maxWidth: "calc(100vw - 2rem)",
    };
  };

  const content = (
    <div
      ref={dropdownRef}
      className="fixed bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-99999 animate-in fade-in zoom-in-95 duration-150"
      style={getStyles()}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-bold text-gray-900 text-base">Notifications</h3>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-bold text-[#9F13FB] hover:text-[#8e11e0] transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-[#9F13FB] border-t-transparent rounded-full mx-auto" />
            <p className="text-xs text-gray-400 mt-2">Updating...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer group relative ${
                  !n.read ? "bg-[#9F13FB]/5" : ""
                }`}
              >
                <div className="flex gap-4">
                  <div
                    className={`shrink-0 w-2 h-2 mt-2 rounded-full ${
                      !n.read
                        ? "bg-[#9F13FB] shadow-[0_0_8px_rgba(159,19,251,0.4)]"
                        : "bg-transparent"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-bold leading-tight ${
                        !n.read ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1 leading-snug">
                      {n.message}
                    </p>
                    <p className="text-[11px] font-medium text-gray-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-[#9F13FB] hover:bg-[#9F13FB]/10 rounded-full transition-all self-start"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/80">
        <button
          onClick={() => {
            router.push("/notifications");
            onClose();
          }}
          className="w-full py-2.5 bg-white border border-[#9F13FB]/20 rounded-xl text-sm font-bold text-[#9F13FB] hover:bg-white hover:shadow-md transition-all active:scale-[0.98]"
        >
          View all activity
        </button>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : null;
};

export default NotificationDropdown;
