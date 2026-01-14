'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/fetcher';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { cleanLotNumber, formatLotNumber } from '@/utils/lotNumber';

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
    lotNumber?: string | null;
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
  bidCount: initialBidCount,
  currentBidAmount: initialCurrentBidAmount,
  minBid: initialMinBid, 
}) => {
  const { user } = useUser();
  const router = useRouter();
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // Real-time state
  const [currentBid, setCurrentBid] = useState(initialCurrentBidAmount);
  const [bidCount, setBidCount] = useState(initialBidCount);
  const [nextMinBid, setNextMinBid] = useState(0);
  // Track reserve met status. Initial value comes from item (which we typed loosely as having it).
  // Ideally, ProductDetailsProps.item should have it.
  const [isReserveMet, setIsReserveMet] = useState((item as any).isReserveMet ?? true); // Default true to hide if undefined, or false?
                                                                                        // Actually safely: default true (hide) unless explicitly false.
                                                                                        // But logically, if reservePrice is present, it might be false. 
                                                                                        // Let's rely on what server sent. If undefined, assume no reserve -> met.

  // Initialize Pusher & Values
  useEffect(() => {
    // Sync initial prop separate from effect if needed, but simplistic approach:
    setIsReserveMet((item as any).isReserveMet);
    
    const calculateNextMin = (price: number) => {
       // Logic mirroring utils/auctionLogic.ts
       let increment = 50;
       if (price < 50) increment = 2;
       else if (price < 100) increment = 5;
       else if (price < 250) increment = 10;
       else if (price < 1000) increment = 25;
       
       return price + increment;
    };
    
    // Initial calculation
    if (bidCount === 0) {
        setNextMinBid(Math.max(item.baseBidPrice, 0));
    } else {
        setNextMinBid(calculateNextMin(currentBid));
    }

    // Pusher Subscription
    const channelName = `auction-item-${item.id}`;
    const handleBidEvent = (data: any) => {
        if (data.currentBid !== undefined) {
             setCurrentBid(data.currentBid);
             setNextMinBid(calculateNextMin(data.currentBid));
        }
        if (data.bidCount !== undefined) {
             setBidCount(data.bidCount);
        }
        if (data.isReserveMet !== undefined) {
             setIsReserveMet(data.isReserveMet);
        }
    };

    import('@/lib/pusher-client').then(({ pusherClient }) => {
        const channel = pusherClient.subscribe(channelName);
        channel.bind('bid-placed', handleBidEvent);
    });

    return () => {
        import('@/lib/pusher-client').then(({ pusherClient }) => {
             pusherClient.unsubscribe(channelName);
        });
    };
  }, [item.id, item.baseBidPrice, currentBid, bidCount]);

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

  const endDate = item.auction?.endDate ? new Date(item.auction.endDate) : null;
  const startDate = item.auction?.startDate ? new Date(item.auction.startDate) : null;
  const now = new Date();
  const isDatePassed = endDate ? endDate < now : false;
  const isNotStarted = startDate ? startDate > now : false;

  const isAuctionClosed = Boolean(
    isDatePassed ||
    item.status === 'Closed' ||
    item.auction?.status === 'Closed' ||
    item.auction?.status === 'Upcoming' ||
    isNotStarted
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
      toast.error('Please login to place a bid', {
        autoClose: 4000,
        pauseOnHover: false,
      });
      router.push('/login');
      return;
    }

    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue) || bidValue < nextMinBid) {
      toast.error(`Bid must be at least ${formatCurrency(nextMinBid)}`, {
        autoClose: 4000,
        pauseOnHover: false,
      });
      return;
    }

    // Proxy bidding: user sets a max bid. Must be >= nextMinBid.
    // We removed the explicit "bidValue <= currentBid" check because 
    // existing check "bidValue < nextMinBid" covers it (nextMinBid > currentBid).

    try {
      setIsPlacingBid(true);
      await apiClient.post('/bid', {
        auctionItemId: item.id,
        userId: user.id,
        amount: bidValue,
      });
      toast.success('Bid placed successfully!', {
        autoClose: 4000,
        pauseOnHover: false,
      });
      setBidAmount('');
    } catch (error) {
      console.error('Error placing bid:', error);
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to place bid';
      toast.error(message, {
        autoClose: 4000,
        pauseOnHover: false,
      });
    } finally {
      setIsPlacingBid(false);
    }
  };

  const lotCount = (item as { lotCount?: number }).lotCount || 1;
  const lotNumbers = Array.from({ length: lotCount }, (_, i) => i + 1);

  // Clean lot number for display
  const cleanedLotNumber = cleanLotNumber(item.lotNumber);
  const formattedLotNumber = formatLotNumber(item.lotNumber);

  return (
    <div className="w-full space-y-6 relative">
      {/* Product Title */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
          {item.name || 'N/A'}
        </h1>
        
        {/* Lot Number and Tags - Display together on same line when possible */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Lot Number Badge */}
          {cleanedLotNumber && (
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-50 border border-purple-200 rounded-lg">
              <span className="text-xs sm:text-sm font-medium text-purple-700">Lot #</span>
              <span className="text-sm sm:text-base font-bold text-purple-900">
                {cleanedLotNumber}
              </span>
            </div>
          )}
          
          {/* Tags */}
          {item.auction?.tags && item.auction.tags.length > 0 && (
            <>
              {item.auction.tags.map((tagOnAuction) => (
                <span
                  key={tagOnAuction.tag.id}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-100 border border-purple-300 rounded-full text-xs sm:text-sm font-medium text-purple-700"
                >
                  {tagOnAuction.tag.name}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

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

      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg border border-gray-200">
        <div className="space-y-4">
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

          <div className="space-y-2">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <span className="text-gray-600 text-sm">
                  {bidCount > 0 ? 'Current Bid:' : 'Starting Bid:'}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentBid ?? item.baseBidPrice)}
                </span>
                
                {/* Reserve Not Met Badge */}
                {isReserveMet === false && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold uppercase tracking-wide rounded-md border border-gray-300">
                        Reserve not met
                    </span>
                )}
                
                <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all">
                  <span className="text-sm font-bold whitespace-nowrap">
                  {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
                </span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              (Enter {formatCurrency(nextMinBid)} or more)
            </p>
          </div>

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

          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-baseline justify-between">
              <span className="text-gray-600 text-sm">Start date:</span>
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                {item.auction?.startDate ? formatDate(item.auction.startDate) : 'N/A'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-baseline justify-between">
              <span className="text-gray-600 text-sm">End date:</span>
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                {item.auction?.endDate ? formatDate(item.auction.endDate) : 'N/A'}
              </span>
            </div>
          </div>

          {user ? (
            <div className="pt-4 space-y-3">
              <div>
                <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your max bid
                </label>
                <div className="flex flex-col min-[375px]:flex-row gap-2">
                  <input
                    id="bidAmount"
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={formatCurrency(nextMinBid)}
                    min={nextMinBid}
                    disabled={isAuctionClosed}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handlePlaceBid();
                    }}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed w-full"
                  />
                  <button
                    onClick={handlePlaceBid}
                    disabled={isPlacingBid || !bidAmount || isAuctionClosed}
                    className="w-full min-[375px]:w-auto min-[375px]:px-6 sm:px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
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
                <p className="text-xs text-gray-500 mt-1">
                    We'll automatically bid for you, up to your max amount.
                </p>
              </div>
            </div>
          ) : (
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

