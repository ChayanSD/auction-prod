'use client';

import React, { useState } from 'react';
import type { SortOptions } from '@/types/auction.types';

interface SortHeaderProps {
  totalItems: number;
  sortOptions: SortOptions;
  onSortChange: (options: SortOptions) => void;
  isLive: boolean;
  onLiveToggle: (isLive: boolean) => void;
}

/**
 * Sort Header Component
 * Displays item count, live toggle, and sort dropdowns
 * Pixel-perfect design for laptop screens
 */
const SortHeader: React.FC<SortHeaderProps> = ({
  totalItems,
  sortOptions,
  onSortChange,
  isLive,
  onLiveToggle
}) => {
  const sortByOptions: SortOptions['sortBy'][] = ['Most Lot', 'Less Lot', 'Ended', 'Most Popular', 'Most Relevant'];
  const byValueOptions: SortOptions['byValue'][] = ['Highest', 'Lowest'];

  return (
    <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-5 mb-6 text-[#4D4D4D] text-lg font-semibold">
      {/* Left Section: Count and Live Toggle */}
      <div className="flex gap-5 items-center">
        <h2 className="text-lg font-semibold text-[#0E0E0E]">{totalItems} auctions</h2>
        <div className="flex gap-2 items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isLive}
              onChange={(e) => onLiveToggle(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9F13FB]"></div>
          </label>
          <h2 className={`text-lg font-semibold ${isLive ? 'text-[#0E0E0E]' : 'text-[#4D4D4D]'}`}>
            Now Live
          </h2>
        </div>
      </div>

      {/* Right Section: Sort Dropdowns */}
      <div className="flex gap-4 items-center">
        <div className="flex gap-1 items-center">
          <h2 className="text-lg font-semibold text-[#4D4D4D]">Sort by:</h2>
          <select
            value={sortOptions.sortBy}
            onChange={(e) => onSortChange({ ...sortOptions, sortBy: e.target.value as SortOptions['sortBy'] })}
            className="text-[#0E0E0E] font-semibold bg-transparent border-none focus:outline-none cursor-pointer"
          >
            {sortByOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-1 items-center">
          <h2 className="text-lg font-semibold text-[#4D4D4D]">By Value:</h2>
          <select
            value={sortOptions.byValue}
            onChange={(e) => onSortChange({ ...sortOptions, byValue: e.target.value as SortOptions['byValue'] })}
            className="text-[#0E0E0E] font-semibold bg-transparent border-none focus:outline-none cursor-pointer"
          >
            {byValueOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SortHeader;

