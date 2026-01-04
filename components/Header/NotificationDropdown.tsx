'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check, X } from 'lucide-react';
import { apiClient } from '@/lib/fetcher';
import { useRouter } from 'next/navigation';

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ notifications: Notification[]; unreadCount: number } | Notification[]>('/notifications?limit=10');
      
      // Handle both response formats (array or object with notifications property)
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
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Calculate position for desktop/tablet
  useEffect(() => {
    if (isOpen && externalButtonRef?.current && typeof window !== 'undefined') {
      const updatePosition = () => {
        if (externalButtonRef?.current) {
          const rect = externalButtonRef.current.getBoundingClientRect();
          // For fixed positioning, use getBoundingClientRect directly (no scroll offset needed)
          const newPosition = {
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
          };
          setPosition(newPosition);
        }
      };

      // Initial position - try multiple times to ensure DOM is ready
      updatePosition();
      const timeoutId1 = setTimeout(updatePosition, 50);
      const timeoutId2 = setTimeout(updatePosition, 100);
      
      // Update on resize and scroll
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    } else {
      // Reset position when closed
      setPosition({ top: 0, right: 0 });
    }
  }, [isOpen, externalButtonRef]);

  // Handle outside click to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        externalButtonRef?.current &&
        !externalButtonRef.current.contains(target)
      ) {
        onClose();
      }
    }

    // Use setTimeout to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, externalButtonRef]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.patch('/notifications', { notificationId: id, read: true });
      
      // Optimistically update state
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications', { markAllRead: true });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await apiClient.patch('/notifications', { notificationId: notification.id, read: true });
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    onClose();
    
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (!isOpen || !mounted) return null;

  // Determine screen size
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024;

  // Calculate final position
  const getPosition = () => {
    if (isMobile) {
      return {
        top: '4.5rem',
        right: '0.5rem',
        width: 'calc(100vw - 1rem)',
        maxHeight: 'calc(100vh - 5rem)',
      };
    }
    
    // For tablet and desktop, use calculated position or fallback
    if (position.top > 0 && position.right > 0) {
      return {
        top: `${position.top}px`,
        right: `${position.right}px`,
        width: isTablet ? '22rem' : '20rem',
        maxWidth: '24rem',
        maxHeight: '500px',
      };
    }
    
    // Fallback positioning
    return {
      top: '4.5rem',
      right: '1rem',
      width: isTablet ? '22rem' : '20rem',
      maxWidth: '24rem',
      maxHeight: '500px',
    };
  };

  const dropdownContent = (
    <div 
      ref={dropdownRef}
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[99999]"
      style={getPosition()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-[#9F13FB] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-medium text-[#9F13FB] hover:text-[#E95AFF] transition-colors"
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

      <div className="max-h-[70vh] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-[#9F13FB] border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  relative p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer group
                  ${!notification.read ? 'bg-blue-50/30' : ''}
                `}
              >
                <div className="flex gap-3">
                  <div className={`
                    shrink-0 w-2 h-2 mt-2 rounded-full
                    ${!notification.read ? 'bg-[#9F13FB]' : 'bg-transparent'}
                  `} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-[#9F13FB] hover:bg-[#9F13FB]/10 rounded-full transition-all self-start shrink-0"
                      title="Mark as read"
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

      {notifications.length > 0 && (
        <div className="p-2 border-t border-gray-100 bg-gray-50/50 text-center">
          <button
            onClick={() => {
              router.push('/profile?section=My Invoices');
              onClose();
            }}
            className="text-sm font-medium text-gray-600 hover:text-[#9F13FB] transition-colors block w-full py-1"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );

  // Render using portal to ensure it's above everything and not clipped by overflow-hidden
  if (typeof document === 'undefined') return null;
  
  return createPortal(dropdownContent, document.body);
};

export default NotificationDropdown;
