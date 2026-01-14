'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/fetcher';
import Link from 'next/link';
import Image from 'next/image';
import { cleanLotNumber } from '@/utils/lotNumber';

interface SimilarItemsProps {
  currentItemId: string;
  auctionId: string;
}

interface SimilarItem {
  id: string;
  name: string;
  baseBidPrice: number;
  currentBid: number | null;
  lotNumber?: string | null;
  productImages: Array<{
    url: string;
    altText: string | null;
  }>;
  auction: {
    endDate: string;
  };
}

const SimilarItems: React.FC<SimilarItemsProps> = ({ currentItemId, auctionId }) => {
  const [items, setItems] = useState<SimilarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilarItems = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<any>('/auction-item');
        // Handle both array and wrapped response formats
        const allItems = Array.isArray(response) ? response : (response?.data || []);
        // Filter items from the same auction, excluding current item
        const similar = allItems
          .filter((item: any) => {
            const itemAuctionId = item.auction?.id || item.auctionId;
            return itemAuctionId === auctionId && item.id !== currentItemId;
          })
          .slice(0, 10); // Limit to 10 items
        setItems(similar);
      } catch (error) {
        console.error('Error fetching similar items:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarItems();
  }, [currentItemId, auctionId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="w-full">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Similar Items Available Now</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg aspect-square animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Similar Items Available Now</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {items.map((item) => {
          const imageUrl = item.productImages?.[0]?.url || '/placeholder-image.png';
          const currentBid = item.currentBid || item.baseBidPrice;
          // Clean lotNumber - use utility function for consistency
          const cleanedLotNumber = cleanLotNumber(item.lotNumber);
          const endDate = item.auction?.endDate || item.auction?.endDate || new Date().toISOString();

          return (
            <Link
              key={item.id}
              href={`/auction-item/${item.id}`}
              className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                <img
                  src={imageUrl}
                  alt={item.productImages?.[0]?.altText || item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 sm:p-4 space-y-2">
                {/* Always show lot number - show N/A if not provided */}
                <div className="text-xs sm:text-sm font-medium text-purple-600 min-h-[18px]">
                  Lot #{cleanedLotNumber ? cleanedLotNumber : 'N/A'}
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
                  {item.name.length > 30 ? `${item.name.substring(0, 30)}...` : item.name}
                </h3>
                <div className="space-y-1">
                  <div className="text-xs sm:text-sm text-gray-600">Opening Bid:</div>
                  <div className="text-base sm:text-lg font-bold text-gray-900">
                    {formatCurrency(currentBid)}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-500">
                  Bidding Ends: {formatDate(endDate)}
                </div>
                <div className="pt-2 space-y-2">
                  <input
                    type="number"
                    placeholder={formatCurrency(currentBid + 10)}
                    className="w-full px-2 py-1.5 text-xs sm:text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-300"
                    onClick={(e) => e.preventDefault()}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/auction-item/${item.id}`;
                    }}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold rounded transition-colors"
                  >
                    Bid
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SimilarItems;

