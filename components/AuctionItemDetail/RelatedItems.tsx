'use client';

import React, { useEffect, useState, useCallback, memo } from 'react';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/fetcher';
import Link from 'next/link';

interface RelatedItemsProps {
  currentItemId: string;
  auctionId: string;
}

interface RelatedItem {
  id: string;
  name: string;
  baseBidPrice: number;
  currentBid: number | null;
  productImages: Array<{
    url: string;
    altText: string | null;
  }>;
  auction: {
    id: string;
    endDate: string;
    status?: string;
  };
  createdAt?: string;
}

const RelatedItems: React.FC<RelatedItemsProps> = ({ currentItemId, auctionId }) => {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchRelatedItems = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<RelatedItem[] | { data: RelatedItem[] }>(`/auction-item?auctionId=${auctionId}`);
        // Handle both array and wrapped response formats
        const allItems = Array.isArray(response) ? response : (response?.data || []);
        // Filter items from the same auction, excluding current item
        const related = allItems
          .filter((item: RelatedItem) => {
            const itemAuctionId = item.auction?.id;
            return itemAuctionId === auctionId && item.id !== currentItemId;
          })
          .slice(0, 10); // Limit to 10 items
        setItems(related);
      } catch (error) {
        console.error('Error fetching related items:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (auctionId) {
      fetchRelatedItems();
    }
  }, [currentItemId, auctionId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Responsive breakpoints
  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 1920 },
      items: 5,
      slidesToSlide: 2
    },
    largeDesktop: {
      breakpoint: { max: 1920, min: 1440 },
      items: 4,
      slidesToSlide: 2
    },
    desktop: {
      breakpoint: { max: 1440, min: 1024 },
      items: 3,
      slidesToSlide: 1
    },
    laptop: {
      breakpoint: { max: 1024, min: 768 },
      items: 2,
      slidesToSlide: 1
    },
    tablet: {
      breakpoint: { max: 768, min: 640 },
      items: 2,
      slidesToSlide: 1
    },
    mobile: {
      breakpoint: { max: 640, min: 480 },
      items: 2,
      slidesToSlide: 1
    },
    smallMobile: {
      breakpoint: { max: 480, min: 0 },
      items: 1,
      slidesToSlide: 1
    }
  };

  // Custom arrow components
  const CustomLeftArrow = memo<{ onClick?: () => void; carouselState?: { currentSlide: number } }>(({ onClick, carouselState }) => {
    const currentSlide = carouselState?.currentSlide || 0;
    return (
      <button
        onClick={onClick}
        disabled={currentSlide === 0}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full shadow-md flex items-center justify-center transition-all duration-200 -translate-x-2 sm:-translate-x-3 md:-translate-x-4 lg:-translate-x-5 xl:-translate-x-10 2xl:-translate-x-16 opacity-60 hover:opacity-100 ${
          currentSlide === 0
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-30'
            : 'bg-white text-gray-600 hover:bg-gray-50 hover:shadow-lg hover:scale-105 active:scale-95'
        }`}
        aria-label="Previous items"
      >
        <ChevronLeft size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
      </button>
    );
  });

  const CustomRightArrow = memo<{ onClick?: () => void; carouselState?: { currentSlide: number; totalItems: number; deviceType?: string } }>(({ onClick, carouselState }) => {
    const { currentSlide = 0, totalItems = 0, deviceType } = carouselState || {};
    const itemsToShow = deviceType && responsive[deviceType as keyof typeof responsive] 
      ? responsive[deviceType as keyof typeof responsive].items 
      : 4;
    const isAtEnd = currentSlide >= totalItems - itemsToShow;

    return (
      <button
        onClick={onClick}
        disabled={isAtEnd}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full shadow-md flex items-center justify-center transition-all duration-200 translate-x-2 sm:translate-x-3 md:translate-x-4 lg:translate-x-5 xl:translate-x-10 2xl:translate-x-16 opacity-60 hover:opacity-100 ${
          isAtEnd
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-30'
            : 'bg-white text-gray-600 hover:bg-gray-50 hover:shadow-lg hover:scale-105 active:scale-95'
        }`}
        aria-label="Next items"
      >
        <ChevronRight size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
      </button>
    );
  });

  CustomLeftArrow.displayName = 'CustomLeftArrow';
  CustomRightArrow.displayName = 'CustomRightArrow';

  const handleBeforeChange = useCallback((nextSlide: number) => {
    setCurrentSlide(nextSlide);
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Related Items</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full mb-10 lg:mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Similar Items Available Now</h2>
        <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-sm sm:text-base">No similar items found.</p>
        </div>
      </div>
    );
  }

  // Map items to match AuctionCard format
  const mappedItems = items.map((item) => ({
    id: item.id,
    name: item.name || 'N/A',
    productImages: item.productImages || [],
    endDate: item.auction?.endDate || null,
    createdAt: item.createdAt || null,
    baseBidPrice: item.baseBidPrice || 0,
    currentBid: item.currentBid || null,
    auction: {
      status: item.auction?.status || 'Draft',
      endDate: item.auction?.endDate || null,
    },
  }));

  return (
    <div className="w-full mb-10 lg:mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Similar Items Available Now</h2>
      <div className="relative related-items-carousel">
        <Carousel
          responsive={responsive}
          infinite={false}
          customLeftArrow={<CustomLeftArrow />}
          customRightArrow={<CustomRightArrow />}
          beforeChange={handleBeforeChange}
          itemClass="px-0"
          containerClass="mx-2 sm:mx-4 md:mx-6 lg:mx-8"
          removeArrowOnDeviceType={[]}
          swipeable={true}
          draggable={true}
          keyBoardControl={true}
          customTransition="transform 250ms ease-out"
          transitionDuration={250}
          renderButtonGroupOutside={false}
          partialVisible={false}
          centerMode={false}
          autoPlay={true}
          autoPlaySpeed={3000}
          shouldResetAutoplay={false}
          rewind={false}
          rewindWithAnimation={false}
        >
          {mappedItems.map((item) => {
            // Generate lot number from item ID
            const lotNumber = `Lot ${item.id.slice(-2).toUpperCase()}`;
            const openingBid = item.currentBid || item.baseBidPrice || 0;
            const endDate = item.endDate || item.auction?.endDate;

            return (
              <div key={item.id} className="px-1 sm:px-2 h-full">
                <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-1 sm:p-2 h-full transform hover:-translate-y-1 flex flex-col">
                  {/* Image */}
                  <Link href={`/auction-item/${item.id}`} className="block">
                    <div className="aspect-square rounded-[14px] bg-gray-100 overflow-hidden mb-2 sm:mb-3 relative">
                      <img
                        src={item.productImages?.[0]?.url || '/placeholder.jpg'}
                        alt={item.productImages?.[0]?.altText || item.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                        draggable={false}
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.jpg';
                        }}
                      />
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="p-2 sm:p-3 lg:p-4 flex-1 flex flex-col">
                    {/* Lot Number */}
                    <div className="text-xs sm:text-sm font-medium text-gray-500 mb-2">
                      {lotNumber}
                    </div>

                    {/* Title */}
                    <Link href={`/auction-item/${item.id}`}>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-3 sm:mb-4 line-clamp-2 leading-tight min-h-[2.5rem] hover:text-purple-600 transition-colors cursor-pointer">
                        {item.name}
                      </h3>
                    </Link>

                    {/* Opening Bid */}
                    <div className="space-y-1 mb-3 sm:mb-4">
                      <div className="text-xs sm:text-sm text-gray-600">Opening Bid:</div>
                      <div className="text-base sm:text-lg font-bold text-gray-900">
                        {formatCurrency(openingBid)}
                      </div>
                    </div>

                    {/* Bidding Ends */}
                    <div className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                      Bidding Ends: {endDate ? formatDate(endDate) : 'N/A'}
                    </div>

                    {/* Bid Input and Button */}
                    <div className="mt-auto space-y-2">
                      <input
                        type="number"
                        placeholder={formatCurrency(openingBid + 10)}
                        className="w-full px-2 py-1.5 text-xs sm:text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-300"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/auction-item/${item.id}`;
                        }}
                        readOnly
                      />
                      <Link href={`/auction-item/${item.id}`} className="block">
                        <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold rounded transition-colors">
                          Bid
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Carousel>
      </div>

      {/* Carousel Styles - matching homepage */}
      <style jsx global>{`
        .related-items-carousel {
          will-change: transform;
        }
        
        .related-items-carousel .react-multi-carousel-list {
          padding: 0 !important;
          overflow: visible !important;
        }
        
        .related-items-carousel .react-multi-carousel-track {
          display: flex !important;
          gap: 0.25rem;
          will-change: transform;
        }
        
        @media (min-width: 640px) {
          .related-items-carousel .react-multi-carousel-track {
            gap: 0.5rem;
          }
        }
        
        @media (min-width: 1024px) {
          .related-items-carousel .react-multi-carousel-track {
            gap: 0.75rem;
          }
        }
        
        .related-items-carousel .react-multi-carousel-item {
          display: flex !important;
          height: 100% !important;
        }
        
        .related-items-carousel .react-multiple-carousel__arrow {
          z-index: 20 !important;
          position: absolute !important;
        }
        
        .related-items-carousel .react-multiple-carousel__arrow--left {
          left: -0.5rem !important;
        }
        
        .related-items-carousel .react-multiple-carousel__arrow--right {
          right: -0.5rem !important;
        }
        
        @media (min-width: 640px) {
          .related-items-carousel .react-multiple-carousel__arrow--left {
            left: -1rem !important;
          }
          
          .related-items-carousel .react-multiple-carousel__arrow--right {
            right: -1rem !important;
          }
        }
        
        @media (min-width: 1024px) {
          .related-items-carousel .react-multiple-carousel__arrow--left {
            left: -2rem !important;
          }
          
          .related-items-carousel .react-multiple-carousel__arrow--right {
            right: -2rem !important;
          }
        }
        
        @media (min-width: 1280px) {
          .related-items-carousel .react-multiple-carousel__arrow--left {
            left: -5rem !important;
          }
          
          .related-items-carousel .react-multiple-carousel__arrow--right {
            right: -5rem !important;
          }
        }
        
        @media (min-width: 1536px) {
          .related-items-carousel .react-multiple-carousel__arrow--left {
            left: -8rem !important;
          }
          
          .related-items-carousel .react-multiple-carousel__arrow--right {
            right: -8rem !important;
          }
        }

        /* Performance optimizations */
        .related-items-carousel * {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          -webkit-perspective: 1000px;
          perspective: 1000px;
        }
        
        .related-items-carousel img {
          transform: translateZ(0);
          will-change: transform;
        }
        
        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .related-items-carousel * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RelatedItems;

