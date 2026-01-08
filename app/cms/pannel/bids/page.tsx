 'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/fetcher';
import PremiumLoader from '@/components/shared/PremiumLoader';
import { Package, Users, Gavel } from 'lucide-react';
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

  const { data: auctions = [], isLoading } = useQuery<AuctionLot[]>({
    queryKey: ['bids-management-auctions'],
    queryFn: async (): Promise<AuctionLot[]> => {
      const data = await apiClient.get<AuctionLot[]>('/auction');
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
  });


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
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bids & Winners</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Review auction lots and send combined invoices to winners.
          </p>
        </div>
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
                {auctions.map((auction) => {
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

