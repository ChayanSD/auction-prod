'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/fetcher';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ProductDetailsProps {
  item: {
    id: string;
    name: string;
    description: string;
    baseBidPrice: number;
    currentBid: number | null;
    estimatedPrice: number | null;
    additionalFee: number | null;
    auction: {
      id: string;
      name: string;
      slug: string;
      endDate: string;
    };
  };
  bidCount: number;
  currentBidAmount: number;
  minBid: number;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({
  item,
  bidCount,
  currentBidAmount,
  minBid,
}) => {
  const { user } = useUser();
  const router = useRouter();
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);

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

  const handlePlaceBid = async () => {
    if (!user) {
      toast.error('Please login to place a bid');
      router.push('/login');
      return;
    }

    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue) || bidValue < minBid) {
      toast.error(`Bid must be at least ${formatCurrency(minBid)}`);
      return;
    }

    try {
      setIsPlacingBid(true);
      await apiClient.post('/bid', {
        auctionItemId: item.id,
        userId: user.id,
        amount: bidValue,
      });
      toast.success('Bid placed successfully!');
      setBidAmount('');
      // Refresh page to get updated bid data
      window.location.reload();
    } catch (error: any) {
      console.error('Error placing bid:', error);
      toast.error(error?.response?.data?.error || 'Failed to place bid');
    } finally {
      setIsPlacingBid(false);
    }
  };

  const additionalFeePercent = item.additionalFee
    ? ((item.additionalFee / currentBidAmount) * 100).toFixed(2)
    : '0';

  return (
    <div className="w-full space-y-6">
      {/* Product Title */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
        {item.name || 'N/A'}
      </h1>

      {/* Bidding Ends Date */}
      <div className="text-sm text-gray-600">
        Bidding Ends: {item.auction?.endDate ? formatDate(item.auction.endDate) : 'N/A'}
      </div>

      {/* Bidding Interface */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg border border-gray-200">
        <div className="space-y-4">
          {/* Current Bid Info - Updated format matching Figma */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <span className="text-gray-600 text-sm">Current Bid:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {currentBidAmount ? formatCurrency(currentBidAmount) : 'N/A'}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
                </span>
              </div>
            </div>
            {minBid && (
              <p className="text-sm text-gray-500">
                (Bid {formatCurrency(minBid)} or more)
              </p>
            )}
          </div>

          {/* Auctioneer's Estimate */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-baseline justify-between">
              <span className="text-gray-600 text-sm">Auctioneer's estimate:</span>
              <span className="text-lg font-semibold text-gray-900">
                {item.estimatedPrice 
                  ? `${formatCurrency(item.estimatedPrice * 0.9)} - ${formatCurrency(item.estimatedPrice * 1.1)}`
                  : 'N/A'}
              </span>
            </div>
          </div>

          {/* Additional Fees */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Additional fees apply: {item.additionalFee && additionalFeePercent !== '0' 
                ? `${additionalFeePercent}% Inc. VAT/sales tax`
                : 'N/A'}
            </p>
          </div>

          {/* Bid Input Section - Only show if user is logged in */}
          {user ? (
            <div className="pt-4 space-y-3">
              <div>
                <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your bid
                </label>
                <div className="flex gap-2">
                  <input
                    id="bidAmount"
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={minBid ? formatCurrency(minBid) : 'Enter amount'}
                    min={minBid || 0}
                    step="10"
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
                  />
                  <button
                    onClick={handlePlaceBid}
                    disabled={isPlacingBid || !bidAmount}
                    className="px-6 sm:px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
                  >
                    {isPlacingBid ? 'Placing...' : 'Place Bid'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Register to Bid Button - Show when user is not logged in */
            <div className="pt-4">
              <button
                onClick={() => router.push('/signup')}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
              >
                Register to Bid Online
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

