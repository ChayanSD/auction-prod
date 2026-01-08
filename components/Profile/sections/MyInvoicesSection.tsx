'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { apiClient } from '@/lib/fetcher';
import ViewInvoiceDialog from '@/components/cms/payments/ViewInvoiceDialog';

interface InvoiceItem {
  id: string;
  invoiceNumber?: string;
  stripePaymentLink?: string;
  // Legacy: single item invoice
  auctionItem?: {
    id: string;
    name: string;
    productImages?: Array<{
      url: string;
      altText?: string;
    }>;
    auction?: {
      id: string;
      name: string;
      endDate?: string | null;
    };
  } | null;
  // New: multiple items per invoice
  lineItems?: Array<{
    id: string;
    auctionItem: {
      id: string;
      name: string;
      productImages?: Array<{
        url: string;
        altText?: string;
      }>;
      auction?: {
        id: string;
        name: string;
        endDate?: string | null;
      };
    };
  }>;
  // Auction info for combined invoices
  auction?: {
    id: string;
    name: string;
    endDate?: string | null;
  } | null;
  amount: number;
  totalAmount?: number;
  status: 'paid' | 'unpaid' | 'Unpaid' | 'Paid' | 'Cancelled';
  paidAt?: string;
  createdAt: string;
}

/**
 * My Invoices Section Component
 * Displays user's invoices with tabs for Paid and Unpaid
 * Pixel-perfect design matching Figma
 */
const MyInvoicesSection: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'paid' | 'unpaid'>('paid');

  // Initialize from URL params on mount
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['paid', 'unpaid'].includes(tab)) {
      setActiveTab(tab as 'paid' | 'unpaid');
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: 'paid' | 'unpaid') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/profile?${params.toString()}`, { scroll: false });
  };
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [allInvoices, setAllInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Calculate counts
  const paidCount = allInvoices.filter(invoice => {
    const status = invoice.status?.toLowerCase();
    return status === 'paid' || invoice.paidAt;
  }).length;

  const unpaidCount = allInvoices.filter(invoice => {
    const status = invoice.status?.toLowerCase();
    return status === 'unpaid' || (!invoice.paidAt && status !== 'paid');
  }).length;

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<InvoiceItem[]>('/invoice');
      
      let invoicesData: InvoiceItem[] = [];
      if (Array.isArray(response)) {
        invoicesData = response;
      } else if (response && typeof response === 'object') {
        // Handle case where API returns object with data property
        invoicesData = (response as any).data || [];
      }

      // Store all invoices for counting
      setAllInvoices(invoicesData);

      // Filter invoices based on active tab
      const filteredInvoices = invoicesData.filter(invoice => {
        const status = invoice.status?.toLowerCase();
        const isPaid = status === 'paid' || !!invoice.paidAt;
        
        if (activeTab === 'paid') {
          return isPaid;
        } else {
          return !isPaid && (status === 'unpaid' || status === null || status === undefined);
        }
      });

      setInvoices(filteredInvoices);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setInvoices([]);
      setAllInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [activeTab]);

  // Refresh invoices when component becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchInvoices();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
    <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 shadow-sm">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          My Invoices
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          View and manage your invoices, make payments, and track your purchase history
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleTabChange('paid')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'paid'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span>Paid Invoices</span>
          {paidCount > 0 && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'paid'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {paidCount}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('unpaid')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'unpaid'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span>Unpaid</span>
          {unpaidCount > 0 && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'unpaid'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {unpaidCount}
            </span>
          )}
        </button>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : invoices.length > 0 ? (
        <div className="space-y-4">
          {invoices.map((invoice) => {
            // Handle both single-item and multi-item invoices
            const isMultiItem = invoice.lineItems && invoice.lineItems.length > 0;
            
            // Get image - prioritize first item from lineItems, fallback to auctionItem
            let imageUrl = '/placeholder.jpg';
            let imageAlt = 'Auction item';
            let itemName = 'Untitled Auction Item';
            
            if (isMultiItem && invoice.lineItems && invoice.lineItems.length > 0) {
              const firstItem = invoice.lineItems[0];
              imageUrl = firstItem.auctionItem?.productImages?.[0]?.url || '/placeholder.jpg';
              imageAlt = firstItem.auctionItem?.productImages?.[0]?.altText || firstItem.auctionItem?.name || 'Auction item';
              itemName = invoice.auction?.name || `${invoice.lineItems.length} Items`;
            } else if (invoice.auctionItem) {
              imageUrl = invoice.auctionItem?.productImages?.[0]?.url || '/placeholder.jpg';
              imageAlt = invoice.auctionItem?.productImages?.[0]?.altText || invoice.auctionItem?.name || 'Auction item';
              itemName = invoice.auctionItem.name;
            } else if (invoice.auction) {
              itemName = invoice.auction.name;
            }
            
            // Get end date - prioritize auction endDate, fallback to first item's auction endDate, then invoice createdAt
            let endDate = formatDate(invoice.createdAt);
            if (invoice.auction?.endDate) {
              endDate = formatDate(invoice.auction.endDate);
            } else if (isMultiItem && invoice.lineItems && invoice.lineItems.length > 0) {
              const firstItemAuction = invoice.lineItems[0].auctionItem?.auction;
              if (firstItemAuction?.endDate) {
                endDate = formatDate(firstItemAuction.endDate);
              }
            } else if (invoice.auctionItem?.auction?.endDate) {
              endDate = formatDate(invoice.auctionItem.auction.endDate);
            }

            const displayAmount = formatCurrency(invoice.totalAmount || invoice.amount);
            const itemCount = isMultiItem && invoice.lineItems ? invoice.lineItems.length : 1;

            return (
              <div
                key={invoice.id}
                className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-4 sm:gap-5">
                  {/* Image */}
                  <div className="w-full md:w-32 h-32 bg-gray-100 rounded-lg border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt={imageAlt}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.jpg';
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg line-clamp-2 flex-1">
                          {itemName}
                        </h3>
                        {isMultiItem && itemCount > 1 && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full shrink-0">
                            {itemCount} items
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span className="truncate">{endDate}</span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-bold text-gray-900 break-words">
                          <span className="shrink-0">{activeTab === 'paid' ? 'Paid Amount' : 'Amount'}: </span>
                          <span className="break-words">{displayAmount}</span>
                        </p>
                        {invoice.invoiceNumber && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Invoice: {invoice.invoiceNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Payment Link or View Invoice Button */}
                    <div className="self-start md:self-center shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3">
                      {(invoice.status === 'unpaid' || invoice.status === 'Unpaid') && invoice.stripePaymentLink ? (
                        <>
                          {/* View Invoice Button for Unpaid */}
                          <Link
                            href={`/invoice/${invoice.id}`}
                            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 border-2 border-purple-600 text-purple-600 font-semibold rounded-full hover:bg-purple-50 transition-all hover:scale-105 whitespace-nowrap text-center inline-flex items-center justify-center"
                          >
                            View Invoice
                          </Link>
                          {/* Pay Now Button */}
                          <a
                            href={invoice.stripePaymentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-all hover:scale-105 whitespace-nowrap text-center inline-flex items-center justify-center"
                          >
                            Pay Now
                          </a>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedInvoiceId(invoice.id);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="w-full sm:w-auto px-5 sm:px-6 py-2.5 border-2 border-purple-600 text-purple-600 font-semibold rounded-full hover:bg-purple-50 transition-all hover:scale-105 whitespace-nowrap"
                        >
                          View Invoice
                        </button>
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
          <p className="text-gray-500">No invoices found.</p>
        </div>
      )}

      {/* Invoice Modal */}
      <ViewInvoiceDialog
        invoiceId={selectedInvoiceId}
        open={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoiceId(null);
        }}
      />
    </section>
  );
};

export default MyInvoicesSection;

