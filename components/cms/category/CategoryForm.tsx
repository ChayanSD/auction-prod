"use client";

import React, { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { uploadToCloudinary, validateImageFile } from "@/lib/cloudinary";

interface CategoryFormProps {
  onSubmit: (data: { name: string; imageUrl?: string }) => Promise<void>;
  initialData?: { name?: string; imageUrl?: string };
  isEditing?: boolean;
}

export default function CategoryForm({
  onSubmit,
  initialData = {},
  isEditing = false,
}: CategoryFormProps) {
  const [name, setName] = useState(initialData.name || "");
  const [imageUrl, setImageUrl] = useState(initialData.imageUrl || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData.imageUrl || "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      let finalImageUrl = imageUrl;
      
      // Upload new image if selected
      if (imageFile) {
        setUploading(true);
        const uploadResult = await uploadToCloudinary(imageFile, {
          folder: 'categories',
          public_id: `category_${Date.now()}`
        });
        finalImageUrl = uploadResult.secure_url;
        setUploading(false);
      }
      
      await onSubmit({ 
        name: name.trim(), 
        imageUrl: finalImageUrl || undefined 
      });
      
      if (!isEditing) {
        setName("");
        setImageUrl("");
        setImageFile(null);
        setImagePreview("");
      }
    } catch (error) {
      console.error("Error submitting category:", error);
      setUploading(false);
    } finally {
      setLoading(false);
    }
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
    setImageUrl("");
  };

  const isSubmitting = loading || uploading;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg space-y-6">
      <div className="mb-4">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Category Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          placeholder="Enter category name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category Image
        </label>
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-4 relative inline-block">
            <img
              src={imagePreview}
              alt="Category preview"
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
          ? "Update Category"
          : "Create Category"}
      </button>
    </form>
  );
}
