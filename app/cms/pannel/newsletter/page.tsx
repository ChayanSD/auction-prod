'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/fetcher';
import toast from 'react-hot-toast';
import PremiumLoader from '@/components/shared/PremiumLoader';

interface NewsletterStats {
  totalSubscribers: number;
  totalUsers: number;
  subscriptionRate: string;
}

interface Auction {
  id: string;
  name: string;
  slug: string;
  status: string;
  startDate?: string;
}

export default function NewsletterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [newsletterType, setNewsletterType] = useState<'upcoming_auction' | 'general_news'>('upcoming_auction');
  
  // Form state
  const [selectedAuctionId, setSelectedAuctionId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [readMoreUrl, setReadMoreUrl] = useState('');

  useEffect(() => {
    fetchStats();
    fetchAuctions();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get<NewsletterStats>('/newsletter/stats');
      setStats(response);
    } catch (error) {
      console.error('Error fetching newsletter stats:', error);
      toast.error('Failed to load newsletter statistics');
    }
  };

  const fetchAuctions = async () => {
    try {
      const response = await apiClient.get<Auction[]>('/auction');
      // Filter for upcoming or live auctions
      const upcomingAuctions = response.filter(
        (auction: Auction) => auction.status === 'Upcoming' || auction.status === 'Live'
      );
      setAuctions(upcomingAuctions);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      toast.error('Failed to load auctions');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newsletterType === 'upcoming_auction' && !selectedAuctionId) {
      toast.error('Please select an auction');
      return;
    }

    if (newsletterType === 'general_news' && (!subject.trim() || !content.trim())) {
      toast.error('Subject and content are required for general news');
      return;
    }

    if (!stats || stats.totalSubscribers === 0) {
      toast.error('No subscribers found');
      return;
    }

    if (!confirm(`Are you sure you want to send this newsletter to ${stats.totalSubscribers} subscribers?`)) {
      return;
    }

    try {
      setSending(true);
      
      const payload: any = {
        type: newsletterType,
      };

      if (newsletterType === 'upcoming_auction') {
        payload.auctionId = selectedAuctionId;
        if (imageUrl.trim()) payload.imageUrl = imageUrl.trim();
      } else {
        payload.subject = subject.trim();
        payload.content = content.trim();
        if (imageUrl.trim()) payload.imageUrl = imageUrl.trim();
        if (readMoreUrl.trim()) payload.readMoreUrl = readMoreUrl.trim();
      }

      const response = await apiClient.post<{
        success: boolean;
        message: string;
        emailsSent: number;
        emailsFailed: number;
        totalSubscribers: number;
        errors?: string[];
      }>('/newsletter/send', payload);
      
      toast.success(
        `Newsletter sent successfully! ${response.emailsSent} emails sent.${response.emailsFailed > 0 ? ` ${response.emailsFailed} failed.` : ''}`,
        { duration: 6000 }
      );

      // Reset form
      setSelectedAuctionId('');
      setSubject('');
      setContent('');
      setImageUrl('');
      setReadMoreUrl('');
      
      // Refresh stats
      await fetchStats();
    } catch (error: any) {
      console.error('Error sending newsletter:', error);
      toast.error(
        error?.response?.data?.error || 'Failed to send newsletter',
        { duration: 4000 }
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <PremiumLoader text="Loading newsletter page..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Newsletter Management</h1>
          <p className="text-gray-600">Send newsletters and upcoming auction notifications to subscribed users</p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Subscribers</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalSubscribers}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Subscription Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.subscriptionRate}</p>
              </div>
            </div>
          </div>
        )}

        {/* Newsletter Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Newsletter</h2>
          
          <form onSubmit={handleSend} className="space-y-6">
            {/* Newsletter Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Newsletter Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="newsletterType"
                    value="upcoming_auction"
                    checked={newsletterType === 'upcoming_auction'}
                    onChange={(e) => setNewsletterType(e.target.value as 'upcoming_auction')}
                    className="mr-2"
                  />
                  <span>Upcoming Auction</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="newsletterType"
                    value="general_news"
                    checked={newsletterType === 'general_news'}
                    onChange={(e) => setNewsletterType(e.target.value as 'general_news')}
                    className="mr-2"
                  />
                  <span>General News</span>
                </label>
              </div>
            </div>

            {/* Upcoming Auction Fields */}
            {newsletterType === 'upcoming_auction' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Auction *
                  </label>
                  <select
                    value={selectedAuctionId}
                    onChange={(e) => setSelectedAuctionId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="">Select an auction...</option>
                    {auctions.map((auction) => (
                      <option key={auction.id} value={auction.id}>
                        {auction.name} ({auction.status})
                      </option>
                    ))}
                  </select>
                  {auctions.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">No upcoming auctions found</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </>
            )}

            {/* General News Fields */}
            {newsletterType === 'general_news' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Newsletter Subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your newsletter content here..."
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Read More URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={readMoreUrl}
                    onChange={(e) => setReadMoreUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || (stats?.totalSubscribers || 0) === 0}
                className="px-6 py-2 bg-gradient-to-r from-[#E253FF] to-[#9F13FB] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : `Send to ${stats?.totalSubscribers || 0} Subscribers`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
