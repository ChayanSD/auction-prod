'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/fetcher';
import Header from '@/components/Header';
import ProductImageGallery from './ProductImageGallery';
import ProductDetails from './ProductDetails';
import ProductTabs from './ProductTabs';
import RelatedItems from './RelatedItems';
import HeroCTALgSection from '@/components/Homepage/HeroCTALgSection';
import Footer from '@/components/Footer';

interface AuctionItemDetailProps {
  itemId: string;
}

interface AuctionItem {
  id: string;
  name: string;
  description: string;
  baseBidPrice: number;
  currentBid: number | null;
  estimatedPrice: number | null;
  buyersPremium?: number | null;
  taxPercentage?: number | null;
  terms: string | null;
  shipping: any;
  startDate?: string;
  endDate?: string;
  productImages: Array<{
    id: string;
    url: string;
    altText: string | null;
  }>;
  bids: Array<{
    id: string;
    amount: number;
    createdAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  lotCount?: number;
  auction: {
    id: string;
    name: string;
    slug: string;
    location: string;
    status: string;
    tags?: Array<{
      tag: {
        id: string;
        name: string;
      };
    }>;
  };
}

const AuctionItemDetail: React.FC<AuctionItemDetailProps> = ({ itemId }) => {
  const [item, setItem] = useState<AuctionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get<AuctionItem>(`/auction-item/${itemId}`);
        
        // Check if data exists and has required fields
        if (!data || !data.id) {
          setError('Auction item not found');
          return;
        }
        
        setItem(data);
      } catch (err: any) {
        console.error('Error fetching auction item:', err);
        const errorMessage = err?.message || err?.response?.data?.error || 'Failed to load auction item';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItem();
    } else {
      setError('Invalid item ID');
      setLoading(false);
    }
  }, [itemId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <Header />
        <div className="h-16 lg:h-20"></div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading auction item...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <Header />
        <div className="h-16 lg:h-20"></div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 text-lg">{error || 'Auction item not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const bidCount = item.bids?.length || 0;
  const currentBidAmount = item.currentBid || item.baseBidPrice;
  const buyersPremium = item.buyersPremium ?? 0;
  const taxPercentage = item.taxPercentage ?? 0;
  const taxAmount = (currentBidAmount + buyersPremium) * (taxPercentage / 100);
  const minBid = currentBidAmount + buyersPremium + taxAmount;

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Header />
      
      {/* Spacer for fixed header */}
      <div className="h-16 lg:h-20"></div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mb-10 lg:mb-16">
          {/* Left: Product Images */}
          <div className="w-full">
            <ProductImageGallery images={item.productImages || []} />
          </div>

          {/* Right: Product Details & Bidding */}
          <div className="w-full">
            <ProductDetails
              item={item}
              bidCount={bidCount}
              currentBidAmount={currentBidAmount}
              minBid={minBid}
            />
          </div>
        </div>

        {/* Product Tabs Section */}
        <div className="mb-10 lg:mb-16">
          <ProductTabs item={item} />
        </div>
      </main>

      {/* Related Items Section - Same Auction Carousel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RelatedItems currentItemId={item.id} auctionId={item.auction.id} />
      </div>

      {/* Hero CTA Section - positioned above footer like auction page */}
      <div className="relative lg:z-50 left-1/2 -translate-x-1/2 w-screen md:w-full md:left-0 md:translate-x-0">
        <HeroCTALgSection />
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AuctionItemDetail;

