'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/fetcher';
import PremiumLoader from '@/components/shared/PremiumLoader';
import ViewBidsDialog from '@/components/cms/auction-items/ViewBidsDialog';
import SendInvoiceDialog from '@/components/cms/auction-items/SendInvoiceDialog';
import { Eye, Send, Package } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface AuctionItem {
  id: string;
  name: string;
  currentBid?: number;
  baseBidPrice: number;
  endDate: string;
  status?: string;
  auction?: {
    id: string;
    name: string;
    endDate: string;
    status: string;
  };
  _count?: {
    bids: number;
  };
}

export default function BidsManagementPage() {
  const { user } = useUser();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [viewBidsOpen, setViewBidsOpen] = useState(false);
  const [sendInvoiceOpen, setSendInvoiceOpen] = useState(false);

  const { data: auctionItems = [], isLoading } = useQuery<AuctionItem[]>({
    queryKey: ['auction-items-with-bids'],
    queryFn: async (): Promise<AuctionItem[]> => {
      const data = await apiClient.get<AuctionItem[]>('/auction-item');
      const items = Array.isArray(data) ? data : [];

      // Check and update status for items that have ended
      const now = new Date();
      const itemsToUpdate = items.filter(item =>
        item.status === 'Live' && new Date(item.endDate) < now
      );

      if (itemsToUpdate.length > 0) {
        // Update status to Closed for ended auctions
        await Promise.all(
          itemsToUpdate.map(item =>
            axios.patch(`${API_BASE_URL}/auction-item/${item.id}`, { status: 'Closed' }, { withCredentials: true })
              .catch(error => console.error(`Failed to update status for item ${item.id}:`, error))
          )
        );

        // Refetch data after updates
        const updatedData = await apiClient.get<AuctionItem[]>('/auction-item');
        return Array.isArray(updatedData) ? updatedData : [];
      }

      return items;
    },
    enabled: !!user,
  });

  const handleViewBids = (itemId: string) => {
    setSelectedItemId(itemId);
    setViewBidsOpen(true);
  };

  const handleSendInvoice = (itemId: string) => {
    setSelectedItemId(itemId);
    setSendInvoiceOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!user) {
    return <PremiumLoader text="Loading..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bids Management</h1>
        <p className="text-gray-600 mt-1">
          View all bids for auction items and send invoices to winners
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <PremiumLoader text="Loading auction items..." fullScreen={false} />
        </div>
      ) : auctionItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No auction items found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auction Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Bid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auctionItems.map((item) => {
                  const bidCount = item._count?.bids || 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.auction?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(item.baseBidPrice)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(item.currentBid || 0)}
                        </div>
                        {bidCount > 0 && (
                          <div className="text-xs text-gray-500">{bidCount} {bidCount === 1 ? 'bid' : 'bids'}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(item.endDate)}
                        </div>
                        {item.status === 'Closed' && (
                          <div className="text-xs text-red-600 font-medium">Ended</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBids(item.id)}
                            title="View All Bids"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Bids
                          </Button>
                          {bidCount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendInvoice(item.id)}
                              title="Send Invoice to Winner"
                              className="text-green-600 hover:text-green-700 border-green-300"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Send Invoice
                            </Button>
                          )}
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

      {/* View Bids Dialog */}
      {selectedItemId && (
        <ViewBidsDialog
          itemId={selectedItemId}
          open={viewBidsOpen}
          onClose={() => {
            setViewBidsOpen(false);
            setSelectedItemId(null);
          }}
        />
      )}

      {/* Send Invoice Dialog */}
      {selectedItemId && (
        <SendInvoiceDialog
          itemId={selectedItemId}
          open={sendInvoiceOpen}
          onClose={() => {
            setSendInvoiceOpen(false);
            setSelectedItemId(null);
          }}
        />
      )}
    </div>
  );
}

