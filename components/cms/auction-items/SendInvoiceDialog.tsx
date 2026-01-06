'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/fetcher';
import toast from 'react-hot-toast';
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
  };
}

interface BidsData {
  auctionItem: {
    id: string;
    name: string;
    currentBid: number;
    baseBidPrice: number;
    buyersPremium?: number;
    taxPercentage?: number;
  };
  bids: Bid[];
  highestBid: Bid | null;
}

interface Props {
  itemId: string;
  open: boolean;
  onClose: () => void;
}

export default function SendInvoiceDialog({ itemId, open, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [bidsData, setBidsData] = useState<BidsData | null>(null);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open && itemId) {
      fetchBids();
    }
  }, [open, itemId]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<BidsData>(`/auction-item/${itemId}/bids`);
      setBidsData(data);
      // Auto-select highest bid
      if (data.highestBid) {
        setSelectedBidId(data.highestBid.id);
      }
    } catch (err: unknown) {
      console.error('Error fetching bids:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bids';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!selectedBidId || !bidsData) {
      toast.error('Please select a bid');
      return;
    }

    const selectedBid = bidsData.bids.find(b => b.id === selectedBidId);
    if (!selectedBid) {
      toast.error('Selected bid not found');
      return;
    }

    try {
      setSending(true);
      const response = await apiClient.post('/invoice', {
        auctionItemId: itemId,
        userId: selectedBid.user.id,
        winningBidId: selectedBidId,
        notes: notes.trim() || undefined,
      });

      toast.success('Invoice sent successfully!');
      onClose();
      setNotes('');
    } catch (err: unknown) {
      console.error('Error sending invoice:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send invoice';
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateTotal = (bidAmount: number) => {
    const buyersPremium = bidsData?.auctionItem.buyersPremium || 0;
    const taxPercentage = bidsData?.auctionItem.taxPercentage || 0;
    const taxAmount = (bidAmount + buyersPremium) * (taxPercentage / 100);
    return bidAmount + buyersPremium + taxAmount;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Invoice to Winner</DialogTitle>
          <DialogDescription>
            Select the winning bid and send an invoice with Stripe payment link
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8">
            <PremiumLoader text="Loading bids..." fullScreen={false} />
          </div>
        ) : bidsData ? (
          <div className="space-y-4">
            {/* Product Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{bidsData.auctionItem.name}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Buyer's Premium: {formatCurrency(bidsData.auctionItem.buyersPremium || 0)}</p>
                <p>Tax Percentage: {bidsData.auctionItem.taxPercentage || 0}%</p>
              </div>
            </div>

            {/* Select Winning Bid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Winning Bid
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {bidsData.bids.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No bids available</p>
                ) : (
                  bidsData.bids.map((bid, index) => {
                    const total = calculateTotal(bid.amount);
                    const isSelected = selectedBidId === bid.id;
                    return (
                      <div
                        key={bid.id}
                        onClick={() => setSelectedBidId(bid.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              checked={isSelected}
                              onChange={() => setSelectedBidId(bid.id)}
                              className="mt-1"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">
                                  {formatCurrency(bid.amount)}
                                </span>
                                {index === 0 && (
                                  <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                                    Highest
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {bid.user.firstName} {bid.user.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{bid.user.email}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Total: {formatCurrency(total)} (Bid + Fees)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for the invoice..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </div>

            {/* Summary */}
            {selectedBidId && bidsData.bids.find(b => b.id === selectedBidId) && (() => {
              const bidAmount = bidsData.bids.find(b => b.id === selectedBidId)!.amount;
              const buyersPremium = bidsData.auctionItem.buyersPremium || 0;
              const taxPercentage = bidsData.auctionItem.taxPercentage || 0;
              const taxAmount = (bidAmount + buyersPremium) * (taxPercentage / 100);
              const total = calculateTotal(bidAmount);
              return (
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Invoice Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Hammer (Winning Bid):</span>
                      <span className="font-semibold">
                        {formatCurrency(bidAmount)}
                      </span>
                    </div>
                    {buyersPremium > 0 && (
                      <div className="flex justify-between">
                        <span>Buyer's Premium:</span>
                        <span>{formatCurrency(buyersPremium)}</span>
                      </div>
                    )}
                    {taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({taxPercentage}%):</span>
                        <span>{formatCurrency(taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-purple-200 pt-1 mt-1">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSendInvoice}
            disabled={!selectedBidId || sending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {sending ? 'Sending...' : 'Send Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

