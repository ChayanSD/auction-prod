import React from 'react';
import Link from 'next/link';
import { Eye, Calendar } from 'lucide-react';
import type { AuctionItem } from '@/types/homepage.types';

interface AuctionCardProps {
  item: AuctionItem;
}

/**
 * Reusable auction card component
 * Displays auction item with image, status badge, and action buttons
 * Fully responsive for mobile, tablet, and desktop
 */
export const AuctionCard: React.FC<AuctionCardProps> = ({ item }) => {
  const endDate = item.endDate ? new Date(item.endDate) : item.createdAt ? new Date(item.createdAt) : null;
  const now = new Date();
  const isToday = endDate?.toDateString() === now.toDateString();
  const isPast = !!(endDate && endDate < now && !isToday);

  const getStatusBadge = () => {
    if (!endDate) {
      return (
        <div className="text-gray-500 text-xs">Invalid date</div>
      );
    }
    
    if (isToday) {
      return (
        <div className="flex items-center justify-center bg-[#FEF8ED] border border-[#F6BC48] text-[#DB9914] text-xs rounded-full px-2 py-1 min-w-[80px] sm:min-w-[90px]">
          <span>Ends Today</span>
        </div>
      );
    }
    
    if (isPast) {
      return (
        <div className="flex items-center justify-center bg-[#F7F7F7] border border-[#E3E3E3] text-[#4D4D4D] text-xs rounded-full px-2 py-1 min-w-[60px] sm:min-w-[70px]">
          <span>Closed</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center bg-[#feeded] border border-[#FA9A9C] text-[#F6484B] text-xs rounded-full px-2 py-1 min-w-[40px] sm:min-w-[50px]">
        <span>Live</span>
      </div>
    );
  };

  return (
    <div className="px-1 sm:px-2 h-full">
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-1 sm:p-2 h-full transform hover:-translate-y-1">
        {/* Image with lazy loading */}
        <Link href={`/auction-item/${item.id}`}>
          <div className="aspect-square rounded-[14px] bg-gray-100 overflow-hidden cursor-pointer">
            <img
              src={item.productImages && item.productImages.length > 0 ? item.productImages[0].url : '/placeholder.jpg'}
              alt={item.productImages && item.productImages.length > 0 ? item.productImages[0].altText || item.name : item.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
              draggable={false}
            />
          </div>
        </Link>

        {/* Content */}
        <div className="p-2 sm:p-3 lg:p-4">
          <Link href={`/auction-item/${item.id}`}>
            <h3 className="font-semibold text-gray-700 text-xs sm:text-sm lg:text-base xl:text-lg mb-2 line-clamp-2 leading-tight min-h-[2rem] sm:min-h-[2.5rem] lg:min-h-[3rem] hover:text-purple-600 transition-colors cursor-pointer">
              {item.name}
            </h3>
          </Link>

          <div className="flex flex-col gap-2 mb-3">
            <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
              {getStatusBadge()}
              <span className="text-xs text-gray-600 font-medium">
                {endDate ? endDate.toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                }) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href={`/auction-item/${item.id}`} className="flex-1">
              <button
                className={`w-full py-2 px-2 sm:px-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isPast
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-br from-[#e253ff] to-[#9f14fc] text-white hover:shadow-md active:scale-95'
                }`}
                disabled={isPast}
              >
                {isPast ? 'Auction Closed' : 'Bid Now'}
              </button>
            </Link>
            <Link href={`/auction-item/${item.id}`}>
              <button 
                className="flex items-center justify-center bg-[#F7F7F7] rounded-full p-2 sm:p-3 border border-[#E3E3E3] hover:border-purple-600 text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 hover:scale-110"
                aria-label="View auction details"
              >
                <Eye size={12} className="sm:w-4 sm:h-4" />
              </button>
            </Link>
            <button 
              className="flex items-center justify-center bg-[#F7F7F7] rounded-full p-2 sm:p-3 border border-[#E3E3E3] hover:border-purple-600 text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 hover:scale-110"
              aria-label="Set reminder"
            >
              <Calendar size={12} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

