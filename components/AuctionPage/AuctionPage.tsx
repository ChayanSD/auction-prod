'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FilterSidebar from '@/components/AuctionPage/FilterSidebar';
import ProductCard from '@/components/AuctionPage/ProductCard';
import Sort from '@/components/AuctionPage/Sort';
import Pagination from '@/components/AuctionPage/Pagination';
import HeroCTASection from '@/components/Homepage/HeroCTASection';
import { apiClient } from '@/lib/fetcher';
import { Filter, X } from 'lucide-react';
import type { AuctionListingItem, AuctionFilters } from '@/types/auction.types';

/**
 * Auction Page Component
 * Contains all client-side logic and state management
 * Pixel-perfect design for laptop screens (1024px, 1280px, 1440px+)
 * Background: white (not #F2F0E9 based on original)
 * Layout: 334px sidebar + flexible main content
 */
const AuctionPage: React.FC = () => {
  const searchParams = useSearchParams();
  const [originalData, setOriginalData] = useState<AuctionListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Initialize filters with category from URL if present
  const initialCategory = searchParams?.get('category') || '';
  const [filters, setFilters] = useState<AuctionFilters>({
    keyword: '',
    country: '',
    category: initialCategory,
    auctionStatus: '',
    startDate: null,
    endDate: null,
    priceRange: [0, 10000]
  });
  const [byValue, setByValue] = useState<string>('');
  const [isLive, setIsLive] = useState(false);

  const itemsPerPage = 5; // Matching original

  // Update category filter when URL param changes
  useEffect(() => {
    const categoryParam = searchParams?.get('category');
    if (categoryParam) {
      setFilters(prev => ({ ...prev, category: categoryParam }));
    }
  }, [searchParams]);

  // Fetch auction items
  useEffect(() => {
    const fetchAuctionItems = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<AuctionListingItem[] | { success: boolean; data: AuctionListingItem[] }>('/auction-item');
        
        if (Array.isArray(response)) {
          setOriginalData(response);
        } else if (response && 'success' in response && response.success && 'data' in response) {
          setOriginalData(response.data);
        } else {
          setOriginalData([]);
        }
      } catch (err) {
        console.error('Error fetching auction items:', err);
        setOriginalData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionItems();
  }, []);

  // Map API data to ProductCard format
  const mappedData = useMemo(() => {
    return originalData.map(item => ({
      lotNumber: item.id,
      itemId: item.id, // Add itemId for navigation
      title: item.name,
      biddingEnds: item.auction?.endDate 
        ? new Date(item.auction.endDate).toLocaleDateString('en-GB', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })
        : 'N/A',
      auctioneerLocation: item.auction?.location || item.auction?.name || 'Auction',
      category: item.auction?.category?.name || item.auction?.name || 'General',
      imagePath: item.productImages && item.productImages.length > 0 
        ? item.productImages[0].url 
        : '/placeholder.jpg',
      imageAlt: item.productImages && item.productImages.length > 0 
        ? (item.productImages[0].altText || item.name || 'Product Image')
        : (item.name || 'Product Image'),
      tags: item.auction?.tags?.map((tagOnAuction: any) => tagOnAuction.tag.name) || [],
      // Add price fields for filtering
      currentBid: item.currentBid,
      baseBidPrice: item.baseBidPrice,
      estimatedPrice: item.estimatedPrice,
      auction: item.auction
    }));
  }, [originalData]);

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = [...mappedData];

    // Debug: Log filter state
    // console.log('Filter state:', filters.priceRange);

    // Keyword search
    if (filters.keyword) {
      const keywordLower = filters.keyword.toLowerCase();
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(keywordLower) ||
        item.lotNumber?.toLowerCase().includes(keywordLower)
      );
    }

    // Country filter
    if (filters.country) {
      filtered = filtered.filter(item =>
        item.auctioneerLocation?.toLowerCase().includes(filters.country.toLowerCase())
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(item =>
        item.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Auction status filter - uses backend status field
    if (filters.auctionStatus) {
      filtered = filtered.filter(item => {
        // Check the actual status field from the backend
        const auctionStatus = item.auction?.status;
        return auctionStatus === filters.auctionStatus;
      });
    }

    // "Now Live" toggle filter - shows only Active auctions
    if (isLive) {
      filtered = filtered.filter(item => {
        const auctionStatus = item.auction?.status;
        return auctionStatus === 'Active';
      });
    }

    // Price range filter - always apply (default [0, 10000] means no filter)
    // Only filter when max is less than 10000 (meaning user has set a limit)
    if (filters.priceRange[1] < 10000) {
      const minPrice = Number(filters.priceRange[0]);
      const maxPrice = Number(filters.priceRange[1]);
      
      filtered = filtered.filter(item => {
        // Use currentBid if available, otherwise use baseBidPrice, otherwise use estimatedPrice
        const itemPrice = Number(item.currentBid ?? item.baseBidPrice ?? item.estimatedPrice ?? 0);
        
        // Ensure we have valid numbers for comparison
        if (isNaN(itemPrice) || isNaN(minPrice) || isNaN(maxPrice)) {
          return false; // Filter out items with invalid prices
        }
        
        // Filter: item price must be within the range [minPrice, maxPrice]
        const passes = itemPrice >= minPrice && itemPrice <= maxPrice;
        
        // Debug: Uncomment to see what's being filtered
        // if (item.title === 'Adele Dejesus') {
        //   console.log('Filter check:', { 
        //     title: item.title, 
        //     itemPrice, 
        //     minPrice, 
        //     maxPrice, 
        //     currentBid: item.currentBid, 
        //     baseBidPrice: item.baseBidPrice, 
        //     estimatedPrice: item.estimatedPrice,
        //     passes 
        //   });
        // }
        
        return passes;
      });
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(item => {
        const itemStartDate = item.auction?.startDate ? new Date(item.auction.startDate) : null;
        const itemEndDate = item.auction?.endDate ? new Date(item.auction.endDate) : null;
        
        if (filters.startDate && itemStartDate) {
          if (itemStartDate < filters.startDate) return false;
        }
        if (filters.endDate && itemEndDate) {
          if (itemEndDate > filters.endDate) return false;
        }
        return true;
      });
    }

    // Sort by value (Highest value / Lowest value)
    if (byValue) {
      filtered.sort((a, b) => {
        // Use currentBid if available, otherwise use baseBidPrice, otherwise use estimatedPrice
        const aValue = a.currentBid ?? a.baseBidPrice ?? a.estimatedPrice ?? 0;
        const bValue = b.currentBid ?? b.baseBidPrice ?? b.estimatedPrice ?? 0;
        
        if (byValue === 'Highest value') {
          return bValue - aValue; // Descending order
        } else if (byValue === 'Lowest value') {
          return aValue - bValue; // Ascending order
        }
        return 0;
      });
    }

    return filtered;
  }, [mappedData, filters, byValue, isLive]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, byValue, isLive]);

  // Disable body scroll when filter sidebar is open (mobile)
  useEffect(() => {
    if (isFilterOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      if (isFilterOpen) {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      }
    };
  }, [isFilterOpen]);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <div className="px-4 py-4 md:px-4 md:py-0 lg:px-8">
      <Header />
      </div>
      <div className="h-12 lg:h-16"></div> {/* Spacer for fixed header */}
      
      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 py-2 md:px-4 md:py-0 lg:px-8">
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-5 mb-6 sm:mb-8">
          {/* Desktop Filters - Only show on xl+ screens */}
          <div className="hidden xl:block py-7 xl:pt-8 xl:pb-96 pr-6 xl:pr-8">
            <div className="mb-16">
              <h2 className="font-bold text-5xl text-[#0E0E0E]">Auction Lists</h2>
            </div>
            <FilterSidebar filters={filters} onFilterChange={setFilters} />
          </div>

          {/* Mobile Filter Button - Show on mobile, tablet, and 1024px */}
          <div className="xl:hidden pt-4 sm:pt-6 pb-4 flex items-center justify-between">
            <h2 className="font-bold text-2xl sm:text-3xl text-[#0E0E0E]">Auction Lists</h2>
            <button
              onClick={toggleFilter}
              className="bg-white hover:bg-gray-50 rounded-full p-2.5 shadow-lg border border-gray-200 w-10 h-10 flex items-center justify-center transition-colors"
              aria-label="Open filters"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Product Section */}
          <div className="xl:mt-16 space-y-4 sm:space-y-6 md:space-y-8 w-full pb-8 sm:pb-12">
          <Sort 
            totalItems={filteredData.length}
            byValue={byValue}
            onByValueChange={setByValue}
            isLive={isLive}
            onLiveToggle={setIsLive}
          />
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9F13FB]"></div>
            </div>
          ) : currentItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-1 gap-4 sm:gap-6 md:gap-8 md:items-stretch lg:items-stretch">
              {currentItems.map((item) => (
                <ProductCard key={item.lotNumber} item={item} />
              ))}
              </div>

              {/* Pagination Controls */}
              {filteredData.length > 0 && (
                <div className="flex justify-center xl:justify-end items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <button
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                    className={`px-3 sm:px-4 py-2 rounded-lg border transition-colors ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-[#4D4D4D]'}`}
                    aria-label="Previous page"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M11.78 5.21983C11.9205 5.36045 11.9994 5.55108 11.9994 5.74983C11.9994 5.94858 11.9205 6.1392 11.78 6.27983L8.06001 9.99983L11.78 13.7198C11.8537 13.7885 11.9128 13.8713 11.9538 13.9633C11.9948 14.0553 12.0168 14.1546 12.0186 14.2553C12.0204 14.356 12.0019 14.456 11.9641 14.5494C11.9264 14.6428 11.8703 14.7276 11.799 14.7989C11.7278 14.8701 11.643 14.9262 11.5496 14.964C11.4562 15.0017 11.3562 15.0202 11.2555 15.0184C11.1548 15.0166 11.0555 14.9946 10.9635 14.9536C10.8715 14.9126 10.7887 14.8535 10.72 14.7798L6.47001 10.5298C6.32956 10.3892 6.25067 10.1986 6.25067 9.99983C6.25067 9.80108 6.32956 9.61045 6.47001 9.46983L10.72 5.21983C10.8606 5.07938 11.0513 5.00049 11.25 5.00049C11.4488 5.00049 11.6394 5.07938 11.78 5.21983Z" fill="currentColor" />
                    </svg>
                  </button>

                  <span className="font-medium text-[#4D4D4D] text-sm sm:text-base">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={`px-3 sm:px-4 py-2 rounded-lg border transition-colors ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-[#4D4D4D]'}`}
                    aria-label="Next page"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M8.21995 5.21983C8.36058 5.07938 8.5512 5.00049 8.74995 5.00049C8.9487 5.00049 9.13932 5.07938 9.27995 5.21983L13.53 9.46983C13.6704 9.61045 13.7493 9.80108 13.7493 9.99983C13.7493 10.1986 13.6704 10.3892 13.53 10.5298L9.27995 14.7798C9.13778 14.9123 8.94973 14.9844 8.75543 14.981C8.56113 14.9776 8.37574 14.8989 8.23833 14.7614C8.10092 14.624 8.0222 14.4387 8.01877 14.2444C8.01535 14.05 8.08747 13.862 8.21995 13.7198L11.9399 9.99983L8.21995 6.27983C8.0795 6.1392 8.00061 5.94858 8.00061 5.74983C8.00061 5.55108 8.0795 5.36045 8.21995 5.21983Z" fill="currentColor" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-center items-center py-12 sm:py-20">
              <p className="text-[#4D4D4D] text-base sm:text-lg">No auction items available.</p>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Sidebar - Show on mobile, tablet, and 1024px */}
      {isFilterOpen && (
        <div
          className="xl:hidden fixed inset-0 z-[10000] bg-black/40 sidebar-overlay"
          onClick={toggleFilter}
        >
          <div
            className="absolute left-0 top-0 h-full w-full md:w-1/2 lg:w-1/2 bg-white shadow-lg p-4 sm:p-6 overflow-y-auto z-[10001] sidebar-content-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#0E0E0E]">Filters</h3>
              <button
                onClick={toggleFilter}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Filter Component */}
            <FilterSidebar filters={filters} onFilterChange={setFilters} />
          </div>
        </div>
      )}

      <div className="relative lg:z-50 left-1/2 -translate-x-1/2 w-screen md:w-full md:left-0 md:translate-x-0">
      <HeroCTASection />
      </div>
      <Footer />
    </div>
  );
};

export default AuctionPage;

