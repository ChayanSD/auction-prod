'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/fetcher';

interface BidItem {
  id: string;
  amount: number;
  createdAt: string;
  auctionItem: {
    id: string;
    name: string;
    endDate?: string; // Auction item end date
    lotCount?: number;
    currentBid?: number;
    baseBidPrice?: number;
    productImages?: Array<{
      url: string;
      altText?: string;
    }>;
    auction?: {
      id: string;
      name: string;
      endDate?: string; // Fallback: auction end date
      status?: string;
    };
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * My Bids Section Component
 * Displays user's bids with tabs for Active Bids, Bid History, and Paid Bids
 * Pixel-perfect design matching Figma
 */
interface PaidBidItem extends BidItem {
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAt: string;
    status: string;
  };
}

const MyBidsSection: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'active' | 'paid'>('active');

  // Initialize from URL params on mount
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['active', 'paid'].includes(tab)) {
      setActiveTab(tab as 'active' | 'paid');
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: 'active' | 'paid') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/profile?${params.toString()}`, { scroll: false });
  };
  const [bids, setBids] = useState<BidItem[] | PaidBidItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        
        if (activeTab === 'paid') {
          // For paid tab, fetch invoices and match with bids
          const [bidsResponse, invoicesResponse] = await Promise.all([
            apiClient.get<BidItem[]>('/bid?userId=current'),
            apiClient.get<any[]>('/invoice'),
          ]);
          
          let bidsData: BidItem[] = [];
          if (Array.isArray(bidsResponse)) {
            bidsData = bidsResponse;
          }
          
          let invoicesData: any[] = [];
          if (Array.isArray(invoicesResponse)) {
            invoicesData = invoicesResponse.filter(inv => 
              inv.status === 'Paid' || inv.paidAt
            );
          }

          // Match bids with paid invoices
          const paidBids: PaidBidItem[] = bidsData
            .filter(bid => {
              // Find invoice for this bid
              const invoice = invoicesData.find(inv => inv.winningBidId === bid.id);
              return invoice != null;
            })
            .map(bid => {
              const invoice = invoicesData.find(inv => inv.winningBidId === bid.id);
              return {
                ...bid,
                invoice: invoice ? {
                  id: invoice.id,
                  invoiceNumber: invoice.invoiceNumber,
                  totalAmount: invoice.totalAmount,
                  paidAt: invoice.paidAt,
                  status: invoice.status,
                } : undefined,
              };
            });

          setBids(paidBids);
        } else {
          // Fetch user's bids only
          const response = await apiClient.get<BidItem[]>('/bid?userId=current');
          
          let bidsData: BidItem[] = [];
          if (Array.isArray(response)) {
            bidsData = response;
          }

          // Filter bids based on active tab (only 'active' since we removed 'history')
          const now = new Date();
          let filteredBids: BidItem[] = [];

          if (activeTab === 'active') {
            // Active bids: auction item hasn't ended yet (still live/ongoing)
            // Shows bids on auctions that are currently active
            filteredBids = bidsData.filter(bid => {
              // Check if auction item endDate exists and hasn't passed
              const endDate = bid.auctionItem?.endDate 
                ? new Date(bid.auctionItem.endDate)
                : bid.auctionItem?.auction?.endDate 
                ? new Date(bid.auctionItem.auction.endDate)
                : null;
              
              if (!endDate) return false;
              return endDate >= now;
            });
          }

          setBids(filteredBids);
        }
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
          onClick={() => handleTabChange('active')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'active'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Active Bids
        </button>
        <button
          onClick={() => handleTabChange('paid')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'paid'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Paid
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
            const paidBid = bid as PaidBidItem;
            const isPaid = activeTab === 'paid' && paidBid.invoice;
            
            let dateLabel = 'Auction End Date';
            let dateValue = bid.auctionItem?.endDate
              ? formatDate(bid.auctionItem.endDate)
              : bid.auctionItem?.auction?.endDate
              ? formatDate(bid.auctionItem.auction.endDate)
              : 'N/A';
            
            if (isPaid && paidBid.invoice?.paidAt) {
              dateLabel = 'Paid On';
              dateValue = formatDate(paidBid.invoice.paidAt);
            }
            
            const myBid = formatCurrency(bid.amount);
            const totalPaid = isPaid && paidBid.invoice 
              ? formatCurrency(paidBid.invoice.totalAmount)
              : null;

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
                        <span className="truncate">
                          {dateLabel}: {dateValue}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">
                            Winning Bid: {myBid}
                          </p>
                          {isPaid && (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        {isPaid && totalPaid && (
                          <p className="text-sm font-bold text-green-600">
                            Total Paid: {totalPaid}
                          </p>
                        )}
                        {!isPaid && (
                          <p className="text-sm font-bold text-gray-700">
                            Current Bid: {formatCurrency(bid.auctionItem?.currentBid || bid.auctionItem?.baseBidPrice || 0)}
                          </p>
                        )}
                        {isPaid && paidBid.invoice?.invoiceNumber && (
                          <p className="text-xs text-gray-500 mt-1">
                            Invoice: {paidBid.invoice.invoiceNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* View Auction or View Invoice Button */}
                    <div className="self-start md:self-center flex-shrink-0">
                      {isPaid ? (
                        <Link href={`/payment/${paidBid.invoice?.id}`}>
                          <button className="w-full md:w-auto px-6 py-2.5 border-2 border-purple-600 text-purple-600 font-semibold rounded-full hover:bg-purple-50 transition-all hover:scale-105 whitespace-nowrap">
                            View Invoice
                          </button>
                        </Link>
                      ) : (
                        <Link href={`/auction-item/${bid.auctionItem?.id}`}>
                          <button className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-[#E253FF] to-[#9F13FB] text-white font-semibold rounded-full hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap">
                            View Auction
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-500">
            {activeTab === 'paid' 
              ? 'No paid bids found.' 
              : 'No active bids found.'}
          </p>
        </div>
      )}
    </section>
  );
};

export default MyBidsSection;

