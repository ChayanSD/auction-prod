'use client';

import React from 'react';

interface NavItem {
  label: string;
  icon?: string;
}

interface ProfileSidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'My Details', icon: '/myAccount/My Details.svg' },
  { label: 'My Bids', icon: '/myAccount/My Bids.svg' },
  { label: 'My Invoices', icon: '/myAccount/My Invoices.svg' },
];

/**
 * Profile Sidebar Component
 * Left navigation sidebar for My Account page
 * Pixel-perfect design matching Figma
 */
const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ activeItem, onItemClick }) => {
  return (
    <nav className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-5 shadow-sm">
      <ul className="space-y-2 text-sm">
        {NAV_ITEMS.map((item) => {
          const isActive = activeItem === item.label;
          return (
            <li key={item.label}>
              <button
                onClick={() => onItemClick(item.label)}
                className={`w-full flex items-center gap-3 rounded-full px-4 py-2 text-left transition ${
                  isActive
                    ? 'bg-gradient-to-r from-[#E253FF] to-[#9F13FB] text-white font-semibold shadow'
                    : 'text-[#0E0E0E] hover:bg-gray-100 font-medium'
                }`}
              >
                {item.icon && (
                  <img
                    src={item.icon}
                    alt={item.label}
                    className={`h-5 w-5 shrink-0 ${isActive ? '' : 'brightness-0'}`}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default ProfileSidebar;

