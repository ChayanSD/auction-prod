'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/fetcher';
import { cleanLotNumber } from '@/utils/lotNumber';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CatalogueSidebarProps {
  currentItemId: string;
  auctionId: string;
  auctionName: string;
  currentLotNumber?: string | null;
}

interface CatalogueItem {
  id: string;
  name: string;
  lotNumber?: string | null;
  productImages: Array<{
    url: string;
    altText?: string | null;
  }>;
}

const CatalogueSidebar: React.FC<CatalogueSidebarProps> = ({
  currentItemId,
  auctionId,
  auctionName,
  currentLotNumber,
}) => {
  const router = useRouter();
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevItem, setPrevItem] = useState<CatalogueItem | null>(null);
  const [nextItem, setNextItem] = useState<CatalogueItem | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<CatalogueItem[] | { data: CatalogueItem[] }>(
          `/auction-item?auctionId=${auctionId}`
        );
        
        const allItems = Array.isArray(response) ? response : (response?.data || []);
        
        // Sort items by lot number
        const sortedItems = [...allItems].sort((a, b) => {
          const getLotNumericValue = (lotNumber: string | null | undefined): number => {
            if (!lotNumber) return Infinity;
            const cleaned = cleanLotNumber(lotNumber);
            if (!cleaned) return Infinity;
            const numericMatch = cleaned.match(/\d+/);
            if (numericMatch) {
              return parseInt(numericMatch[0], 10);
            }
            return Infinity;
          };
          
          const aNum = getLotNumericValue(a.lotNumber);
          const bNum = getLotNumericValue(b.lotNumber);
          
          if (aNum !== Infinity || bNum !== Infinity) {
            if (aNum !== bNum) {
              return aNum - bNum;
            }
          }
          
          const aLot = cleanLotNumber(a.lotNumber) || '';
          const bLot = cleanLotNumber(b.lotNumber) || '';
          if (aLot !== bLot) {
            return aLot.localeCompare(bLot);
          }
          
          return 0;
        });
        
        setItems(sortedItems);
        
        // Find current item index
        const currentIndex = sortedItems.findIndex(item => item.id === currentItemId);
        
        if (currentIndex !== -1) {
          setPrevItem(currentIndex > 0 ? sortedItems[currentIndex - 1] : null);
          setNextItem(currentIndex < sortedItems.length - 1 ? sortedItems[currentIndex + 1] : null);
        }
      } catch (error) {
        console.error('Error fetching catalogue items:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (auctionId && currentItemId) {
      fetchItems();
    }
  }, [auctionId, currentItemId]);

  const handleViewAll = () => {
    router.push(`/auction?category=${encodeURIComponent(auctionName)}`);
  };

  if (loading) {
    return (
      <div className="w-full lg:w-80 bg-white rounded-lg p-4 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-24"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length <= 1) {
    return null;
  }

  return (
    <div className="w-full lg:w-80 bg-white rounded-lg p-4 sm:p-6 border border-gray-200 sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">CATALOGUE</h3>
        <button
          onClick={handleViewAll}
          className="text-sm text-purple-600 cursor-pointer hover:text-purple-700 font-medium transition-colors"
        >
          View all
        </button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Previous Lot */}
        {prevItem && (
          <div>
            <Link
              href={`/auction-item/${prevItem.id}`}
              className="block group"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2 sm:mb-3">
                <img
                  src={prevItem.productImages?.[0]?.url || '/placeholder.jpg'}
                  alt={prevItem.productImages?.[0]?.altText || prevItem.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-medium text-gray-700">
                  LOT {cleanLotNumber(prevItem.lotNumber) || 'N/A'}
                </span>
                <span className="text-xs sm:text-sm text-gray-500 truncate">
                  {prevItem.name.length > 30 ? `${prevItem.name.substring(0, 30)}...` : prevItem.name}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-xs sm:text-sm cursor-pointer text-purple-600 hover:text-purple-700 font-medium">
                  Previous Lot
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Next Lot */}
        {nextItem && (
          <div>
            <Link
              href={`/auction-item/${nextItem.id}`}
              className="block group"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2 sm:mb-3">
                <img
                  src={nextItem.productImages?.[0]?.url || '/placeholder.jpg'}
                  alt={nextItem.productImages?.[0]?.altText || nextItem.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-medium text-gray-700">
                  LOT {cleanLotNumber(nextItem.lotNumber) || 'N/A'}
                </span>
                <span className="text-xs sm:text-sm text-gray-500 truncate">
                  {nextItem.name.length > 30 ? `${nextItem.name.substring(0, 30)}...` : nextItem.name}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-xs sm:text-sm cursor-pointer text-purple-600 hover:text-purple-700 font-medium">
                  Next Lot
                </span>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogueSidebar;
