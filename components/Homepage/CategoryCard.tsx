'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, Calendar } from 'lucide-react';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    imageUrl?: string;
  };
}

/**
 * Category Card Component
 * Displays category with image, name, status badge, date, and action buttons
 * Fully responsive for mobile, tablet, and desktop
 * Inspired by the LEGO product card design from the second image
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const categoryUrl = `/auction?category=${encodeURIComponent(category.name)}`;
  const imageUrl = category.imageUrl || '/placeholder.jpg';

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a[href]')) {
      return;
    }
    window.location.href = categoryUrl;
  };

  return (
    <div className="px-1 sm:px-2 h-full">
      <div 
        className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-1 sm:p-2 h-full transform hover:-translate-y-1 flex flex-col cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Image with lazy loading */}
        <div className="aspect-square rounded-[14px] bg-gray-100 overflow-hidden mb-2 sm:mb-3 relative">
          <img
            src={imageUrl}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
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
          <h3 className="font-semibold text-gray-700 text-xs sm:text-sm lg:text-base xl:text-lg mb-2 sm:mb-3 line-clamp-2 leading-tight min-h-[2rem] sm:min-h-[2.5rem] hover:text-purple-600 transition-colors">
            {category.name}
          </h3>

          {/* Status Badge and Date (inspired by second image) */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            {/* Status Badge - Live */}
            <div className="flex items-center justify-center bg-[#feeded] border border-[#FA9A9C] text-[#F6484B] text-xs rounded-full px-2 py-1">
              <span>Live</span>
            </div>
            {/* Date */}
            <div className="text-xs sm:text-sm text-gray-500">
              {new Date().toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
            <Link href={categoryUrl} className="flex-1">
              <button
                className="w-full py-2 px-2 sm:px-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 bg-gradient-to-br from-[#e253ff] to-[#9f14fc] text-white hover:shadow-md active:scale-95"
              >
                Bid Now
              </button>
            </Link>
            <Link href={categoryUrl}>
              <button 
                className="flex items-center justify-center bg-[#F7F7F7] rounded-full p-2 sm:p-3 border border-[#E3E3E3] hover:border-purple-600 text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 hover:scale-110"
                aria-label="View category"
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

