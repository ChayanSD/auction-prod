'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/fetcher';
import { cleanLotNumber } from '@/utils/lotNumber';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface LotNavigationProps {
  currentItemId: string;
  auctionId: string;
  currentLotNumber?: string | null;
}

interface AuctionItem {
  id: string;
  lotNumber?: string | null;
}

const LotNavigation: React.FC<LotNavigationProps> = ({
  currentItemId,
  auctionId,
  currentLotNumber,
}) => {
  const router = useRouter();
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [prevItem, setPrevItem] = useState<AuctionItem | null>(null);
  const [nextItem, setNextItem] = useState<AuctionItem | null>(null);
  const [prevLotNumber, setPrevLotNumber] = useState<string | null>(null);
  const [nextLotNumber, setNextLotNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<AuctionItem[] | { data: AuctionItem[] }>(
          `/auction-item?auctionId=${auctionId}`
        );
        
        const allItems = Array.isArray(response) ? response : (response?.data || []);
        
        // Sort items: first by lot number (if available), then by creation date
        const sortedItems = [...allItems].sort((a, b) => {
          // Try to extract numeric values from lot numbers for proper sorting
          const getLotNumericValue = (lotNumber: string | null | undefined): number => {
            if (!lotNumber) return Infinity; // Items without lot numbers go to the end
            const cleaned = cleanLotNumber(lotNumber);
            if (!cleaned) return Infinity;
            
            // Try to extract number from lot number (e.g., "123", "Lot 456", "Lap 12A" -> extract number part)
            const numericMatch = cleaned.match(/\d+/);
            if (numericMatch) {
              return parseInt(numericMatch[0], 10);
            }
            return Infinity;
          };
          
          const aNum = getLotNumericValue(a.lotNumber);
          const bNum = getLotNumericValue(b.lotNumber);
          
          if (aNum !== Infinity || bNum !== Infinity) {
            // At least one has a numeric lot number
            if (aNum !== bNum) {
              return aNum - bNum;
            }
          }
          
          // If lot numbers are equal or both don't have numeric values, sort alphabetically by lot number
          const aLot = cleanLotNumber(a.lotNumber) || '';
          const bLot = cleanLotNumber(b.lotNumber) || '';
          if (aLot !== bLot) {
            return aLot.localeCompare(bLot);
          }
          
          // If lot numbers are the same or both null, maintain original order (by ID or creation)
          return 0;
        });
        
        setItems(sortedItems);
        
        // Find current item index
        const currentIndex = sortedItems.findIndex(item => item.id === currentItemId);
        
        if (currentIndex !== -1) {
          // Set previous item
          if (currentIndex > 0) {
            const prev = sortedItems[currentIndex - 1];
            setPrevItem(prev);
            setPrevLotNumber(cleanLotNumber(prev.lotNumber));
          } else {
            setPrevItem(null);
            setPrevLotNumber(null);
          }
          
          // Set next item
          if (currentIndex < sortedItems.length - 1) {
            const next = sortedItems[currentIndex + 1];
            setNextItem(next);
            setNextLotNumber(cleanLotNumber(next.lotNumber));
          } else {
            setNextItem(null);
            setNextLotNumber(null);
          }
        }
      } catch (error) {
        console.error('Error fetching items for lot navigation:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (auctionId && currentItemId) {
      fetchItems();
    }
  }, [auctionId, currentItemId]);

  const handlePrevClick = () => {
    if (prevItem) {
      router.push(`/auction-item/${prevItem.id}`);
    }
  };

  const handleNextClick = () => {
    if (nextItem) {
      router.push(`/auction-item/${nextItem.id}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    
    // Search for item by lot number
    const searchTerm = searchValue.trim().toLowerCase();
    const foundItem = items.find(item => {
      const cleanedLot = cleanLotNumber(item.lotNumber);
      if (!cleanedLot) return false;
      
      // Try to match lot number (case insensitive)
      return cleanedLot.toLowerCase().includes(searchTerm) || 
             searchTerm.includes(cleanedLot.toLowerCase());
    });
    
    if (foundItem) {
      router.push(`/auction-item/${foundItem.id}`);
      setSearchValue('');
    } else {
      // Show error toast or message
      alert(`Lot number "${searchValue}" not found in this auction.`);
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  // Don't show navigation if there's only one item or no items
  if (items.length <= 1) {
    return null;
  }

  return (
    <div className="w-full mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Previous Lot */}
        <button
          onClick={handlePrevClick}
          disabled={!prevItem}
          className={`flex items-center gap-2 text-sm sm:text-base font-medium transition-colors ${
            prevItem
              ? 'text-purple-600 hover:text-purple-700 cursor-pointer'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <ChevronLeft 
            size={20} 
            className={`${prevItem ? 'text-purple-600' : 'text-gray-400'}`} 
          />
          <span className="whitespace-nowrap">
            Prev lot{prevLotNumber ? `: ${prevLotNumber}` : ''}
          </span>
        </button>

        {/* Search by Lot Number */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 max-w-xs sm:max-w-md w-full">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by lot #"
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center min-w-[44px]"
            aria-label="Search lot number"
          >
            <Search size={18} />
          </button>
        </form>

        {/* Next Lot */}
        <button
          onClick={handleNextClick}
          disabled={!nextItem}
          className={`flex items-center gap-2 text-sm sm:text-base font-medium transition-colors ${
            nextItem
              ? 'text-purple-600 hover:text-purple-700 cursor-pointer'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <span className="whitespace-nowrap">
            Next lot{nextLotNumber ? `: ${nextLotNumber}` : ''}
          </span>
          <ChevronRight 
            size={20} 
            className={`${nextItem ? 'text-purple-600' : 'text-gray-400'}`} 
          />
        </button>
      </div>
    </div>
  );
};

export default LotNavigation;
