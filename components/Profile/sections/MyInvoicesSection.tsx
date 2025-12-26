'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { apiClient } from '@/lib/fetcher';
import ViewInvoiceDialog from '@/components/cms/payments/ViewInvoiceDialog';

interface InvoiceItem {
  id: string;
  invoiceNumber?: string;
  stripePaymentLink?: string;
  auctionItem?: {
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
  const [activeTab, setActiveTab] = useState<'paid' | 'unpaid'>('paid');
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<InvoiceItem[]>('/invoice');
      
      let invoicesData: InvoiceItem[] = [];
      if (Array.isArray(response)) {
        invoicesData = response;
      }

      // Filter invoices based on active tab
      const filteredInvoices = invoicesData.filter(invoice => {
        const status = invoice.status?.toLowerCase();
        if (activeTab === 'paid') {
          return status === 'paid' || invoice.paidAt;
        } else {
          return status === 'unpaid' || (!invoice.paidAt && status !== 'paid');
        }
      });

      setInvoices(filteredInvoices);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setInvoices([]);
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
    <section className="bg-white rounded-2xl border border-gray-200 p-5 lg:p-6 shadow-sm">
      <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
        My Invoices
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('paid')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'paid'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Paid Invoices
        </button>
        <button
          onClick={() => setActiveTab('unpaid')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'unpaid'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Unpaid
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
            const imageUrl = invoice.auctionItem?.productImages?.[0]?.url || '/placeholder.jpg';
            const imageAlt = invoice.auctionItem?.productImages?.[0]?.altText || invoice.auctionItem?.name || 'Auction item';
            const endDate = invoice.auctionItem?.auction?.endDate
              ? formatDate(invoice.auctionItem.auction.endDate)
              : formatDate(invoice.createdAt);
            const paidAmount = formatCurrency(invoice.amount);

            return (
              <div
                key={invoice.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Image */}
                  <div className="w-full md:w-32 h-32 bg-gray-100 rounded-lg border border-gray-200 shrink-0 overflow-hidden">
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
                        {invoice.auctionItem?.name || 'Untitled Auction Item'}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span className="truncate">{endDate}</span>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {activeTab === 'paid' ? 'Paid Amount' : 'Amount'}: {formatCurrency(invoice.totalAmount || invoice.amount)}
                        </p>
                      </div>
                    </div>

                    {/* Payment Link or View Invoice Button */}
                    <div className="self-start md:self-center shrink-0">
                      {(invoice.status === 'unpaid' || invoice.status === 'Unpaid') && invoice.stripePaymentLink ? (
                        <a
                          href={invoice.stripePaymentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full md:w-auto px-6 py-2.5 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-all hover:scale-105 whitespace-nowrap inline-block text-center"
                        >
                          Pay Now
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedInvoiceId(invoice.id);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="w-full md:w-auto px-6 py-2.5 border-2 border-purple-600 text-purple-600 font-semibold rounded-full hover:bg-purple-50 transition-all hover:scale-105 whitespace-nowrap"
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

