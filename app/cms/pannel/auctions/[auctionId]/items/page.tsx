"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AuctionItemForm from "@/components/cms/auction-items/AuctionItemForm";
import { API_BASE_URL } from "@/lib/api";
import toast from "react-hot-toast";
import { ArrowLeft, Edit, Trash2, Search, X } from "lucide-react";

interface Tag {
  name: string;
}

interface TagRelation {
  tag: Tag;
}

interface AuctionItem {
  id: string;
  name: string;
  description: string;
  auctionId: string;
  lotNumber?: string | null;
  baseBidPrice: number;
  reservePrice?: number;
  buyersPremium?: number;
  taxPercentage?: number;
  currentBid?: number;
  estimateMin?: number;
  estimateMax?: number;
  terms?: string;
  shipping?: {
    address: string;
    cost: number;
    deliveryTime: string;
  };
  productImages: { url: string; altText: string | null }[];
  tags?: TagRelation[];
  createdAt: string;
}

interface Auction {
  id: string;
  name: string;
  description?: string;
  location: string;
  status?: "Upcoming" | "Live" | "Closed";
  startDate?: string | null;
  endDate?: string | null;
}

interface AuctionItemApiPayload {
  name: string;
  description: string;
  auctionId: string;
  shipping?: {
    address: string;
    cost: number;
    deliveryTime: string;
  };
  terms: string;
  baseBidPrice: number;
  reservePrice?: number;
  buyersPremium?: number;
  taxPercentage?: number;
  estimateMin?: number;
  estimateMax?: number;
  productImages: { url: string; altText: string }[];
  tags?: { name: string }[];
}

export default function AuctionItemsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const auctionId = params.auctionId as string;
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const editFormRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [minBaseBid, setMinBaseBid] = useState<string>("");
  const [maxBaseBid, setMaxBaseBid] = useState<string>("");
  const [bidFilter, setBidFilter] = useState<string>("all"); // all, hasBids, noBids
  const [sortBy, setSortBy] = useState<string>("newest"); // newest, name, baseBid, currentBid

  // Fetch auction details
  const { data: auction, isLoading: auctionLoading } = useQuery<Auction>({
    queryKey: ["auction", auctionId],
    queryFn: async (): Promise<Auction> => {
      const res = await axios.get(`${API_BASE_URL}/auction/${auctionId}`, {
        withCredentials: true,
      });
      return res.data;
    },
    enabled: !!auctionId && !!user,
  });

  // Fetch all items for this auction
  const { data: items = [], isLoading: itemsLoading } = useQuery<AuctionItem[]>(
    {
      queryKey: ["auction-items", auctionId],
      queryFn: async (): Promise<AuctionItem[]> => {
        const res = await axios.get(
          `${API_BASE_URL}/auction-item?auctionId=${auctionId}`,
          { withCredentials: true }
        );
        return Array.isArray(res.data) ? res.data : [];
      },
      enabled: !!auctionId && !!user,
    }
  );

  // Fetch single item for editing
  const { data: editingItem, isLoading: editingItemLoading } =
    useQuery<AuctionItem>({
      queryKey: ["auction-item", editingItemId],
      queryFn: async (): Promise<AuctionItem> => {
        const res = await axios.get(
          `${API_BASE_URL}/auction-item/${editingItemId}`,
          { withCredentials: true }
        );
        return res.data;
      },
      enabled: !!editingItemId && !!user,
    });

  const createItemMutation = useMutation({
    mutationFn: (itemData: AuctionItemApiPayload) =>
      axios.post(`${API_BASE_URL}/auction-item`, itemData, {
        withCredentials: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-items", auctionId] });
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      setShowAddForm(false);
      toast.success("Auction item created successfully!");
    },
    onError: (error: unknown) => {
      let errorMessage = "Failed to create auction item";
      if (error instanceof Error) {
        if (axios.isAxiosError(error)) {
          errorMessage =
            error.response?.data?.error ||
            error.response?.data?.errors?.[0]?.message ||
            error.message;
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AuctionItemApiPayload }) =>
      axios.patch(`${API_BASE_URL}/auction-item/${id}`, data, {
        withCredentials: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-items", auctionId] });
      queryClient.invalidateQueries({
        queryKey: ["auction-item", editingItemId],
      });
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      setEditingItemId(null);
      toast.success("Auction item updated successfully!");
    },
    onError: (error: unknown) => {
      let errorMessage = "Failed to update auction item";
      if (error instanceof Error) {
        if (axios.isAxiosError(error)) {
          errorMessage =
            error.response?.data?.error ||
            error.response?.data?.errors?.[0]?.message ||
            error.message;
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      axios.delete(`${API_BASE_URL}/auction-item/${itemId}`, {
        withCredentials: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-items", auctionId] });
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      setShowDeleteModal(false);
      setDeleteItemId(null);
      toast.success("Auction item deleted successfully!");
    },
    onError: (error: unknown) => {
      let errorMessage = "Failed to delete auction item";
      if (error instanceof Error) {
        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.error || error.message;
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    },
  });

  const handleFormSubmit = async (itemData: {
    name: string;
    description: string;
    auctionId: string;
    lotNumber?: string | null;
    baseBidPrice: number;
    reservePrice?: number;
    buyersPremium?: number;
    taxPercentage?: number;
    estimateMin?: number;
    estimateMax?: number;
    terms: string;
    shipping?: {
      address: string;
      cost: number;
      deliveryTime: string;
    };
    productImages: { url: string; altText: string | null }[];
    tags?: Tag[] | string[] | TagRelation[];
  }) => {
    // Send numbers directly to API (API expects numbers, not strings)
    const apiPayload: AuctionItemApiPayload = {
      name: itemData.name,
      description: itemData.description,
      auctionId: auctionId,
      ...(itemData.lotNumber && itemData.lotNumber.trim() && { lotNumber: itemData.lotNumber.trim() }),
      baseBidPrice: itemData.baseBidPrice,
      reservePrice: itemData.reservePrice,
      buyersPremium: itemData.buyersPremium,
      taxPercentage: itemData.taxPercentage,
      estimateMin: itemData.estimateMin,
      estimateMax: itemData.estimateMax,
      terms: itemData.terms || "",
      shipping: itemData.shipping
        ? {
            address: itemData.shipping.address,
            cost: itemData.shipping.cost,
            deliveryTime: itemData.shipping.deliveryTime,
          }
        : undefined,
      productImages: itemData.productImages.map((img) => ({
        url: img.url,
        altText: img.altText || "",
      })),
      tags: itemData.tags && Array.isArray(itemData.tags)
        ? itemData.tags.map((tag: any) => {
            if (typeof tag === 'string') return { name: tag.trim() };
            if (tag && typeof tag === 'object' && 'tag' in tag) return { name: tag.tag.name.trim() };
            if (tag && typeof tag === 'object' && 'name' in tag) return { name: tag.name.trim() };
            return { name: String(tag).trim() };
          }).filter((tag: { name: string }) => tag.name)
        : undefined,
    };

    if (editingItemId) {
      updateItemMutation.mutate({
        id: editingItemId,
        data: apiPayload,
      });
    } else {
      createItemMutation.mutate(apiPayload);
    }
  };

  const handleEdit = (itemId: string) => {
    setEditingItemId(itemId);
    setShowAddForm(false);
    // Scroll to edit form after a brief delay to allow DOM update
    setTimeout(() => {
      const editForm = document.getElementById('edit-form');
      if (editForm) {
        editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback to top if element not found
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleDelete = (itemId: string) => {
    setDeleteItemId(itemId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteItemId) {
      deleteItemMutation.mutate(deleteItemId);
    }
  };

  const cancelEdit = () => {
    setEditingItemId(null);
  };

  // Scroll to edit form when it appears
  useEffect(() => {
    if (editingItemId && editingItem && !editingItemLoading && editFormRef.current) {
      setTimeout(() => {
        editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [editingItemId, editingItem, editingItemLoading]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchLower)
      );
    }

    // Base bid price filter
    if (minBaseBid) {
      const min = parseFloat(minBaseBid);
      if (!isNaN(min)) {
        filtered = filtered.filter((item) => item.baseBidPrice >= min);
      }
    }
    if (maxBaseBid) {
      const max = parseFloat(maxBaseBid);
      if (!isNaN(max)) {
        filtered = filtered.filter((item) => item.baseBidPrice <= max);
      }
    }

    // Bid filter (has bids vs no bids)
    if (bidFilter === "hasBids") {
      filtered = filtered.filter((item) => (item.currentBid || 0) > 0);
    } else if (bidFilter === "noBids") {
      filtered = filtered.filter(
        (item) => !item.currentBid || item.currentBid === 0
      );
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          // Sort by creation date (newest first) - items come from API already sorted, but maintain order
          // If items have createdAt, use it; otherwise maintain API order
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          // Maintain original order (API already sorts by createdAt desc)
          return 0;
        case "oldest":
          // Sort by creation date (oldest first)
          if (a.createdAt && b.createdAt) {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
          return 0;
        case "baseBid":
          return b.baseBidPrice - a.baseBidPrice;
        case "currentBid":
          return (b.currentBid || 0) - (a.currentBid || 0);
        default:
          // Default to newest first
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return 0;
      }
    });

    return filtered;
  }, [items, searchTerm, minBaseBid, maxBaseBid, bidFilter, sortBy]);

  if (!user) {
    return <div>Loading...</div>;
  }

  if (auctionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Auction Not Found
          </h2>
          <Button onClick={() => router.push("/cms/pannel/auctions")}>
            Back to Auction Lots
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/cms/pannel/auctions")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{auction.name}</h1>
            <p className="text-gray-600 mt-1">{auction.location}</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {showAddForm ? "Cancel" : "Add New Item"}
        </Button>
      </div>

      {/* Add Item Form */}
      {showAddForm && !editingItemId && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">
            Create New Auction Item
          </h2>
          <AuctionItemForm
            onSubmit={handleFormSubmit}
            initialData={{ auctionId: auctionId }}
            isEditing={false}
          />
        </div>
      )}

      {/* Edit Item Form */}
      {editingItemId && editingItem && !editingItemLoading && (
        <div ref={editFormRef} id="edit-form" className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Edit Auction Item</h2>
            <Button
              variant="outline"
              onClick={cancelEdit}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
          </div>
          <AuctionItemForm
            onSubmit={handleFormSubmit}
            initialData={{
              auctionId: editingItem.auctionId,
              name: editingItem.name,
              description: editingItem.description,
              lotNumber: editingItem.lotNumber || "",
              baseBidPrice: editingItem.baseBidPrice,
              reservePrice: editingItem.reservePrice,
              buyersPremium: editingItem.buyersPremium,
              taxPercentage: editingItem.taxPercentage,
              estimateMin: editingItem.estimateMin,
              estimateMax: editingItem.estimateMax,
              terms: editingItem.terms || "",
              shipping: editingItem.shipping
                ? {
                    address: editingItem.shipping.address,
                    cost: editingItem.shipping.cost,
                    deliveryTime: editingItem.shipping.deliveryTime,
                  }
                : undefined,
              productImages: editingItem.productImages.map((img) => ({
                url: img.url,
                altText: img.altText || "",
              })),
              tags: editingItem.tags || [],
            }}
            isEditing={true}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
            />
          </div>

          {/* Min Base Bid */}
          <div>
            <input
              type="number"
              placeholder="Min Base Bid (£)"
              value={minBaseBid}
              onChange={(e) => setMinBaseBid(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              min="0"
              step="1"
            />
          </div>

          {/* Max Base Bid */}
          <div>
            <input
              type="number"
              placeholder="Max Base Bid (£)"
              value={maxBaseBid}
              onChange={(e) => setMaxBaseBid(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              min="0"
              step="1"
            />
          </div>

          {/* Bid Status Filter */}
          <div>
            <select
              value={bidFilter}
              onChange={(e) => setBidFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
            >
              <option value="all">All Items</option>
              <option value="hasBids">Has Bids</option>
              <option value="noBids">No Bids</option>
            </select>
          </div>
        </div>

        {/* Sort and Clear Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Sort By */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="baseBid">Base Bid (High to Low)</option>
              <option value="currentBid">Current Bid (High to Low)</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm ||
            minBaseBid ||
            maxBaseBid ||
            bidFilter !== "all" ||
            sortBy !== "newest") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setMinBaseBid("");
                setMaxBaseBid("");
                setBidFilter("all");
                setSortBy("newest");
              }}
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Items Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Items ({filteredAndSortedItems.length}
            {items.length !== filteredAndSortedItems.length
              ? ` of ${items.length}`
              : ""}
            )
          </h2>
        </div>

        {itemsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-md p-4 animate-pulse"
              >
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              {items.length === 0
                ? "No items found for this auction lot."
                : "No items match your filters."}
            </p>
            {items.length === 0 ? (
              <p className="text-gray-400 text-sm mt-2">
                Click &quot;Add New Item&quot; to create your first item.
              </p>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setMinBaseBid("");
                  setMaxBaseBid("");
                  setBidFilter("all");
                  setSortBy("name");
                }}
                className="text-purple-600 hover:text-purple-700 text-sm mt-2 underline"
              >
                Clear filters to see all items
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredAndSortedItems.map((item) => {
              // Use a data URI placeholder instead of non-existent file
              const placeholderDataUri = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
              const imageUrl =
                item.productImages && item.productImages.length > 0
                  ? item.productImages[0].url
                  : placeholderDataUri;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden group">
                    <img
                      src={imageUrl}
                      alt={item.productImages?.[0]?.altText || item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Prevent infinite loop - if already trying placeholder, use data URI
                        if (!e.currentTarget.src.includes('data:image')) {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                          e.currentTarget.onerror = null; // Remove error handler to prevent loop
                        }
                      }}
                    />
                    {/* Edit/Delete Buttons Overlay */}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item.id);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white h-8 w-8 p-0"
                        title="Edit Item"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="h-8 w-8 p-0"
                        title="Delete Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {item.lotNumber && (
                      <div className="text-xs sm:text-sm font-medium text-purple-600 mb-1">
                        Lot #{(() => {
                          const cleaned = item.lotNumber?.replace(/^Lot\s+/i, '').trim();
                          return cleaned || item.lotNumber;
                        })()}
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-12">
                      {item.name}
                    </h3>

                    {/* Auction Dates */}
                    {auction && (auction.startDate || auction.endDate) && (
                      <div className="mb-3 space-y-1">
                        {auction.startDate && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                              <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8 12.5C5.52 12.5 3.5 10.48 3.5 8C3.5 5.52 5.52 3.5 8 3.5C10.48 3.5 12.5 5.52 12.5 8C12.5 10.48 10.48 12.5 8 12.5ZM8.5 4.5V8.5L11 10L10.25 10.75L7.5 9V4.5H8.5Z" fill="#6B7280"/>
                            </svg>
                            <span className="truncate">
                              Starts: {new Date(auction.startDate).toLocaleDateString('en-GB', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        )}
                        {auction.endDate && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                              <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8 12.5C5.52 12.5 3.5 10.48 3.5 8C3.5 5.52 5.52 3.5 8 3.5C10.48 3.5 12.5 5.52 12.5 8C12.5 10.48 10.48 12.5 8 12.5ZM8.5 4.5V8.5L11 10L10.25 10.75L7.5 9V4.5H8.5Z" fill="#6B7280"/>
                            </svg>
                            <span className="truncate">
                              Ends: {new Date(auction.endDate).toLocaleDateString('en-GB', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Price Info */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Base Bid:</span>
                        <span className="font-semibold text-gray-900">
                          £{item.baseBidPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Current Bid:</span>
                        <span className="font-semibold text-green-600">
                          £{(item.currentBid || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {item.buyersPremium && item.buyersPremium > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          Premium: {item.buyersPremium}%
                        </span>
                      )}
                      {item.taxPercentage && item.taxPercentage > 0 && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          Tax: {item.taxPercentage}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this auction item? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteItemId(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteItemMutation.isPending}
              className="w-full sm:w-auto"
            >
              {deleteItemMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
