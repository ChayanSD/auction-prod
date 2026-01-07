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

interface InvoiceCreatedEventData {
  invoiceId: string;
  invoiceNumber: string;
  auctionId: string;
  auctionName: string;
  totalAmount: number;
  sentAt: string;
}

interface PaymentSuccessEventData {
  invoiceId: string;
  invoiceNumber: string;
  userName: string;
  userEmail: string;
  totalAmount: number;
  auctionName: string;
  itemsCount: number;
  paidAt: string;
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
          £{data.amount} by {data.userName}
        </div>,
        {
          autoClose: 8000,
        }
      );
      
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const notification = new Notification(`New Bid: £${data.amount}`, {
            body: `By ${data.userName} on ${data.auctionItemName}`,
            icon: '/favicon.ico',
            requireInteraction: true,
          });
          notification.onclick = () => {
             window.focus();
             notification.close();
          };
        } catch (e) {
          console.error("AdminBidNotification: Error showing notification", e);
        }
      }
    });

    channel.bind('invoice-created', (data: InvoiceCreatedEventData) => {
      toast.success(
        <div>
          <strong>Invoice Generated</strong>
          <br />
          Invoice {data.invoiceNumber} for {data.auctionName} - £{data.totalAmount.toFixed(2)}
        </div>,
        {
          autoClose: 8000,
        }
      );
    });

    channel.bind('payment-success', (data: PaymentSuccessEventData) => {
      toast.success(
        <div>
          <strong>Payment Received</strong>
          <br />
          {data.userName} paid invoice {data.invoiceNumber} - £{data.totalAmount.toFixed(2)}
        </div>,
        {
          autoClose: 8000,
        }
      );
      
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const notification = new Notification(`Payment Received: £${data.totalAmount.toFixed(2)}`, {
            body: `${data.userName} paid invoice ${data.invoiceNumber}`,
            icon: '/favicon.ico',
            requireInteraction: true,
          });
          notification.onclick = () => {
             window.focus();
             notification.close();
          };
        } catch (e) {
          console.error("AdminBidNotification: Error showing notification", e);
        }
      }
    });

    return () => {
      pusherClient.unsubscribe('admin-notifications');
    };
  }, []);

  return null;
}
