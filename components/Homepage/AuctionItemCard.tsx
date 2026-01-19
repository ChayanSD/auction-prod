"use client";

import React from "react";
import Link from "next/link";
import { cleanLotNumber } from "@/utils/lotNumber";

interface AuctionItemCardProps {
  item: {
    id: string;
    name: string;
    status?: string; // Item's own status (Live, Closed, etc.)
    lotNumber?: string | null;
    currentBid?: number | null;
    baseBidPrice?: number | null;
    productImages?: Array<{ url: string; altText?: string }>;
    auction?: {
      status?: "Upcoming" | "Live" | "Closed";
      endDate?: string | Date;
    };
  };
}

/**
 * Auction Item Card Component
 * Displays auction item with image, name, status, and Bid Now button
 * Fully responsive for mobile, tablet, and desktop
 */
export const AuctionItemCard: React.FC<AuctionItemCardProps> = ({ item }) => {
  const itemUrl = `/auction-item/${item.id}`;
  const imageUrl =
    item.productImages && item.productImages.length > 0
      ? item.productImages[0].url
      : "/placeholder.jpg";

  const auctionStatus = item.auction?.status || "Upcoming";
  const itemStatus = item.status;
  const endDate = item.auction?.endDate ? new Date(item.auction.endDate) : null;
  const now = new Date();
  const isDatePassed = endDate && endDate < now;

  // Determine if auction is Closed or Live
  const isClosed =
    isDatePassed || itemStatus === "Closed" || auctionStatus === "Closed";

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get current bid - show current bid if > 0, otherwise show base bid price
  const displayBid =
    item.currentBid && item.currentBid > 0
      ? item.currentBid
      : (item.baseBidPrice ?? 0);

  const getStatusBadge = () => {
    if (isClosed) {
      return (
        <div className="inline-flex items-center bg-[#F7F7F7] border border-[#E3E3E3] text-[#4D4D4D] text-sm sm:text-xs rounded-full px-2 py-1">
          <span>Closed</span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center bg-[#feeded] border border-[#FA9A9C] text-[#F6484B] text-sm sm:text-xs rounded-full px-2 py-1">
        <span>Live</span>
      </div>
    );
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a[href]")) {
      return;
    }
    window.location.href = itemUrl;
  };

  return (
    <div className="px-1 sm:px-2 h-full py-2">
      <div
        className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-1 sm:p-2 h-full transform hover:-translate-y-1 flex flex-col cursor-pointer"
        onClick={handleCardClick}
        style={{ minHeight: "100%" }}
      >
        {/* Image with lazy loading */}
        <div className="aspect-square rounded-[14px] bg-gray-100 overflow-hidden mb-2 sm:mb-3 relative w-full flex-shrink-0">
          <img
            src={imageUrl}
            alt={item.productImages?.[0]?.altText || item.name}
            className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
            loading="lazy"
            draggable={false}
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = "/placeholder.jpg";
            }}
          />
        </div>

        {/* Content */}
        <div className="p-2 sm:p-3 lg:p-4 flex-1 flex flex-col min-h-0">
          {/* Lot Number and Title */}
          <div className="space-y-2 mb-3 sm:mb-4 flex-shrink-0">
            {/* Always show lot number - show N/A if not provided */}
            <div className="text-xs sm:text-sm font-medium text-purple-600">
              Lot #{cleanLotNumber(item.lotNumber) || "N/A"}
            </div>
            <h3 className="font-semibold text-gray-700 text-sm sm:text-base lg:text-lg line-clamp-2 leading-snug min-h-[2.8rem] sm:min-h-[3rem] hover:text-purple-600 transition-colors overflow-hidden">
              {item.name}
            </h3>
          </div>

          {/* Status Badge */}
          <div className="mb-3 sm:mb-4 flex-shrink-0">{getStatusBadge()}</div>

          {/* Current Bid */}
          <div className="mb-3 sm:mb-4 flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/60 border border-emerald-200/50 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="flex-shrink-0"
              >
                <path
                  d="M8 0.5C3.86 0.5 0.5 3.86 0.5 8C0.5 12.14 3.86 15.5 8 15.5C12.14 15.5 15.5 12.14 15.5 8C15.5 3.86 12.14 0.5 8 0.5ZM8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C11.31 2 14 4.69 14 8C14 11.31 11.31 14 8 14ZM7.75 4.25V8.25L10.5 9.75L9.75 10.75L6.75 9V4.25H7.75Z"
                  fill="#10B981"
                />
              </svg>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-emerald-700 font-medium whitespace-nowrap">
                  Current Bid
                </span>
                <span className="text-sm text-[#0E0E0E] font-bold whitespace-nowrap">
                  {formatCurrency(displayBid)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
            className="mt-auto flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={itemUrl} className="block w-full">
              <button className="w-full py-2.5 px-2 sm:px-3 lg:px-4 rounded-full text-sm sm:text-sm lg:text-sm xl:text-base font-semibold transition-all duration-200 bg-gradient-to-br from-[#e253ff] to-[#9f14fc] text-white hover:shadow-md active:scale-95 whitespace-nowrap">
                Bid Now
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
