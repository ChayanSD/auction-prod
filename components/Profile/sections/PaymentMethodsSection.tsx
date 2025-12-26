'use client';

import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { apiClient } from '@/lib/fetcher';

interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

interface ProfileData {
  user: {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
    billingAddress?: {
      country: string;
      address1: string;
      address2?: string;
      city: string;
      postcode: string;
    };
    shippingAddress?: {
      country: string;
      address1: string;
      address2?: string;
      city: string;
      postcode: string;
    };
  };
  paymentMethods: PaymentMethod[];
}

/**
 * Payment Methods Section Component
 * Displays saved payment methods from Stripe
 * Pixel-perfect design matching Figma
 */
const PaymentMethodsSection: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get<ProfileData>('/user/profile');
        if (data.paymentMethods) {
          setPaymentMethods(data.paymentMethods);
        }
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        setPaymentMethods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const formatExpiryDate = (month: number, year: number) => {
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedYear = year.toString().slice(-2);
    return `${formattedMonth}/${formattedYear}`;
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-5 lg:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
          My Payment Methods
        </h2>
        <button className="flex items-center gap-1 text-sm text-purple-600 font-medium hover:underline">
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : paymentMethods.length > 0 ? (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="space-y-3 text-sm text-gray-700">
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-10">
                <div className="flex-1">
                  <p className="font-medium text-gray-500 mb-1">Card Number</p>
                  <div className="h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3 sm:px-4">
                    {formatCardBrand(method.card.brand)} •••• •••• •••• {method.card.last4}
                  </div>
                </div>
                <div className="w-full lg:w-40 mt-3 lg:mt-0">
                  <p className="font-medium text-gray-500 mb-1">Expiry Date</p>
                  <div className="h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3 sm:px-4">
                    {formatExpiryDate(method.card.expMonth, method.card.expYear)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No payment methods saved yet.</p>
          <p className="text-gray-400 text-xs mt-2">Payment methods will appear here after you complete a payment.</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 mt-4 text-xs text-gray-700">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span>Auto invoice payment</span>
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span>Collection only</span>
        </label>
      </div>
    </section>
  );
};

export default PaymentMethodsSection;

