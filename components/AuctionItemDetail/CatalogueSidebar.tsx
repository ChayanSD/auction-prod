"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/fetcher";
import { cleanLotNumber } from "@/utils/lotNumber";

interface CatalogueSidebarProps {
  currentItemId: string;
  auctionId: string;
  auctionName: string;
}

interface CatalogueItem {
  id: string;
  name: string;
  lotNumber?: string | null;
  productImages: Array<{
    url: string;
    altText?: string | null;
  }>;
}

const CatalogueSidebar: React.FC<CatalogueSidebarProps> = ({
  currentItemId,
  auctionId,
  auctionName,
}) => {
  const router = useRouter();
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevItem, setPrevItem] = useState<CatalogueItem | null>(null);
  const [nextItem, setNextItem] = useState<CatalogueItem | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<
          CatalogueItem[] | { data: CatalogueItem[] }
        >(`/auction-item?auctionId=${auctionId}`);

        const allItems = Array.isArray(response)
          ? response
          : response?.data || [];

        // Sort items by lot number
        const sortedItems = [...allItems].sort((a, b) => {
          const getLotNumericValue = (
            lotNumber: string | null | undefined,
          ): number => {
            if (!lotNumber) return Infinity;
            const cleaned = cleanLotNumber(lotNumber);
            if (!cleaned) return Infinity;
            const numericMatch = cleaned.match(/\d+/);
            if (numericMatch) {
              return parseInt(numericMatch[0], 10);
            }
            return Infinity;
          };

          const aNum = getLotNumericValue(a.lotNumber);
          const bNum = getLotNumericValue(b.lotNumber);

          if (aNum !== Infinity || bNum !== Infinity) {
            if (aNum !== bNum) {
              return aNum - bNum;
            }
          }

          const aLot = cleanLotNumber(a.lotNumber) || "";
          const bLot = cleanLotNumber(b.lotNumber) || "";
          if (aLot !== bLot) {
            return aLot.localeCompare(bLot);
          }

          return 0;
        });

        setItems(sortedItems);

        // Find current item index
        const currentIndex = sortedItems.findIndex(
          (item) => item.id === currentItemId,
        );

        if (currentIndex !== -1) {
          setPrevItem(currentIndex > 0 ? sortedItems[currentIndex - 1] : null);
          setNextItem(
            currentIndex < sortedItems.length - 1
              ? sortedItems[currentIndex + 1]
              : null,
          );
        }
      } catch (error) {
        console.error("Error fetching catalogue items:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (auctionId && currentItemId) {
      fetchItems();
    }
  }, [auctionId, currentItemId]);

  const handleViewAll = () => {
    router.push(`/auction?category=${encodeURIComponent(auctionName)}`);
  };

  if (loading) {
    return (
      <div className="w-full lg:w-80 bg-white rounded-lg p-4 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-24"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length <= 1) {
    return null;
  }

  return (
    <div className="w-full lg:w-80 sticky top-4 space-y-4 sm:space-y-6">
      {/* Catalogue Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
          CATALOGUE
        </h3>
        <button
          onClick={handleViewAll}
          className="text-sm text-purple-600 hover:text-purple-700 font-semibold transition-colors"
        >
          View all
        </button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Previous Lot Card */}
        {prevItem && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <Link
              href={`/auction-item/${prevItem.id}`}
              className="block p-4 sm:p-5 group"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-[#F8F8F8] mb-4 flex items-center justify-center p-2 sm:p-4">
                <img
                  src={prevItem.productImages?.[0]?.url || "/placeholder.jpg"}
                  alt={prevItem.productImages?.[0]?.altText || prevItem.name}
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="text-center space-y-2">
                <div className="text-sm sm:text-base text-gray-900 line-clamp-2 leading-relaxed">
                  <span className="font-bold">
                    LOT {cleanLotNumber(prevItem.lotNumber) || "N/A"}
                  </span>{" "}
                  <span className="text-gray-700">{prevItem.name}</span>
                </div>
                <div className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors pt-1">
                  Previous Lot
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Next Lot Card */}
        {nextItem && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <Link
              href={`/auction-item/${nextItem.id}`}
              className="block p-4 sm:p-5 group"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-[#F8F8F8] mb-4 flex items-center justify-center p-2 sm:p-4">
                <img
                  src={nextItem.productImages?.[0]?.url || "/placeholder.jpg"}
                  alt={nextItem.productImages?.[0]?.altText || nextItem.name}
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="text-center space-y-2">
                <div className="text-sm sm:text-base text-gray-900 line-clamp-2 leading-relaxed">
                  <span className="font-bold">
                    LOT {cleanLotNumber(nextItem.lotNumber) || "N/A"}
                  </span>{" "}
                  <span className="text-gray-700">{nextItem.name}</span>
                </div>
                <div className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors pt-1">
                  Next Lot
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogueSidebar;
