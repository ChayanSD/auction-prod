'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuctionCard from '@/components/AuctionPage/AuctionCard';
import Pagination from '@/components/AuctionPage/Pagination';
import { apiClient } from '@/lib/fetcher';
import { ChevronRight, Home, Filter, X } from 'lucide-react';
import PremiumLoader from '@/components/shared/PremiumLoader';
import type { Auction } from '@/types/auction.types';

interface Category {
  id: string;
  name: string;
  imageUrl?: string | null;
}

/**
 * Auctions Page for a Specific Category
 * Displays all auctions under a category
 * Responsive design matching project patterns
 */
export default function CategoryAuctionsPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params?.categoryId as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    location: '',
  });
  const [sortBy, setSortBy] = useState<string>('');

  const itemsPerPage = 12;

  // Fetch category info
  useEffect(() => {
    const fetchCategory = async () => {
      if (!categoryId) return;
      try {
        const response = await apiClient.get<Category>(`/category/${categoryId}`);
        setCategory(response);
      } catch (err) {
        console.error('Error fetching category:', err);
      }
    };
    fetchCategory();
  }, [categoryId]);

  // Fetch auctions for category
  useEffect(() => {
    const fetchAuctions = async () => {
      if (!categoryId) return;
      try {
        setLoading(true);
        const response = await apiClient.get<Auction[]>(`/auction?categoryId=${categoryId}`);
        
        if (Array.isArray(response)) {
          setAuctions(response);
        } else {
          setAuctions([]);
        }
      } catch (err) {
        console.error('Error fetching auctions:', err);
        setError('Failed to load auctions');
        setAuctions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [categoryId]);

  // Filter and sort auctions
  const filteredAndSortedAuctions = useMemo(() => {
    let filtered = [...auctions];

    // Keyword filter
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(
        (auction) =>
          auction.name.toLowerCase().includes(keyword) ||
          auction.description?.toLowerCase().includes(keyword) ||
          auction.location.toLowerCase().includes(keyword)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((auction) => auction.status === filters.status);
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter((auction) =>
        auction.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Sort
    if (sortBy) {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'items-asc':
            return (a.items?.length || 0) - (b.items?.length || 0);
          case 'items-desc':
            return (b.items?.length || 0) - (a.items?.length || 0);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [auctions, filters, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAuctions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAuctions = filteredAndSortedAuctions.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  // Disable body scroll when filter sidebar is open (mobile)
  useEffect(() => {
    if (isFilterOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      if (isFilterOpen) {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      }
    };
  }, [isFilterOpen]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Get unique locations and statuses for filters
  // MUST be called before any early returns to follow Rules of Hooks
  const uniqueLocations = useMemo(() => {
    const locations = new Set(auctions.map((a) => a.location));
    return Array.from(locations).sort();
  }, [auctions]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(auctions.map((a) => a.status));
    return Array.from(statuses).sort();
  }, [auctions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="h-16 lg:h-20"></div>
        <PremiumLoader text="Loading auctions..." />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden">
        <Header />
        <div className="h-16 lg:h-20"></div>
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-7xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error || 'Category not found'}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <div className="px-4 py-4 md:px-4 md:py-0 lg:px-8">
        <Header />
      </div>
      <div className="h-12 lg:h-16"></div>

      <main className="max-w-[1440px] mx-auto px-4 py-2 md:px-4 md:py-0 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4 sm:mb-6 flex-wrap" aria-label="Breadcrumb">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-purple-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <Link
            href="/categories"
            className="hover:text-purple-600 transition-colors"
          >
            Categories
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-gray-900 font-medium">{category.name}</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-gray-900 font-medium">Auctions</span>
        </nav>

        {/* Page Header */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-2 sm:mb-4">
            {category.name} Auctions
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">
            Browse all auctions in {category.name} category
          </p>
        </div>

        {/* Mobile Filter Button */}
        <div className="xl:hidden mb-4 sm:mb-6">
          <button
            onClick={toggleFilter}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filters</span>
          </button>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 sm:gap-5 mb-6 sm:mb-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden xl:block w-[334px] shrink-0 py-7 xl:pt-8 xl:pb-96 pr-6 xl:pr-8">
            <div className="mb-16">
              <h2 className="font-bold text-5xl text-[#0E0E0E]">Filters</h2>
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Auctions
              </label>
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="Search by name, description..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Status Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auction Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Locations</option>
                {uniqueLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(filters.keyword || filters.status || filters.location) && (
              <button
                onClick={() => setFilters({ keyword: '', status: '', location: '' })}
                className="w-full px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Mobile Filter Sidebar */}
          {isFilterOpen && (
            <div className="xl:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
              <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="text-xl font-bold">Filters</h2>
                  <button
                    onClick={toggleFilter}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-6">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Auctions
                    </label>
                    <input
                      type="text"
                      value={filters.keyword}
                      onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                      placeholder="Search by name..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auction Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Statuses</option>
                      {uniqueStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <select
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Locations</option>
                      {uniqueLocations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clear Filters */}
                  {(filters.keyword || filters.status || filters.location) && (
                    <button
                      onClick={() => setFilters({ keyword: '', status: '', location: '' })}
                      className="w-full px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Header with count and sort */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div className="text-base sm:text-lg text-gray-700">
                <span className="font-semibold text-gray-900">{filteredAndSortedAuctions.length}</span>
                <span className="ml-1">{filteredAndSortedAuctions.length === 1 ? 'Auction' : 'Auctions'}</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="">Default</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="items-desc">Most Items</option>
                  <option value="items-asc">Least Items</option>
                </select>
              </div>
            </div>

            {/* Auctions Grid */}
            {currentAuctions.length === 0 ? (
              <div className="text-center py-12 sm:py-16 lg:py-20">
                <p className="text-gray-500 text-base sm:text-lg">
                  {filteredAndSortedAuctions.length === 0
                    ? 'No auctions found in this category.'
                    : 'No auctions match your filters.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10">
                  {currentAuctions.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

