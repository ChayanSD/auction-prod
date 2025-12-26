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
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-2">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

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
      {address ? (
        <div className="text-xs leading-relaxed">
          <p className="font-medium">{name}</p>
          <p>{address.address1}</p>
          {address.address2 && <p>{address.address2}</p>}
          <p>{address.city}</p>
          <p>{address.postcode}</p>
          <p>{address.country}</p>
        </div>
      ) : (
        <div className="text-xs text-gray-500">
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
    <section className="bg-white rounded-2xl border border-gray-200 p-5 lg:p-6 shadow-sm">
      <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
        My Addresses
      </h2>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
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

      <button className="inline-flex items-center justify-center rounded-full border border-purple-600 px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors">
        + Add New Address
      </button>
    </section>
  );
};

export default AddressesSection;

