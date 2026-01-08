'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api';
import type { AuctionFilters } from '@/types/auction.types';

interface FilterSidebarProps {
  filters: AuctionFilters;
  onFilterChange: (filters: AuctionFilters) => void;
}

const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
    {isOpen ? (
      <path d="M16.258 12.9581C16.1033 13.1126 15.8936 13.1994 15.675 13.1994C15.4564 13.1994 15.2467 13.1126 15.092 12.9581L11 8.86612L6.90801 12.9581C6.83248 13.0392 6.74139 13.1042 6.64018 13.1493C6.53897 13.1944 6.4297 13.2186 6.31893 13.2206C6.20816 13.2225 6.09813 13.2022 5.9954 13.1607C5.89267 13.1192 5.79935 13.0574 5.72101 12.9791C5.64267 12.9007 5.58091 12.8074 5.53942 12.7047C5.49793 12.602 5.47755 12.4919 5.4795 12.3812C5.48146 12.2704 5.5057 12.1611 5.55079 12.0599C5.59588 11.9587 5.66089 11.8677 5.74201 11.7921L10.417 7.11714C10.5717 6.96261 10.7814 6.87582 11 6.87582C11.2186 6.87582 11.4283 6.96261 11.583 7.11714L16.258 11.7921C16.4125 11.9468 16.4993 12.1565 16.4993 12.3751C16.4993 12.5938 16.4125 12.8034 16.258 12.9581Z" fill="#0E0E0E" />
    ) : (
      <path d="M5.74201 9.04188C5.89669 8.88738 6.10638 8.8006 6.32501 8.8006C6.54363 8.8006 6.75332 8.88738 6.90801 9.04188L11 13.1339L15.092 9.04188C15.1675 8.96082 15.2586 8.89581 15.3598 8.85072C15.461 8.80563 15.5703 8.78138 15.681 8.77943C15.7918 8.77747 15.9018 8.79785 16.0046 8.83934C16.1073 8.88083 16.2006 8.94259 16.2789 9.02093C16.3573 9.09927 16.419 9.19259 16.4605 9.29532C16.502 9.39805 16.5224 9.50808 16.5205 9.61885C16.5185 9.72962 16.4943 9.83887 16.4492 9.94007C16.4041 10.0413 16.3391 10.1323 16.258 10.2079L11.583 14.8829C11.4283 15.0374 11.2186 15.1242 11 15.1242C10.7814 15.1242 10.5717 15.0374 10.417 14.8829L5.74201 10.2079C5.58751 10.0532 5.50073 9.8435 5.50073 9.62488C5.50073 9.40625 5.58751 9.19656 5.74201 9.04188Z" fill="#0E0E0E" />
    )}
  </svg>
);

/**
 * Advanced Filters Sidebar Component
 * Pixel-perfect design for laptop screens
 * Width: 334px (from Figma)
 */
const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, onFilterChange }) => {
  const [isOpenLocation, setIsOpenLocation] = useState(true);
  const [isOpenCategory, setIsOpenCategory] = useState(true);
  const [isOpenDateRange, setIsOpenDateRange] = useState(true);
  const [isOpenAuctionStatus, setIsOpenAuctionStatus] = useState(true);
  const [isOpenAuctionHouse, setIsOpenAuctionHouse] = useState(true);
  const [isOpenBrandName, setIsOpenBrandName] = useState(true);

  const countries = [
    'United Kingdom', 'Germany', 'France', 'Italy', 'Spain',
    'United States', 'Canada', 'Mexico',
    'China', 'Japan', 'India', 'Bangladesh', 'South Korea', 'Indonesia'
  ];

  // Fetch auctions from backend
  const { data: auctions = [], isLoading: auctionsLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/auction`, { withCredentials: true });
      // API returns array directly, not wrapped in success/data object
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  // Status filter options (mapped to item/auction status in AuctionPage)
  const auctionStatuses = [
    { label: 'Live', value: 'Live', displayLabel: 'Live' },
    { label: 'Upcoming', value: 'Upcoming', displayLabel: 'Upcoming' },
    { label: 'Closed', value: 'Closed', displayLabel: 'Closed' },
  ];

  const auctionHouses = [
    { label: 'Brighton Auction House', count: 43 },
    { label: 'Los Angeles Auction House', count: 456 },
    { label: 'Paris Auction House', count: 687 },
    { label: 'London Auction House', count: 678 },
    { label: 'New York Auction House', count: 678 },
  ];

  const handleFilterChange = (key: keyof AuctionFilters, value: unknown) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="w-full md:w-80 border-[#E3E3E3] md:border-r-[1px] md:pr-5 overflow-hidden">
      {/* Advanced Filters Header */}
      <div className="flex gap-2 sm:gap-3 border-b-2 border-b-[#E3E3E3] pb-2.5 mb-4 sm:mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="30" viewBox="0 0 28 30" fill="none">
          <path d="M14.875 14.0938V24.9688C14.875 25.2091 14.7828 25.4396 14.6187 25.6096C14.4546 25.7795 14.2321 25.875 14 25.875C13.7679 25.875 13.5454 25.7795 13.3813 25.6096C13.2172 25.4396 13.125 25.2091 13.125 24.9688V14.0938C13.125 13.8534 13.2172 13.6229 13.3813 13.4529C13.5454 13.283 13.7679 13.1875 14 13.1875C14.2321 13.1875 14.4546 13.283 14.6187 13.4529C14.7828 13.6229 14.875 13.8534 14.875 14.0938ZM21.875 22.25C21.6429 22.25 21.4204 22.3455 21.2563 22.5154C21.0922 22.6854 21 22.9159 21 23.1562V24.9688C21 25.2091 21.0922 25.4396 21.2563 25.6096C21.4204 25.7795 21.6429 25.875 21.875 25.875C22.1071 25.875 22.3296 25.7795 22.4937 25.6096C22.6578 25.4396 22.75 25.2091 22.75 24.9688V23.1562C22.75 22.9159 22.6578 22.6854 22.4937 22.5154C22.3296 22.3455 22.1071 22.25 21.875 22.25ZM24.5 16.8125H22.75V5.03125C22.75 4.7909 22.6578 4.56039 22.4937 4.39043C22.3296 4.22048 22.1071 4.125 21.875 4.125C21.6429 4.125 21.4204 4.22048 21.2563 4.39043C21.0922 4.56039 21 4.7909 21 5.03125V16.8125H19.25C19.0179 16.8125 18.7954 16.908 18.6313 17.0779C18.4672 17.2479 18.375 17.4784 18.375 17.7188V19.5312C18.375 19.7716 18.4672 20.0021 18.6313 20.1721C18.7954 20.342 19.0179 20.4375 19.25 20.4375H24.5C24.7321 20.4375 24.9546 20.342 25.1187 20.1721C25.2828 20.0021 25.375 19.7716 25.375 19.5312V17.7188C25.375 17.4784 25.2828 17.2479 25.1187 17.0779C24.9546 16.908 24.7321 16.8125 24.5 16.8125ZM6.125 18.625C5.89294 18.625 5.67038 18.7205 5.50628 18.8904C5.34219 19.0604 5.25 19.2909 5.25 19.5312V24.9688C5.25 25.2091 5.34219 25.4396 5.50628 25.6096C5.67038 25.7795 5.89294 25.875 6.125 25.875C6.35706 25.875 6.57962 25.7795 6.74372 25.6096C6.90781 25.4396 7 25.2091 7 24.9688V19.5312C7 19.2909 6.90781 19.0604 6.74372 18.8904C6.57962 18.7205 6.35706 18.625 6.125 18.625ZM8.75 13.1875H7V5.03125C7 4.7909 6.90781 4.56039 6.74372 4.39043C6.57962 4.22048 6.35706 4.125 6.125 4.125C5.89294 4.125 5.67038 4.22048 5.50628 4.39043C5.34219 4.56039 5.25 4.7909 5.25 5.03125V13.1875H3.5C3.26794 13.1875 3.04538 13.283 2.88128 13.4529C2.71719 13.6229 2.625 13.8534 2.625 14.0938V15.9062C2.625 16.1466 2.71719 16.3771 2.88128 16.5471C3.04538 16.717 3.26794 16.8125 3.5 16.8125H8.75C8.98206 16.8125 9.20462 16.717 9.36872 16.5471C9.53281 16.3771 9.625 16.1466 9.625 15.9062V14.0938C9.625 13.8534 9.53281 13.6229 9.36872 13.4529C9.20462 13.283 8.98206 13.1875 8.75 13.1875ZM16.625 7.75H14.875V5.03125C14.875 4.7909 14.7828 4.56039 14.6187 4.39043C14.4546 4.22048 14.2321 4.125 14 4.125C13.7679 4.125 13.5454 4.22048 13.3813 4.39043C13.2172 4.56039 13.125 4.7909 13.125 5.03125V7.75H11.375C11.1429 7.75 10.9204 7.84548 10.7563 8.01543C10.5922 8.18539 10.5 8.4159 10.5 8.65625V10.4688C10.5 10.7091 10.5922 10.9396 10.7563 11.1096C10.9204 11.2795 11.1429 11.375 11.375 11.375H16.625C16.8571 11.375 17.0796 11.2795 17.2437 11.1096C17.4078 10.9396 17.5 10.7091 17.5 10.4688V8.65625C17.5 8.4159 17.4078 8.18539 17.2437 8.01543C17.0796 7.84548 16.8571 7.75 16.625 7.75Z" fill="#4D4D4D" />
        </svg>
        <h5 className="font-bold text-lg sm:text-xl text-[#4D4D4D]">Advanced Filters</h5>
      </div>

      {/* Search Input */}
      <div className="relative mb-4 sm:mb-5">
        <input
          type="text"
          value={filters.keyword}
          onChange={(e) => handleFilterChange('keyword', e.target.value)}
          placeholder="Search auction name, lot or keyword"
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-lg border border-[#E3E3E3] bg-[#F7F7F7] focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm text-gray-700 placeholder-[#9F9F9F]"
        />
        <div className="absolute top-4 right-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M17.9422 17.058L14.0305 13.1471C15.1642 11.7859 15.7296 10.04 15.6089 8.27263C15.4883 6.50524 14.6909 4.85241 13.3826 3.65797C12.0744 2.46353 10.356 1.81944 8.58492 1.85969C6.81388 1.89994 5.12653 2.62143 3.87389 3.87407C2.62125 5.12671 1.89976 6.81406 1.85951 8.5851C1.81926 10.3561 2.46334 12.0745 3.65779 13.3828C4.85223 14.691 6.50506 15.4884 8.27244 15.6091C10.0398 15.7298 11.7857 15.1644 13.1469 14.0306L17.0578 17.9424C17.1159 18.0004 17.1848 18.0465 17.2607 18.0779C17.3366 18.1094 17.4179 18.1255 17.5 18.1255C17.5821 18.1255 17.6634 18.1094 17.7393 18.0779C17.8152 18.0465 17.8841 18.0004 17.9422 17.9424C18.0003 17.8843 18.0463 17.8154 18.0777 17.7395C18.1092 17.6636 18.1253 17.5823 18.1253 17.5002C18.1253 17.4181 18.1092 17.3367 18.0777 17.2609C18.0463 17.185 18.0003 17.1161 17.9422 17.058ZM3.125 8.75018C3.125 7.63766 3.4549 6.55012 4.07298 5.6251C4.69106 4.70007 5.56957 3.9791 6.5974 3.55336C7.62524 3.12761 8.75624 3.01622 9.84738 3.23326C10.9385 3.4503 11.9408 3.98603 12.7275 4.7727C13.5141 5.55937 14.0499 6.56165 14.2669 7.6528C14.484 8.74394 14.3726 9.87494 13.9468 10.9028C13.5211 11.9306 12.8001 12.8091 11.8751 13.4272C10.9501 14.0453 9.86252 14.3752 8.75 14.3752C7.25866 14.3735 5.82888 13.7804 4.77435 12.7258C3.71981 11.6713 3.12665 10.2415 3.125 8.75018Z" fill="#6E6E6E" />
          </svg>
        </div>
      </div>

      {/* Location Filter */}
      <div className="mb-4 sm:mb-5">
        <div className="flex justify-between items-center mb-2 sm:mb-3 cursor-pointer" onClick={() => setIsOpenLocation(!isOpenLocation)}>
          <h5 className="font-medium text-base sm:text-lg text-[#0E0E0E]">Location</h5>
          <ChevronIcon isOpen={isOpenLocation} />
        </div>
        {isOpenLocation && (
          <div className="relative">
            <select
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-lg border border-[#E3E3E3] bg-[#F7F7F7] focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm text-[#4D4D4D] appearance-none"
            >
              <option value="">Select Location</option>
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            <div className="absolute top-4 right-4 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5.22001 8.22015C5.36064 8.0797 5.55126 8.00081 5.75001 8.00081C5.94876 8.00081 6.13939 8.0797 6.28001 8.22015L10 11.9402L13.72 8.22015C13.7887 8.14647 13.8715 8.08736 13.9635 8.04637C14.0555 8.00538 14.1548 7.98334 14.2555 7.98156C14.3562 7.97979 14.4562 7.99831 14.5496 8.03603C14.643 8.07375 14.7278 8.1299 14.799 8.20112C14.8703 8.27233 14.9264 8.35717 14.9641 8.45056C15.0019 8.54394 15.0204 8.64397 15.0186 8.74468C15.0168 8.84538 14.9948 8.94469 14.9538 9.03669C14.9128 9.12869 14.8537 9.21149 14.78 9.28015L10.53 13.5302C10.3894 13.6706 10.1988 13.7495 10 13.7495C9.80126 13.7495 9.61064 13.6706 9.47001 13.5302L5.22001 9.28015C5.07956 9.13953 5.00067 8.9489 5.00067 8.75015C5.00067 8.5514 5.07956 8.36078 5.22001 8.22015Z" fill="#4D4D4D" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Auction Filter */}
      <div className="mb-4 sm:mb-5">
        <div className="flex justify-between items-center mb-2 sm:mb-3 cursor-pointer" onClick={() => setIsOpenCategory(!isOpenCategory)}>
          <h5 className="font-medium text-base sm:text-lg text-[#0E0E0E]">Auction Lot</h5>
          <ChevronIcon isOpen={isOpenCategory} />
        </div>
        {isOpenCategory && (
          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-lg border border-[#E3E3E3] bg-[#F7F7F7] focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm text-[#4D4D4D] appearance-none pr-10"
              disabled={auctionsLoading}
            >
              <option value="">Select Auction Lot</option>
              {auctions.map((auction) => (
                <option key={auction.id} value={auction.name}>
                  {auction.name}
                </option>
              ))}
            </select>
            <div className="absolute top-4 right-4 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5.22001 8.22015C5.36064 8.0797 5.55126 8.00081 5.75001 8.00081C5.94876 8.00081 6.13939 8.0797 6.28001 8.22015L10 11.9402L13.72 8.22015C13.7887 8.14647 13.8715 8.08736 13.9635 8.04637C14.0555 8.00538 14.1548 7.98334 14.2555 7.98156C14.3562 7.97979 14.4562 7.99831 14.5496 8.03603C14.643 8.07375 14.7278 8.1299 14.799 8.20112C14.8703 8.27233 14.9264 8.35717 14.9641 8.45056C15.0019 8.54394 15.0204 8.64397 15.0186 8.74468C15.0168 8.84538 14.9948 8.94469 14.9538 9.03669C14.9128 9.12869 14.8537 9.21149 14.78 9.28015L10.53 13.5302C10.3894 13.6706 10.1988 13.7495 10 13.7495C9.80126 13.7495 9.61064 13.6706 9.47001 13.5302L5.22001 9.28015C5.07956 9.13953 5.00067 8.9489 5.00067 8.75015C5.00067 8.5514 5.07956 8.36078 5.22001 8.22015Z" fill="#4D4D4D" />
              </svg>
            </div>
            {/* X button removed - users can use "Clear All Filters" button or select another category */}
            {/* {filters.category && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilterChange('category', '');
                }}
                className="absolute top-3.5 right-10 sm:right-12 p-1 hover:bg-gray-200 rounded transition-colors"
                title="Clear category"
                aria-label="Clear category filter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4L12 12" stroke="#6E6E6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )} */}
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="mb-4 sm:mb-5">
        <div className="flex justify-between items-center mb-2 sm:mb-3 cursor-pointer" onClick={() => setIsOpenDateRange(!isOpenDateRange)}>
          <h5 className="font-medium text-base sm:text-lg text-[#0E0E0E]">Date Range</h5>
          <ChevronIcon isOpen={isOpenDateRange} />
        </div>
        {isOpenDateRange && (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : null)}
              className="flex-1 min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border border-[#E3E3E3] bg-[#F7F7F7] focus:outline-none focus:ring-2 focus:ring-purple-300 text-xs sm:text-sm text-gray-700"
            />
            <span className="text-xs font-medium text-[#9F9F9F] whitespace-nowrap flex-shrink-0">to</span>
            <input
              type="date"
              value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : null)}
              min={filters.startDate ? filters.startDate.toISOString().split('T')[0] : undefined}
              className="flex-1 min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border border-[#E3E3E3] bg-[#F7F7F7] focus:outline-none focus:ring-2 focus:ring-purple-300 text-xs sm:text-sm text-gray-700"
            />
          </div>
        )}
      </div>

      {/* Auction Status Filter */}
      <div className="mb-4 sm:mb-5">
        <div className="flex justify-between items-center mb-2 sm:mb-3 cursor-pointer" onClick={() => setIsOpenAuctionStatus(!isOpenAuctionStatus)}>
          <h5 className="font-medium text-base sm:text-lg text-[#0E0E0E]">Auction Status</h5>
          <ChevronIcon isOpen={isOpenAuctionStatus} />
        </div>
        {isOpenAuctionStatus && (
            <div className="flex flex-col gap-2">
              {auctionStatuses.map(({ value, displayLabel }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="auctionStatus"
                    value={value}
                    checked={filters.auctionStatus === value}
                    onChange={(e) => handleFilterChange('auctionStatus', e.target.value)}
                    className="sr-only peer"
                  />
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      stroke="#9F9F9F"
                      strokeWidth="1.25"
                      className="peer-checked:fill-[#9F13FB] peer-checked:stroke-[#9F13FB]"
                    >
                      <path d="M1.875 9C1.875 5.64124 1.875 3.96187 2.91843 2.91843C3.96187 1.875 5.64124 1.875 9 1.875C12.3587 1.875 14.0381 1.875 15.0816 2.91843C16.125 3.96187 16.125 5.64124 16.125 9C16.125 12.3587 16.125 14.0381 15.0816 15.0816C14.0381 16.125 12.3587 16.125 9 16.125C5.64124 16.125 3.96187 16.125 2.91843 15.0816C1.875 14.0381 1.875 12.3587 1.875 9Z" />
                    </svg>
                    {filters.auctionStatus === value && (
                      <img src="/checkmarkPurple.png" alt="checked" className="absolute top-0 left-0 w-[18px] h-[18px]" />
                    )}
                  </div>
                  <span className="text-sm text-[#0E0E0E]">{displayLabel}</span>
                </label>
              ))}
            </div>
        )}
      </div>

      {/* Clear All Filters Button */}
      <button
        onClick={() => onFilterChange({
          keyword: '',
          country: '',
          category: '',
          auctionStatus: '',
          startDate: null,
          endDate: null,
          priceRange: [0, 10000] // Keep in state but not displayed
        })}
        className="w-full mt-4 sm:mt-6 py-2.5 sm:py-3 px-3 sm:px-4 border-2 border-[#9F13FB] text-[#9F13FB] rounded-full font-semibold hover:bg-purple-50 transition-colors text-sm sm:text-base"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterSidebar;

