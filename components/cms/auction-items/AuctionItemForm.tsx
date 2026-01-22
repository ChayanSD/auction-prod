"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";
import { X, Plus, Search, User, Trash2 } from "lucide-react";

interface Tag {
  name: string;
}

interface TagRelation {
  tag: Tag;
}

interface AuctionItem {
  name: string;
  description: string;
  auctionId: string;
  lotNumber?: string | null;
  shipping?: {
    address: string;
    cost: number;
    deliveryTime: string;
  };
  terms: string;
  baseBidPrice: number;
  reservePrice?: number; // Added reservePrice
  buyersPremium?: number; // Percentage
  taxPercentage?: number;
  currentBid?: number;
  estimateMin?: number;
  estimateMax?: number;
  productImages: { url: string; altText: string | null }[];
  tags?: Tag[] | string[] | TagRelation[];
  sellerId?: string | null;
}

interface Auction {
  id: string;
  name: string;
}

interface Props {
  onSubmit: (data: AuctionItem) => Promise<void>;
  initialData?: Partial<AuctionItem>;
  isEditing?: boolean;
}

interface FormData {
  name: string;
  description: string;
  auctionId: string;
  lotNumber: string;
  shipping: {
    address: string;
    cost: string;
    deliveryTime: string;
  };
  terms: string;
  baseBidPrice: string;
  reservePrice: string; // Added reservePrice
  buyersPremium: string; // Percentage
  taxPercentage: string;
  currentBid: string;
  estimateMin: string;
  estimateMax: string;
  productImages: { url: string; altText: string | null }[];
  tags: string[];
  sellerId: string;
}

export default function AuctionItemForm({
  onSubmit,
  initialData = {},
  isEditing = false,
}: Props) {
  const [formData, setFormData] = useState<FormData>({
    name: initialData.name || "",
    description: initialData.description || "",
    auctionId: initialData.auctionId || "",
    lotNumber: initialData.lotNumber || "",
    shipping: {
      address: initialData.shipping?.address || "",
      cost: initialData.shipping?.cost?.toString() || "",
      deliveryTime: initialData.shipping?.deliveryTime || "",
    },
    terms: initialData.terms || "",
    baseBidPrice: initialData.baseBidPrice?.toString() || "",
    reservePrice: initialData.reservePrice?.toString() || "", // Initialize reservePrice
    buyersPremium: initialData.buyersPremium?.toString() || "",
    taxPercentage: initialData.taxPercentage?.toString() || "",
    currentBid: initialData.currentBid?.toString() || "",
    estimateMin: initialData.estimateMin?.toString() || "",
    estimateMax: initialData.estimateMax?.toString() || "",
    productImages: initialData.productImages || [],
    tags: initialData.tags
      ? initialData.tags.map((tag: string | Tag | TagRelation) => {
          if (typeof tag === "string") return tag;
          if ("tag" in tag) return tag.tag.name;
          return tag.name;
        })
      : [],
    sellerId: initialData.sellerId || "",
  });
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<
    { id: string; name: string }[]
  >([]);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  // Seller Search State
  const [sellerSearchInput, setSellerSearchInput] = useState("");
  const [sellerSuggestions, setSellerSuggestions] = useState<
    {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      companyName: string | null;
      sellerStatus: string;
    }[]
  >([]);
  const [isSellerDropdownOpen, setIsSellerDropdownOpen] = useState(false);
  const [isLoadingSellers, setIsLoadingSellers] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const sellerInputRef = useRef<HTMLInputElement>(null);
  const sellerDropdownRef = useRef<HTMLDivElement>(null);

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        auctionId: initialData.auctionId || "",
        lotNumber: initialData.lotNumber || "",
        shipping: {
          address: initialData.shipping?.address || "",
          cost: initialData.shipping?.cost?.toString() || "",
          deliveryTime: initialData.shipping?.deliveryTime || "",
        },
        terms: initialData.terms || "",
        baseBidPrice: initialData.baseBidPrice?.toString() || "",
        reservePrice: initialData.reservePrice?.toString() || "", // Update on edit prop change
        buyersPremium: initialData.buyersPremium?.toString() || "",
        taxPercentage: initialData.taxPercentage?.toString() || "",
        currentBid: initialData.currentBid?.toString() || "",
        estimateMin: initialData.estimateMin?.toString() || "",
        estimateMax: initialData.estimateMax?.toString() || "",
        productImages: initialData.productImages || [],
        tags: initialData.tags
          ? initialData.tags.map((tag: string | Tag | TagRelation) => {
              if (typeof tag === "string") return tag;
              if ("tag" in tag) return tag.tag.name;
              return tag.name;
            })
          : [],
        sellerId: initialData.sellerId || "",
      });
      // If editing existing item, we might need to fetch the seller name if we only have ID
      // For now, if editing, we rely on the API response including seller info,
      // otherwise we might show just ID or empty state.
      if (initialData.sellerId) {
        // Optimistically set the ID, name fetch would ideally happen via a hook or if initialData includes seller object
        setSelectedSeller({
          id: initialData.sellerId,
          name: "Loading Seller...",
        }); // Placeholder
        // Fetch actual seller details if needed
        axios
          .get(`${API_BASE_URL}/cms/users/${initialData.sellerId}`)
          .then((res) => {
            const u = res.data;
            setSelectedSeller({
              id: u.id,
              name: u.companyName || `${u.firstName} ${u.lastName}`,
            });
          })
          .catch(() => {
            // Ignore error or set to 'Unknown'
            setSelectedSeller({
              id: initialData.sellerId!,
              name: "Unknown Seller",
            });
          });
      }
    }
  }, [initialData, isEditing]);

  const { data: auctions = [], isLoading: auctionsLoading } = useQuery<
    Auction[]
  >({
    queryKey: ["auctions"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/auction`, {
        withCredentials: true,
      });
      // API returns array directly, not wrapped in success/data object
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("shipping.")) {
      const shippingField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        shipping: { ...prev.shipping, [shippingField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Fetch tag suggestions from database (debounced)
  useEffect(() => {
    if (!tagInput.trim()) {
      setTagSuggestions([]);
      setIsTagDropdownOpen(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        setIsLoadingTags(true);
        const res = await axios.get(`${API_BASE_URL}/tag`, {
          params: { q: tagInput.trim(), limit: 10 },
          withCredentials: true,
        });
        const suggestions = Array.isArray(res.data) ? res.data : [];
        // Filter out tags that are already added
        const filteredSuggestions = suggestions.filter(
          (tag: { id: string; name: string }) =>
            !formData.tags.includes(tag.name),
        );
        setTagSuggestions(filteredSuggestions);
        setIsTagDropdownOpen(filteredSuggestions.length > 0);
      } catch (error) {
        console.error("Error fetching tag suggestions:", error);
        setTagSuggestions([]);
        setIsTagDropdownOpen(false);
      } finally {
        setIsLoadingTags(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [tagInput, formData.tags]);

  // Close tag dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(event.target as Node) &&
        tagInputRef.current &&
        !tagInputRef.current.contains(event.target as Node)
      ) {
        setIsTagDropdownOpen(false);
      }
    };

    if (isTagDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTagDropdownOpen]);

  const handleAddTag = (tagName?: string) => {
    const tagToAdd = (tagName || tagInput.trim()).trim();
    if (tagToAdd && !formData.tags.includes(tagToAdd)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagToAdd] }));
      setTagInput("");
      setIsTagDropdownOpen(false);
      setTagSuggestions([]);
    }
  };

  const handleSelectTagSuggestion = (tagName: string) => {
    handleAddTag(tagName);
  };

  // --- Seller Search Logic ---
  useEffect(() => {
    if (!sellerSearchInput.trim()) {
      setSellerSuggestions([]);
      setIsSellerDropdownOpen(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        setIsLoadingSellers(true);
        const res = await axios.get(`${API_BASE_URL}/cms/users/search`, {
          params: { q: sellerSearchInput.trim() },
          withCredentials: true,
        });
        const suggestions = Array.isArray(res.data) ? res.data : [];
        setSellerSuggestions(suggestions);
        setIsSellerDropdownOpen(suggestions.length > 0);
      } catch (error) {
        console.error("Error fetching seller suggestions:", error);
        setSellerSuggestions([]);
        setIsSellerDropdownOpen(false);
      } finally {
        setIsLoadingSellers(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [sellerSearchInput]);

  const handleSelectSeller = (seller: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyName: string | null;
    sellerStatus: string;
  }) => {
    const displayName =
      seller.companyName || `${seller.firstName} ${seller.lastName}`;
    setSelectedSeller({ id: seller.id, name: displayName });
    setFormData((prev) => ({ ...prev, sellerId: seller.id }));
    setSellerSearchInput("");
    setIsSellerDropdownOpen(false);
  };

  const clearSelectedSeller = () => {
    setSelectedSeller(null);
    setFormData((prev) => ({ ...prev, sellerId: "" }));
  };

  // Close seller dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sellerDropdownRef.current &&
        !sellerDropdownRef.current.contains(event.target as Node) &&
        sellerInputRef.current &&
        !sellerInputRef.current.contains(event.target as Node)
      ) {
        setIsSellerDropdownOpen(false);
      }
    };
    if (isSellerDropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSellerDropdownOpen]);

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Add the new file to the existing files array
    setImageFiles((prev) => [...prev, file]);

    // Create preview URL for the new file
    const previewUrl = URL.createObjectURL(file);
    setImagePreviews((prev) => [...prev, previewUrl]);

    // Reset the input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const removeImagePreview = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);

    // Remove from both arrays
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index),
    }));
  };

  const uploadImagesToCloudinary = async (
    files: File[],
  ): Promise<{ url: string; altText: string }[]> => {
    setUploadingImages(true);
    const uploadedImages = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      ); // Use environment variable
      try {
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${process.env
            .NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!}/image/upload`,
          formData,
        ); // Use environment variable
        uploadedImages.push({
          url: res.data.secure_url,
          altText: file.name,
        });
      } catch (err) {
        console.error("Error uploading image:", err);
      }
    }
    setUploadingImages(false);
    return uploadedImages;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.auctionId) return;

    setLoading(true);
    try {
      let productImages = formData.productImages;
      if (imageFiles.length > 0) {
        const uploadedImages = await uploadImagesToCloudinary(imageFiles);
        productImages = [...productImages, ...uploadedImages];
      }

      const reservePriceStr = formData.reservePrice?.toString().trim();
      const reservePricePayload =
        reservePriceStr && reservePriceStr !== ""
          ? { reservePrice: parseFloat(reservePriceStr) }
          : {};

      const payload: AuctionItem = {
        name: formData.name,
        description: formData.description,
        auctionId: formData.auctionId,
        ...(formData.lotNumber.trim() && {
          lotNumber: formData.lotNumber.trim(),
        }),
        shipping:
          formData.shipping.address ||
          formData.shipping.cost ||
          formData.shipping.deliveryTime
            ? {
                address: formData.shipping.address,
                cost: formData.shipping.cost
                  ? parseFloat(formData.shipping.cost)
                  : 0,
                deliveryTime: formData.shipping.deliveryTime,
              }
            : undefined,
        terms: formData.terms,
        baseBidPrice: parseFloat(formData.baseBidPrice),
        ...reservePricePayload,
        ...(formData.buyersPremium.trim() && {
          buyersPremium: parseFloat(formData.buyersPremium),
        }),
        ...(formData.taxPercentage.trim() && {
          taxPercentage: parseFloat(formData.taxPercentage),
        }),
        ...(formData.currentBid.trim() && {
          currentBid: parseFloat(formData.currentBid),
        }),
        ...(formData.estimateMin.trim() && {
          estimateMin: parseFloat(formData.estimateMin),
        }),
        ...(formData.estimateMax.trim() && {
          estimateMax: parseFloat(formData.estimateMax),
        }),
        productImages,
        tags: formData.tags
          .map((name) => ({ name: name.trim() }))
          .filter((tag) => tag.name),
        sellerId: formData.sellerId || null,
      } as any;

      await onSubmit(payload);
      if (!isEditing) {
        setFormData({
          name: "",
          description: "",
          auctionId: "",
          lotNumber: "",
          shipping: { address: "", cost: "", deliveryTime: "" },
          terms: "",
          baseBidPrice: "",
          reservePrice: "", // Reset
          buyersPremium: "",
          taxPercentage: "",
          currentBid: "",
          estimateMin: "",
          estimateMax: "",
          productImages: [],
          tags: [],
          sellerId: "",
        });
        setSelectedSeller(null);
        setSellerSearchInput("");
        setTagInput("");
        setTagSuggestions([]);
        setIsTagDropdownOpen(false);
        setImageFiles([]);
        setImagePreviews([]);
        // Clean up object URLs
        imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      }
    } catch (error) {
      console.error("Error submitting auction item:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Auction Item Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter item name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Auction Item Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter description"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          required
        />
      </div>

      <div>
        <label
          htmlFor="auctionId"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Choose Auction Lot <span className="text-red-500">*</span>
        </label>
        <select
          id="auctionId"
          name="auctionId"
          value={formData.auctionId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={auctionsLoading}
        >
          <option value="">
            {auctionsLoading ? "Loading auctions..." : "Select an auction"}
          </option>
          {auctions.map((auction) => (
            <option key={auction.id} value={auction.id}>
              {auction.name}
            </option>
          ))}
        </select>
      </div>

      {/* --- Seller / Consignment Section --- */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <User className="w-4 h-4" />
          Ownership & Consignment
        </h3>

        <div className="relative">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Consignor (Leave empty for House Item)
          </label>

          {!selectedSeller ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                ref={sellerInputRef}
                type="text"
                value={sellerSearchInput}
                onChange={(e) => setSellerSearchInput(e.target.value)}
                placeholder="Search seller by name or email..."
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onFocus={() => {
                  if (sellerSuggestions.length > 0)
                    setIsSellerDropdownOpen(true);
                }}
              />

              {/* Seller Dropdown */}
              {isSellerDropdownOpen && (
                <div
                  ref={sellerDropdownRef}
                  className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto"
                >
                  {isLoadingSellers ? (
                    <div className="p-3 text-center text-xs text-gray-500">
                      Searching...
                    </div>
                  ) : sellerSuggestions.length > 0 ? (
                    sellerSuggestions.map((seller) => (
                      <button
                        key={seller.id}
                        type="button"
                        onClick={() => handleSelectSeller(seller)}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 border-b border-gray-100 last:border-0 flex items-center justify-between"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">
                            {seller.companyName ||
                              `${seller.firstName} ${seller.lastName}`}
                          </span>
                          <span className="text-xs text-gray-500">
                            {seller.email}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            seller.sellerStatus === "Approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {seller.sellerStatus}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No registered sellers found matching &quot;
                      {sellerSearchInput}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg shadow-sm transition-all animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                  {selectedSeller.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 leading-tight">
                    {selectedSeller.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                      Consigned Item
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium italic">
                      All proceeds (minus commission) go to this seller.
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelectedSeller}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Remove Consignor"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            If no seller is selected, this item acts as <b>House Inventory</b>{" "}
            (100% profit). If a seller is linked, settlement reports will
            include this item.
          </p>
        </div>
      </div>
      {/* --- End Consignment Section --- */}

      <div>
        <label
          htmlFor="lotNumber"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Lot Number
        </label>
        <input
          type="text"
          id="lotNumber"
          name="lotNumber"
          value={formData.lotNumber}
          onChange={handleChange}
          placeholder="Leave empty to auto-generate (e.g., 1, 2, 3...)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Optional: Leave blank to auto-assign next available number, or enter a
          custom lot number
        </p>
      </div>

      {/* Shipping fields removed from admin form as per requirements */}

      <div>
        <label
          htmlFor="terms"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Terms
        </label>
        <textarea
          id="terms"
          name="terms"
          value={formData.terms}
          onChange={handleChange}
          placeholder="Enter terms and conditions"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="baseBidPrice"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Base Bid Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            id="baseBidPrice"
            name="baseBidPrice"
            value={formData.baseBidPrice}
            onChange={handleChange}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Reserve Price Field */}
        <div>
          <label
            htmlFor="reservePrice"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Reserve Price (Hidden)
          </label>
          <input
            type="number"
            step="0.01"
            id="reservePrice"
            name="reservePrice"
            value={formData.reservePrice}
            onChange={handleChange}
            placeholder="Optional reserve"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            If set, bids must meet this to sell.
          </p>
        </div>
        <div>
          <label
            htmlFor="buyersPremium"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Buyer&apos;s Premium (%)
          </label>
          <input
            type="number"
            step="0.01"
            id="buyersPremium"
            name="buyersPremium"
            value={formData.buyersPremium}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter percentage (e.g., 20 for 20%)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="taxPercentage"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Tax Percentage (%)
          </label>
          <input
            type="number"
            step="0.01"
            id="taxPercentage"
            name="taxPercentage"
            value={formData.taxPercentage}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter percentage (e.g., 20 for 20%)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="estimateMin"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Auctioneer&apos;s Estimate (Min)
          </label>
          <input
            type="number"
            step="0.01"
            id="estimateMin"
            name="estimateMin"
            value={formData.estimateMin}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="estimateMax"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Auctioneer&apos;s Estimate (Max)
          </label>
          <input
            type="number"
            step="0.01"
            id="estimateMax"
            name="estimateMax"
            value={formData.estimateMax}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Auction Item Images
        </label>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          id="productImages"
          name="productImages"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
          disabled={loading || uploadingImages}
        />

        {uploadingImages && (
          <p className="text-sm text-blue-500 mb-2">Uploading images...</p>
        )}

        {/* Combined images display: existing + new previews */}
        {(formData.productImages.length > 0 || imagePreviews.length > 0) && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-3">
              {/* Existing uploaded images */}
              {formData.productImages.map((image, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <div className="w-24 h-24 rounded-lg border-2 border-gray-300 overflow-hidden bg-gray-50">
                    <Image
                      src={image.url}
                      alt={image.altText || `Image ${index + 1}`}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || uploadingImages}
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* New image previews */}
              {imagePreviews.map((preview, index) => (
                <div key={`preview-${index}`} className="relative group">
                  <div className="w-24 h-24 rounded-lg border-2 border-blue-300 overflow-hidden bg-gray-50">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImagePreview(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || uploadingImages}
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add more button */}
              <button
                type="button"
                onClick={handleAddImageClick}
                disabled={loading || uploadingImages}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed group"
                title="Add another image"
              >
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors font-medium">
                  Add
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Initial add button when no images exist */}
        {formData.productImages.length === 0 && imagePreviews.length === 0 && (
          <button
            type="button"
            onClick={handleAddImageClick}
            disabled={loading || uploadingImages}
            className="w-full py-12 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
            <span className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors font-medium">
              Click to add an image
            </span>
            <span className="text-xs text-gray-400">
              You can add multiple images one by one
            </span>
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags (for search and SEO)
        </label>
        <div className="relative flex space-x-2 mb-2">
          <div className="flex-1 relative">
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTagInput(e.target.value)
              }
              onFocus={() => {
                if (tagSuggestions.length > 0) {
                  setIsTagDropdownOpen(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                } else if (e.key === "Escape") {
                  setIsTagDropdownOpen(false);
                }
              }}
              placeholder="Type to search existing tags or add new..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Tag Suggestions Dropdown */}
            {isTagDropdownOpen && (
              <div
                ref={tagDropdownRef}
                className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto"
              >
                {isLoadingTags ? (
                  <div className="p-3 text-center text-gray-500">
                    <div className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-2 text-sm">Loading tags...</p>
                  </div>
                ) : tagSuggestions.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {tagSuggestions.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleSelectTagSuggestion(tag.name)}
                        className="w-full p-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="text-sm text-gray-900">
                          {tag.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-gray-500">
                    <p className="text-sm">No matching tags found</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleAddTag()}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-200 px-2 py-1 rounded-md flex items-center"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Type to search existing tags from database or add new tags. Tags help
          with search engine optimization and make items easier to find.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || uploadingImages}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : isEditing
            ? "Update Auction Item"
            : "Create Auction Item"}
      </button>
    </form>
  );
}
