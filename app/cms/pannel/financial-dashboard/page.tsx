"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "@/contexts/UserContext";
import { API_BASE_URL } from "@/lib/api";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Calendar,
  FileText,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface FinancialStats {
  totalRevenue: number;
  totalLiabilities: number;
  grossProfit: number;
  netProfit: number;
  totalHammerSales: number;
  totalCommissions: number;
  totalPremiums: number;
  totalTax: number;
  totalOwedToSellers: number;
  pendingPayments: number;
  paidSettlements: number;
  activeAuctions: number;
  closedAuctions: number;
  totalSellers: number;
}

export default function FinancialDashboard() {
  const { user } = useUser();

  const { data: stats, isLoading } = useQuery<FinancialStats>({
    queryKey: ["financial-stats"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/cms/financial-stats`, {
        withCredentials: true,
      });
      return res.data;
    },
    enabled: !!user && user.accountType === "Admin",
  });

  if (!user || user.accountType !== "Admin") {
    return <div className="p-8">Unauthorized</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9F13FB]"></div>
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Revenue",
      value: `£${stats?.totalRevenue.toFixed(2) || "0.00"}`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Gross Profit",
      value: `£${stats?.grossProfit.toFixed(2) || "0.00"}`,
      change: "+8.2%",
      trend: "up",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Owed to Sellers",
      value: `£${stats?.totalOwedToSellers.toFixed(2) || "0.00"}`,
      change: "-5.1%",
      trend: "down",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Pending Payments",
      value: `£${stats?.pendingPayments.toFixed(2) || "0.00"}`,
      change: "",
      trend: "neutral",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Financial Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of revenue, profit, and liabilities
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
              {metric.change && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    metric.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {metric.trend === "up" ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                  {metric.change}
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              {metric.title}
            </h3>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Sources */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Revenue Sources
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Seller Commissions</span>
              <span className="text-sm font-bold text-gray-900">
                £{stats?.totalCommissions.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Buyer Premiums</span>
              <span className="text-sm font-bold text-gray-900">
                £{stats?.totalPremiums.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Tax Collected</span>
              <span className="text-sm font-bold text-gray-900">
                £{stats?.totalTax.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-base font-bold text-gray-900">
                Total Revenue
              </span>
              <span className="text-base font-bold text-green-600">
                £{stats?.totalRevenue.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>

        {/* Liabilities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Liabilities & Expenses
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                Hammer Sales (Pass-through)
              </span>
              <span className="text-sm font-bold text-gray-900">
                £{stats?.totalHammerSales.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Owed to Sellers</span>
              <span className="text-sm font-bold text-gray-900">
                £{stats?.totalOwedToSellers.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Pending Settlements</span>
              <span className="text-sm font-bold text-gray-900">
                £{stats?.pendingPayments.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-base font-bold text-gray-900">
                Total Liabilities
              </span>
              <span className="text-base font-bold text-red-600">
                £{stats?.totalLiabilities.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Analysis */}
      <div className="bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] rounded-xl p-6 text-white">
        <h2 className="text-lg font-bold mb-4">Profit Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm opacity-90 mb-1">Gross Profit</p>
            <p className="text-3xl font-bold">
              £{stats?.grossProfit.toFixed(2) || "0.00"}
            </p>
            <p className="text-xs opacity-75 mt-1">Revenue - Direct Costs</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Net Profit</p>
            <p className="text-3xl font-bold">
              £{stats?.netProfit.toFixed(2) || "0.00"}
            </p>
            <p className="text-xs opacity-75 mt-1">After all expenses</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Profit Margin</p>
            <p className="text-3xl font-bold">
              {stats?.totalRevenue
                ? ((stats.grossProfit / stats.totalRevenue) * 100).toFixed(1)
                : "0"}
              %
            </p>
            <p className="text-xs opacity-75 mt-1">Gross Profit / Revenue</p>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Active Auctions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.activeAuctions || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Closed Auctions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.closedAuctions || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Total Sellers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.totalSellers || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">Paid Settlements</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.paidSettlements || 0}
          </p>
        </div>
      </div>

      {/* Tax Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Tax Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Tax Collected</p>
            <p className="text-xl font-bold text-gray-900">
              £{stats?.totalTax.toFixed(2) || "0.00"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Taxable Income</p>
            <p className="text-xl font-bold text-gray-900">
              £{stats?.grossProfit.toFixed(2) || "0.00"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">
              Estimated Tax Due (20%)
            </p>
            <p className="text-xl font-bold text-gray-900">
              £{((stats?.grossProfit || 0) * 0.2).toFixed(2)}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          * This is an estimate. Consult your accountant for accurate tax
          calculations.
        </p>
      </div>
    </div>
  );
}
