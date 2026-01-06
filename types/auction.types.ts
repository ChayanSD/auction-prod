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
    status?: 'Draft' | 'Upcoming' | 'Active' | 'Ended' | 'Cancelled';
    category?: {
      id: string;
      name: string;
    };
    tags?: Array<{
      tag: {
        id: string;
        name: string;
      };
    }>;
  };
  currentBid?: number;
  baseBidPrice?: number;
  estimatedPrice?: number;
  status?: string; // Item's own status (Live, Upcoming, Closed, etc.)
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
  status: 'Draft' | 'Upcoming' | 'Active' | 'Ended' | 'Cancelled';
  category: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
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

