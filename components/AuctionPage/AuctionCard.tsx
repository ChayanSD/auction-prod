'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, Calendar } from 'lucide-react';
import type { AuctionListingItem } from '@/types/auction.types';

interface AuctionCardProps {
  item: AuctionListingItem;
}

/**
 * Auction Card Component for Listing Page
 * Pixel-perfect design matching Figma
 * Grid layout: 3 columns on 1440px, 2 columns on 1024px
 */
const AuctionCard: React.FC<AuctionCardProps> = ({ item }) => {
  const endDate = item.auction?.endDate ? new Date(item.auction.endDate) : null;
  const now = new Date();
  const isToday = endDate?.toDateString() === now.toDateString();
  const isPast = endDate && endDate < now && !isToday;

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="bg-white rounded-[20px] border border-[#E3E3E3] overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image Section */}
      <Link href={`/auction-item/${item.id}`}>
        <div className="bg-[#F7F7F7] rounded-t-[14px] aspect-square flex items-center justify-center overflow-hidden cursor-pointer">
          <img
            src={item.productImages && item.productImages.length > 0 ? item.productImages[0].url : '/placeholder.jpg'}
            alt={item.productImages && item.productImages.length > 0 ? item.productImages[0].altText || item.name : item.name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-4">
        {/* Status Badge and Date */}
        <div className="flex items-center justify-between mb-3">
          <div>
            {!endDate ? (
              <div className="text-gray-500 text-xs">Invalid date</div>
            ) : isToday ? (
              <div className="flex items-center gap-1.5 bg-[#FEF8ED] border border-[#F6BC48] text-[#DB9914] rounded-full px-2 py-1 text-xs font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M9.375 3.545V1.875C9.375 1.67609 9.29598 1.48532 9.15367 1.34301C9.01136 1.2007 8.82059 1.12168 8.625 1.12168C8.42941 1.12168 8.23864 1.2007 8.09633 1.34301C7.95402 1.48532 7.875 1.67609 7.875 1.875V3.5625C7.87526 3.67889 7.90247 3.79364 7.95452 3.89774C8.00658 4.00184 8.08204 4.09247 8.175 4.1625L10.6252 6L8.175 7.8375C8.08204 7.90753 8.00658 7.99816 7.95452 8.10226C7.90247 8.20636 7.87526 8.32111 7.875 8.4375V10.125C7.875 10.3206 7.95402 10.5114 8.09633 10.6537C8.23864 10.796 8.42941 10.875 8.625 10.875C8.82059 10.875 9.01136 10.796 9.15367 10.6537C9.29598 10.5114 9.375 10.3206 9.375 10.125V8.45438C9.3747 8.3385 9.34749 8.22425 9.29544 8.12065C9.24338 8.01705 9.16792 7.92692 9.075 7.8575L6.62213 6L9.075 4.1425C9.16792 4.07308 9.24338 3.98295 9.29544 3.87935C9.34749 3.77575 9.3747 3.6615 9.375 3.545ZM8.35453 8.25L5.62481 6L8.35453 3.75V8.25ZM8.625 3.545L6 5.71875L3.375 3.5625V1.875H8.625V3.545Z" fill="#DB9914" fillOpacity="0.85" />
                </svg>
                <span>Ends Today</span>
              </div>
            ) : isPast ? (
              <div className="flex items-center gap-1.5 bg-[#F7F7F7] border border-[#E3E3E3] text-[#4D4D4D] rounded-full px-2 py-1 text-xs font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M9 6.00013C9 7.29353 8.6569 8.5583 8.0129 9.6784C7.3689 10.7985 6.4522 11.7284 5.3761 12.3829C4.30001 13.0373 3.11155 13.2939 1.95746 13.1217C0.80337 12.9495 -0.26583 12.3561 -1.11812 11.4099C-1.97041 10.4637 -2.5 9.21288 -2.5 7.91948C-2.5 6.62608 -1.97041 5.37528 -1.11812 4.42908C-0.26583 3.48288 0.80337 2.88948 1.95746 2.71728C3.11155 2.54508 4.30001 2.80168 5.3761 3.45613C6.4522 4.11058 7.3689 5.04048 8.0129 6.16058C8.6569 7.28068 9 8.54548 9 9.83888C9 10.4969 8.73661 11.1284 8.26777 11.5973C7.79893 12.0661 7.16739 12.3295 6.50938 12.3295C5.85137 12.3295 5.21983 12.0661 4.75099 11.5973C4.28215 11.1284 4.01876 10.4969 4.01876 9.83888C4.01876 9.18087 4.28215 8.54933 4.75099 8.08049C5.21983 7.61165 5.85137 7.34826 6.50938 7.34826C7.16739 7.34826 7.79893 7.61165 8.26777 8.08049C8.73661 8.54933 9 9.18087 9 9.83888V6.00013Z" fill="#6E6E6E" />
                </svg>
                <span>Closed</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-[#FEEDED] border border-[#FA9A9C] text-[#F6484B] rounded-full px-2 py-1 text-xs font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="9" viewBox="0 0 12 9" fill="none">
                  <path d="M7.87493 4.49976C7.87493 4.87066 7.765 5.23318 7.55897 5.54152C7.35293 5.84986 7.06007 6.09018 6.71924 6.2321C6.37841 6.37402 6.00536 6.41114 5.64414 6.3388C5.28292 6.26645 4.93633 6.08787 4.67421 5.82575C4.41209 5.56363 4.23351 5.21704 4.16116 4.85582C4.08882 4.4946 4.12594 4.12155 4.26786 3.78072C4.40978 3.43989 4.6501 3.14703 4.95844 2.94099C5.26678 2.73496 5.6293 2.62503 6.0002 2.62503C6.49622 2.62503 6.97234 2.8226 7.32619 3.17645C7.68004 3.5303 7.87761 4.00642 7.87761 4.50244C7.87761 4.99846 7.68004 5.47458 7.32619 5.82843C6.97234 6.18228 6.49622 6.37985 6.0002 6.37985C5.50418 6.37985 5.02806 6.18228 4.67421 5.82843C4.32036 5.47458 4.12279 4.99846 4.12279 4.50244C4.12279 4.00642 4.32036 3.5303 4.67421 3.17645C5.02806 2.8226 5.50418 2.62503 6.0002 2.62503C6.49622 2.62503 6.97234 2.8226 7.32619 3.17645C7.68004 3.5303 7.87761 4.00642 7.87761 4.50244V4.49976Z" fill="#F6484B" />
                </svg>
                <span>Live</span>
              </div>
            )}
          </div>
          <span className="text-xs text-[#4D4D4D] font-medium">{formatDate(endDate)}</span>
        </div>

        {/* Title */}
        <Link href={`/auction-item/${item.id}`}>
          <h3 className="font-bold text-base text-[#0E0E0E] mb-3 line-clamp-2 leading-tight min-h-[2.5rem] hover:text-purple-600 transition-colors cursor-pointer">
            {item.name}
          </h3>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link href={`/auction-item/${item.id}`} className="flex-1">
            <button className="w-full py-2.5 px-4 rounded-full bg-gradient-to-br from-[#9F13FB] to-[#E95AFF] text-white text-sm font-semibold hover:shadow-md transition-all active:scale-95">
              Bid Now
            </button>
          </Link>
          <Link href={`/auction-item/${item.id}`}>
            <button className="flex items-center justify-center bg-[#F7F7F7] rounded-full p-2.5 border border-[#E3E3E3] hover:border-purple-600 text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all hover:scale-110">
              <Eye size={14} />
            </button>
          </Link>
          <button className="flex items-center justify-center bg-[#F7F7F7] rounded-full p-2.5 border border-[#E3E3E3] hover:border-purple-600 text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all hover:scale-110">
            <Calendar size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionCard;

