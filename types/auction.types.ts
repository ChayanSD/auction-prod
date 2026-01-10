/**
 * TypeScript types for Auction Listing page
 */

export interface AuctionListingItem {
  id: string;
  lotNumber?: string;
  name: string;
  description?: string;
  // Item-level dates (preferred source for bidding and status)
  startDate?: string;
  endDate?: string;
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
    status?: 'Upcoming' | 'Live' | 'Closed';
    tags?: Array<{
      tag: {
        id: string;
        name: string;
      };
    }>;
  };
  currentBid?: number;
  baseBidPrice?: number;
  estimateMin?: number;
  estimateMax?: number;
  shipping?: {
    address?: string;
    country?: string;
  };
  tags?: string[];
}

export interface AuctionFilters {
  keyword: string;
  category: string; // Now stores auction name (kept as 'category' for backward compatibility)
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

/**
 * TypeScript types for Auction (parent level)
 */
export interface Auction {
  id: string;
  name: string;
  description: string;
  location: string;
  slug: string;
  imageUrl?: string | null;
  startDate?: string;
  endDate?: string;
  status: 'Upcoming' | 'Live' | 'Closed';
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  items?: Array<{
    id: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AuctionFiltersForAuctions {
  keyword: string;
  status: string;
  location: string;
  tags: string[];
}

