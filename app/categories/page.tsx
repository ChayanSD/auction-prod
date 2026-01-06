'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { apiClient } from '@/lib/fetcher';
import { ChevronRight, Home } from 'lucide-react';
import PremiumLoader from '@/components/shared/PremiumLoader';

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

/**
 * Categories Page
 * Displays all auction categories in a grid layout
 * Clicking a category navigates to auction list page with that category selected
 * Fully responsive for mobile, tablet, and desktop
 */
export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<Category[] | { success: boolean; data: Category[] }>('/category');
        
        if (Array.isArray(response)) {
          setCategories(response);
        } else if (response && typeof response === 'object' && 'success' in response) {
          if (response.success && 'data' in response) {
            setCategories(response.data);
          } else {
            setError('Failed to fetch categories');
          }
        } else {
          setError('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/category/${categoryId}/auctions`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="h-16 lg:h-20"></div>
        <PremiumLoader text="Loading categories..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <div className="h-16 lg:h-20"></div>
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 lg:pb-12 max-w-7xl">
        {/* Breadcrumbs */}
        {/* <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6 sm:mb-8 flex-wrap" aria-label="Breadcrumb">
          <Link 
            href="/" 
            className="flex items-center gap-1 hover:text-purple-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <Link 
            href="/auction" 
            className="hover:text-purple-600 transition-colors"
          >
            Auctions
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-gray-900 font-medium">Categories</span>
        </nav> */}

        {/* Page Header */}
        <div className="mb-6 sm:mb-8 lg:mb-12 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            All Categories
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            Browse all auction categories and find items that interest you.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Categories Grid */}
        {categories.length === 0 && !loading ? (
          <div className="text-center py-12 sm:py-16 lg:py-20">
            <p className="text-gray-500 text-base sm:text-lg">No categories found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {categories.map((category) => {
              const imageUrl = category.imageUrl || '/placeholder.jpg';
              return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-3 sm:p-4 lg:p-5 cursor-pointer transform hover:-translate-y-1 flex flex-col min-h-[230px] sm:min-h-[260px]"
                >
                  {/* Image */}
                  <div className="aspect-[4/5] rounded-xl bg-gray-100 overflow-hidden mb-3 sm:mb-4 relative">
                    <img
                      src={imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      draggable={false}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.jpg';
                      }}
                    />
                  </div>

                  {/* Category Name */}
                  <h3 className="font-semibold text-gray-700 text-xs sm:text-sm lg:text-base xl:text-lg mb-3 sm:mb-4 line-clamp-2 leading-tight min-h-[2rem] sm:min-h-[2.5rem] group-hover:text-purple-600 transition-colors text-center">
                    {category.name}
                  </h3>

                  {/* View Auctions Button */}
                  <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleCategoryClick(category.id)}
                      className="w-full py-2 px-2 sm:px-3 lg:px-4 rounded-full text-xs sm:text-sm lg:text-sm xl:text-base font-semibold transition-all duration-200 bg-gradient-to-br from-[#e253ff] to-[#9f14fc] text-white hover:shadow-md active:scale-95 whitespace-nowrap"
                    >
                      View Auctions
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

