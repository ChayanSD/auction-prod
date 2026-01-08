'use client';

import React from 'react';
import Link from 'next/link';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    imageUrl?: string;
    location?: string;
    status?: string;
  };
}

/**
 * Auction Card Component (renamed from CategoryCard)
 * Displays auction with image, name, and action buttons
 * Fully responsive for mobile, tablet, and desktop
 * Inspired by the LEGO product card design from the second image
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const auctionUrl = `/auction?auctionId=${category.id}`;
  const imageUrl = category.imageUrl || '/placeholder.jpg';

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a[href]')) {
      return;
    }
    window.location.href = auctionUrl;
  };

  return (
    <div className="px-1 sm:px-2 h-full">
      <div 
        className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-1 sm:p-2 h-full transform hover:-translate-y-1 flex flex-col cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Image with lazy loading */}
        <div className="aspect-square rounded-[14px] bg-gray-100 overflow-hidden mb-2 sm:mb-3 relative w-full">
          <img
            src={imageUrl}
            alt={category.name}
            className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
            style={{ minHeight: '100%', minWidth: '100%' }}
            loading="lazy"
            draggable={false}
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = '/placeholder.jpg';
            }}
          />
        </div>

        {/* Content */}
        <div className="p-2 sm:p-3 lg:p-4 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-semibold text-gray-700 text-sm sm:text-sm lg:text-base xl:text-lg mb-3 sm:mb-4 line-clamp-2 leading-tight min-h-[2.25rem] sm:min-h-[2.5rem] hover:text-purple-600 transition-colors">
            {category.name}
          </h3>

          {/* Actions */}
          <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
            <Link href={auctionUrl} className="block w-full">
              <button
                className="w-full py-2.5 px-2 sm:px-3 lg:px-4 rounded-full text-sm sm:text-sm lg:text-sm xl:text-base font-semibold transition-all duration-200 bg-gradient-to-br from-[#e253ff] to-[#9f14fc] text-white hover:shadow-md active:scale-95 whitespace-nowrap"
              >
                View Items
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

