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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Bid {
  id: string;
  amount: number;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

interface ItemWithBids {
  itemId: string;
  itemName: string;
  baseBidPrice: number;
  currentBid: number | null;
  totalBids: number;
  highestBid: Bid | null;
  bids: Bid[];
}

interface AuctionBidsData {
  auction: {
    id: string;
    name: string;
    location: string;
    status: string;
  };
  items: ItemWithBids[];
  totalBids: number;
  totalItems: number;
}

interface Props {
  auctionId: string;
  open: boolean;
  onClose: () => void;
}

export default function ViewAuctionBidsDialog({ auctionId, open, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [bidsData, setBidsData] = useState<AuctionBidsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && auctionId) {
      fetchBids();
    }
  }, [open, auctionId]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<AuctionBidsData>(`/auction/${auctionId}/bids`);
      setBidsData(data);
    } catch (err: unknown) {
      console.error('Error fetching bids:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bids';
      setError(errorMessage);
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>All Bids for {bidsData?.auction.name || 'Auction'}</DialogTitle>
          <DialogDescription>
            View all bids placed on all items in this auction lot
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
            {/* Auction Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Auction Name</p>
                  <p className="font-semibold">{bidsData.auction.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-semibold">{bidsData.auction.location}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Items</p>
                  <p className="font-semibold">{bidsData.totalItems}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Bids</p>
                  <p className="font-semibold text-green-600">{bidsData.totalBids}</p>
                </div>
              </div>
            </div>

            {/* Items with Bids */}
            {bidsData.items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No items found in this auction</p>
              </div>
            ) : (
              <div className="space-y-6">
                {bidsData.items.map((item) => (
                  <div key={item.itemId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{item.itemName}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span>Base Price: {formatCurrency(item.baseBidPrice)}</span>
                          <span>Current Bid: <span className="font-semibold text-green-600">{formatCurrency(item.currentBid || 0)}</span></span>
                          <span>Total Bids: {item.totalBids}</span>
                        </div>
                      </div>
                      {item.highestBid && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">🏆 Highest Bid</p>
                          <p className="font-bold text-green-700">{formatCurrency(item.highestBid.amount)}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {item.highestBid.user.firstName} {item.highestBid.user.lastName}
                          </p>
                        </div>
                      )}
                    </div>

                    {item.bids.length === 0 ? (
                      <p className="text-gray-500 text-sm">No bids placed on this item</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Rank</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Bidder Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Placed At</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {item.bids.map((bid, index) => (
                              <TableRow
                                key={bid.id}
                                className={index === 0 ? 'bg-green-50' : ''}
                              >
                                <TableCell>
                                  <span className="font-semibold">#{index + 1}</span>
                                  {index === 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                                      Highest
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {formatCurrency(bid.amount)}
                                </TableCell>
                                <TableCell>
                                  {bid.user.firstName} {bid.user.lastName}
                                </TableCell>
                                <TableCell className="text-sm">{bid.user.email}</TableCell>
                                <TableCell className="text-sm">
                                  {bid.user.phone || '—'}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatDate(bid.createdAt)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

