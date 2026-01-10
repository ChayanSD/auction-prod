'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/fetcher';
import PremiumLoader from '@/components/shared/PremiumLoader';
import { Package, Users, Gavel, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuctionLot {
  id: string;
  name: string;
  location: string;
  startDate?: string | null;
  endDate?: string | null;
  status: 'Upcoming' | 'Live' | 'Closed';
  _count?: {
    items: number;
  };
}

export default function BidsManagementPage() {
  const { user } = useUser();
  const router = useRouter();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const { data: auctions = [], isLoading } = useQuery<AuctionLot[]>({
    queryKey: ['bids-management-auctions'],
    queryFn: async (): Promise<AuctionLot[]> => {
      const data = await apiClient.get<AuctionLot[]>('/auction');
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
  });
  
  // Extract unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    auctions.forEach(auction => {
      if (auction.location) {
        locations.add(auction.location);
      }
    });
    return Array.from(locations).sort();
  }, [auctions]);

  // Filter auctions
  const filteredAuctions = useMemo(() => {
    return auctions.filter((auction) => {
      // Search filter
      const matchesSearch = 
        !searchTerm ||
        auction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = 
        statusFilter === 'all' || 
        auction.status === statusFilter;
      
      // Location filter
      const matchesLocation = 
        locationFilter === 'all' || 
        auction.location === locationFilter;
      
      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [auctions, searchTerm, statusFilter, locationFilter]);


  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusBadgeClasses = (status: AuctionLot['status']) => {
    switch (status) {
      case 'Live':
        return 'bg-green-100 text-green-700';
      case 'Upcoming':
        return 'bg-yellow-100 text-yellow-700';
      case 'Closed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!user) {
    return <PremiumLoader text="Loading..." />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bids & Winners</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Review auction lots and send combined invoices to winners.
          </p>
        </div>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold text-gray-900">{filteredAuctions.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
            >
              <option value="all">All Statuses</option>
              <option value="Live">Live</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              disabled={uniqueLocations.length === 0}
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || statusFilter !== 'all' || locationFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setLocationFilter('all');
            }}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <PremiumLoader text="Loading auction lots..." fullScreen={false} />
        </div>
      ) : auctions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No auction lots found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auction Lot
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auction Window
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredAuctions.map((auction) => {
                  const itemCount = auction._count?.items ?? 0;
                  return (
                    <tr key={auction.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{auction.name}</div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{auction.location}</div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
                          {itemCount} item{itemCount === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          Start: {formatDate(auction.startDate ?? null)}
                        </div>
                        <div className="text-xs text-gray-500">
                          End: {formatDate(auction.endDate ?? null)}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadgeClasses(
                            auction.status
                          )}`}
                        >
                          {auction.status}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/cms/pannel/bids/${auction.id}`)}
                            title="View all bids for this auction lot"
                            className="text-blue-600 hover:text-blue-700 border-blue-300"
                          >
                            <Gavel className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">See All Bids</span>
                            <span className="sm:hidden">Bids</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/cms/pannel/bids/${auction.id}/winners`)}
                            title="See winners for this auction lot"
                            className="text-purple-600 hover:text-purple-700 border-purple-300"
                          >
                            <Users className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">See Winners</span>
                            <span className="sm:hidden">Winners</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

