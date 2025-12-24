'use client';

import React, { useState, useEffect } from 'react';

interface SortProps {
  totalItems?: number;
}

/**
 * Sort Component
 * Matching original SortingComp design
 * Mobile responsive with proper spacing
 */
const Sort: React.FC<SortProps> = ({ totalItems = 530 }) => {
  const [sort, setSort] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const filterData = {
      sort: sort,
      value: value
    };
    console.log('Selected Filters:', filterData);
  }, [sort, value]);

  const sortBy = ['Most lots', 'Less Lot', 'Ended'];
  const byValue = ['Highest value', 'Lowest value'];

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-5 text-[#4D4D4D] text-base sm:text-lg font-semibold mb-4 sm:mb-0">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 items-start sm:items-center">
        <h2 className="text-base sm:text-lg font-semibold text-[#0E0E0E]">{totalItems} auctions</h2>
        <div className="flex gap-2 items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isLive}
              onChange={() => setIsLive(!isLive)}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9F13FB]"></div>
          </label>
          <h2 className={`text-base sm:text-lg font-semibold ${isLive ? 'text-[#0E0E0E]' : 'text-[#4D4D4D]'}`}>
            Now Live
          </h2>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex gap-1 items-center">
          <h2 className="text-base sm:text-lg font-semibold text-[#4D4D4D]">Sort by:</h2>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-[#0E0E0E] font-semibold bg-transparent border-none focus:outline-none cursor-pointer text-sm sm:text-base"
          >
            {sortBy.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-1 items-center">
          <h2 className="text-base sm:text-lg font-semibold text-[#4D4D4D]">by value:</h2>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="text-[#0E0E0E] font-semibold bg-transparent border-none focus:outline-none cursor-pointer text-sm sm:text-base"
          >
            {byValue.map((option) => (
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

export default Sort;

