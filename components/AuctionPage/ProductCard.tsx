'use client';

import React from 'react';
import Link from 'next/link';
import type { AuctionListingItem } from '@/types/auction.types';

interface ProductCardProps {
  item: {
    lotNumber: string;
    itemId?: string; // Add itemId for navigation
    biddingEnds: string;
    title: string;
    auctioneerLocation: string;
    category: string;
    imagePath: string;
    imageAlt: string;
    tags?: string[];
    baseBidPrice?: number;
    itemStatus?: string; // Item's own status (Live, Closed, etc.)
    auction?: {
      status?: 'Draft' | 'Upcoming' | 'Active' | 'Ended' | 'Cancelled';
      endDate?: string;
    };
  };
}

/**
 * Product Card Component for Auction Listing Page
 * Horizontal layout: Image | Content | Buttons
 * Pixel-perfect design matching original ProductCard
 */
const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const { lotNumber, itemId, biddingEnds, title, auctioneerLocation, category, imagePath, imageAlt, tags, baseBidPrice, itemStatus, auction } = item;
  // Use itemId if available, otherwise use lotNumber (which is the item ID in mapped data)
  const navigateToItemId = itemId || lotNumber;

  const parseDate = (str: string) => {
    if (!str) return null;

    // Match: "Fri, 8th Aug 2025, 1:30PM"
    const match = str.match(/(\d+)\w*\s+([A-Za-z]+)\s+(\d{4}),\s+(\d+):(\d+)(AM|PM)/);
    if (!match) return null;

    const [_, day, month, year, hour, minute, meridiem] = match;

    // Convert to 24-hour format
    let hours = parseInt(hour);
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    // Format: "Aug 8, 2025 13:30:00" - this format works reliably
    const dateStr = `${month} ${day}, ${year} ${hours.toString().padStart(2, '0')}:${minute}:00`;
    return new Date(dateStr);
  };

  // Get endDate from auction object or parse from biddingEnds string
  const getEndDate = () => {
    if (auction?.endDate) {
      try {
        const date = new Date(auction.endDate);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (e) {
        // Fall through to parse biddingEnds
      }
    }
    return parseDate(biddingEnds);
  };

  const endDate = getEndDate();
  const auctionStatus = auction?.status;
  const now = new Date();
  
  // Priority 1: Check if date has passed - if yes, always show "Auction Closed"
  const isDatePassed = endDate && endDate < now;

  // Format date for display - smaller and inline
  const formatDateCompact = (dateStr: string) => {
    if (!dateStr) return '';
    const date = parseDate(dateStr);
    if (!date) return dateStr;
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Format date for "Bidding Ends" - short format DD/MM/YY
  const formatBiddingEndsDate = () => {
    // Use raw endDate from auction if available, otherwise use biddingEnds string
    if (auction?.endDate) {
      try {
        const date = new Date(auction.endDate);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit', 
            year: '2-digit' 
          });
        }
      } catch (e) {
        // Fall through to parse biddingEnds
      }
    }
    
    // Fallback to parsing biddingEnds string
    if (!biddingEnds || biddingEnds === 'N/A') return 'N/A';
    const date = parseDate(biddingEnds);
    if (!date) {
      // Try to parse as ISO string if parseDate fails
      try {
        const isoDate = new Date(biddingEnds);
        if (!isNaN(isoDate.getTime())) {
          return isoDate.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit', 
            year: '2-digit' 
          });
        }
      } catch (e) {
        return biddingEnds;
      }
      return biddingEnds;
    }
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit' 
    });
  };

  // Get status badge - Priority: Date first, then status
  const getStatusBadge = () => {
    // Priority 1: If date has passed, always show "Auction Closed"
    if (isDatePassed) {
      return (
        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F7F7F7] border border-[#E3E3E3] text-[#4D4D4D] rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <path d="M14 8.00013C14 9.17205 13.6569 10.3183 13.0129 11.2974C12.3689 12.2765 11.4522 13.0456 10.3761 13.5097C9.30001 13.9738 8.11155 14.1126 6.95746 13.909C5.80337 13.7054 4.73417 13.1682 3.88188 12.3639C3.83411 12.3187 3.7957 12.2646 3.76884 12.2046C3.74198 12.1447 3.7272 12.08 3.72535 12.0143C3.72349 11.9486 3.73459 11.8832 3.75802 11.8218C3.78144 11.7603 3.81673 11.7042 3.86188 11.6564C3.95304 11.5599 4.0788 11.5036 4.21148 11.4999C4.27718 11.498 4.3426 11.5091 4.40401 11.5325C4.46542 11.556 4.52161 11.5912 4.56938 11.6364C5.28421 12.3108 6.18193 12.7595 7.15037 12.9266C8.11881 13.0937 9.11501 12.9717 10.0145 12.5759C10.914 12.18 11.6769 11.5279 12.2079 10.7009C12.7389 9.87398 13.0144 8.90889 13 7.92625C12.9856 6.94361 12.6819 5.987 12.127 5.17594C11.572 4.36489 10.7904 3.73535 9.87967 3.36601C8.96897 2.99666 7.96962 2.90387 7.00649 3.09925C6.04336 3.29462 5.15916 3.76949 4.46438 4.46451C4.24375 4.68763 4.03625 4.90701 3.83438 5.12513L4.85375 6.14638C4.92376 6.21631 4.97144 6.30544 4.99076 6.40248C5.01009 6.49952 5.00019 6.60012 4.96231 6.69153C4.92444 6.78294 4.86029 6.86106 4.77799 6.916C4.69569 6.97093 4.59895 7.00021 4.5 7.00013H2C1.86739 7.00013 1.74021 6.94746 1.64645 6.85369C1.55268 6.75992 1.5 6.63274 1.5 6.50013V4.00013C1.49992 3.90119 1.5292 3.80444 1.58414 3.72214C1.63908 3.63985 1.71719 3.5757 1.80861 3.53782C1.90002 3.49995 2.00061 3.49004 2.09765 3.50937C2.1947 3.5287 2.28382 3.57638 2.35375 3.64638L3.125 4.41888C3.32625 4.20076 3.53375 3.98138 3.75375 3.75951C4.59255 2.91928 5.66178 2.34679 6.82609 2.1145C7.99041 1.88221 9.19746 2.00057 10.2945 2.45459C11.3915 2.90861 12.3292 3.67789 12.9888 4.66505C13.6484 5.65221 14.0003 6.81288 14 8.00013ZM8 4.50013C7.86739 4.50013 7.74021 4.55281 7.64645 4.64658C7.55268 4.74035 7.5 4.86753 7.5 5.00013V8.00013C7.49997 8.08645 7.52229 8.17131 7.56479 8.24644C7.60729 8.32158 7.66851 8.38443 7.7425 8.42888L10.2425 9.92888C10.2988 9.9627 10.3612 9.9851 10.4262 9.99479C10.4911 10.0045 10.5574 10.0013 10.6211 9.98539C10.6848 9.96949 10.7448 9.94119 10.7976 9.90211C10.8504 9.86303 10.8949 9.81394 10.9288 9.75763C10.9626 9.70133 10.985 9.63892 10.9947 9.57396C11.0043 9.509 11.0012 9.44277 10.9853 9.37904C10.9694 9.31532 10.9411 9.25535 10.902 9.20256C10.8629 9.14977 10.8138 9.1052 10.7575 9.07138L8.5 7.71701V5.00013C8.5 4.86753 8.44732 4.74035 8.35355 4.64658C8.25979 4.55281 8.13261 4.50013 8 4.50013Z" fill="#6E6E6E" />
          </svg>
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Auction Closed</span>
        </div>
      );
    }

    // Priority 2: If date hasn't passed, check status
    // Check item's own status first
    if (itemStatus === 'Closed') {
      return (
        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F7F7F7] border border-[#E3E3E3] text-[#4D4D4D] rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <path d="M14 8.00013C14 9.17205 13.6569 10.3183 13.0129 11.2974C12.3689 12.2765 11.4522 13.0456 10.3761 13.5097C9.30001 13.9738 8.11155 14.1126 6.95746 13.909C5.80337 13.7054 4.73417 13.1682 3.88188 12.3639C3.83411 12.3187 3.7957 12.2646 3.76884 12.2046C3.74198 12.1447 3.7272 12.08 3.72535 12.0143C3.72349 11.9486 3.73459 11.8832 3.75802 11.8218C3.78144 11.7603 3.81673 11.7042 3.86188 11.6564C3.95304 11.5599 4.0788 11.5036 4.21148 11.4999C4.27718 11.498 4.3426 11.5091 4.40401 11.5325C4.46542 11.556 4.52161 11.5912 4.56938 11.6364C5.28421 12.3108 6.18193 12.7595 7.15037 12.9266C8.11881 13.0937 9.11501 12.9717 10.0145 12.5759C10.914 12.18 11.6769 11.5279 12.2079 10.7009C12.7389 9.87398 13.0144 8.90889 13 7.92625C12.9856 6.94361 12.6819 5.987 12.127 5.17594C11.572 4.36489 10.7904 3.73535 9.87967 3.36601C8.96897 2.99666 7.96962 2.90387 7.00649 3.09925C6.04336 3.29462 5.15916 3.76949 4.46438 4.46451C4.24375 4.68763 4.03625 4.90701 3.83438 5.12513L4.85375 6.14638C4.92376 6.21631 4.97144 6.30544 4.99076 6.40248C5.01009 6.49952 5.00019 6.60012 4.96231 6.69153C4.92444 6.78294 4.86029 6.86106 4.77799 6.916C4.69569 6.97093 4.59895 7.00021 4.5 7.00013H2C1.86739 7.00013 1.74021 6.94746 1.64645 6.85369C1.55268 6.75992 1.5 6.63274 1.5 6.50013V4.00013C1.49992 3.90119 1.5292 3.80444 1.58414 3.72214C1.63908 3.63985 1.71719 3.5757 1.80861 3.53782C1.90002 3.49995 2.00061 3.49004 2.09765 3.50937C2.1947 3.5287 2.28382 3.57638 2.35375 3.64638L3.125 4.41888C3.32625 4.20076 3.53375 3.98138 3.75375 3.75951C4.59255 2.91928 5.66178 2.34679 6.82609 2.1145C7.99041 1.88221 9.19746 2.00057 10.2945 2.45459C11.3915 2.90861 12.3292 3.67789 12.9888 4.66505C13.6484 5.65221 14.0003 6.81288 14 8.00013ZM8 4.50013C7.86739 4.50013 7.74021 4.55281 7.64645 4.64658C7.55268 4.74035 7.5 4.86753 7.5 5.00013V8.00013C7.49997 8.08645 7.52229 8.17131 7.56479 8.24644C7.60729 8.32158 7.66851 8.38443 7.7425 8.42888L10.2425 9.92888C10.2988 9.9627 10.3612 9.9851 10.4262 9.99479C10.4911 10.0045 10.5574 10.0013 10.6211 9.98539C10.6848 9.96949 10.7448 9.94119 10.7976 9.90211C10.8504 9.86303 10.8949 9.81394 10.9288 9.75763C10.9626 9.70133 10.985 9.63892 10.9947 9.57396C11.0043 9.509 11.0012 9.44277 10.9853 9.37904C10.9694 9.31532 10.9411 9.25535 10.902 9.20256C10.8629 9.14977 10.8138 9.1052 10.7575 9.07138L8.5 7.71701V5.00013C8.5 4.86753 8.44732 4.74035 8.35355 4.64658C8.25979 4.55281 8.13261 4.50013 8 4.50013Z" fill="#6E6E6E" />
          </svg>
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Auction Closed</span>
        </div>
      );
    }

    // Check auction status
    if (!auctionStatus) {
      return null;
    }

    switch (auctionStatus) {
      case 'Active':
        return (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#FEEDED] border border-[#FA9A9C] text-[#F6484B] rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 12" fill="none" className="flex-shrink-0">
              <path d="M10.4999 5.99976C10.4999 6.49422 10.3533 6.97757 10.0786 7.38869C9.80388 7.79981 9.41343 8.12024 8.95662 8.30946C8.4998 8.49868 7.99714 8.54819 7.51218 8.45173C7.02723 8.35526 6.58177 8.11716 6.23214 7.76753C5.88251 7.4179 5.64441 6.97244 5.54795 6.48749C5.45148 6.00254 5.50099 5.49987 5.69021 5.04305C5.87943 4.58624 6.19986 4.19579 6.61098 3.92109C7.02211 3.64639 7.50546 3.49976 7.99991 3.49976C8.66295 3.49976 9.29883 3.76316 9.76768 4.232C10.2365 4.70084 10.4999 5.33672 10.4999 5.99976ZM12.9999 5.99976C13.0014 4.76968 12.548 3.58249 11.7268 2.66664C11.6833 2.61652 11.6303 2.57555 11.5709 2.5461C11.5115 2.51666 11.4468 2.49934 11.3806 2.49515C11.3144 2.49096 11.248 2.49998 11.1853 2.52169C11.1227 2.5434 11.0649 2.57737 11.0155 2.62161C10.9661 2.66585 10.926 2.71948 10.8975 2.77937C10.869 2.83927 10.8527 2.90424 10.8495 2.9705C10.8464 3.03675 10.8565 3.10297 10.8792 3.16529C10.9019 3.22762 10.9368 3.2848 10.9818 3.33351C11.6377 4.06686 12.0003 5.01621 12.0003 6.00008C12.0003 6.98394 11.6377 7.93329 10.9818 8.66664C10.8958 8.7658 10.8523 8.89478 10.8606 9.02575C10.8689 9.15671 10.9283 9.27917 11.0261 9.3667C11.1239 9.45423 11.2522 9.4998 11.3832 9.49359C11.5143 9.48738 11.6377 9.42989 11.7268 9.33351C12.5478 8.41734 13.0013 7.23001 12.9999 5.99976ZM5.01803 3.33351C5.06305 3.2848 5.09793 3.22762 5.12064 3.16529C5.14334 3.10297 5.15341 3.03675 5.15028 2.9705C5.14714 2.90424 5.13085 2.83927 5.10236 2.77937C5.07386 2.71948 5.03374 2.66585 4.98432 2.62161C4.93489 2.57737 4.87716 2.5434 4.81449 2.52169C4.75181 2.49998 4.68544 2.49096 4.61924 2.49515C4.55305 2.49934 4.48835 2.51666 4.42891 2.5461C4.36947 2.57555 4.31648 2.61652 4.27304 2.66664C3.45228 3.58298 2.99844 4.76991 2.99844 6.00008C2.99844 7.23025 3.45228 8.41717 4.27304 9.33351C4.3621 9.42989 4.48549 9.48738 4.61658 9.49359C4.74766 9.4998 4.87593 9.45423 4.97371 9.3667C5.07149 9.27917 5.13094 9.15671 5.13923 9.02575C5.14753 8.89478 5.104 8.7658 5.01803 8.66664C4.36151 7.9336 3.99848 6.98413 3.99848 6.00008C3.99848 5.01602 4.36151 4.06655 5.01803 3.33351ZM14.9105 3.08351C14.5446 2.21448 14.0174 1.42261 13.3568 0.749763C13.3112 0.701081 13.2564 0.661995 13.1956 0.634803C13.1347 0.607611 13.069 0.592863 13.0024 0.591425C12.9358 0.589987 12.8695 0.601889 12.8075 0.626431C12.7456 0.650973 12.6891 0.68766 12.6415 0.734333C12.5939 0.781007 12.5561 0.836725 12.5304 0.898211C12.5047 0.959697 12.4915 1.02571 12.4916 1.09237C12.4918 1.15902 12.5052 1.22498 12.5312 1.28636C12.5572 1.34773 12.5952 1.40329 12.643 1.44976C13.8347 2.66391 14.5024 4.29724 14.5024 5.99851C14.5024 7.69979 13.8347 9.33311 12.643 10.5473C12.5969 10.5941 12.5605 10.6496 12.5358 10.7106C12.5111 10.7715 12.4987 10.8367 12.4992 10.9025C12.4997 10.9682 12.5132 11.0333 12.5388 11.0938C12.5645 11.1544 12.6018 11.2093 12.6487 11.2554C12.6955 11.3015 12.751 11.338 12.812 11.3626C12.8729 11.3873 12.9381 11.3998 13.0039 11.3992C13.0696 11.3987 13.1346 11.3852 13.1952 11.3596C13.2557 11.334 13.3107 11.2966 13.3568 11.2498C14.3919 10.1927 15.0916 8.85331 15.3681 7.39985C15.6445 5.9464 15.4853 4.44367 14.9105 3.08039V3.08351ZM2.01054 8.52976C1.51094 7.34876 1.37218 6.04628 1.61176 4.78653C1.85134 3.52678 2.45854 2.36617 3.35679 1.45101C3.44978 1.35636 3.50136 1.22865 3.50019 1.09597C3.49902 0.963287 3.44518 0.836505 3.35054 0.743513C3.25589 0.650522 3.12817 0.598938 2.99549 0.60011C2.86281 0.601282 2.73603 0.655114 2.64304 0.749763C1.2669 2.15072 0.49585 4.03599 0.49585 5.99976C0.49585 7.96354 1.2669 9.84881 2.64304 11.2498C2.68857 11.2984 2.74338 11.3375 2.80424 11.3647C2.86509 11.3919 2.93078 11.4067 2.99742 11.4081C3.06406 11.4095 3.13032 11.3976 3.19229 11.3731C3.25427 11.3486 3.31071 11.3119 3.3583 11.2652C3.40589 11.2185 3.44367 11.1628 3.46941 11.1013C3.49515 11.0398 3.50834 10.9738 3.5082 10.9072C3.50806 10.8405 3.49459 10.7745 3.46859 10.7132C3.44259 10.6518 3.40457 10.5962 3.35679 10.5498C2.78471 9.96731 2.32794 9.28194 2.01054 8.52976Z" fill="#F6484B" />
            </svg>
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Live Now</span>
          </div>     
        );
      case 'Upcoming':
        return (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#FEF8ED] border border-[#F6BC48] text-[#DB9914] rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <path d="M12.5 4.7275V2.5C12.5 2.23478 12.3946 1.98043 12.2071 1.79289C12.0196 1.60536 11.7652 1.5 11.5 1.5H4.5C4.23478 1.5 3.98043 1.60536 3.79289 1.79289C3.60536 1.98043 3.5 2.23478 3.5 2.5V4.75C3.50034 4.90519 3.53663 5.05818 3.60603 5.19698C3.67543 5.33579 3.77605 5.45662 3.9 5.55L7.16687 8L3.9 10.45C3.77605 10.5434 3.67543 10.6642 3.60603 10.803C3.53663 10.9418 3.50034 11.0948 3.5 11.25V13.5C3.5 13.7652 3.60536 14.0196 3.79289 14.2071C3.98043 14.3946 4.23478 14.5 4.5 14.5H11.5C11.7652 14.5 12.0196 14.3946 12.2071 14.2071C12.3946 14.0196 12.5 13.7652 12.5 13.5V11.2725C12.4996 11.118 12.4636 10.9657 12.3947 10.8274C12.3259 10.6891 12.2261 10.5685 12.1031 10.475L8.82938 8L12.1031 5.52563C12.2262 5.43205 12.326 5.31136 12.3948 5.17294C12.4637 5.03452 12.4996 4.88209 12.5 4.7275ZM11.1394 11H4.83313L8 8.625L11.1394 11ZM11.5 4.7275L8 7.375L4.5 4.75V2.5H11.5V4.7275Z" fill="#DB9914" fillOpacity="0.85" />
            </svg>
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Upcoming</span>
          </div>
        );
      case 'Cancelled':
        return (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F7F7F7] border border-[#E3E3E3] text-[#6E6E6E] rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM10.5 10.5L9.5 11.5L8 10L6.5 11.5L5.5 10.5L7 9L5.5 7.5L6.5 6.5L8 8L9.5 6.5L10.5 7.5L9 9L10.5 10.5Z" fill="#6E6E6E" />
            </svg>
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Cancelled</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-[20px] hover:shadow-lg transition-shadow border border-[#E3E3E3] flex flex-col md:h-full lg:h-full overflow-hidden">
      {/* Image Section */}
      <Link href={`/auction-item/${navigateToItemId}`} className="w-full h-full">
        <div className="bg-[#F7F7F7] w-full h-full min-h-[200px] sm:min-h-[240px] md:h-[220px] lg:h-[240px] cursor-pointer hover:opacity-90 transition-opacity overflow-hidden rounded-t-[20px]">
          <img src={imagePath} alt={imageAlt} className="w-full h-full object-cover" />
        </div>
      </Link>

      {/* Content Section */}
      <div className="m-3 sm:m-5 pb-4 md:flex-1 md:flex md:flex-col">
        {/* Status and Timestamp - Inline on desktop, stacked on mobile */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-wrap">
          {/* Status Badge */}
          {getStatusBadge()}
          
          {/* Date - Smaller and inline */}
          {biddingEnds && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-[#4D4D4D]">
              <div className="p-1.5 sm:p-2 bg-[#F7F7F7] rounded-full flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" viewBox="0 0 12 14" fill="none" className="sm:w-3 sm:h-3">
                  <path d="M11 1.5H9.5V1C9.5 0.867392 9.44732 0.740215 9.35355 0.646447C9.25979 0.552678 9.13261 0.5 9 0.5C8.86739 0.5 8.74021 0.552678 8.64645 0.646447C8.55268 0.740215 8.5 0.867392 8.5 1V1.5H3.5V1C3.5 0.867392 3.44732 0.740215 3.35355 0.646447C3.25979 0.552678 3.13261 0.5 3 0.5C2.86739 0.5 2.74021 0.552678 2.64645 0.646447C2.55268 0.740215 2.5 0.867392 2.5 1V1.5H1C0.734784 1.5 0.48043 1.60536 0.292893 1.79289C0.105357 1.98043 0 2.23478 0 2.5V12.5C0 12.7652 0.105357 13.0196 0.292893 13.2071C0.48043 13.3946 0.734784 13.5 1 13.5H11C11.2652 13.5 11.5196 13.3946 11.7071 13.2071C11.8946 13.0196 12 12.7652 12 12.5V2.5C12 2.23478 11.8946 1.98043 11.7071 1.79289C11.5196 1.60536 11.2652 1.5 11 1.5ZM8.60375 7.85375L5.60375 10.8538C5.55731 10.9002 5.50217 10.9371 5.44147 10.9623C5.38077 10.9874 5.31571 11.0004 5.25 11.0004C5.18429 11.0004 5.11923 10.9874 5.05853 10.9623C4.99783 10.9371 4.94269 10.9002 4.89625 10.8538L3.39625 9.35375C3.30243 9.25993 3.24972 9.13268 3.24972 9C3.24972 8.86732 3.30243 8.74007 3.39625 8.64625C3.49007 8.55243 3.61732 8.49972 3.75 8.49972C3.88268 8.49972 4.00993 8.55243 4.10375 8.64625L5.25 9.79313L7.89625 7.14625C7.9427 7.09979 7.99786 7.06294 8.05855 7.0378C8.11925 7.01266 8.1843 6.99972 8.25 6.99972C8.3157 6.99972 8.38075 7.01266 8.44145 7.0378C8.50214 7.06294 8.55729 7.09979 8.60375 7.14625C8.65021 7.1927 8.68705 7.24786 8.7122 7.30855C8.73734 7.36925 8.75028 7.4343 8.75028 7.5C8.75028 7.5657 8.73734 7.63075 8.7122 7.69145C8.68705 7.75214 8.65021 7.8073 8.60375 7.85375ZM1 4.5V2.5H2.5V3C2.5 3.13261 2.55268 3.25979 2.64645 3.35355C2.74021 3.44732 2.86739 3.5 3 3.5C3.13261 3.5 3.25979 3.44732 3.35355 3.35355C3.44732 3.25979 3.5 3.13261 3.5 3V2.5H8.5V3C8.5 3.13261 8.55268 3.25979 8.64645 3.35355C8.74021 3.44732 8.86739 3.5 9 3.5C9.13261 3.5 9.25979 3.44732 9.35355 3.35355C9.44732 3.25979 9.5 3.13261 9.5 3V2.5H11V4.5H1Z" fill="#4D4D4D" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                {formatDateCompact(biddingEnds)}
              </span>
            </div>
          )}
        </div>

        {/* Product Title and Description */}
        <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6 md:flex-1 md:flex md:flex-col">
          <Link href={`/auction-item/${navigateToItemId}`}>
            <div className="font-bold text-lg sm:text-xl text-[#0E0E0E] text-ellipsis overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] hover:text-purple-600 transition-colors cursor-pointer md:min-h-[3rem]">
              <h2>{title}</h2>
            </div>
          </Link>
          <div className="text-base sm:text-[18px] text-[#4D4D4D] font-medium">
            <h4>{category} Auctions</h4>
          </div>
          <div className="flex gap-1 items-center text-sm sm:text-[16px] text-[#4D4D4D] font-medium">
            <div className="p-2 rounded-full bg-[#F7F7F7]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 14 18" fill="none">
                <path d="M12.625 16.5H8.76094C9.41004 15.9204 10.0222 15.3007 10.5938 14.6445C12.7383 12.1781 13.875 9.57812 13.875 7.125C13.875 5.30164 13.1507 3.55295 11.8614 2.26364C10.572 0.974328 8.82336 0.25 7 0.25C5.17664 0.25 3.42795 0.974328 2.13864 2.26364C0.849328 3.55295 0.125 5.30164 0.125 7.125C0.125 9.57812 1.25859 12.1781 3.40625 14.6445C3.97782 15.3007 4.58996 15.9204 5.23906 16.5H1.375C1.20924 16.5 1.05027 16.5658 0.933058 16.6831C0.815848 16.8003 0.75 16.9592 0.75 17.125C0.75 17.2908 0.815848 17.4497 0.933058 17.5669C1.05027 17.6842 1.20924 17.75 1.375 17.75H12.625C12.7908 17.75 12.9497 17.6842 13.0669 17.5669C13.1842 17.4497 13.25 17.2908 13.25 17.125C13.25 16.9592 13.1842 16.8003 13.0669 16.6831C12.9497 16.5658 12.7908 16.5 12.625 16.5ZM7 4.625C7.49445 4.625 7.9778 4.77162 8.38893 5.04633C8.80005 5.32103 9.12048 5.71148 9.3097 6.16829C9.49892 6.62511 9.54843 7.12777 9.45196 7.61273C9.3555 8.09768 9.1174 8.54314 8.76777 8.89277C8.41814 9.2424 7.97268 9.4805 7.48773 9.57696C7.00277 9.67343 6.50011 9.62392 6.04329 9.4347C5.58648 9.24548 5.19603 8.92505 4.92133 8.51393C4.64662 8.1028 4.5 7.61945 4.5 7.125C4.5 6.46196 4.76339 5.82607 5.23223 5.35723C5.70107 4.88839 6.33696 4.625 7 4.625Z" fill="#4D4D4D" />
              </svg>
            </div>
            <h4>{auctioneerLocation}</h4>
          </div>
          
          {/* Opening Bid and Bidding Ends */}
          <div className="flex flex-col gap-1.5 sm:gap-2 mt-3 sm:mt-4 text-sm sm:text-base text-[#4D4D4D]">
            {baseBidPrice !== undefined && baseBidPrice !== null && (
              <div className="flex items-center">
                <span className="font-medium">Opening Bid:</span>
                <span className="font-semibold text-[#0E0E0E] ml-1">£{baseBidPrice.toLocaleString()}</span>
              </div>
            )}
            {(biddingEnds || auction?.endDate) && (
              <div className="flex items-center">
                <span className="font-medium">Bidding Ends:</span>
                <span className="font-semibold text-[#0E0E0E] ml-1">{formatBiddingEndsDate()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buttons Section */}
      <div className="p-3 sm:p-5">
        <div className="flex flex-col gap-3 sm:gap-4">
          <Link href={`/auction-item/${navigateToItemId}`} className="w-full">
            <div className="text-center py-2.5 sm:py-2 w-full px-4 sm:px-5 border bg-gradient-to-bl from-[#9F13FB] to-[#E95AFF] text-white text-sm sm:text-base rounded-full hover:shadow-md transition-all active:scale-95 cursor-pointer font-semibold">
              View Auction
            </div>
          </Link>
          <Link href="/contact?type=Consignment" className="w-full">
            <div className="text-center py-2.5 sm:py-2 px-4 sm:px-5 w-full border border-[#9F13FB] text-[#9F13FB] text-sm sm:text-base rounded-full hover:bg-purple-50 transition-all active:scale-95 cursor-pointer font-semibold">
              Consign with Us
            </div>
          </Link>
        </div>
        <div className="mt-4 sm:mt-5">
          {tags && tags.map((tag, index) => (
            <span key={index} className="inline-block bg-[#F7F7F7] text-[#0E0E0E] text-xs font-medium mr-2 mb-2 px-3 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

