'use client';

import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { apiClient } from '@/lib/fetcher';

interface Address {
  country: string;
  address1: string;
  address2?: string;
  city: string;
  postcode: string;
}

interface AddressCardProps {
  title: string;
  isDefault: boolean;
  name: string;
  address?: Address;
  loading?: boolean;
}

const AddressCard: React.FC<AddressCardProps> = ({ title, isDefault, name, address, loading }) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6 flex flex-col gap-3">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
        <button 
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-purple-600 transition-colors px-2 py-1 rounded-md hover:bg-purple-50"
          aria-label={`Edit ${title}`}
        >
          <Edit className="w-4 h-4" />
          <span className="hidden sm:inline">Edit</span>
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-7 sm:h-8 w-28 sm:w-32 items-center justify-center rounded-full text-xs sm:text-sm px-3 sm:px-4 font-medium transition-colors ${
            isDefault
              ? 'bg-gradient-to-r from-[#E253FF] to-[#9F13FB] text-white shadow-sm'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
          }`}
        >
          {isDefault ? 'Default' : 'Make Default'}
        </span>
      </div>
      
      {address ? (
        <div className="text-sm sm:text-base leading-relaxed space-y-1 text-gray-700">
          <p className="font-semibold text-gray-900 mb-2">{name}</p>
          <p className="text-gray-700">{address.address1}</p>
          {address.address2 && <p className="text-gray-700">{address.address2}</p>}
          <p className="text-gray-700">{address.city}</p>
          <p className="text-gray-700">{address.postcode}</p>
          <p className="text-gray-700 font-medium mt-2">{address.country}</p>
        </div>
      ) : (
        <div className="text-sm sm:text-base text-gray-500 py-2">
          <p>No address saved</p>
        </div>
      )}
    </div>
  );
};

/**
 * Addresses Section Component
 * Displays billing and shipping addresses from database
 * Pixel-perfect design matching Figma
 */
const AddressesSection: React.FC = () => {
  const { user } = useUser();
  const [billingAddress, setBillingAddress] = useState<Address | null>(null);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get<{
          user: {
            billingAddress?: Address;
            shippingAddress?: Address;
          };
        }>('/user/profile');
        
        if (data.user) {
          setBillingAddress(data.user.billingAddress || null);
          setShippingAddress(data.user.shippingAddress || null);
        }
      } catch (err) {
        console.error('Error fetching addresses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName}${user.middleName ? ` ${user.middleName}` : ''} ${user.lastName}`
    : user?.firstName || 'User';

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 shadow-sm">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          My Addresses
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Manage your billing and shipping addresses for orders and invoices
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 mb-6 sm:mb-8">
        <AddressCard 
          title="My Billing Address" 
          isDefault={false} 
          name={userName}
          address={billingAddress || undefined}
          loading={loading}
        />
        <AddressCard 
          title="My Shipping Address" 
          isDefault={true} 
          name={userName}
          address={shippingAddress || undefined}
          loading={loading}
        />
      </div>

      <button 
        className="inline-flex items-center justify-center rounded-full border-2 border-purple-600 px-6 py-3 sm:px-8 sm:py-3.5 text-sm sm:text-base font-semibold text-purple-600 hover:bg-purple-50 hover:border-purple-700 transition-all active:scale-95 w-full sm:w-auto"
        aria-label="Add new address"
      >
        <span className="mr-2 text-lg">+</span>
        Add New Address
      </button>
    </section>
  );
};

export default AddressesSection;

