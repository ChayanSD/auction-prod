'use client';

import React from 'react';
import { Edit } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

/**
 * My Details Section Component
 * Displays user's personal information
 * Pixel-perfect design matching Figma
 */
const MyDetailsSection: React.FC = () => {
  const { user } = useUser();

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            My Details
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your personal information and account details
          </p>
        </div>
        <button 
          className="flex items-center gap-2 text-sm sm:text-base text-purple-600 font-semibold hover:text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors self-start sm:self-auto"
          aria-label="Edit personal details"
        >
          <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Edit</span>
        </button>
      </div>

      <div className="grid gap-5 sm:gap-6 text-sm sm:text-base text-gray-700">
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Full Name</label>
          <div className="h-11 sm:h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-4 sm:px-5 text-sm sm:text-base text-gray-900">
            {user?.firstName && user?.lastName
              ? `${user.firstName}${user.middleName ? ` ${user.middleName}` : ''} ${user.lastName}`
              : user?.firstName || user?.email?.split('@')[0] || 'N/A'}
          </div>
        </div>
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className="w-full h-11 sm:h-12 rounded-lg border border-gray-200 bg-gray-50 px-4 sm:px-5 text-sm sm:text-base text-gray-900 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Phone Number</label>
          <div className="h-11 sm:h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-4 sm:px-5 text-sm sm:text-base text-gray-900">
            {user?.phone || '+44'}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyDetailsSection;

