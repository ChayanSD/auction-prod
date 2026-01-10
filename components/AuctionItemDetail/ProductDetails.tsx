'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/fetcher';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface ProductDetailsProps {
  item: {
    id: string;
    name: string;
    description: string;
    baseBidPrice: number;
    currentBid: number | null;
    estimateMin?: number | null;
    estimateMax?: number | null;
    status?: string; // Item's own status (Live, Closed, etc.)
    startDate?: string;
    endDate?: string;
    auction: {
      id: string;
      name: string;
      slug: string;
      status?: string;
      startDate?: string | null;
      endDate?: string | null;
      tags?: Array<{
        tag: {
          id: string;
          name: string;
        };
      }>;
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
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Determine if auction is closed for this item
  // Note: dates now live on the Auction model; use auction dates
  const endDate = item.auction?.endDate ? new Date(item.auction.endDate) : null;
  const startDate = item.auction?.startDate ? new Date(item.auction.startDate) : null;
  const now = new Date();
  const isDatePassed = endDate && endDate < now;
  const isNotStarted = startDate && startDate > now;

  // Treat auction as closed/not available for bidding if:
  // - End date (if present) has passed, OR
  // - Item status is 'Closed', OR
  // - Parent auction status is explicitly 'Closed', OR
  // - Parent auction status is 'Upcoming' (bidding not available until auction goes Live), OR
  // - Start date hasn't passed yet (auction hasn't started)
  const isAuctionClosed =
    isDatePassed ||
    item.status === 'Closed' ||
    item.auction?.status === 'Closed' ||
    item.auction?.status === 'Upcoming' ||
    isNotStarted;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Time remaining countdown
  useEffect(() => {
    if (!endDate) {
      setTimeRemaining(null);
      return;
    }

    const updateRemaining = () => {
      const now = new Date().getTime();
      const diff = endDate.getTime() - now;

      if (diff <= 0) {
        setTimeRemaining('0d 0:00:00');
        return false;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const formatted = `${days}d ${hours}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      setTimeRemaining(formatted);
      return true;
    };

    // Initial call
    const hasTime = updateRemaining();
    if (!hasTime) return;

    const intervalId = setInterval(() => {
      const stillPositive = updateRemaining();
      if (!stillPositive) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [endDate]);

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

    // Check if bid is less than current bid amount
    if (currentBidAmount && bidValue <= currentBidAmount) {
      toast.error(
        `Your bid must be higher than the current bid of ${formatCurrency(currentBidAmount)}. Please enter a bid of ${formatCurrency(minBid)} or more.`,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
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
      // Hide loader before reloading to avoid double loader
      setIsPlacingBid(false);
      // Small delay to ensure loader is hidden, then reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error placing bid:', error);
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to place bid';
      toast.error(message);
    } finally {
      setIsPlacingBid(false);
    }
  };

  // Generate lot numbers array
  const lotCount = (item as { lotCount?: number }).lotCount || 1;
  const lotNumbers = Array.from({ length: lotCount }, (_, i) => i + 1);

  return (
    <div className="w-full space-y-6 relative">
      {/* Product Title */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
        {item.name || 'N/A'}
      </h1>

      {/* Tags/Lot Number Display */}
      {item.auction?.tags && item.auction.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.auction.tags.map((tagOnAuction) => (
            <span
              key={tagOnAuction.tag.id}
              className="px-3 py-1 bg-purple-100 border border-purple-300 rounded-full text-sm font-medium text-purple-700"
            >
              {tagOnAuction.tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Lot Numbers Display */}
      {lotCount > 1 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-purple-900 mb-2">
            This product has {lotCount} lots:
          </p>
          <div className="flex flex-wrap gap-2">
            {lotNumbers.map((lotNum) => (
              <span
                key={lotNum}
                className="px-3 py-1 bg-white border border-purple-300 rounded-full text-sm font-medium text-purple-700"
              >
                Lot {lotNum}
              </span>
            ))}
          </div>
          <p className="text-xs text-purple-700 mt-2">
            Bidding applies to all {lotCount} lots. Winner receives all items.
          </p>
        </div>
      )}

      {/* Bidding Interface */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg border border-gray-200">
        <div className="space-y-4">
          {/* Time Remaining */}
          {endDate && (
            <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-gray-700">
                Time Remaining
              </span>
              <span className="text-sm sm:text-base font-bold text-gray-900">
                {!isAuctionClosed && timeRemaining
                  ? timeRemaining
                  : 'Auction Closed'}
              </span>
            </div>
          )}

          {/* Current Bid Info - Updated format matching Figma */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <span className="text-gray-600 text-sm">Current Bid:</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">
                  {currentBidAmount ? formatCurrency(currentBidAmount) : 'N/A'}
                </span>
                {/* Eye-catching bid count badge */}
                <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all">
                  <span className="text-sm font-bold whitespace-nowrap">
                  {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
                </span>
                </div>
              </div>
            </div>
            {minBid && (
              <p className="text-sm text-gray-500">
                (Bid {formatCurrency(minBid)} or more)
              </p>
            )}
          </div>

          {/* Auctioneer's Estimate */}
          {(item.estimateMin || item.estimateMax) && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-baseline justify-between">
                <span className="text-gray-600 text-sm">Auctioneer's estimate:</span>
                <span className="text-sm sm:text-base font-semibold text-gray-900">
                  {item.estimateMin && item.estimateMax
                    ? `${formatCurrency(item.estimateMin)} - ${formatCurrency(item.estimateMax)}`
                    : item.estimateMin
                    ? `${formatCurrency(item.estimateMin)}+`
                    : item.estimateMax
                    ? `Up to ${formatCurrency(item.estimateMax)}`
                    : 'N/A'}
                </span>
              </div>
            </div>
          )}

          {/* Start Date */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-baseline justify-between">
              <span className="text-gray-600 text-sm">Start date:</span>
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                {item.auction?.startDate ? formatDate(item.auction.startDate) : 'N/A'}
              </span>
            </div>
          </div>

          {/* End Date */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-baseline justify-between">
              <span className="text-gray-600 text-sm">End date:</span>
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                {item.auction?.endDate ? formatDate(item.auction.endDate) : 'N/A'}
              </span>
            </div>
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
                    disabled={isAuctionClosed}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handlePlaceBid}
                    disabled={isPlacingBid || !bidAmount || isAuctionClosed}
                    className="px-6 sm:px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
                  >
                    {isAuctionClosed 
                      ? (item.auction?.status === 'Upcoming' || isNotStarted 
                          ? 'Auction Not Started' 
                          : 'Auction Closed')
                      : isPlacingBid 
                        ? 'Placing...' 
                        : 'Place Bid'}
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

