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
import { Calendar, User, Package, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  bidAmount: number;
  additionalFee?: number;
  totalAmount: number;
  status: 'Unpaid' | 'Paid' | 'Cancelled';
  createdAt: string;
  paidAt?: string;
  notes?: string;
  auctionItem: {
    id: string;
    name: string;
    lotCount?: number;
    productImages?: Array<{
      url: string;
      altText?: string;
    }>;
    auction: {
      id: string;
      name: string;
      endDate: string;
    };
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  winningBid: {
    id: string;
    amount: number;
    createdAt: string;
  };
  stripePaymentLink?: string | null;
}

interface ViewInvoiceDialogProps {
  invoiceId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function ViewInvoiceDialog({ invoiceId, open, onClose }: ViewInvoiceDialogProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !invoiceId) {
      setInvoice(null);
      setError(null);
      return;
    }

    const fetchInvoice = async () => {
      if (!invoiceId) {
        setError('Invoice ID is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log('Fetching invoice with ID:', invoiceId);
        const data = await apiClient.get<Invoice>(`/invoice/${invoiceId}`);
        console.log('Invoice data received:', data);
        if (!data) {
          setError('Invoice not found');
          return;
        }
        setInvoice(data);
      } catch (err: any) {
        console.error('Error fetching invoice:', err);
        console.error('Error details:', {
          message: err?.message,
          status: err?.status,
          data: err?.data,
          response: err?.response,
        });
        // Handle both ApiError and axios error formats
        const errorMessage = 
          err?.message || 
          err?.data?.error || 
          err?.response?.data?.error || 
          'Failed to load invoice. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [open, invoiceId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>Paid</span>
          </div>
        );
      case 'Unpaid':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            <span>Unpaid</span>
          </div>
        );
      case 'Cancelled':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            <span>Cancelled</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: '700px' }} className=" max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="px-4 sm:px-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">Invoice Details</DialogTitle>
          <DialogDescription className="text-sm">
            View complete invoice information and payment status
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 px-4">
            <PremiumLoader text="Loading invoice..." fullScreen={false} />
          </div>
        ) : error ? (
          <div className="text-center py-12 px-4">
            <div className="text-red-500 mb-4 font-medium">{error}</div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        ) : invoice ? (
          <div className="space-y-4 sm:space-y-6 mt-4 px-4 sm:px-0">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 sm:p-6 border border-purple-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Invoice #{invoice.invoiceNumber}</h3>
                  <p className="text-sm text-gray-600">Created: {formatDate(invoice.createdAt)}</p>
                </div>
                {getStatusBadge(invoice.status)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column - User & Auction Info */}
              <div className="space-y-4 sm:space-y-6">
                {/* User Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Customer Information</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Name:</span>{' '}
                      <span className="font-medium text-gray-900">
                        {invoice.user.firstName} {invoice.user.lastName}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600">Email:</span>{' '}
                      <span className="font-medium text-gray-900">{invoice.user.email}</span>
                    </p>
                  </div>
                </div>

                {/* Auction Item Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Auction Item</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Item:</span>{' '}
                      <span className="font-medium text-gray-900">{invoice.auctionItem.name}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Auction:</span>{' '}
                      <span className="font-medium text-gray-900">{invoice.auctionItem.auction.name}</span>
                    </p>
                    {invoice.auctionItem.lotCount && invoice.auctionItem.lotCount > 1 && (
                      <p>
                        <span className="text-gray-600">Lots:</span>{' '}
                        <span className="font-medium text-gray-900">{invoice.auctionItem.lotCount}</span>
                      </p>
                    )}
                    <p>
                      <span className="text-gray-600">Auction End:</span>{' '}
                      <span className="font-medium text-gray-900">
                        {formatDate(invoice.auctionItem.auction.endDate)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Payment & Bid Info */}
              <div className="space-y-4 sm:space-y-6">
                {/* Product Image */}
                {invoice.auctionItem.productImages && invoice.auctionItem.productImages.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Product Image</h4>
                    </div>
                    <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={invoice.auctionItem.productImages[0].url}
                        alt={invoice.auctionItem.productImages[0].altText || invoice.auctionItem.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Payment Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Payment Summary</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 pb-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Winning Bid:</span>
                      <span className="text-sm font-semibold text-gray-900 break-words sm:text-right">
                        {formatCurrency(invoice.bidAmount)}
                      </span>
                    </div>
                    {invoice.additionalFee && invoice.additionalFee > 0 && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 pb-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">Additional Fees:</span>
                        <span className="text-sm font-semibold text-gray-900 break-words sm:text-right">
                          {formatCurrency(invoice.additionalFee)}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1 sm:gap-2 pt-2">
                      <span className="text-base sm:text-lg font-bold text-gray-900">Total Amount:</span>
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 break-words">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bid Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Bid Information</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-600">Bid Amount:</span>
                      <span className="font-medium text-gray-900 break-words">
                        {formatCurrency(invoice.winningBid.amount)}
                      </span>
                    </div>
                    <p>
                      <span className="text-gray-600">Bid Placed:</span>{' '}
                      <span className="font-medium text-gray-900">
                        {formatDate(invoice.winningBid.createdAt)}
                      </span>
                    </p>
                    {invoice.paidAt && (
                      <p>
                        <span className="text-gray-600">Paid At:</span>{' '}
                        <span className="font-medium text-green-600">
                          {formatDate(invoice.paidAt)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {invoice.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 px-4 sm:px-0 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
              {invoice.status === 'Unpaid' && invoice.stripePaymentLink && (
                <a
                  href={invoice.stripePaymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-center"
                >
                  Pay Now
                </a>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

