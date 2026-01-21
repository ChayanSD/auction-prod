"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { Upload, X } from "lucide-react";
import { uploadToCloudinary, validateImageFile } from "@/lib/cloudinary";
import toast from "react-hot-toast";
import Image from "next/image";

interface AuctionRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

export default function AuctionRequestForm({
  onSuccess,
  onCancel,
  compact = false,
}: AuctionRequestFormProps) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    itemName: "",
    itemDescription: "",
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach((file) => {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(`Invalid files: ${invalidFiles.join(", ")}`);
    }

    if (validFiles.length > 0) {
      setImageFiles((prev) => [...prev, ...validFiles]);

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImagesToCloudinary = async (files: File[]) => {
    const uploadedImages: { url: string; altText: string }[] = [];

    for (const file of files) {
      try {
        const uploadResult = await uploadToCloudinary(file, {
          folder: "auction-requests",
          public_id: `auction_request_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        });
        uploadedImages.push({
          url: uploadResult.secure_url,
          altText: file.name,
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    return uploadedImages;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !formData.itemName.trim() ||
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.itemDescription.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    setLoading(true);
    try {
      let productImages: { url: string; altText: string }[] = [];

      if (imageFiles.length > 0) {
        setUploading(true);
        productImages = await uploadImagesToCloudinary(imageFiles);
        setUploading(false);
      }

      const payload = {
        itemName: formData.itemName.trim(),
        itemDescription: formData.itemDescription.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        productImages: productImages.length > 0 ? productImages : undefined,
      };

      await axios.post(`${API_BASE_URL}/auction-request`, payload, {
        withCredentials: true,
      });

      toast.success("Auction request submitted successfully!");

      if (onSuccess) {
        onSuccess();
      } else {
        // Reset form
        setFormData({
          itemName: "",
          itemDescription: "",
          name: user ? `${user.firstName} ${user.lastName}`.trim() : "",
          email: user?.email || "",
          phone: user?.phone || "",
        });
        setImageFiles([]);
        setImagePreviews([]);
      }
    } catch (error: unknown) {
      console.error("Error submitting auction request:", error);
      toast.error("Failed to submit auction request");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const isSubmitting = loading || uploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={compact ? "grid grid-cols-1 gap-4" : "space-y-6"}>
        <div>
          <label
            htmlFor="itemName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="itemName"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            placeholder="Enter item name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="itemDescription"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="itemDescription"
            name="itemDescription"
            value={formData.itemDescription}
            onChange={handleChange}
            placeholder="Describe your auction item in detail"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={compact ? 3 : 5}
            required
            minLength={10}
          />
        </div>

        {!user && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images
          </label>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-300">
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
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col items-center justify-center w-full">
            <label
              htmlFor="image-upload-form"
              className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-6 h-6 mb-2 text-gray-500" />
                <p className="text-xs text-gray-500">
                  PNG, JPG, JPEG (MAX. 5MB)
                </p>
              </div>
              <input
                id="image-upload-form"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting}
                multiple
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] text-white py-3 px-6 rounded-full font-semibold hover:shadow-lg disabled:opacity-50 transition-all shadow-md active:scale-95"
        >
          {uploading
            ? "Uploading..."
            : loading
              ? "Submitting..."
              : "Submit Request"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
