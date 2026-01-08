'use client';

import React, { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { apiClient } from '@/lib/fetcher';
import toast from 'react-hot-toast';

/**
 * My Details Section Component
 * Displays user's personal information with edit functionality
 * Pixel-perfect design matching Figma
 */
const MyDetailsSection: React.FC = () => {
  const { user, refreshUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    middleName: user?.middleName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  // Update form data when user changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original user data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await apiClient.patch('/user/profile', {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName?.trim() || null,
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
      });
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
      await refreshUser?.();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error?.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
        {!isEditing ? (
          <button 
            onClick={handleEdit}
            className="flex items-center gap-2 text-sm sm:text-base text-purple-600 font-semibold hover:text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors self-start sm:self-auto"
            aria-label="Edit personal details"
          >
            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Edit</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button 
              onClick={handleCancel}
              className="flex items-center gap-2 text-sm sm:text-base text-gray-600 font-semibold hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Cancel editing"
              disabled={loading}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Cancel</span>
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 text-sm sm:text-base text-white font-semibold bg-gradient-to-r from-[#E253FF] to-[#9F13FB] px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save changes"
              disabled={loading}
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:gap-6 text-sm sm:text-base text-gray-700">
        {isEditing ? (
          <>
            <div>
              <label className="block font-semibold text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full h-11 sm:h-12 rounded-lg border border-gray-300 px-4 sm:px-5 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                className="w-full h-11 sm:h-12 rounded-lg border border-gray-300 px-4 sm:px-5 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full h-11 sm:h-12 rounded-lg border border-gray-300 px-4 sm:px-5 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full h-11 sm:h-12 rounded-lg border border-gray-300 px-4 sm:px-5 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
          </>
        ) : (
          <>
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
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Phone Number</label>
              <div className="h-11 sm:h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-4 sm:px-5 text-sm sm:text-base text-gray-900">
                {user?.phone || 'Not provided'}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default MyDetailsSection;
