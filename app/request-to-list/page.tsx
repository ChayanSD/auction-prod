'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api';
import { Upload, X } from 'lucide-react';
import { uploadToCloudinary, validateImageFile } from '@/lib/cloudinary';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';

interface Auction {
  id: string;
  name: string;
  description?: string;
  location?: string;
}

export default function RequestToListPage() {
  const router = useRouter();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    auctionId: '',
    baseBidPrice: '',
    additionalFee: '',
    estimatedPrice: '',
    shipping: {
      address: '',
      cost: '',
      deliveryTime: '',
    },
    terms: '',
  });
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [auctionsLoading, setAuctionsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchAuctions();
  }, [user, router]);

  const fetchAuctions = async () => {
    try {
      setAuctionsLoading(true);
      const res = await axios.get(`${API_BASE_URL}/auction`, { withCredentials: true });
      if (Array.isArray(res.data)) {
        setAuctions(res.data as Auction[]);
      } else if (res.data.success && res.data.data) {
        setAuctions(res.data.data as Auction[]);
      } else {
        setAuctions([]);
      }
    } catch (err) {
      console.error('Error fetching auctions:', (err as Error).message);
      toast.error('Failed to load auctions');
      setAuctions([]);
    } finally {
      setAuctionsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('shipping.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shipping: { ...prev.shipping, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach(file => {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(`Invalid files: ${invalidFiles.join(', ')}`);
    }

    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);
      
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImagesToCloudinary = async (files: File[]) => {
    const uploadedImages: { url: string; altText: string }[] = [];
    
    for (const file of files) {
      try {
        const uploadResult = await uploadToCloudinary(file, {
          folder: 'auction-requests',
          public_id: `auction_request_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        });
        uploadedImages.push({
          url: uploadResult.secure_url,
          altText: file.name,
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    return uploadedImages;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.auctionId || !formData.baseBidPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let productImages: { url: string; altText: string }[] = [];

      // Upload images if selected
      if (imageFiles.length > 0) {
        setUploading(true);
        productImages = await uploadImagesToCloudinary(imageFiles);
        setUploading(false);
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        auctionId: formData.auctionId,
        baseBidPrice: parseFloat(formData.baseBidPrice),
        additionalFee: formData.additionalFee ? parseFloat(formData.additionalFee) : undefined,
        estimatedPrice: formData.estimatedPrice ? parseFloat(formData.estimatedPrice) : undefined,
        shipping: formData.shipping.address || formData.shipping.cost ? {
          address: formData.shipping.address,
          cost: parseFloat(formData.shipping.cost) || 0,
          deliveryTime: formData.shipping.deliveryTime || undefined,
        } : undefined,
        terms: formData.terms || undefined,
        productImages: productImages.length > 0 ? productImages : undefined,
      };

      await axios.post(`${API_BASE_URL}/auction-request`, payload, { withCredentials: true });

      toast.success('Auction request submitted successfully! An admin will review it shortly.');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        auctionId: '',
        baseBidPrice: '',
        additionalFee: '',
        estimatedPrice: '',
        shipping: {
          address: '',
          cost: '',
          deliveryTime: '',
        },
        terms: '',
      });
      setAuctions([]);
      setImageFiles([]);
      setImagePreviews([]);
    } catch (error: unknown) {
      console.error('Error submitting auction request:', error);
      let errorMessage = 'Failed to submit auction request';
      if (error instanceof Error) {
        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.error ||
                        error.response?.data?.details?.[0]?.message ||
                        error.message;
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  const isSubmitting = loading || uploading;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Request to List Your Auction Item</h1>
          <p className="text-gray-600 mb-8">
            Fill out the form below to submit your auction item for review. Our admin team will review your request and get back to you soon.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter item name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your auction item in detail (minimum 10 characters)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                required
                minLength={10}
              />
            </div>

            <div>
              <label htmlFor="auctionId" className="block text-sm font-medium text-gray-700 mb-2">
                Select Auction <span className="text-red-500">*</span>
              </label>
              <select
                id="auctionId"
                name="auctionId"
                value={formData.auctionId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={auctionsLoading}
              >
                <option value="">
                  {auctionsLoading
                    ? 'Loading auctions...'
                    : auctions.length === 0
                    ? 'No auctions available yet'
                    : 'Select an auction'}
                </option>
                {auctions.map((auction) => (
                  <option key={auction.id} value={auction.id}>
                    {auction.name} {auction.location && `- ${auction.location}`}
                  </option>
                ))}
              </select>
              {!auctionsLoading && auctions.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No auctions are currently available. Please try again later.
                </p>
              )}
            </div>

            {/* Dates are now configured on the Auction itself, not per requested item,
                so we no longer ask the user for start/end date here. */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="baseBidPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Base Bid Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="baseBidPrice"
                  name="baseBidPrice"
                  value={formData.baseBidPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="additionalFee" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Fee
                </label>
                <input
                  type="number"
                  id="additionalFee"
                  name="additionalFee"
                  value={formData.additionalFee}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="estimatedPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Price
                </label>
                <input
                  type="number"
                  id="estimatedPrice"
                  name="estimatedPrice"
                  value={formData.estimatedPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border-t pt-4">
          {/* Shipping address removed from public request form as per requirements */}
            </div>

            <div>
              <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                id="terms"
                name="terms"
                value={formData.terms}
                onChange={handleChange}
                placeholder="Enter terms and conditions"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images
              </label>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col items-center justify-center w-full">
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG or WebP (MAX. 5MB each)</p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpg,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                    multiple
                  />
                </label>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] text-white py-3 px-6 rounded-full hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#9F13FB] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold hover:scale-105 active:scale-95"
              >
                {uploading
                  ? 'Uploading images...'
                  : loading
                  ? 'Submitting...'
                  : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="px-6 py-3 border border-gray-300 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
