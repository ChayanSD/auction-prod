"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/fetcher";
import PremiumLoader from "@/components/shared/PremiumLoader";
import {
  Package,
  Search,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ViewInvoiceDialog from "@/components/cms/payments/ViewInvoiceDialog";

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  shippingStatus: string;
  actualShippingCost: number | null;
  quotedShippingPrice: number | null;
  status: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  auctionItem?: { name: string };
  auction?: { name: string };
}

export default function LogisticsDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await apiClient.get<Invoice[]>("/invoice");
        // Filter for invoices with shipping interaction
        const shippingInvoices = data.filter(
          (inv) =>
            inv.shippingStatus !== "NotRequested" &&
            inv.shippingStatus !== "SelfArranged",
        );
        setInvoices(shippingInvoices);
      } catch (error) {
        console.error("Error fetching logistics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${inv.user.firstName} ${inv.user.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const stats = {
    totalProfit: invoices.reduce(
      (acc, inv) =>
        acc + ((inv.quotedShippingPrice || 0) - (inv.actualShippingCost || 0)),
      0,
    ),
    avgMargin:
      invoices.length > 0
        ? invoices.reduce((acc, inv) => {
            const cost = inv.actualShippingCost || 0;
            const price = inv.quotedShippingPrice || 0;
            return acc + (price > 0 ? ((price - cost) / price) * 100 : 0);
          }, 0) / invoices.length
        : 0,
    pendingQuotes: invoices.filter((inv) => inv.shippingStatus === "Requested")
      .length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  if (loading) return <PremiumLoader text="Loading Logistics Dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Shipping & Logistics
          </h1>
          <p className="text-gray-600">
            Track shipping quotes, actual costs, and profit margins.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-purple-600">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Total Shipping Profit
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.totalProfit)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-green-600">
            <Percent className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Avg. Profit Margin
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.avgMargin.toFixed(1)}%
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-orange-600">
            <Package className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Pending Quotes
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.pendingQuotes}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="px-6 py-4">Invoice</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Actual Cost</th>
                <th className="px-6 py-4">Quoted Price</th>
                <th className="px-6 py-4">Net Profit</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((inv) => {
                const profit =
                  (inv.quotedShippingPrice || 0) -
                  (inv.actualShippingCost || 0);
                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-purple-600">
                      #{inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {inv.user.firstName} {inv.user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {inv.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {inv.actualShippingCost
                        ? formatCurrency(inv.actualShippingCost)
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-bold">
                      {inv.quotedShippingPrice
                        ? formatCurrency(inv.quotedShippingPrice)
                        : "—"}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-bold ${profit > 0 ? "text-green-600" : "text-gray-400"}`}
                    >
                      {profit !== 0 ? formatCurrency(profit) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inv.shippingStatus === "Requested"
                            ? "bg-orange-100 text-orange-800"
                            : inv.shippingStatus === "Quoted"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {inv.shippingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setSelectedInvoiceId(inv.id)}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Manage
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No logistics records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ViewInvoiceDialog
        invoiceId={selectedInvoiceId}
        open={!!selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />
    </div>
  );
}
