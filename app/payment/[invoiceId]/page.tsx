'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe-client';
import { apiClient } from '@/lib/fetcher';
import { useUser } from '@/contexts/UserContext';
import Header from '@/components/Header';
import PremiumLoader from '@/components/shared/PremiumLoader';
import PaymentForm from '@/components/Payment/PaymentForm';
import toast from 'react-hot-toast';

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  bidAmount: number;
  additionalFee: number;
  status: 'Unpaid' | 'Paid' | 'Cancelled';
  stripePaymentLink: string | null;
  stripePaymentLinkId: string | null;
  auctionItem: {
    id: string;
    name: string;
    lotCount?: number;
    productImages?: Array<{
      url: string;
      altText?: string;
    }>;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const invoiceId = params.invoiceId as string;
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiClient.get<Invoice>(`/invoice/${invoiceId}`);
      
      // Validate invoice access
      if (!data) {
        setError('Invoice not found');
        return;
      }

      // Check if invoice is already paid
      if (data.status === 'Paid') {
        setError('This invoice has already been paid');
        return;
      }

      // Check if invoice is cancelled
      if (data.status === 'Cancelled') {
        setError('This invoice has been cancelled');
        return;
      }

      // Check if user is the invoice owner (if logged in)
      if (user && data.user.id !== user.id) {
        setError('You do not have permission to access this invoice');
        return;
      }

      // If no payment link, invoice is invalid
      if (!data.stripePaymentLink && !data.stripePaymentLinkId) {
        setError('Payment link is not available for this invoice');
        return;
      }

      setInvoice(data);

      // Create payment intent for checkout (optional - user can also use Stripe payment link)
      if (data.stripePaymentLink || data.stripePaymentLinkId) {
        try {
          const sessionResponse = await apiClient.post<{ clientSecret: string }>('/stripe/create-payment-intent', {
            invoiceId: data.id,
            amount: data.totalAmount,
          });
          if (sessionResponse?.clientSecret) {
            setClientSecret(sessionResponse.clientSecret);
          }
        } catch (err: any) {
          console.error('Error creating payment intent:', err);
          // If payment intent creation fails, user can still use the Stripe payment link
        }
      }
    } catch (err: any) {
      console.error('Error fetching invoice:', err);
      setError(err?.message || 'Failed to load invoice. Please check your payment link.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <Header />
        <div className="h-16 lg:h-20"></div>
        <PremiumLoader text="Loading payment page..." />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <Header />
        <div className="h-16 lg:h-20"></div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2>
              <p className="text-red-700 mb-4">{error || 'Invoice not found'}</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const imageUrl = invoice.auctionItem.productImages?.[0]?.url || '/placeholder.jpg';
  const imageAlt = invoice.auctionItem.productImages?.[0]?.altText || invoice.auctionItem.name;

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Header />
      <div className="h-16 lg:h-20"></div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] px-6 py-8 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Complete Your Payment</h1>
            <p className="text-white/90">Invoice #{invoice.invoiceNumber}</p>
          </div>

          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Invoice Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Invoice Details</h2>
                  
                  {/* Product Image */}
                  <div className="mb-6">
                    <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden mb-4">
                      <img
                        src={imageUrl}
                        alt={imageAlt}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{invoice.auctionItem.name}</h3>
                    {invoice.auctionItem.lotCount && invoice.auctionItem.lotCount > 1 && (
                      <p className="text-sm text-gray-600 mt-1">
                        {invoice.auctionItem.lotCount} lots
                      </p>
                    )}
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-sm">
                      <span className="text-gray-600">Winning Bid:</span>
                      <span className="font-semibold break-words sm:text-right">{formatCurrency(invoice.bidAmount)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-sm">
                      <span className="text-gray-600">Additional Fees:</span>
                      <span className="break-words sm:text-right">{formatCurrency(invoice.additionalFee)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex flex-col gap-1 sm:gap-2">
                      <span className="font-bold text-base sm:text-lg">Total Amount:</span>
                      <span className="font-bold text-lg sm:text-xl md:text-2xl text-purple-600 break-words">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Billing To:</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.user.firstName} {invoice.user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{invoice.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Right: Payment Form */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
                
                {clientSecret ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Complete your payment securely below:
                    </p>
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <PaymentForm invoiceId={invoice.id} amount={invoice.totalAmount} />
                    </Elements>
                  </div>
                ) : invoice.stripePaymentLink ? (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-yellow-800 mb-2">
                        Complete your payment securely via Stripe Checkout:
                      </p>
                      <a
                        href={invoice.stripePaymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center px-6 py-3 bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
                      >
                        Pay with Stripe Checkout
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">Payment link is not available. Please contact support.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

