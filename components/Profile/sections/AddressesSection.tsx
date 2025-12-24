'use client';

import React from 'react';
import { Edit } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

interface AddressCardProps {
  title: string;
  isDefault: boolean;
  name: string;
}

const AddressCard: React.FC<AddressCardProps> = ({ title, isDefault, name }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-2 text-sm text-gray-700">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <button className="flex items-center gap-1 text-xs text-gray-600 hover:underline">
          <Edit className="w-3 h-3" />
          <span>Edit</span>
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span
          className={`inline-flex h-6 w-24 items-center justify-center rounded-full text-[10px] px-2 font-medium ${
            isDefault
              ? 'bg-gradient-to-r from-[#E253FF] to-[#9F13FB] text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {isDefault ? 'Default' : 'Make Default'}
        </span>
      </div>
      <div className="text-xs leading-relaxed">
        <p className="font-medium">{name}</p>
        <p>8 Burns Terrace</p>
        <p>Stonehaven</p>
        <p>AB39 2NA</p>
        <p>UK</p>
      </div>
    </div>
  );
};

/**
 * Addresses Section Component
 * Displays billing and shipping addresses
 * Pixel-perfect design matching Figma
 */
const AddressesSection: React.FC = () => {
  const { user } = useUser();
  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || 'Craig Watson';

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-5 lg:p-6 shadow-sm">
      <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
        My Addresses
      </h2>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        <AddressCard title="My Billing Address" isDefault={false} name={userName} />
        <AddressCard title="My Shipping Address" isDefault={true} name={userName} />
      </div>

      <button className="inline-flex items-center justify-center rounded-full border border-purple-600 px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors">
        + Add New Address
      </button>
    </section>
  );
};

export default AddressesSection;

