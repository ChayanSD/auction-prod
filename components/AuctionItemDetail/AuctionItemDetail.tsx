"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/fetcher";
import Header from "@/components/Header";
import ProductImageGallery from "./ProductImageGallery";
import ProductDetails from "./ProductDetails";
import ProductTabs from "./ProductTabs";
import RelatedItems from "./RelatedItems";
import HeroCTALgSection from "@/components/Homepage/HeroCTALgSection";
import Footer from "@/components/Footer";
import PremiumLoader from "@/components/shared/PremiumLoader";
import { cleanLotNumber } from "@/utils/lotNumber";
import CatalogueSidebar from "./CatalogueSidebar";

interface AuctionItemDetailProps {
  itemId: string;
}

interface AuctionItem {
  id: string;
  name: string;
  description: string;
  baseBidPrice: number;
  currentBid: number | null;
  estimateMin?: number | null;
  estimateMax?: number | null;
  buyersPremium?: number | null;
  taxPercentage?: number | null;
  terms: string | null;
  shipping: string | null | Record<string, unknown>;
  startDate?: string;
  endDate?: string;
  lotNumber?: string | null;
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
  isReserveMet?: boolean; // Dynamic flag from API
  auction: {
    id: string;
    name: string;
    slug: string;
    location: string;
    status: string;
    startDate?: string | null;
    endDate?: string | null;
    termsAndConditions?: string | null;
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
        const data = await apiClient.get<AuctionItem>(
          `/auction-item/${itemId}`
        );

        // Check if data exists and has required fields
        if (!data || !data.id) {
          setError("Auction item not found");
          return;
        }

        setItem(data);
      } catch (err: unknown) {
        console.error("Error fetching auction item:", err);
        const errorMessage =
          (err as Error)?.message || "Failed to load auction item";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItem();
    } else {
      setError("Invalid item ID");
      setLoading(false);
    }
  }, [itemId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <Header />
        <div className="h-16 lg:h-20"></div>
        {/* Premium full-screen style loader for auction item */}
        <div className="relative min-h-[60vh]">
          <PremiumLoader text="Loading auction item..." fullScreen={false} />
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
            <p className="text-red-600 text-lg">
              {error || "Auction item not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const bidCount = item.bids?.length || 0;
  const currentBidAmount = item.currentBid || item.baseBidPrice;
  // Minimum bid is just the next increment (base amount only, no fees)
  // Fees (buyer's premium and tax) will be added at invoice generation
  const minBid = currentBidAmount + 1;

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Header />

      {/* Spacer for fixed header */}
      {/* <div className="h-16 lg:h-20"></div> */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10">
        {/* Title Section - Above image on laptop, hidden on mobile (shown in ProductDetails) */}
        <div className="mb-6 hidden lg:block">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-3">
            {item.name || 'N/A'}
          </h1>
          {/* Lot Number and Tags */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {(() => {
              const cleanedLotNumber = cleanLotNumber(item.lotNumber);
              return (
                <>
                  {/* Lot Number Badge */}
                  {cleanedLotNumber && (
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <span className="text-xs sm:text-sm font-medium text-purple-700">Lot #</span>
                      <span className="text-sm sm:text-base font-bold text-purple-900">
                        {cleanedLotNumber}
                      </span>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {item.auction?.tags && item.auction.tags.length > 0 && (
                    <>
                      {item.auction.tags.map((tagOnAuction) => (
                        <span
                          key={tagOnAuction.tag.id}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-100 border border-purple-300 rounded-full text-xs sm:text-sm font-medium text-purple-700"
                        >
                          {tagOnAuction.tag.name}
                        </span>
                      ))}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>

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
              showTitleOnMobile={true}
            />
          </div>
        </div>

        {/* Product Tabs and Catalogue Sidebar Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-10 lg:mb-16">
          {/* Left: Product Tabs */}
          <div className="w-full lg:col-span-2">
            <ProductTabs item={item} />
          </div>

          {/* Right: Catalogue Sidebar */}
          <div className="w-full lg:col-span-1">
            <CatalogueSidebar
              currentItemId={item.id}
              auctionId={item.auction.id}
              auctionName={item.auction.name}
              currentLotNumber={item.lotNumber}
            />
          </div>
        </div>
      </main>

      {/* Related Items Section - Same Auction Carousel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RelatedItems currentItemId={item.id} auctionId={item.auction.id} />
      </div>

      {/* Hero CTA Section - positioned above footer like auction page */}
      <div className="relative lg:z-50 w-full overflow-x-hidden md:overflow-visible">
        <HeroCTALgSection />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AuctionItemDetail;
