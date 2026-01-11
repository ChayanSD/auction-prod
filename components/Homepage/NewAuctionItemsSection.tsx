"use client";

import { useState, useCallback, memo, useEffect } from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/fetcher";
import { AuctionItemCard } from "@/components/Homepage/AuctionItemCard";

interface AuctionItem {
  id: string;
  name: string;
  productImages?: Array<{ url: string; altText?: string }>;
  auction?: {
    status?: "Upcoming" | "Live" | "Closed";
    endDate?: string | Date;
  };
}

/**
 * New Auction Items section with carousel
 * Shows latest 10 auction items from backend
 * Fully responsive for mobile, tablet, and desktop
 */
const NewAuctionItemsSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [data, setData] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuctionItems = async () => {
      try {
        setLoading(true);
        // Fetch auction items from backend
        const response = await apiClient.get<
          AuctionItem[] | { success: boolean; data: AuctionItem[] }
        >("/auction-item");

        // Handle both response formats
        let items: AuctionItem[] = [];
        if (Array.isArray(response)) {
          items = response;
        } else if (
          response &&
          typeof response === "object" &&
          "success" in response
        ) {
          if (response.success && "data" in response) {
            items = response.data;
          } else {
            setError("Failed to fetch auction items");
          }
        } else {
          setError("Invalid response format");
        }

        // API already returns items sorted by createdAt desc, just take latest 10
        const sortedItems = items.slice(0, 10);

        setData(sortedItems);
      } catch (err) {
        console.error("Error fetching auction items:", err);
        setError("Failed to load auction items");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionItems();
  }, []);

  // Responsive breakpoints: 4 items (large), 3 items (medium), 2 items (tablet), 1 item (mobile)
  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 1440 },
      items: 4,
      slidesToSlide: 1,
    },
    desktop: {
      breakpoint: { max: 1440, min: 1024 },
      items: 4,
      slidesToSlide: 1,
    },
    tablet: {
      breakpoint: { max: 1024, min: 768 },
      items: 3,
      slidesToSlide: 1,
    },
    mobile: {
      breakpoint: { max: 768, min: 640 },
      items: 2,
      slidesToSlide: 1,
    },
    smallMobile: {
      breakpoint: { max: 640, min: 0 },
      items: 1,
      slidesToSlide: 1,
    },
  };

  // Memoized custom arrow components
  const CustomLeftArrow = memo<{
    onClick?: () => void;
    carouselState?: { currentSlide: number };
  }>(({ onClick, carouselState }) => {
    const currentSlide = carouselState?.currentSlide || 0;
    return (
      <button
        onClick={onClick}
        disabled={currentSlide === 0}
        className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          currentSlide === 0
            ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-30"
            : "bg-white text-gray-700 hover:bg-gray-50 hover:shadow-xl hover:scale-110 active:scale-95"
        }`}
        aria-label="Previous items"
      >
        <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
      </button>
    );
  });

  const CustomRightArrow = memo<{
    onClick?: () => void;
    carouselState?: {
      currentSlide: number;
      totalItems: number;
      deviceType?: string;
    };
  }>(({ onClick, carouselState }) => {
    const {
      currentSlide = 0,
      totalItems = 0,
      deviceType,
    } = carouselState || {};
    const itemsToShow =
      deviceType && responsive[deviceType as keyof typeof responsive]
        ? responsive[deviceType as keyof typeof responsive].items
        : 4;
    const isAtEnd = currentSlide >= totalItems - itemsToShow;

    return (
      <button
        onClick={onClick}
        disabled={isAtEnd}
        className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isAtEnd
            ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-30"
            : "bg-white text-gray-700 hover:bg-gray-50 hover:shadow-xl hover:scale-110 active:scale-95"
        }`}
        aria-label="Next items"
      >
        <ChevronRight size={20} className="sm:w-6 sm:h-6" />
      </button>
    );
  });

  CustomLeftArrow.displayName = "CustomLeftArrow";
  CustomRightArrow.displayName = "CustomRightArrow";

  // Memoized view more button
  const ViewMoreButton = memo(() => (
    <Link href={"/auction"} className="group">
      <button className="flex items-center gap-2 px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 border border-purple-600 rounded-full hover:bg-purple-50 transition-all duration-200 hover:shadow-md active:scale-95 shrink-0">
        <span className="font-semibold text-xs sm:text-sm sm:text-base lg:text-lg text-purple-600">
          View More
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="17"
          viewBox="0 0 24 25"
          fill="none"
          className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        >
          <path
            d="M17.0306 12.804L9.53055 20.304C9.46087 20.3737 9.37815 20.4289 9.2871 20.4667C9.19606 20.5044 9.09847 20.5238 8.99993 20.5238C8.90138 20.5238 8.8038 20.5044 8.71276 20.4667C8.62171 20.4289 8.53899 20.3737 8.4693 20.304C8.39962 20.2343 8.34435 20.1516 8.30663 20.0605C8.26892 19.9695 8.24951 19.8719 8.24951 19.7734C8.24951 19.6748 8.26892 19.5772 8.30663 19.4862C8.34435 19.3952 8.39962 19.3124 8.4693 19.2427L15.4396 12.2734L8.4693 5.30399C8.32857 5.16326 8.24951 4.97239 8.24951 4.77337C8.24951 4.57434 8.32857 4.38347 8.4693 4.24274C8.61003 4.10201 8.80091 4.02295 8.99993 4.02295C9.19895 4.02295 9.38982 4.10201 9.53055 4.24274L17.0306 11.7427C17.1003 11.8124 17.1556 11.8951 17.1933 11.9862C17.2311 12.0772 17.2505 12.1748 17.2505 12.2734C17.2505 12.3719 17.2311 12.4695 17.1933 12.5606C17.1556 12.6516 17.1003 12.7343 17.0306 12.804Z"
            fill="#9F13FB"
          />
        </svg>
      </button>
    </Link>
  ));

  ViewMoreButton.displayName = "ViewMoreButton";

  const handleBeforeChange = useCallback((nextSlide: number) => {
    setCurrentSlide(nextSlide);
  }, []);

  return (
    <div className="w-full min-h-[500px] sm:min-h-[600px] lg:h-auto lg:min-h-[1168px] bg-gradient-to-br from-orange-50 to-amber-50 pb-0  pt-16 md:pt-0 md:pb-20 lg:pb-8 md:rounded-b-2xl lg:-mt-100 xl:-mt-110 2xl:-mt-130">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left mb-4 sm:mb-6 md:mb-8 lg:mb-10 gap-4 sm:gap-6">
          {/* <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-gray-900 leading-tight">
            New Auction Items
          </h2> */}
          <h2 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight mb-3 sm:mb-4">
            Discover Our{' '}
            <span className="bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] bg-clip-text text-transparent">
              Latest Auction Items
            </span>
          </h2>
          <div className="hidden md:block">
            <ViewMoreButton />
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative auction-carousel py-4 sm:py-6">
          {/* <Carousel
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
          > */}
          <Carousel
            responsive={responsive}
            infinite={false}
            rewind={true}
            rewindWithAnimation={true}
            autoPlay={true}
            autoPlaySpeed={4000}
            shouldResetAutoplay={true}
            arrows={true}
            customLeftArrow={<CustomLeftArrow />}
            customRightArrow={<CustomRightArrow />}
            beforeChange={handleBeforeChange}
            itemClass="px-0 sm:px-0"
            containerClass=""
            swipeable={true}
            draggable={true}
            keyBoardControl={true}
            customTransition="transform 300ms ease-in-out"
            transitionDuration={300}
            removeArrowOnDeviceType={[]}
            renderButtonGroupOutside={false}
            partialVisible={false}
            centerMode={false}
            focusOnSelect={false}
            minimumTouchDrag={80}
            pauseOnHover={true}
          >
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-red-500 text-sm sm:text-base">{error}</p>
              </div>
            ) : data && data.length > 0 ? (
              data.map((item) => <AuctionItemCard key={item.id} item={item} />)
            ) : (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500 text-sm sm:text-base">
                  No auction items found.
                </p>
              </div>
            )}
          </Carousel>
        </div>

        {/* Mobile View More Button */}
        <div className="md:hidden my-6 pb-4 mb-8 flex  justify-center">
          <ViewMoreButton />
        </div>
      </div>

      {/* Optimized CSS with better performance */}
      <style jsx global>{`
        .auction-carousel {
          will-change: transform;
        }

        .auction-carousel .react-multi-carousel-list {
          padding: 0 !important;
          overflow: hidden !important;
        }

        .auction-carousel .react-multi-carousel-track {
          display: flex !important;
          gap: 0.25rem;
          will-change: transform;
        }

        @media (min-width: 640px) {
          .auction-carousel .react-multi-carousel-track {
            gap: 0.1rem;
          }
        }

        @media (min-width: 1024px) {
          .auction-carousel .react-multi-carousel-track {
            gap: 0.1rem;
          }
        }

        .auction-carousel .react-multi-carousel-item {
          display: flex !important;
          height: 100% !important;
          align-items: stretch !important;
        }

        @media (min-width: 1024px) {
          .auction-carousel .react-multi-carousel-item {
            padding-bottom: 1rem !important;
          }
        }

        .auction-carousel .react-multi-carousel-item > div {
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }

        .auction-carousel .react-multiple-carousel__arrow {
          z-index: 20 !important;
          position: absolute !important;
        }

        .auction-carousel .react-multiple-carousel__arrow--left {
          left: 0.5rem !important;
        }

        .auction-carousel .react-multiple-carousel__arrow--right {
          right: 0.5rem !important;
        }

        /* Performance optimizations */
        .auction-carousel * {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          -webkit-perspective: 1000px;
          perspective: 1000px;
        }

        .auction-carousel img {
          transform: translateZ(0);
          will-change: transform;
        }

        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .auction-carousel * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default NewAuctionItemsSection;
