'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { X } from 'lucide-react';


interface AuctionItem {
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
  buyersPremium?: number; // Percentage
  taxPercentage?: number;
  currentBid?: number;
  estimateMin?: number;
  estimateMax?: number;
  productImages: { url: string; altText: string }[];
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
  shipping: {
    address: string;
    cost: string;
    deliveryTime: string;
  };
  terms: string;
  baseBidPrice: string;
  buyersPremium: string; // Percentage
  taxPercentage: string;
  currentBid: string;
  estimateMin: string;
  estimateMax: string;
  productImages: { url: string; altText: string }[];
}

export default function AuctionItemForm({ onSubmit, initialData = {}, isEditing = false }: Props) {
  const [formData, setFormData] = useState<FormData>({
    name: initialData.name || '',
    description: initialData.description || '',
    auctionId: initialData.auctionId || '',
    shipping: {
      address: initialData.shipping?.address || '',
      cost: initialData.shipping?.cost?.toString() || '',
      deliveryTime: initialData.shipping?.deliveryTime || ''
    },
    terms: initialData.terms || '',
    baseBidPrice: initialData.baseBidPrice?.toString() || '',
    buyersPremium: initialData.buyersPremium?.toString() || '',
    taxPercentage: initialData.taxPercentage?.toString() || '',
    currentBid: initialData.currentBid?.toString() || '',
    estimateMin: initialData.estimateMin?.toString() || '',
    estimateMax: initialData.estimateMax?.toString() || '',
    productImages: initialData.productImages || []
  });
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        auctionId: initialData.auctionId || '',
        shipping: {
          address: initialData.shipping?.address || '',
          cost: initialData.shipping?.cost?.toString() || '',
          deliveryTime: initialData.shipping?.deliveryTime || ''
        },
        terms: initialData.terms || '',
        baseBidPrice: initialData.baseBidPrice?.toString() || '',
        buyersPremium: initialData.buyersPremium?.toString() || '',
        taxPercentage: initialData.taxPercentage?.toString() || '',
        currentBid: initialData.currentBid?.toString() || '',
        estimateMin: initialData.estimateMin?.toString() || '',
        estimateMax: initialData.estimateMax?.toString() || '',
        productImages: initialData.productImages || []
      });
    }
  }, [initialData, isEditing]);

  const { data: auctions = [], isLoading: auctionsLoading } = useQuery<Auction[]>({
    queryKey: ['auctions'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/auction`, { withCredentials: true });
      // API returns array directly, not wrapped in success/data object
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('shipping.')) {
      const shippingField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shipping: { ...prev.shipping, [shippingField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    
    // Create preview URLs for selected files
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImagePreview = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    // Remove from both arrays
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index)
    }));
  };

  const uploadImagesToCloudinary = async (files: File[]): Promise<{ url: string; altText: string }[]> => {
    setUploadingImages(true);
    const uploadedImages = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!); // Use environment variable
      try {
        const res = await axios.post(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!}/image/upload`, formData); // Use environment variable
        uploadedImages.push({
          url: res.data.secure_url,
          altText: file.name
        });
      } catch (err) {
        console.error('Error uploading image:', err);
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

      const payload: AuctionItem = {
        name: formData.name,
        description: formData.description,
        auctionId: formData.auctionId,
        shipping: formData.shipping.address || formData.shipping.cost || formData.shipping.deliveryTime ? {
          address: formData.shipping.address,
          cost: formData.shipping.cost ? parseFloat(formData.shipping.cost) : 0,
          deliveryTime: formData.shipping.deliveryTime,
        } : undefined,
        terms: formData.terms,
        baseBidPrice: parseFloat(formData.baseBidPrice),
        ...(formData.buyersPremium.trim() && { buyersPremium: parseFloat(formData.buyersPremium) }),
        ...(formData.taxPercentage.trim() && { taxPercentage: parseFloat(formData.taxPercentage) }),
        ...(formData.currentBid.trim() && { currentBid: parseFloat(formData.currentBid) }),
        ...(formData.estimateMin.trim() && { estimateMin: parseFloat(formData.estimateMin) }),
        ...(formData.estimateMax.trim() && { estimateMax: parseFloat(formData.estimateMax) }),
        productImages
      };
      await onSubmit(payload);
      if (!isEditing) {
        setFormData({
          name: '',
          description: '',
          auctionId: '',
          shipping: { address: '', cost: '', deliveryTime: '' },
          terms: '',
          baseBidPrice: '',
          buyersPremium: '',
          taxPercentage: '',
          currentBid: '',
          estimateMin: '',
          estimateMax: '',
          productImages: []
        });
        setImageFiles([]);
        setImagePreviews([]);
        // Clean up object URLs
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
      }
    } catch (error) {
      console.error('Error submitting auction item:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
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
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
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
        <label htmlFor="auctionId" className="block text-sm font-medium text-gray-700 mb-2">
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
          <option value="">{auctionsLoading ? 'Loading auctions...' : 'Select an auction'}</option>
          {auctions.map(auction => (
            <option key={auction.id} value={auction.id}>{auction.name}</option>
          ))}
        </select>
      </div>



      {/* Shipping fields removed from admin form as per requirements */}

      <div>
        <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-2">
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
          <label htmlFor="baseBidPrice" className="block text-sm font-medium text-gray-700 mb-2">
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
        <div>
          <label htmlFor="buyersPremium" className="block text-sm font-medium text-gray-700 mb-2">
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
          <p className="text-xs text-gray-500 mt-1">Enter percentage (e.g., 20 for 20%)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="taxPercentage" className="block text-sm font-medium text-gray-700 mb-2">
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
          <p className="text-xs text-gray-500 mt-1">Enter percentage (e.g., 20 for 20%)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="estimateMin" className="block text-sm font-medium text-gray-700 mb-2">
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
          <label htmlFor="estimateMax" className="block text-sm font-medium text-gray-700 mb-2">
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
        <label htmlFor="productImages" className="block text-sm font-medium text-gray-700 mb-2">
          Choose Auction Item Images
        </label>
        <input
          type="file"
          id="productImages"
          name="productImages"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading || uploadingImages}
        />
        {uploadingImages && <p className="text-sm text-blue-500 mt-2">Uploading images...</p>}
        
        {/* Preview of newly selected images */}
        {imagePreviews.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">New Images (Preview):</p>
            <div className="flex flex-wrap gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative inline-block">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeImagePreview(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    disabled={loading || uploadingImages}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing uploaded images */}
        {formData.productImages.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Existing Images:</p>
            <div className="flex flex-wrap gap-2">
              {formData.productImages.map((image, index) => (
                <div key={index} className="relative inline-block">
                  <Image 
                    src={image.url} 
                    alt={image.altText || `Image ${index + 1}`} 
                    width={96} 
                    height={96} 
                    className="object-cover rounded-lg border border-gray-300" 
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    disabled={loading || uploadingImages}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || uploadingImages}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? 'Saving...' : (isEditing ? 'Update Auction Item' : 'Create Auction Item')}
      </button>
    </form>
  );
}