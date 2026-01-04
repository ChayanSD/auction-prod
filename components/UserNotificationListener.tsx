'use client';

import { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { pusherClient } from '@/lib/pusher-client';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface OutbidEventData {
  auctionItemName: string;
  newAmount: number;
  timestamp: string;
  link: string;
}

export default function UserNotificationListener() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const channelName = `user-${user.id}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind('outbid', (data: OutbidEventData) => {
      // Play a subtle sound if possible (optional, maybe later)
      
      toast((t) => (
        <div className="flex flex-col gap-2 min-w-[300px]">
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-red-600 animate-pulse">You've been outbid!</h3>
            <button 
              onClick={() => toast.dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-700">
            Someone placed a higher bid of <strong>£{data.newAmount}</strong> on <strong>{data.auctionItemName}</strong>.
          </p>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              router.push(data.link);
            }}
            className="mt-2 text-sm bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors w-full font-medium"
          >
            Bid Again Now
          </button>
        </div>
      ), {
        duration: 8000,
        position: 'top-right',
        style: {
          border: '1px solid #fee2e2',
          padding: '16px',
          background: '#fff',
        },
      });
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [user, router]);

  return null;
}
