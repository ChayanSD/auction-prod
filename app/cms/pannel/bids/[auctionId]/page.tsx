'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/fetcher';
import PremiumLoader from '@/components/shared/PremiumLoader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, TrendingUp, Users, Calendar, MapPin, Gavel, Package } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Bid {
  id: string;
  amount: number;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

interface ItemWithBids {
  itemId: string;
  itemName: string;
  baseBidPrice: number;
  currentBid: number | null;
  totalBids: number;
  highestBid: Bid | null;
  bids: Bid[];
}

interface AuctionBidsData {
  auction: {
    id: string;
    name: string;
    location: string;
    status: string;
  };
  items: ItemWithBids[];
  totalBids: number;
  totalItems: number;
}

export default function AuctionBidsPage() {
  const router = useRouter();
  const params = useParams();
  const auctionId = params?.auctionId as string;

  const [loading, setLoading] = useState(true);
  const [bidsData, setBidsData] = useState<AuctionBidsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auctionId) {
      fetchBids();
    }
  }, [auctionId]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<AuctionBidsData>(`/auction/${auctionId}/bids`);
      setBidsData(data);
    } catch (err: unknown) {
      console.error('Error fetching bids:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bids';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      Live: 'bg-green-100 text-green-700 border-green-300',
      Upcoming: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      Closed: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <PremiumLoader text="Loading bids..." fullScreen={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <p className="text-red-600 text-lg font-semibold">{error}</p>
          <Button
            variant="outline"
            onClick={fetchBids}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!bidsData) {
    return null;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              All Bids - {bidsData.auction.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Complete bid history for this auction lot
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              Total Bids
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{bidsData.totalBids}</p>
            <p className="text-xs text-blue-600 mt-1">Across all items</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-900">{bidsData.totalItems}</p>
            <p className="text-xs text-purple-600 mt-1">In this auction</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Active Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">
              {bidsData.items.filter(item => item.totalBids > 0).length}
            </p>
            <p className="text-xs text-green-600 mt-1">With bids placed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadge(bidsData.auction.status)}`}>
              {bidsData.auction.status}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Auction Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-500" />
            Auction Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Auction Name</p>
              <p className="font-semibold text-gray-900">{bidsData.auction.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Location</p>
              <p className="font-semibold text-gray-900">{bidsData.auction.location}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items with Bids */}
      {bidsData.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No items found in this auction</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {bidsData.items.map((item, itemIndex) => (
            <Card key={item.itemId} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg sm:text-xl mb-2">{item.itemName}</CardTitle>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Base Price:</span>
                        <span className="text-gray-900">{formatCurrency(item.baseBidPrice)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Current Bid:</span>
                        <span className="text-green-600 font-semibold">
                          {formatCurrency(item.currentBid || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gavel className="h-4 w-4" />
                        <span className="font-medium">{item.totalBids} bid{item.totalBids === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                  </div>
                  {item.highestBid && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 sm:p-4 shrink-0">
                      <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        Highest Bid
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-green-700">
                        {formatCurrency(item.highestBid.amount)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {item.highestBid.user.firstName} {item.highestBid.user.lastName}
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {item.bids.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p>No bids placed on this item yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Rank</TableHead>
                          <TableHead className="font-semibold">Amount</TableHead>
                          <TableHead className="font-semibold">Bidder Name</TableHead>
                          <TableHead className="font-semibold hidden md:table-cell">Email</TableHead>
                          <TableHead className="font-semibold hidden lg:table-cell">Phone</TableHead>
                          <TableHead className="font-semibold">Placed At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.bids.map((bid, bidIndex) => (
                          <TableRow
                            key={bid.id}
                            className={bidIndex === 0 ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">#{bidIndex + 1}</span>
                                {bidIndex === 0 && (
                                  <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-semibold flex items-center gap-1">
                                    <Trophy className="h-3 w-3" />
                                    Winner
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`font-bold ${bidIndex === 0 ? 'text-green-700' : 'text-gray-900'}`}>
                                {formatCurrency(bid.amount)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {bid.user.firstName} {bid.user.lastName}
                                </p>
                                <p className="text-xs text-gray-500 md:hidden">{bid.user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <p className="text-sm text-gray-600">{bid.user.email}</p>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <p className="text-sm text-gray-600">{bid.user.phone || '—'}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-gray-600">{formatDate(bid.createdAt)}</p>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

