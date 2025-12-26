'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/fetcher';
import PremiumLoader from '@/components/shared/PremiumLoader';

interface Bid {
  id: string;
  amount: number;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

interface BidsData {
  auctionItem: {
    id: string;
    name: string;
    lotCount: number;
    currentBid: number;
    baseBidPrice: number;
    additionalFee: number;
  };
  auction: {
    id: string;
    name: string;
    endDate: string;
    status: string;
  };
  bids: Bid[];
  highestBid: Bid | null;
  totalBids: number;
}

interface Props {
  itemId: string;
  open: boolean;
  onClose: () => void;
}

export default function ViewBidsDialog({ itemId, open, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [bidsData, setBidsData] = useState<BidsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && itemId) {
      fetchBids();
    }
  }, [open, itemId]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<BidsData>(`/auction-item/${itemId}/bids`);
      setBidsData(data);
    } catch (err: any) {
      console.error('Error fetching bids:', err);
      setError(err?.message || 'Failed to fetch bids');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bids for {bidsData?.auctionItem.name || 'Auction Item'}</DialogTitle>
          <DialogDescription>
            View all bids placed on this product
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8">
            <PremiumLoader text="Loading bids..." fullScreen={false} />
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : bidsData ? (
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Lots</p>
                  <p className="font-semibold">{bidsData.auctionItem.lotCount || 1}</p>
                </div>
                <div>
                  <p className="text-gray-500">Base Price</p>
                  <p className="font-semibold">{formatCurrency(bidsData.auctionItem.baseBidPrice)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Current Bid</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(bidsData.auctionItem.currentBid || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total Bids</p>
                  <p className="font-semibold">{bidsData.totalBids}</p>
                </div>
              </div>
            </div>

            {/* Highest Bid (Winner) */}
            {bidsData.highestBid && (
              <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">🏆 Highest Bid (Winner)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-lg font-bold text-green-700">
                      {formatCurrency(bidsData.highestBid.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bidder</p>
                    <p className="font-semibold">
                      {bidsData.highestBid.user.firstName} {bidsData.highestBid.user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{bidsData.highestBid.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Placed At</p>
                    <p className="text-sm">{formatDate(bidsData.highestBid.createdAt)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* All Bids List */}
            <div>
              <h3 className="font-semibold mb-3">All Bids ({bidsData.bids.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {bidsData.bids.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No bids placed yet</p>
                ) : (
                  bidsData.bids.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`p-4 border rounded-lg ${
                        index === 0 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-lg">
                              {formatCurrency(bid.amount)}
                            </span>
                            {index === 0 && (
                              <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                                Highest
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>
                              <span className="font-medium">
                                {bid.user.firstName} {bid.user.lastName}
                              </span>
                              {' • '}
                              {bid.user.email}
                            </p>
                            <p className="text-xs mt-1">{formatDate(bid.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Rank #{index + 1}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

