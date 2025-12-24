'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { apiClient } from '@/lib/fetcher';

interface BidItem {
  id: string;
  auctionItem: {
    id: string;
    name: string;
    productImages?: Array<{
      url: string;
      altText?: string;
    }>;
    auction?: {
      endDate?: string;
    };
  };
  amount: number;
  currentBid?: number;
  createdAt: string;
}

/**
 * My Bids Section Component
 * Displays user's bids with tabs for Active Bids, Bid History, and Legacy Bidding Results
 * Pixel-perfect design matching Figma
 */
const MyBidsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'legacy'>('active');
  const [bids, setBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<BidItem[] | { success: boolean; data: BidItem[] }>('/bid');
        
        let bidsData: BidItem[] = [];
        if (Array.isArray(response)) {
          bidsData = response;
        } else if (response && 'success' in response && response.success && 'data' in response) {
          bidsData = response.data;
        }

        // Filter bids based on active tab
        const now = new Date();
        let filteredBids: BidItem[] = [];

        if (activeTab === 'active') {
          // Active bids: auction hasn't ended yet
          filteredBids = bidsData.filter(bid => {
            if (!bid.auctionItem?.auction?.endDate) return false;
            const endDate = new Date(bid.auctionItem.auction.endDate);
            return endDate >= now;
          });
        } else if (activeTab === 'history') {
          // Bid history: auction has ended
          filteredBids = bidsData.filter(bid => {
            if (!bid.auctionItem?.auction?.endDate) return false;
            const endDate = new Date(bid.auctionItem.auction.endDate);
            return endDate < now;
          });
        } else {
          // Legacy bidding results (same as history for now)
          filteredBids = bidsData.filter(bid => {
            if (!bid.auctionItem?.auction?.endDate) return false;
            const endDate = new Date(bid.auctionItem.auction.endDate);
            return endDate < now;
          });
        }

        setBids(filteredBids);
      } catch (err) {
        console.error('Error fetching bids:', err);
        setBids([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [activeTab]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-5 lg:p-6 shadow-sm">
      <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
        My Bids
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'active'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Active Bids
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'history'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Bid History
        </button>
        <button
          onClick={() => setActiveTab('legacy')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'legacy'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Legacy Bidding Results
        </button>
      </div>

      {/* Bids List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : bids.length > 0 ? (
        <div className="space-y-4">
          {bids.map((bid) => {
            const imageUrl = bid.auctionItem?.productImages?.[0]?.url || '/placeholder.jpg';
            const imageAlt = bid.auctionItem?.productImages?.[0]?.altText || bid.auctionItem?.name || 'Auction item';
            const endDate = bid.auctionItem?.auction?.endDate
              ? formatDate(bid.auctionItem.auction.endDate)
              : 'N/A';
            const myBid = formatCurrency(bid.amount);
            const currentBid = formatCurrency(bid.currentBid || bid.amount);

            return (
              <div
                key={bid.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Image */}
                  <div className="w-full md:w-32 h-32 bg-gray-100 rounded-lg border border-gray-200 flex-shrink-0 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={imageAlt}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-2 text-sm md:text-base line-clamp-2">
                        {bid.auctionItem?.name || 'Untitled Auction Item'}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{endDate}</span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-900">
                          My Bid: {myBid}
                        </p>
                        <p className="text-sm font-bold text-gray-700">
                          Current Bid: {currentBid}
                        </p>
                      </div>
                    </div>

                    {/* View Auction Button */}
                    <div className="self-start md:self-center flex-shrink-0">
                      <Link href={`/auction/${bid.auctionItem?.id}/details`}>
                        <button className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-[#E253FF] to-[#9F13FB] text-white font-semibold rounded-full hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap">
                          View Auction
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-500">No bids found.</p>
        </div>
      )}
    </section>
  );
};

export default MyBidsSection;

