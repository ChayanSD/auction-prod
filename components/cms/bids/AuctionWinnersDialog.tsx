'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PremiumLoader from '@/components/shared/PremiumLoader';
import { apiClient } from '@/lib/fetcher';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle, Mail, Package, User, Receipt } from 'lucide-react';

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

interface AuctionWinnersDialogProps {
  auctionId: string;
  open: boolean;
  onClose: () => void;
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
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      );
    case 'Unpaid':
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          <Clock className="w-3 h-3 mr-1" />
          Unpaid
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
          <XCircle className="w-3 h-3 mr-1" />
          Not Generated
        </Badge>
      );
  }
};

export default function AuctionWinnersDialog({
  auctionId,
  open,
  onClose,
}: AuctionWinnersDialogProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [data, setData] = useState<WinnersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && auctionId) {
      void fetchWinners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, auctionId]);

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

  const handleClose = (): void => {
    if (!sending) {
      onClose();
    }
  };

  const winners = data?.winners ?? [];
  const hasUnpaidInvoices = winners.some(
    (w) => !w.invoiceId || (w.invoiceStatus !== 'Paid' && w.invoiceSent)
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header Section */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                Auction Winners
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                {data ? (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="font-medium text-gray-900">{data.auction.name}</span>
                    <span className="text-gray-400">•</span>
                    <Badge
                      variant="outline"
                      className={
                        data.auction.status === 'Live'
                          ? 'border-green-500 text-green-700 bg-green-50'
                          : data.auction.status === 'Closed'
                          ? 'border-gray-500 text-gray-700 bg-gray-50'
                          : 'border-yellow-500 text-yellow-700 bg-yellow-50'
                      }
                    >
                      {data.auction.status}
                    </Badge>
                    {data.auction.endDate && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">
                          Ends: {formatDateTime(data.auction.endDate)}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  'Review winners and send combined invoices per user for this auction lot.'
                )}
              </DialogDescription>
            </div>
            {winners.length > 0 && (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white shrink-0 w-full sm:w-auto"
                onClick={() => void handleSendAllInvoices()}
                disabled={sending || !hasUnpaidInvoices}
                size="lg"
              >
                <Mail className="w-4 h-4 mr-2" />
                {sending ? 'Sending...' : 'Send All Invoices'}
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Content Section - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <PremiumLoader text="Loading winners..." fullScreen={false} />
            </div>
          ) : error ? (
            <div className="py-8 text-center space-y-4">
              <div className="text-red-600 text-sm font-medium">{error}</div>
              <Button size="sm" variant="outline" onClick={() => void fetchWinners()}>
                Try Again
              </Button>
            </div>
          ) : winners.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Package className="w-16 h-16 text-gray-300 mx-auto" />
              <p className="text-gray-600 text-base font-medium">
                No winners found for this auction lot yet
              </p>
              <p className="text-gray-500 text-sm">No bids have been placed on items in this auction.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Total Winners</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{winners.length}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Total Items Won</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {winners.reduce((sum, w) => sum + w.items.length, 0)}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Invoices Generated</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {winners.filter((w) => w.invoiceId).length}
                  </p>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Winner
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Items Won
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Invoice Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {winners.map((winner) => {
                        const fullName = `${winner.user.firstName} ${winner.user.lastName}`;
                        const itemsCount = winner.items.length;

                        return (
                          <tr key={winner.userId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-5 align-top">
                              <div className="font-semibold text-gray-900 text-sm">{fullName}</div>
                              <div className="text-xs text-gray-500 mt-1">{winner.user.email}</div>
                            </td>
                            <td className="px-6 py-5 align-top">
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
                            </td>
                            <td className="px-6 py-5 align-top">
                              <div className="text-lg font-bold text-gray-900">
                                {formatCurrency(winner.totalAmount)}
                              </div>
                            </td>
                            <td className="px-6 py-5 align-top">
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-4">
                {winners.map((winner) => {
                  const fullName = `${winner.user.firstName} ${winner.user.lastName}`;
                  const itemsCount = winner.items.length;

                  return (
                    <div
                      key={winner.userId}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 space-y-4"
                    >
                      {/* Winner Header */}
                      <div className="flex items-start justify-between gap-4 pb-4 border-b">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-gray-400 shrink-0" />
                            <h3 className="font-semibold text-gray-900 text-base truncate">
                              {fullName}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{winner.user.email}</p>
                        </div>
                        {winner.invoiceId && (
                          <div className="shrink-0">{getStatusBadge(winner.invoiceStatus)}</div>
                        )}
                      </div>

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
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
