'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/fetcher';
import PremiumLoader from '@/components/shared/PremiumLoader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, User, Package, Receipt, CheckCircle2, Clock, XCircle, Calendar, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface WinnerUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface WinnerItem {
  itemId: string;
  itemName: string;
  bidAmount: number;
  buyersPremium: number;
  taxAmount: number;
}

interface WinnerWithInvoice {
  userId: string;
  user: WinnerUser;
  items: WinnerItem[];
  totalAmount: number;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  invoiceSent: boolean;
}

interface AuctionSummary {
  id: string;
  name: string;
  endDate: string | null;
  status: string;
}

interface WinnersResponse {
  auction: AuctionSummary;
  winners: WinnerWithInvoice[];
  totalWinners: number;
  invoicesGenerated: number;
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);

const formatDateTime = (value: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'Paid':
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-300">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      );
    case 'Unpaid':
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Unpaid
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-300">
          <XCircle className="w-3 h-3 mr-1" />
          Not Generated
        </Badge>
      );
  }
};

export default function AuctionWinnersPage() {
  const router = useRouter();
  const params = useParams();
  const auctionId = params?.auctionId as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [data, setData] = useState<WinnersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auctionId) {
      fetchWinners();
    }
  }, [auctionId]);

  const fetchWinners = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<WinnersResponse>(`/auction/${auctionId}/winners`);
      setData(response);
    } catch (err: unknown) {
      console.error('Error fetching winners:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to fetch winners for this auction.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAllInvoices = async (): Promise<void> => {
    try {
      setSending(true);
      setError(null);

      // 1) Ensure invoices exist by closing the auction (idempotent)
      try {
        await apiClient.post(`/auction/${auctionId}/close`, {});
      } catch (closeError) {
        // If auction is already closed and invoices exist, this may return 409 – that's OK
        const status = (closeError as { response?: { status?: number; data?: unknown } })?.response
          ?.status;
        const alreadyClosed =
          status === 409 &&
          ((closeError as { response?: { data?: { invoicesAlreadyExist?: boolean; error?: string } } })
            ?.response?.data?.invoicesAlreadyExist ||
            ((closeError as { response?: { data?: { error?: string } } })?.response?.data?.error
              ?.toString()
              .includes('already closed')));
        if (!alreadyClosed) {
          console.error('Error closing auction before sending invoices:', closeError);
          throw closeError;
        }
      }

      // 2) Send all unpaid invoices for this auction
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        invoicesSent: number;
      }>(`/auction/${auctionId}/send-invoices`, {});

      toast.success(
        response?.message ||
          `Sent ${response?.invoicesSent ?? 0} invoice(s) successfully for this auction.`
      );

      // 3) Refresh winners to reflect new invoice statuses
      await fetchWinners();
    } catch (err) {
      console.error('Error sending invoices:', err);
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Failed to send invoices for this auction.');
      setError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <PremiumLoader text="Loading winners..." fullScreen={false} />
      </div>
    );
  }

  if (error && !data) {
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
            onClick={fetchWinners}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const winners = data.winners;
  const hasUnpaidInvoices = winners.some(
    (w) => !w.invoiceId || (w.invoiceStatus !== 'Paid' && w.invoiceSent)
  );

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'Live':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Closed':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Upcoming':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

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
              Auction Winners - {data.auction.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Review winners and send combined invoices per user
            </p>
          </div>
        </div>
        {winners.length > 0 && (
          <Button
            className="bg-green-600 hover:bg-green-700 text-white shrink-0"
            onClick={() => void handleSendAllInvoices()}
            disabled={sending || !hasUnpaidInvoices}
            size="lg"
          >
            <Mail className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : 'Send All Invoices'}
          </Button>
        )}
      </div>

      {/* Auction Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-500" />
            Auction Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Auction Name</p>
              <p className="font-semibold text-gray-900">{data.auction.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadgeClasses(data.auction.status)}`}>
                {data.auction.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">End Date</p>
              <p className="font-semibold text-gray-900">{formatDateTime(data.auction.endDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <User className="h-4 w-4" />
              Total Winners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{winners.length}</p>
            <p className="text-xs text-blue-600 mt-1">Users who won items</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Items Won
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-900">
              {winners.reduce((sum, w) => sum + w.items.length, 0)}
            </p>
            <p className="text-xs text-purple-600 mt-1">Items across all winners</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Invoices Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">
              {winners.filter((w) => w.invoiceId).length}
            </p>
            <p className="text-xs text-green-600 mt-1">Out of {winners.length} winners</p>
          </CardContent>
        </Card>
      </div>

      {/* Winners Table/Cards */}
      {winners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">
              No winners found for this auction lot yet
            </p>
            <p className="text-gray-500 text-sm mt-2">No bids have been placed on items in this auction.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Winner</TableHead>
                      <TableHead className="font-semibold">Items Won</TableHead>
                      <TableHead className="font-semibold">Total Amount</TableHead>
                      <TableHead className="font-semibold">Invoice Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {winners.map((winner) => {
                      const fullName = `${winner.user.firstName} ${winner.user.lastName}`;
                      const itemsCount = winner.items.length;

                      return (
                        <TableRow key={winner.userId} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <div className="font-semibold text-gray-900">{fullName}</div>
                              <div className="text-xs text-gray-500 mt-1">{winner.user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-gray-900 mb-2">
                              {itemsCount} item{itemsCount === 1 ? '' : 's'}
                            </div>
                            <div className="space-y-1.5">
                              {winner.items.map((item) => (
                                <div
                                  key={item.itemId}
                                  className="flex items-center justify-between gap-3 text-xs bg-gray-50 rounded px-2 py-1.5"
                                >
                                  <span className="text-gray-700 font-medium truncate flex-1">
                                    {item.itemName}
                                  </span>
                                  <span className="text-gray-900 font-semibold whitespace-nowrap">
                                    {formatCurrency(item.bidAmount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-lg font-bold text-gray-900">
                              {formatCurrency(winner.totalAmount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {winner.invoiceId ? (
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-gray-700">
                                  Invoice #{winner.invoiceNumber ?? winner.invoiceId.slice(0, 8)}
                                </div>
                                {getStatusBadge(winner.invoiceStatus)}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {getStatusBadge(null)}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-4">
            {winners.map((winner) => {
              const fullName = `${winner.user.firstName} ${winner.user.lastName}`;
              const itemsCount = winner.items.length;

              return (
                <Card key={winner.userId}>
                  <CardHeader className="border-b">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-gray-400 shrink-0" />
                          <CardTitle className="text-base truncate">{fullName}</CardTitle>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{winner.user.email}</p>
                      </div>
                      {winner.invoiceId && (
                        <div className="shrink-0">{getStatusBadge(winner.invoiceStatus)}</div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {/* Items Won */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">
                          {itemsCount} Item{itemsCount === 1 ? '' : 's'} Won
                        </span>
                      </div>
                      <div className="space-y-2">
                        {winner.items.map((item) => (
                          <div
                            key={item.itemId}
                            className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2.5"
                          >
                            <span className="text-sm text-gray-700 font-medium flex-1 truncate">
                              {item.itemName}
                            </span>
                            <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                              {formatCurrency(item.bidAmount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total & Invoice Info */}
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Total Amount:</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(winner.totalAmount)}
                        </span>
                      </div>
                      {winner.invoiceId && (
                        <div className="text-xs text-gray-500">
                          Invoice #{winner.invoiceNumber ?? winner.invoiceId.slice(0, 8)}
                        </div>
                      )}
                      {!winner.invoiceId && (
                        <div className="flex items-center gap-2">{getStatusBadge(null)}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

