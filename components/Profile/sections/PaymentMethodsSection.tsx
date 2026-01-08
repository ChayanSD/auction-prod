'use client';

import React, { useState, useEffect } from 'react';
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
    <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          My Payment Methods
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Your saved payment methods for quick and easy checkout. Payment methods are automatically saved when you complete a payment.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      ) : paymentMethods.length > 0 ? (
        <div className="space-y-5 sm:space-y-6">
          {paymentMethods.map((method) => (
            <div key={method.id} className="bg-gray-50 rounded-xl border border-gray-200 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 lg:gap-10">
                <div className="flex-1">
                  <label className="block font-semibold text-gray-700 mb-2 text-sm sm:text-base">Card Number</label>
                  <div className="h-11 sm:h-12 rounded-lg border border-gray-200 bg-white flex items-center px-4 sm:px-5 text-sm sm:text-base text-gray-900 font-medium">
                    {formatCardBrand(method.card.brand)} •••• •••• •••• {method.card.last4}
                  </div>
                </div>
                <div className="w-full sm:w-40 mt-4 sm:mt-0">
                  <label className="block font-semibold text-gray-700 mb-2 text-sm sm:text-base">Expiry Date</label>
                  <div className="h-11 sm:h-12 rounded-lg border border-gray-200 bg-white flex items-center px-4 sm:px-5 text-sm sm:text-base text-gray-900 font-medium">
                    {formatExpiryDate(method.card.expMonth, method.card.expYear)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-600 text-base sm:text-lg font-medium mb-2">No payment methods saved yet</p>
          <p className="text-gray-500 text-sm sm:text-base">Payment methods will appear here after you complete a payment</p>
        </div>
      )}
    </section>
  );
};

export default PaymentMethodsSection;

