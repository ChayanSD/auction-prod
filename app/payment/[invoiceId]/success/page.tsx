'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import { apiClient } from '@/lib/fetcher';
import PremiumLoader from '@/components/shared/PremiumLoader';
import toast from 'react-hot-toast';

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  auctionItem: {
    name: string;
  };
}

export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  // Mark invoice as paid after successful payment
  useEffect(() => {
    if (invoiceId && invoice && invoice.status !== 'Paid') {
      const markAsPaid = async () => {
        try {
          await apiClient.post(`/invoice/${invoiceId}/mark-paid`, {});
          // Refresh invoice data
          fetchInvoice();
        } catch (err) {
          console.error('Error marking invoice as paid:', err);
        }
      };
      markAsPaid();
    }
  }, [invoiceId, invoice]);

  // Mark invoice as paid after successful payment
  useEffect(() => {
    if (invoiceId && invoice && invoice.status !== 'Paid') {
      const markAsPaid = async () => {
        try {
          await apiClient.post(`/invoice/${invoiceId}/mark-paid`, {});
          // Refresh invoice data
          const updatedInvoice = await apiClient.get<Invoice>(`/invoice/${invoiceId}`);
          setInvoice(updatedInvoice);
        } catch (err) {
          console.error('Error marking invoice as paid:', err);
        }
      };
      markAsPaid();
    }
  }, [invoiceId, invoice]);

  const fetchInvoice = async () => {
    try {
      const data = await apiClient.get<Invoice>(`/invoice/${invoiceId}`);
      setInvoice(data);
    } catch (err) {
      console.error('Error fetching invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <Header />
        <div className="h-16 lg:h-20"></div>
        <PremiumLoader text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Header />
      <div className="h-16 lg:h-20"></div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          
          {invoice && (
            <>
              <p className="text-lg text-gray-600 mb-2">
                Thank you for your payment
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Invoice #{invoice.invoiceNumber}
              </p>
            </>
          )}

          <div className="space-y-4">
            <button
              onClick={() => router.push('/profile')}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              View My Invoices
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-full hover:bg-gray-50 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

