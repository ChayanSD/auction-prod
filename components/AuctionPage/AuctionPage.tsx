'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FilterSidebar from '@/components/AuctionPage/FilterSidebar';
import ProductCard from '@/components/AuctionPage/ProductCard';
import CategoryHeaderSection from '@/components/AuctionPage/CategoryHeaderSection';
import HeroCTALgSection from '@/components/Homepage/HeroCTALgSection';
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
  const router = useRouter();
  const [originalData, setOriginalData] = useState<AuctionListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [auctionNameFromId, setAuctionNameFromId] = useState<string>('');
  
  // Track if user explicitly cleared filters to prevent useEffects from overriding
  const userClearedFiltersRef = useRef(false);
  const isInitialMountRef = useRef(true);
  
  // Get URL parameters
  const initialAuctionName = searchParams?.get('category') || ''; // Using 'category' param for auction name for backward compatibility
  const auctionIdParam = searchParams?.get('auctionId') || '';
  
  const [filters, setFilters] = useState<AuctionFilters>({
    keyword: '',
    category: initialAuctionName, // Now stores auction name instead of category
    auctionStatus: '',
    startDate: null,
    endDate: null,
    priceRange: [0, 10000]
  });

  const itemsPerPage = 5; // Matching original

  // Fetch auction details when auctionId is in URL to get auction name
  // Only runs on initial mount or when auctionId changes, NOT when filters change
  useEffect(() => {
    // Skip if user explicitly cleared filters
    if (userClearedFiltersRef.current) {
      return;
    }
    
    const fetchAuctionName = async () => {
      // Only fetch if we have auctionId but no auction name in URL
      // And only on initial mount or when auctionId changes
      if (auctionIdParam && !initialAuctionName && isInitialMountRef.current) {
        try {
          const auction = await apiClient.get<{ name: string }>(`/auction/${auctionIdParam}`);
          if (auction?.name) {
            const auctionName = auction.name;
            setAuctionNameFromId(auctionName);
            setFilters(prev => ({ ...prev, category: auctionName }));
            // Update URL to include category param (for backward compatibility, using 'category' param)
            const params = new URLSearchParams(searchParams?.toString() || '');
            params.set('category', auctionName);
            router.replace(`/auction?${params.toString()}`, { scroll: false });
          }
        } catch (err) {
          console.error('Error fetching auction:', err);
        }
      }
    };

    fetchAuctionName();
    // Mark initial mount as complete after first run
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionIdParam, initialAuctionName]);

  // Update auction name filter when URL param changes (but don't override user changes)
  useEffect(() => {
    // Skip if user explicitly cleared filters
    if (userClearedFiltersRef.current) {
      // Reset the flag after URL has been updated
      const auctionNameParam = searchParams?.get('category');
      if (!auctionNameParam) {
        userClearedFiltersRef.current = false;
      }
      return;
    }
    
    const auctionNameParam = searchParams?.get('category');
    if (auctionNameParam) {
      setFilters(prev => {
        // Only update if different to avoid unnecessary re-renders
        if (prev.category !== auctionNameParam) {
          return { ...prev, category: auctionNameParam };
        }
        return prev;
      });
    } else if (!auctionNameParam && filters.category) {
      // If URL has no auction name but filter still has one, clear it
      // This handles browser back/forward navigation
      setFilters(prev => ({ ...prev, category: '' }));
    }
  }, [searchParams, filters.category]);

  // Fetch auction items
  // Only use auctionId if auction name filter matches the auction's name or no filter is set
  useEffect(() => {
    const fetchAuctionItems = async () => {
      try {
        setLoading(true);
        
        // Determine if we should use auctionId or fetch all items
        let shouldUseAuctionId = false;
        if (auctionIdParam && auctionNameFromId) {
          // Use auctionId only if:
          // 1. No auction name filter is set (show all items from this auction), OR
          // 2. Auction name filter matches the auction's name
          if (!filters.category || filters.category === auctionNameFromId) {
            shouldUseAuctionId = true;
          }
          // If auction name is different from the selected auction, fetch all items
        } else if (auctionIdParam && !auctionNameFromId) {
          // If we have auctionId but auctionNameFromId is not set yet (still loading),
          // use auctionId to fetch items
          shouldUseAuctionId = true;
        }
        // If no auctionId or auction name filter was changed, fetch all items
        
        const url = shouldUseAuctionId 
          ? `/auction-item?auctionId=${auctionIdParam}`
          : '/auction-item';
        const response = await apiClient.get<AuctionListingItem[] | { success: boolean; data: AuctionListingItem[] }>(url);
        
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
  }, [auctionIdParam, filters.category, auctionNameFromId]);

  // Map API data to ProductCard format
  const mappedData = useMemo(() => {
    return originalData.map((item) => {
      // Prefer item-level dates; fall back to auction-level
      const rawStartDate = item.startDate || item.auction?.startDate;
      const rawEndDate = item.endDate || item.auction?.endDate;

      const formattedBiddingEnds =
        rawEndDate &&
        !isNaN(new Date(rawEndDate).getTime())
          ? new Date(rawEndDate).toLocaleDateString('en-GB', {
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: 'numeric',
              minute: '2-digit',
          })
          : 'N/A';

      return {
        lotNumber: item.id,
        itemId: item.id, // Add itemId for navigation
        title: item.name,
        biddingEnds: formattedBiddingEnds,
        auctioneerLocation: item.auction?.location || item.auction?.name || 'Auction',
        // Category model was removed; use auction name as a friendly label
        category: item.auction?.name || 'General',
        imagePath:
          item.productImages && item.productImages.length > 0
        ? item.productImages[0].url 
        : '/placeholder.jpg',
        imageAlt:
          item.productImages && item.productImages.length > 0
            ? item.productImages[0].altText || item.name || 'Product Image'
            : item.name || 'Product Image',
        tags:
          item.auction?.tags?.map((tagOnAuction) => tagOnAuction.tag.name) || [],
      // Add price fields for filtering
      currentBid: item.currentBid,
      baseBidPrice: item.baseBidPrice,
      estimatedPrice: item.estimatedPrice,
      // Pass item status if available (some items may have their own status field)
      itemStatus: (item as any).status,
        // Ensure auction object carries the resolved dates
        auction: item.auction
          ? {
              ...item.auction,
              startDate: rawStartDate || item.auction.startDate,
              endDate: rawEndDate || item.auction.endDate,
            }
          : undefined,
        // Expose item-level dates for filters if needed
        startDate: rawStartDate,
        endDate: rawEndDate,
      };
    });
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

    // Auction name filter (using 'category' filter key for backward compatibility)
    if (filters.category) {
      filtered = filtered.filter(item =>
        item.auction?.name?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Auction status filter - use auction status from parent auction
    if (filters.auctionStatus) {
      filtered = filtered.filter((item) => {
        const itemStatus = item.auction?.status;
        if (!itemStatus) return false;

        switch (filters.auctionStatus) {
          case 'Live':
            return itemStatus === 'Live';
          case 'Upcoming':
            return itemStatus === 'Upcoming';
          case 'Closed':
            return itemStatus === 'Closed';
          default:
            return itemStatus === filters.auctionStatus;
        }
      });
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((item) => {
        const rawStart = item.startDate || item.auction?.startDate;
        const rawEnd = item.endDate || item.auction?.endDate;
        const itemStartDate = rawStart ? new Date(rawStart) : null;
        const itemEndDate = rawEnd ? new Date(rawEnd) : null;
        
        if (filters.startDate && itemStartDate) {
          if (itemStartDate < filters.startDate) return false;
        }
        if (filters.endDate && itemEndDate) {
          if (itemEndDate > filters.endDate) return false;
        }
        return true;
      });
    }

    return filtered;
  }, [mappedData, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

  // Handle filter changes and sync with URL
  const handleFilterChange = (newFilters: AuctionFilters) => {
    const previousCategory = filters.category;
    const categoryCleared = previousCategory && !newFilters.category;
    
    // Set loading state for smooth transition
    setFilterLoading(true);
    
    // Mark that user explicitly cleared filters if auction name was cleared
    if (categoryCleared) {
      userClearedFiltersRef.current = true;
      setAuctionNameFromId('');
    }
    
    // If auction name changed to a different auction, clear auctionNameFromId
    const auctionNameChangedToDifferent = auctionNameFromId && newFilters.category && newFilters.category !== auctionNameFromId;
    if (auctionNameChangedToDifferent) {
      setAuctionNameFromId('');
    }
    
    // Update filters state
    setFilters(newFilters);
    
    // Update URL params based on filters
    const params = new URLSearchParams();
    
    // Only keep auctionId if:
    // 1. Auction name is cleared and we originally came from an auction (keep context), OR
    // 2. Auction name matches the auction's name
    // If auction name changed to different one, remove auctionId to fetch all items
    if (auctionIdParam) {
      const shouldKeepAuctionId = 
        (!newFilters.category && auctionNameFromId && !categoryCleared) || // Cleared but keep context (only if not user cleared)
        (auctionNameFromId && newFilters.category === auctionNameFromId); // Matches original
      
      if (shouldKeepAuctionId) {
        params.set('auctionId', auctionIdParam);
      }
      // If auction name changed to different one, don't include auctionId (will fetch all items)
    }
    
    // Add auction name to URL if set (using 'category' param for backward compatibility)
    if (newFilters.category) {
      params.set('category', newFilters.category);
    }
    
    // Build new URL and update
    const newUrl = params.toString() ? `/auction?${params.toString()}` : '/auction';
    router.replace(newUrl, { scroll: false });
    
    // Reset loading state after a short delay to allow URL update
    setTimeout(() => {
      setFilterLoading(false);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <div className="px-4 py-4 md:px-4 md:py-0 lg:px-8">
      <Header />
      </div>
      <div className="h-12 lg:h-16"></div> {/* Spacer for fixed header */}
      
      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 py-2 md:px-4 md:py-0 lg:px-8">
        {/* Category Header Section */}
        <CategoryHeaderSection categoryName={filters.category} />
        
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-5 mb-6 sm:mb-8">
          {/* Desktop Filters - Only show on xl+ screens */}
          <div className="hidden xl:block py-7 xl:pt-8 xl:pb-96 pr-6 xl:pr-8">
            <div className="mb-16">
              {/* <h2 className="font-bold text-5xl text-[#0E0E0E]">Auction Lots</h2> */}
            </div>
            <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
          </div>

          {/* Mobile Filter Button - Show on mobile, tablet, and 1024px */}
          <div className="xl:hidden pt-4 sm:pt-6 pb-4 flex items-center justify-between">
            <h2 className="font-bold text-2xl sm:text-3xl text-[#0E0E0E]">Auction Lots</h2>
            <button
              onClick={toggleFilter}
              className="bg-white hover:bg-gray-50 rounded-full p-2.5 shadow-lg border border-gray-200 w-10 h-10 flex items-center justify-center transition-colors"
              aria-label="Open filters"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Product Section */}
          <div className="xl:mt-16 space-y-4 sm:space-y-6 md:space-y-8 w-full pb-8 sm:pb-12 relative">
          {/* Filter Loading Overlay */}
          {filterLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#9F13FB]"></div>
                <p className="text-sm text-gray-600">Updating filters...</p>
              </div>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9F13FB]"></div>
            </div>
          ) : currentItems.length > 0 ? (
            <>
              <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
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
          className="xl:hidden fixed inset-0 z-10000 bg-black/40 sidebar-overlay"
          onClick={toggleFilter}
        >
          <div
            className="absolute left-0 top-0 h-full w-full md:w-1/2 lg:w-1/2 bg-white shadow-lg p-4 sm:p-6 overflow-y-auto z-10001 sidebar-content-left"
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
            <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
          </div>
        </div>
      )}

      <div className="relative lg:z-50 left-1/2 -translate-x-1/2 w-screen md:w-full md:left-0 md:translate-x-0">
      <HeroCTALgSection />
      </div>
      <Footer />
    </div>
  );
};

export default AuctionPage;

