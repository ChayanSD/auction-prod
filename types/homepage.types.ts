/**
 * TypeScript types and interfaces for Homepage components
 */

export interface ProductImage {
  url: string;
  altText?: string;
}

export interface AuctionItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  productImages?: ProductImage[];
  endDate?: string;
  currentBid?: number;
  baseBidPrice?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface FeatureCardData {
  title: string;
  status: string;
  character: string;
}

export interface CheckmarkItemProps {
  text: string;
  className?: string;
}

export interface CTAButtonProps {
  href: string;
  text: string;
  variant?: 'purple' | 'black';
  className?: string;
  onClick?: () => void;
}

export interface CarouselResponsive {
  breakpoint: {
    max: number;
    min: number;
  };
  items: number;
  slidesToSlide: number;
}

export interface CarouselResponsiveConfig {
  superLargeDesktop: CarouselResponsive;
  desktop: CarouselResponsive;
  laptop: CarouselResponsive;
  tablet: CarouselResponsive;
  mobile: CarouselResponsive;
  smallMobile: CarouselResponsive;
}

