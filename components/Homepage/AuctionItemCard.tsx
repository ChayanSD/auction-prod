'use client';

import React from 'react';
import Link from 'next/link';

interface AuctionItemCardProps {
  item: {
    id: string;
    name: string;
    status?: string; // Item's own status (Live, Closed, etc.)
    productImages?: Array<{ url: string; altText?: string }>;
    auction?: {
      status?: 'Draft' | 'Upcoming' | 'Active' | 'Ended' | 'Cancelled';
      endDate?: string | Date;
    };
  };
}

/**
 * Auction Item Card Component
 * Displays auction item with image, name, status badge, and Bid Now button
 * Fully responsive for mobile, tablet, and desktop
 */
export const AuctionItemCard: React.FC<AuctionItemCardProps> = ({ item }) => {
  const itemUrl = `/auction-item/${item.id}`;
  const imageUrl = item.productImages && item.productImages.length > 0 
    ? item.productImages[0].url 
    : '/placeholder.jpg';
  
  const auctionStatus = item.auction?.status || 'Draft';
  const itemStatus = item.status; // Item's own status (Live, Closed, Upcoming, etc.)
  const endDate = item.auction?.endDate ? new Date(item.auction.endDate) : null;
  const now = new Date();

  // Priority 1: Check if date has passed - if yes, always show "Auction Closed"
  const isDatePassed = endDate && endDate < now;

  // Get status badge - Priority: Date first, then item status, then auction status
  const getStatusBadge = () => {
    // Priority 1: If date has passed, always show "Auction Closed"
    if (isDatePassed) {
      return (
        <div className="flex items-center justify-center bg-[#F7F7F7] border border-[#E3E3E3] text-[#4D4D4D] text-sm sm:text-xs rounded-full px-2 py-1">
          <span>Auction Closed</span>
        </div>
      );
    }

    // Priority 2: If date hasn't passed, check item's own status first
    if (itemStatus === 'Closed') {
      return (
        <div className="flex items-center justify-center bg-[#F7F7F7] border border-[#E3E3E3] text-[#4D4D4D] text-sm sm:text-xs rounded-full px-2 py-1">
          <span>Auction Closed</span>
        </div>
      );
    }

    if (itemStatus === 'Live') {
      return (
        <div className="flex items-center justify-center bg-[#feeded] border border-[#FA9A9C] text-[#F6484B] text-sm sm:text-xs rounded-full px-2 py-1">
          <span>Live</span>
        </div>
      );
    }

    if (itemStatus === 'Upcoming') {
      return (
        <div className="flex items-center justify-center bg-[#FEF8ED] border border-[#F6BC48] text-[#DB9914] text-sm sm:text-xs rounded-full px-2 py-1">
          <span>Upcoming</span>
        </div>
      );
    }

    // Priority 3: Fallback to auction status when item status is not present
    if (auctionStatus === 'Ended' || auctionStatus === 'Cancelled') {
      return (
        <div className="flex items-center justify-center bg-[#F7F7F7] border border-[#E3E3E3] text-[#4D4D4D] text-sm sm:text-xs rounded-full px-2 py-1">
          <span>Auction Closed</span>
        </div>
      );
    }

    if (auctionStatus === 'Active') {
      return (
        <div className="flex items-center justify-center bg-[#feeded] border border-[#FA9A9C] text-[#F6484B] text-sm sm:text-xs rounded-full px-2 py-1">
          <span>Live</span>
        </div>
      );
    }

    if (auctionStatus === 'Upcoming') {
      return (
        <div className="flex items-center justify-center bg-[#FEF8ED] border border-[#F6BC48] text-[#DB9914] text-sm sm:text-xs rounded-full px-2 py-1">
          <span>Upcoming</span>
        </div>
      );
    }

    return null;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a[href]')) {
      return;
    }
    window.location.href = itemUrl;
  };

  return (
    <div className="px-1 sm:px-2 h-full">
      <div 
        className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-1 sm:p-2 h-full transform hover:-translate-y-1 flex flex-col cursor-pointer"
        onClick={handleCardClick}
        style={{ minHeight: '100%' }}
      >
        {/* Image with lazy loading */}
        <div className="aspect-square rounded-[14px] bg-gray-100 overflow-hidden mb-2 sm:mb-3 relative w-full flex-shrink-0">
          <img
            src={imageUrl}
            alt={item.productImages?.[0]?.altText || item.name}
            className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
            loading="lazy"
            draggable={false}
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = '/placeholder.jpg';
            }}
          />
        </div>

        {/* Content */}
        <div className="p-2 sm:p-3 lg:p-4 flex-1 flex flex-col min-h-0">
          {/* Title */}
          <h3 className="font-semibold text-gray-700 text-sm sm:text-sm lg:text-base xl:text-lg mb-3 sm:mb-4 line-clamp-2 leading-tight min-h-[2.25rem] sm:min-h-[2.5rem] hover:text-purple-600 transition-colors flex-shrink-0">
            {item.name}
          </h3>

          {/* Status Badge and Date */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
            {getStatusBadge()}
            {/* Date */}
            {endDate && (
              <div className="text-sm sm:text-sm text-gray-500">
                {formatDate(endDate)}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-auto flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Link href={itemUrl} className="block w-full">
              <button
                className="w-full py-2.5 px-2 sm:px-3 lg:px-4 rounded-full text-sm sm:text-sm lg:text-sm xl:text-base font-semibold transition-all duration-200 bg-gradient-to-br from-[#e253ff] to-[#9f14fc] text-white hover:shadow-md active:scale-95 whitespace-nowrap"
              >
                Bid Now
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

