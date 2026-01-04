'use client';

import { useEffect } from 'react';
import { pusherClient } from '@/lib/pusher-client';
import { toast } from 'react-toastify';

interface BidNotificationData {
  amount: number;
  userName: string;
  auctionItemName: string;
  auctionItemId: string;
  timestamp: string;
}

export default function AdminBidNotification() {
  useEffect(() => {
    console.log("AdminBidNotification: Component mounted");
    if (typeof window !== 'undefined' && 'Notification' in window) {
      console.log("AdminBidNotification: Requesting permission. Current state:", Notification.permission);
      Notification.requestPermission().then((permission) => {
        console.log("AdminBidNotification: Permission request result:", permission);
      });
    } else {
      console.warn("AdminBidNotification: Browser does not support Notifications");
    }

    console.log("AdminBidNotification: Subscribing to admin-notifications channel");
    const channel = pusherClient.subscribe('admin-notifications');

    channel.bind('new-bid', (data: BidNotificationData) => {
      console.log("AdminBidNotification: Received new-bid event", data);
      
      toast.info(
        <div>
          <strong>New Bid on {data.auctionItemName}</strong>
          <br />
          ${data.amount} by {data.userName}
        </div>,
        {
          autoClose: 8000,
        }
      );
      
      console.log("AdminBidNotification: Checking permission for system notification. Permission:", Notification.permission);
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        console.log("AdminBidNotification: Attempting to show system notification");
        try {
          const notification = new Notification(`New Bid: $${data.amount}`, {
            body: `By ${data.userName} on ${data.auctionItemName}`,
            icon: '/favicon.ico',
            requireInteraction: true,
          });
          notification.onclick = () => {
             console.log("AdminBidNotification: Notification clicked");
             window.focus();
             notification.close();
          };
        } catch (e) {
          console.error("AdminBidNotification: Error showing notification", e);
        }
      } else {
        console.warn("AdminBidNotification: System notification skipped. Permission:", Notification.permission);
      }
    });

    return () => {
      pusherClient.unsubscribe('admin-notifications');
    };
  }, []);

  return null;
}
