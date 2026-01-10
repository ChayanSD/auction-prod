'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/fetcher';
import { useUser } from '@/contexts/UserContext';
import PremiumLoader from '@/components/shared/PremiumLoader';
import { Calendar, CheckCircle, XCircle, Clock, Eye, Search, X as XIcon } from 'lucide-react';
import ViewInvoiceDialog from '@/components/cms/payments/ViewInvoiceDialog';

interface Invoice {
  id: string;
  invoiceNumber: string;
  bidAmount?: number | null; // Optional for combined invoices
  additionalFee?: number;
  totalAmount: number;
  status: 'Unpaid' | 'Paid' | 'Cancelled';
  createdAt: string;
  paidAt?: string;
  // Legacy: single item invoice
  auctionItem?: {
    id: string;
    name: string;
    lotCount?: number;
    productImages?: Array<{
      url: string;
      altText?: string;
    }>;
    auction: {
      name: string;
      endDate: string;
    };
  } | null;
  // New: combined invoice with multiple items
  auction?: {
    id: string;
    name: string;
    endDate?: string | null;
  } | null;
  lineItems?: Array<{
    id: string;
    auctionItem: {
      id: string;
      name: string;
    };
    bidAmount: number;
    lineTotal: number;
  }>;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  winningBid?: {
    id: string;
    amount: number;
    createdAt: string;
  } | null;
}

export default function AdminPaymentsPage() {
  const { user, loading: userLoading } = useUser();
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['admin-invoices'],
    queryFn: async (): Promise<Invoice[]> => {
      const res = await apiClient.get<Invoice[]>('/invoice');
      return Array.isArray(res) ? res : [];
    },
    enabled: !!user && !userLoading && user.accountType === 'Admin',
  });
  
  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Search filter
      const matchesSearch = 
        !searchTerm ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${invoice.user.firstName} ${invoice.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.auctionItem?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.auction?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status filter
      const matchesStatus = 
        statusFilter === 'all' || 
        invoice.status === statusFilter;
      
      // Amount filter
      const matchesMinAmount = !minAmount || invoice.totalAmount >= parseFloat(minAmount);
      const matchesMaxAmount = !maxAmount || invoice.totalAmount <= parseFloat(maxAmount);
      
      // Date filter
      const invoiceDate = new Date(invoice.createdAt);
      const matchesDateFrom = !dateFrom || invoiceDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || invoiceDate <= new Date(dateTo);
      
      return matchesSearch && matchesStatus && matchesMinAmount && matchesMaxAmount && matchesDateFrom && matchesDateTo;
    });
  }, [invoices, searchTerm, statusFilter, minAmount, maxAmount, dateFrom, dateTo]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Unpaid':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Paid
          </span>
        );
      case 'Unpaid':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            Unpaid
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  if (userLoading || invoicesLoading) {
    return <PremiumLoader text="Loading payments..." />;
  }

  if (!user || user.accountType !== 'Admin') {
    return <div className="text-center py-10 text-red-500">Access Denied: Admins only.</div>;
  }

  const paidInvoices = filteredInvoices.filter((inv) => inv.status === 'Paid');
  const unpaidInvoices = filteredInvoices.filter((inv) => inv.status === 'Unpaid');
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payments & Invoices</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">View all payments and invoices across the platform.</p>
        </div>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold text-gray-900">{filteredInvoices.length}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Paid Invoices</h3>
          <p className="text-3xl font-bold text-green-600">{paidInvoices.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Unpaid Invoices</h3>
          <p className="text-3xl font-bold text-yellow-600">{unpaidInvoices.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by invoice, user, email..."
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
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Min Amount */}
          <div>
            <input
              type="number"
              placeholder="Min Amount (£)"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              min="0"
              step="0.01"
            />
          </div>

          {/* Max Amount */}
          <div>
            <input
              type="number"
              placeholder="Max Amount (£)"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || statusFilter !== 'all' || minAmount || maxAmount || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setMinAmount('');
              setMaxAmount('');
              setDateFrom('');
              setDateTo('');
            }}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
          >
            <XIcon className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Invoices</h2>
        </div>
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auction Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.user.firstName} {invoice.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{invoice.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {invoice.auctionItem ? (
                        <>
                          <div className="text-sm text-gray-900">{invoice.auctionItem.name}</div>
                          {invoice.auctionItem.lotCount && invoice.auctionItem.lotCount > 1 && (
                            <div className="text-xs text-gray-500">
                              {invoice.auctionItem.lotCount} lots
                            </div>
                          )}
                        </>
                      ) : invoice.lineItems && invoice.lineItems.length > 0 ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.auction?.name || 'Combined Invoice'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {invoice.lineItems.length} item{invoice.lineItems.length > 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {invoice.lineItems.slice(0, 2).map(item => item.auctionItem.name).join(', ')}
                            {invoice.lineItems.length > 2 && ` +${invoice.lineItems.length - 2} more`}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">N/A</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </div>
                      {invoice.additionalFee && invoice.additionalFee > 0 && (
                        <div className="text-xs text-gray-500">
                          Fee: {formatCurrency(invoice.additionalFee)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.status)}
                        {getStatusBadge(invoice.status)}
                      </div>
                      {invoice.paidAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Paid: {formatDate(invoice.paidAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(invoice.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setViewInvoiceId(invoice.id)}
                        className="text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Invoice Dialog */}
      <ViewInvoiceDialog
        invoiceId={viewInvoiceId}
        open={!!viewInvoiceId}
        onClose={() => setViewInvoiceId(null)}
      />
    </div>
  );
}

