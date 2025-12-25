/**
 * TypeScript types for Auction Listing page
 */

export interface AuctionListingItem {
  id: string;
  lotNumber?: string;
  name: string;
  description?: string;
  productImages?: Array<{
    url: string;
    altText?: string;
  }>;
  auction?: {
    id: string;
    name: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    status?: 'Draft' | 'Upcoming' | 'Active' | 'Ended' | 'Cancelled';
  };
  currentBid?: number;
  baseBidPrice?: number;
  estimatedPrice?: number;
  shipping?: {
    address?: string;
    country?: string;
  };
  tags?: string[];
  category?: string;
}

export interface AuctionFilters {
  keyword: string;
  country: string;
  category: string;
  auctionStatus: string;
  startDate: Date | null;
  endDate: Date | null;
  priceRange: [number, number];
  auctionHouse?: string;
  brandName?: string;
}

export interface SortOptions {
  sortBy: 'Most Lot' | 'Less Lot' | 'Ended' | 'Most Popular' | 'Most Relevant';
  byValue: 'Highest' | 'Lowest';
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

