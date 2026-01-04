'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/fetcher';
import { Bell, X, Check } from 'lucide-react';

interface Notification {
  id: string;
  type: 'Invoice' | 'BidUpdate' | 'AuctionEnded' | 'Outbid';
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose, buttonRef: externalButtonRef }) => {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Notification[]>('/notifications?limit=10');
      setNotifications(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dropdown is open on mobile
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Get button position for absolute positioning on desktop
  useEffect(() => {
    if (isOpen && externalButtonRef?.current) {
      const rect = externalButtonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen, externalButtonRef]);

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.patch('/notifications', {
        notificationId,
        read: true,
      });
      
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications', {
        markAllAsRead: true,
      });
      
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.link) {
      router.push(notification.link);
      onClose();
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Invoice':
        return '💰';
      case 'BidUpdate':
      case 'Outbid':
        return '📊';
      case 'AuctionEnded':
        return '🏁';
      default:
        return '🔔';
    }
  };

  if (!isOpen || !mounted) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const dropdownContent = (
    <>
      {/* Backdrop for mobile */}
      <div 
        className="fixed inset-0 bg-black/20 z-[99998] sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dropdownRef}
        className="fixed right-2 sm:right-auto top-16 sm:top-auto w-[calc(100vw-1rem)] sm:w-80 md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-[99999] max-h-[calc(100vh-5rem)] sm:max-h-[500px] flex flex-col"
        style={{
          ...(typeof window !== 'undefined' && window.innerWidth >= 640 && position.top > 0
            ? {
                top: `${position.top}px`,
                right: `${position.right}px`,
              }
            : {}),
        }}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0" />
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-purple-600 text-white text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap"
            >
              <span className="hidden sm:inline">Mark all read</span>
              <span className="sm:hidden">Read all</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Bell className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left p-3 sm:p-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-purple-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="text-xl sm:text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-xs sm:text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-700'} truncate`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2 break-words">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-2 sm:p-3 border-t border-gray-200">
          <button
            onClick={() => {
              router.push('/profile?section=My Invoices');
              onClose();
            }}
            className="w-full text-center text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-medium py-1"
          >
            View all
          </button>
        </div>
      )}
    </div>
    </>
  );

  // Render using portal to ensure it's above everything
  return createPortal(dropdownContent, document.body);
};

export default NotificationDropdown;

