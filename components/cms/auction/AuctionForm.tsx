'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api';
import { Upload, X, Plus } from "lucide-react";
import { uploadToCloudinary, validateImageFile } from "@/lib/cloudinary";
import { AuctionCreateSchema } from '@/validation/validator';
import { z } from 'zod';
import AuctionItemForm from '@/components/cms/auction-items/AuctionItemForm';

interface Tag {
  name: string;
}

interface TagRelation {
  tag: Tag;
}

interface AuctionInitialData {
  name?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  imageUrl?: string;
  tags?: Tag[] | string[] | TagRelation[];
}

interface AuctionFormData {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  imageUrl?: string;
  tags: string[];
}

interface AuctionFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
    status: string;
    imageUrl?: string;
    tags: { name: string }[];
  }) => Promise<void>;
  initialData?: AuctionInitialData;
  isEditing?: boolean;
  auctionId?: string; // For adding items to existing auction
}

// Helper function to convert ISO date string to datetime-local format (YYYY-MM-DDTHH:mm)
const formatDateForInput = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    // Format as YYYY-MM-DDTHH:mm (datetime-local format)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};

export default function AuctionForm({ onSubmit, initialData = {}, isEditing = false, auctionId }: AuctionFormProps) {
  const [formData, setFormData] = useState<AuctionFormData>({
    name: initialData.name || '',
    description: initialData.description || '',
    location: initialData.location || '',
    startDate: formatDateForInput(initialData.startDate),
    endDate: formatDateForInput(initialData.endDate),
    status: initialData.status || 'Upcoming',
    imageUrl: initialData.imageUrl || '',
    tags: initialData.tags ? initialData.tags.map((tag: string | Tag | TagRelation) => {
      if (typeof tag === 'string') return tag;
      if ('tag' in tag) return tag.tag.name; // Handle TagRelation structure from API
      return tag.name; // Handle Tag structure
    }) : []
  });
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData.imageUrl || "");
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  
  // Get auctionId from prop, initialData, or keep it for editing
  const currentAuctionId = auctionId || (initialData as any)?.id;

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        location: initialData.location || '',
        startDate: formatDateForInput(initialData.startDate),
        endDate: formatDateForInput(initialData.endDate),
        status: initialData.status || 'Upcoming',
        imageUrl: initialData.imageUrl || '',
        tags: initialData.tags ? initialData.tags.map((tag: string | Tag | TagRelation) => {
          if (typeof tag === 'string') return tag;
          if ('tag' in tag) return tag.tag.name;
          return tag.name;
        }) : []
      });
      setImagePreview(initialData.imageUrl || '');
    }
  }, [initialData, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData(prev => ({ ...prev, imageUrl: "" }));
  };

  const isSubmitting = loading || uploading;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setErrors({ name: "Auction lot name is required" });
        return;
      }
      if (!formData.description.trim()) {
        setErrors({ description: "Description is required" });
        return;
      }
      if (!formData.location.trim()) {
        setErrors({ location: "Location is required" });
        return;
      }
      if (!formData.startDate) {
        setErrors({ startDate: "Start date is required" });
        return;
      }
      if (!formData.endDate) {
        setErrors({ endDate: "End date is required" });
        return;
      }

      // Validate dates are valid
      const startDateObj = new Date(formData.startDate);
      const endDateObj = new Date(formData.endDate);
      if (isNaN(startDateObj.getTime())) {
        setErrors({ startDate: "Invalid start date" });
        return;
      }
      if (isNaN(endDateObj.getTime())) {
        setErrors({ endDate: "Invalid end date" });
        return;
      }
      if (endDateObj <= startDateObj) {
        setErrors({ endDate: "End date must be after start date" });
        return;
      }

      const validationData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        startDate: startDateObj,
        endDate: endDateObj,
        status: formData.status,
        imageUrl: formData.imageUrl || undefined,
        tags: formData.tags.map(name => ({ name: name.trim() })).filter(tag => tag.name)
      };

      AuctionCreateSchema.parse(validationData);

      setLoading(true);
      let finalImageUrl = formData.imageUrl;

      // Upload new image if selected
      if (imageFile) {
        setUploading(true);
        const uploadResult = await uploadToCloudinary(imageFile, {
          folder: 'auctions',
          public_id: `auction_${Date.now()}`
        });
        finalImageUrl = uploadResult.secure_url;
        setUploading(false);
      }

      // Convert dates to ISO strings for API
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
        status: formData.status,
        imageUrl: finalImageUrl || undefined,
        tags: formData.tags.map(name => ({ name: name.trim() })).filter(tag => tag.name)
      };
      await onSubmit(payload);
      if (!isEditing) {
        // Reset form after creation
        setFormData({
          name: '',
          description: '',
          location: '',
          startDate: '',
          endDate: '',
          status: 'Upcoming',
          imageUrl: '',
          tags: []
        });
        setImageFile(null);
        setImagePreview("");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error('Error submitting auction:', error);
        setUploading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg space-y-4">
     
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Auction Lot Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter auction lot name"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Auction Lot Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter description"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          rows={3}
          required
        />
        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          Location <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Enter location"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.location ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.startDate ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.endDate ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.status ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        >
          <option value="Upcoming">Upcoming</option>
          <option value="Live">Live</option>
          <option value="Closed">Closed</option>
        </select>
        {errors.status && <p className="mt-1 text-sm text-red-500">{errors.status}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Auction Lot Image
        </label>

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-4 relative inline-block">
            <img
              src={imagePreview}
              alt="Auction preview"
              className="w-32 h-32 object-cover rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              disabled={isSubmitting}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Button */}
        {!imagePreview && (
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
                <p className="text-xs text-gray-500">PNG, JPG, JPEG or WebP (MAX. 5MB)</p>
              </div>
              <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/png,image/jpg,image/jpeg,image/webp"
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
            </label>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Auction Lot Tags
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <span key={index} className="bg-gray-200 px-2 py-1 rounded-md flex items-center">
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
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {uploading
          ? "Uploading image..."
          : loading
          ? "Saving..."
          : isEditing
          ? "Update Auction Lot"
          : "Create Auction Lot"}
      </button>

      {/* Add Item Button - Show when editing (when we have an auctionId) */}
      {isEditing && currentAuctionId && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowAddItemForm(!showAddItemForm)}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Plus className="w-5 h-5" />
            {showAddItemForm ? 'Hide Add Item Form' : 'Add Item to This Auction'}
          </button>

          {showAddItemForm && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Add New Item to Auction</h3>
              <AuctionItemForm
                onSubmit={async (itemData) => {
                  try {
                    const response = await axios.post(
                      `${API_BASE_URL}/auction-item`,
                      {
                        ...itemData,
                        auctionId: currentAuctionId,
                      },
                      { withCredentials: true }
                    );
                    if (response.data) {
                      setShowAddItemForm(false);
                      // Reset the form by toggling it
                      setTimeout(() => setShowAddItemForm(true), 100);
                    }
                  } catch (error) {
                    console.error('Error creating auction item:', error);
                    throw error;
                  }
                }}
                initialData={{
                  auctionId: currentAuctionId,
                }}
                isEditing={false}
              />
            </div>
          )}
        </div>
      )}
    </form>
  );
}