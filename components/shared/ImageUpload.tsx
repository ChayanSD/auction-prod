"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { X, Upload, ImageIcon } from "lucide-react";
import { uploadToCloudinary, validateImageFile } from "@/lib/cloudinary";
import toast from "react-hot-toast";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  label,
  folder = "newsletter",
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    try {
      setUploading(true);
      const result = await uploadToCloudinary(file, { folder });
      onChange(result.secure_url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={value}
              alt="Upload Preview"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
              disabled={disabled || uploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-40 h-40 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-purple-400 transition-all group"
          >
            <div className="p-3 rounded-full bg-white shadow-sm ring-1 ring-gray-200 group-hover:ring-purple-200">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent animate-spin rounded-full" />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-purple-500" />
              )}
            </div>
            <span className="text-xs font-medium text-gray-500 group-hover:text-purple-600">
              {uploading ? "Uploading..." : "Click to upload"}
            </span>
          </button>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={disabled || uploading}
        />
        
        {value && !uploading && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-purple-600 font-medium hover:text-purple-700 underline underline-offset-4"
            disabled={disabled}
          >
            Change Image
          </button>
        )}
      </div>
    </div>
  );
}
