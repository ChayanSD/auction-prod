'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { apiClient } from '@/lib/fetcher';
import toast from 'react-hot-toast';

interface Address {
  country: string;
  address1: string;
  address2?: string;
  city: string;
  postcode: string;
}

interface AddressCardProps {
  title: string;
  addressType: 'billing' | 'shipping';
  address?: Address;
  loading?: boolean;
  onUpdate: () => void;
}

const AddressCard: React.FC<AddressCardProps> = ({ 
  title, 
  addressType, 
  address, 
  loading,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Address>({
    country: address?.country || '',
    address1: address?.address1 || '',
    address2: address?.address2 || '',
    city: address?.city || '',
    postcode: address?.postcode || '',
  });

  // Update form data when address changes
  useEffect(() => {
    if (address) {
      setFormData({
        country: address.country || '',
        address1: address.address1 || '',
        address2: address.address2 || '',
        city: address.city || '',
        postcode: address.postcode || '',
      });
    }
  }, [address]);

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

  const handleEdit = () => {
    setIsEditing(true);
    // Initialize form data when entering edit mode
    if (address) {
      setFormData({
        country: address.country || '',
        address1: address.address1 || '',
        address2: address.address2 || '',
        city: address.city || '',
        postcode: address.postcode || '',
      });
    } else {
      // Initialize empty form if no address exists
      setFormData({
        country: '',
        address1: '',
        address2: '',
        city: '',
        postcode: '',
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original address
    if (address) {
      setFormData({
        country: address.country || '',
        address1: address.address1 || '',
        address2: address.address2 || '',
        city: address.city || '',
        postcode: address.postcode || '',
      });
    } else {
      setFormData({
        country: '',
        address1: '',
        address2: '',
        city: '',
        postcode: '',
      });
    }
  };

  const handleSave = async () => {
    if (!formData.country || !formData.address1 || !formData.city || !formData.postcode) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const updateData = addressType === 'billing' 
        ? { billingAddress: formData }
        : { shippingAddress: formData };
      
      await apiClient.patch('/user/profile', updateData);
      toast.success(`${title} updated successfully`);
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      console.error(`Error updating ${addressType} address:`, error);
      toast.error(error?.response?.data?.error || `Failed to update ${title}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
        {!isEditing ? (
          <button 
            onClick={handleEdit}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-purple-600 transition-colors px-2 py-1 rounded-md hover:bg-purple-50"
            aria-label={`Edit ${title}`}
          >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCancel}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-700 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
              aria-label="Cancel editing"
              disabled={saving}
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-1.5 text-sm text-white bg-gradient-to-r from-[#E253FF] to-[#9F13FB] px-3 py-1 rounded-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save changes"
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1.5">Country *</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1.5">Address Line 1 *</label>
            <input
              type="text"
              name="address1"
              value={formData.address1}
              onChange={handleChange}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1.5">Address Line 2</label>
            <input
              type="text"
              name="address2"
              value={formData.address2}
              onChange={handleChange}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1.5">City *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1.5">Postcode *</label>
            <input
              type="text"
              name="postcode"
              value={formData.postcode}
              onChange={handleChange}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
        </div>
      ) : (
        <>
          {address ? (
            <div className="text-sm sm:text-base leading-relaxed space-y-3 text-gray-700">
              <div>
                <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1.5">Street Address</p>
                <p className="text-gray-900 font-medium">{address.address1}</p>
                {address.address2 && <p className="text-gray-900 font-medium mt-1">{address.address2}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1.5">City</p>
                  <p className="text-gray-900 font-medium">{address.city}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1.5">Postcode</p>
                  <p className="text-gray-900 font-medium">{address.postcode}</p>
                </div>
              </div>
              <div className="mt-2 pt-3 border-t border-gray-200">
                <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1.5">Country</p>
                <p className="text-gray-900 font-semibold text-base">{address.country}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm sm:text-base text-gray-500 py-2">
              <p>No address saved. Click Edit to add an address.</p>
            </div>
          )}
        </>
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

  useEffect(() => {
    fetchAddresses();
  }, []);

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 shadow-sm">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          My Addresses
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Manage your billing and shipping addresses. Billing address will be used for invoices and PDFs.
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <AddressCard 
          title="My Billing Address" 
          addressType="billing"
          address={billingAddress || undefined}
          loading={loading}
          onUpdate={fetchAddresses}
        />
        <AddressCard 
          title="My Shipping Address" 
          addressType="shipping"
          address={shippingAddress || undefined}
          loading={loading}
          onUpdate={fetchAddresses}
        />
      </div>
    </section>
  );
};

export default AddressesSection;
