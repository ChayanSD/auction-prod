'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/fetcher';

interface NavItem {
  label: string;
  icon?: string;
  countKey?: 'bids' | 'invoices';
}

interface ProfileSidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'My Details', icon: '/myAccount/My Details.svg' },
  { label: 'My Bids', icon: '/myAccount/My Bids.svg', countKey: 'bids' },
  { label: 'My Invoices', icon: '/myAccount/My Invoices.svg', countKey: 'invoices' },
];

/**
 * Profile Sidebar Component
 * Left navigation sidebar for My Account page
 * Pixel-perfect design matching Figma
 */
const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ activeItem, onItemClick }) => {
  const [counts, setCounts] = useState({ bids: 0, invoices: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch active bids count
        const bidsResponse = await apiClient.get<any[]>('/bid?userId=current');
        const bidsData = Array.isArray(bidsResponse) ? bidsResponse : [];
        const now = new Date();
        const activeBidsCount = bidsData.filter(bid => {
          const endDate = bid.auctionItem?.endDate 
            ? new Date(bid.auctionItem.endDate)
            : bid.auctionItem?.auction?.endDate 
            ? new Date(bid.auctionItem.auction.endDate)
            : null;
          return endDate && endDate >= now;
        }).length;

        // Fetch total invoices count (paid + unpaid)
        const invoicesResponse = await apiClient.get<any[]>('/invoice');
        const invoicesData = Array.isArray(invoicesResponse) ? invoicesResponse : [];
        const totalInvoicesCount = invoicesData.length;

        setCounts({
          bids: activeBidsCount,
          invoices: totalInvoicesCount,
        });
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-5 shadow-sm">
      <ul className="space-y-2 text-sm">
        {NAV_ITEMS.map((item) => {
          const isActive = activeItem === item.label;
          const count = item.countKey ? counts[item.countKey] : 0;
          return (
            <li key={item.label}>
              <button
                onClick={() => onItemClick(item.label)}
                className={`w-full flex items-center justify-between gap-3 rounded-full px-4 py-2 text-left transition ${
                  isActive
                    ? 'bg-gradient-to-r from-[#E253FF] to-[#9F13FB] text-white font-semibold shadow'
                    : 'text-[#0E0E0E] hover:bg-gray-100 font-medium'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {item.icon && (
                    <img
                      src={item.icon}
                      alt={item.label}
                      className={`h-5 w-5 shrink-0 ${isActive ? '' : 'brightness-0'}`}
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
                {count > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default ProfileSidebar;

