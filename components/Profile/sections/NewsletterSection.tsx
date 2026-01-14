'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@/contexts/UserContext';
import { apiClient } from '@/lib/fetcher';
import toast from 'react-hot-toast';

/**
 * Newsletter Subscription Section Component
 * Allows users to manage their newsletter subscription
 */
const NewsletterSection: React.FC = () => {
  const { user, refreshUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(user?.newsletter || false);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    // Only sync from user context if we're not currently updating
    if (!isUpdatingRef.current && user?.newsletter !== undefined) {
      setIsSubscribed(user.newsletter);
    }
  }, [user]);

  const handleToggle = async () => {
    if (loading) return; // Prevent multiple simultaneous requests
    
    try {
      setLoading(true);
      isUpdatingRef.current = true;
      const newStatus = !isSubscribed;
      
      // Optimistically update UI immediately for better UX
      setIsSubscribed(newStatus);
      
      const response = await apiClient.patch<{
        success: boolean;
        message: string;
        user: { id: string; email: string; newsletter: boolean };
      }>('/user/newsletter', {
        newsletter: newStatus,
      });
      
      // Use the response data to ensure state is correct
      if (response?.user?.newsletter !== undefined) {
        setIsSubscribed(response.user.newsletter);
      }
      
      // Refresh user context after a short delay to ensure session is updated
      setTimeout(async () => {
        try {
          await refreshUser?.();
        } catch (err) {
          console.error('Failed to refresh user context:', err);
          // Don't show error to user, the update already succeeded
        } finally {
          isUpdatingRef.current = false;
        }
      }, 500);
      
      toast.success(
        newStatus 
          ? 'Successfully subscribed to newsletter' 
          : 'Successfully unsubscribed from newsletter',
        { duration: 4000 }
      );
    } catch (error: any) {
      console.error('Error updating newsletter preference:', error);
      // Revert optimistic update on error
      setIsSubscribed(user?.newsletter || false);
      isUpdatingRef.current = false;
      toast.error(
        error?.data?.error || error?.message || 'Failed to update newsletter preference',
        { duration: 4000 }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="newsletter-section" className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Newsletter Subscription
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Stay updated with upcoming auctions and news from Supermedia Bros
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
              Email Updates
            </h3>
            <p className="text-sm text-gray-600">
              {isSubscribed 
                ? 'You are currently subscribed to receive updates about upcoming auctions and news.'
                : 'Subscribe to receive updates about upcoming auctions and news via email.'}
            </p>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={isSubscribed}
              onChange={handleToggle}
              disabled={loading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#E253FF] peer-checked:to-[#9F13FB] disabled:opacity-50 disabled:cursor-not-allowed"></div>
          </label>
        </div>

        {isSubscribed && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-700">
              ✓ You will receive notifications about upcoming auctions, new items, and company news.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsletterSection;
