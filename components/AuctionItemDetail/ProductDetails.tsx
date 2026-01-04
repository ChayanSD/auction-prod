'use client';

import React, { useState } from 'react';
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
    estimatedPrice: number | null;
    additionalFee: number | null;
    lotCount?: number;
    status?: string; // Item's own status (Live, Closed, etc.)
    auction: {
      id: string;
      name: string;
      slug: string;
      endDate: string;
      status?: string;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  // Priority 1: Check if date has passed - if yes, always show "Auction Closed"
  const endDate = item.auction?.endDate ? new Date(item.auction.endDate) : null;
  const now = new Date();
  const isDatePassed = endDate && endDate < now;
  
  // Check if auction is closed: Priority 1 (date passed) OR Priority 2 (status check when date hasn't passed)
  const isAuctionClosed = isDatePassed || (item.status === 'Closed' || item.auction?.status === 'Ended');

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

    // Check if bid is less than current bid amount
    if (currentBidAmount && bidValue < currentBidAmount) {
      toast.error(
        `Your bid of ${formatCurrency(bidValue)} is less than the current bid of ${formatCurrency(currentBidAmount)}. Please enter a bid of ${formatCurrency(minBid)} or more to place your bid.`,
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

  // Generate lot numbers array
  const lotCount = (item as any).lotCount || 1;
  const lotNumbers = Array.from({ length: lotCount }, (_, i) => i + 1);

  return (
    <div className="w-full space-y-6">
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

      {/* Bidding Ends Date and Status */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-sm text-gray-600">
          Bidding Ends: {item.auction?.endDate ? formatDate(item.auction.endDate) : 'N/A'}
        </div>
        {(() => {
          // Priority 1: Check if date has passed - if yes, always show "Auction Closed"
          const endDateCheck = item.auction?.endDate ? new Date(item.auction.endDate) : null;
          const now = new Date();
          const isDatePassedCheck = endDateCheck && endDateCheck < now;
          
          // Priority 2: If date hasn't passed, check status
          const itemStatusCheck = item.status;
          const auctionStatusCheck = item.auction?.status;
          
          if (isDatePassedCheck || (!isDatePassedCheck && (itemStatusCheck === 'Closed' || auctionStatusCheck === 'Ended'))) {
            return (
              <div className="flex items-center gap-1.5 bg-[#F7F7F7] border border-[#E3E3E3] text-[#4D4D4D] rounded-full px-2.5 py-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                  <path d="M14 8.00013C14 9.17205 13.6569 10.3183 13.0129 11.2974C12.3689 12.2765 11.4522 13.0456 10.3761 13.5097C9.30001 13.9738 8.11155 14.1126 6.95746 13.909C5.80337 13.7054 4.73417 13.1682 3.88188 12.3639C3.83411 12.3187 3.7957 12.2646 3.76884 12.2046C3.74198 12.1447 3.7272 12.08 3.72535 12.0143C3.72349 11.9486 3.73459 11.8832 3.75802 11.8218C3.78144 11.7603 3.81673 11.7042 3.86188 11.6564C3.95304 11.5599 4.0788 11.5036 4.21148 11.4999C4.27718 11.498 4.3426 11.5091 4.40401 11.5325C4.46542 11.556 4.52161 11.5912 4.56938 11.6364C5.28421 12.3108 6.18193 12.7595 7.15037 12.9266C8.11881 13.0937 9.11501 12.9717 10.0145 12.5759C10.914 12.18 11.6769 11.5279 12.2079 10.7009C12.7389 9.87398 13.0144 8.90889 13 7.92625C12.9856 6.94361 12.6819 5.987 12.127 5.17594C11.572 4.36489 10.7904 3.73535 9.87967 3.36601C8.96897 2.99666 7.96962 2.90387 7.00649 3.09925C6.04336 3.29462 5.15916 3.76949 4.46438 4.46451C4.24375 4.68763 4.03625 4.90701 3.83438 5.12513L4.85375 6.14638C4.92376 6.21631 4.97144 6.30544 4.99076 6.40248C5.01009 6.49952 5.00019 6.60012 4.96231 6.69153C4.92444 6.78294 4.86029 6.86106 4.77799 6.916C4.69569 6.97093 4.59895 7.00021 4.5 7.00013H2C1.86739 7.00013 1.74021 6.94746 1.64645 6.85369C1.55268 6.75992 1.5 6.63274 1.5 6.50013V4.00013C1.49992 3.90119 1.5292 3.80444 1.58414 3.72214C1.63908 3.63985 1.71719 3.5757 1.80861 3.53782C1.90002 3.49995 2.00061 3.49004 2.09765 3.50937C2.1947 3.5287 2.28382 3.57638 2.35375 3.64638L3.125 4.41888C3.32625 4.20076 3.53375 3.98138 3.75375 3.75951C4.59255 2.91928 5.66178 2.34679 6.82609 2.1145C7.99041 1.88221 9.19746 2.00057 10.2945 2.45459C11.3915 2.90861 12.3292 3.67789 12.9888 4.66505C13.6484 5.65221 14.0003 6.81288 14 8.00013ZM8 4.50013C7.86739 4.50013 7.74021 4.55281 7.64645 4.64658C7.55268 4.74035 7.5 4.86753 7.5 5.00013V8.00013C7.49997 8.08645 7.52229 8.17131 7.56479 8.24644C7.60729 8.32158 7.66851 8.38443 7.7425 8.42888L10.2425 9.92888C10.2988 9.9627 10.3612 9.9851 10.4262 9.99479C10.4911 10.0045 10.5574 10.0013 10.6211 9.98539C10.6848 9.96949 10.7448 9.94119 10.7976 9.90211C10.8504 9.86303 10.8949 9.81394 10.9288 9.75763C10.9626 9.70133 10.985 9.63892 10.9947 9.57396C11.0043 9.509 11.0012 9.44277 10.9853 9.37904C10.9694 9.31532 10.9411 9.25535 10.902 9.20256C10.8629 9.14977 10.8138 9.1052 10.7575 9.07138L8.5 7.71701V5.00013C8.5 4.86753 8.44732 4.74035 8.35355 4.64658C8.25979 4.55281 8.13261 4.50013 8 4.50013Z" fill="#6E6E6E" />
                </svg>
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Auction Closed</span>
              </div>
            );
          }
          return null;
        })()}
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
                    disabled={isAuctionClosed}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handlePlaceBid}
                    disabled={isPlacingBid || !bidAmount || isAuctionClosed}
                    className="px-6 sm:px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
                  >
                    {isAuctionClosed ? 'Auction Closed' : isPlacingBid ? 'Placing...' : 'Place Bid'}
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

