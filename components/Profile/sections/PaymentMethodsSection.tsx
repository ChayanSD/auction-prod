'use client';

import React from 'react';
import { Edit } from 'lucide-react';

/**
 * Payment Methods Section Component
 * Displays saved payment methods
 * Pixel-perfect design matching Figma
 */
const PaymentMethodsSection: React.FC = () => {
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

      <div className="space-y-3 text-sm text-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-10">
          <div className="flex-1">
            <p className="font-medium text-gray-500 mb-1">Card Number</p>
            <div className="h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3">
              •••• •••• •••• 3456
            </div>
          </div>
          <div className="w-full lg:w-40 mt-3 lg:mt-0">
            <p className="font-medium text-gray-500 mb-1">Expiry Date</p>
            <div className="h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3">
              12/27
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mt-2 text-xs text-gray-700">
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
      </div>
    </section>
  );
};

export default PaymentMethodsSection;

