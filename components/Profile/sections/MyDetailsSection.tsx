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
    <section className="bg-white rounded-2xl border border-gray-200 p-5 lg:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
          My Details
        </h2>
        <button className="flex items-center gap-1 text-sm text-purple-600 font-medium hover:underline">
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>

      <div className="grid gap-4 text-sm text-gray-700">
        <div>
          <p className="font-medium text-gray-500 mb-1">Full Name</p>
          <div className="h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3 sm:px-4">
            {user?.firstName && user?.lastName
              ? `${user.firstName}${user.middleName ? ` ${user.middleName}` : ''} ${user.lastName}`
              : user?.firstName || user?.email?.split('@')[0] || 'N/A'}
          </div>
        </div>
        <div>
          <p className="font-medium text-gray-500 mb-1">Email Address</p>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3 sm:px-4 text-sm text-gray-700"
          />
        </div>
        <div>
          <p className="font-medium text-gray-500 mb-1">Phone Number</p>
          <div className="h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3 sm:px-4">
            {user?.phone || '+44'}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyDetailsSection;

