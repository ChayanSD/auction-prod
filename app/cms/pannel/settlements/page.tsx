"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "@/contexts/UserContext";
import { API_BASE_URL } from "@/lib/api";
import toast from "react-hot-toast";
import {
  FileText,
  CheckCircle,
  Clock,
  Plus,
  Download,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { downloadSettlementPDF, viewSettlementPDF } from "@/lib/pdf-settlement";

interface SettlementItem {
  id: string;
  name: string;
  lotNumber: string | null;
  soldPrice: number | null;
  baseBidPrice: number;
  reservePrice: number | null;
  isSold: boolean;
}

interface Settlement {
  id: string;
  reference: string;
  sellerId: string;
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string | null;
    email: string;
  };
  totalSales: number;
  commission: number;
  expenses: number;
  netPayout: number;
  currency: string;
  status: "Draft" | "PendingPayment" | "Paid" | "Cancelled";
  generatedAt: string;
  paidAt: string | null;
  items: SettlementItem[];
  adjustments?: { type: string; description: string; amount: number }[];
}

interface Auction {
  id: string;
  name: string;
}

interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  email: string;
}

export default function SettlementsPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState("");
  const [selectedSeller, setSelectedSeller] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [selectedSettlements, setSelectedSettlements] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [adjustments, setAdjustments] = useState<
    { type: string; description: string; amount: number }[]
  >([]);

  const { data: settlements = [], isLoading } = useQuery<Settlement[]>({
    queryKey: ["settlements", filterStatus],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/cms/settlements`, {
        params: { status: filterStatus !== "all" ? filterStatus : undefined },
        withCredentials: true,
      });
      return res.data;
    },
    enabled: !!user && user.accountType === "Admin",
  });

  const { data: auctions = [] } = useQuery<Auction[]>({
    queryKey: ["auctions"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/auction`, {
        withCredentials: true,
      });
      return res.data;
    },
    enabled: !!user && user.accountType === "Admin",
  });

  const { data: sellers = [] } = useQuery<Seller[]>({
    queryKey: ["sellers"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/cms/sellers`, {
        withCredentials: true,
      });
      return res.data;
    },
    enabled: !!user && user.accountType === "Admin",
  });

  const createSettlementMutation = useMutation({
    mutationFn: async (data: {
      sellerId: string;
      auctionId: string;
      commissionRate: number;
      adjustments: any[];
    }) => {
      const res = await axios.post(`${API_BASE_URL}/cms/settlements`, data, {
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
      setIsCreateDialogOpen(false);
      toast.success("Settlement created successfully");
      setSelectedAuction("");
      setSelectedSeller("");
      setCommissionRate("10");
      setAdjustments([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create settlement");
    },
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: async (data: { auctionId: string; commissionRate: number }) => {
      const res = await axios.post(
        `${API_BASE_URL}/cms/settlements/bulk`,
        data,
        {
          withCredentials: true,
        },
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
      toast.success(data.message || "Bulk settlements generated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Bulk generation failed");
    },
  });

  const handleBulkGenerate = () => {
    if (!selectedAuction) {
      toast.error("Please select an auction first");
      return;
    }
    if (
      confirm(
        "Generate settlements for ALL sellers in this auction? This will process only unsettled items.",
      )
    ) {
      bulkGenerateMutation.mutate({
        auctionId: selectedAuction,
        commissionRate: parseFloat(commissionRate),
      });
    }
  };

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSettlementId, setEditingSettlementId] = useState<string | null>(
    null,
  );

  const updateSettlementMutation = useMutation({
    mutationFn: async (data: { id: string; adjustments: any[] }) => {
      const res = await axios.patch(
        `${API_BASE_URL}/cms/settlements/${data.id}`,
        { adjustments: data.adjustments },
        { withCredentials: true },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
      setIsEditDialogOpen(false);
      setEditingSettlementId(null);
      setAdjustments([]);
      toast.success("Settlement updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update settlement");
    },
  });

  const batchUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const res = await axios.patch(
        `${API_BASE_URL}/cms/settlements/batch`,
        { ids, status },
        { withCredentials: true },
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
      setSelectedSettlements([]);
      toast.success(data.message || "Batch update successful");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Batch update failed");
    },
  });

  const deleteSettlementMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_BASE_URL}/cms/settlements/${id}`, {
        withCredentials: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
      toast.success("Settlement deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete settlement");
    },
  });

  const handleExportExcel = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/cms/settlements/export`,
        {
          params: { status: filterStatus },
          responseType: "blob",
          withCredentials: true,
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `settlements_report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel report exported");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel report");
    }
  };

  const toggleSelectAll = () => {
    if (selectedSettlements.length === settlements.length) {
      setSelectedSettlements([]);
    } else {
      setSelectedSettlements(settlements.map((s) => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedSettlements.includes(id)) {
      setSelectedSettlements(selectedSettlements.filter((sid) => sid !== id));
    } else {
      setSelectedSettlements([...selectedSettlements, id]);
    }
  };

  const handleCreateSettlement = () => {
    if (!selectedAuction || !selectedSeller) {
      toast.error("Please select both auction and seller");
      return;
    }

    createSettlementMutation.mutate({
      sellerId: selectedSeller,
      auctionId: selectedAuction,
      commissionRate: parseFloat(commissionRate),
      adjustments,
    });
  };

  const addAdjustment = () => {
    setAdjustments([
      ...adjustments,
      { type: "expense", description: "", amount: 0 },
    ]);
  };

  const removeAdjustment = (index: number) => {
    setAdjustments(adjustments.filter((_, i) => i !== index));
  };

  const updateAdjustment = (index: number, field: string, value: any) => {
    const updated = [...adjustments];
    updated[index] = { ...updated[index], [field]: value };
    setAdjustments(updated);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "PendingPayment":
        return "bg-yellow-100 text-yellow-800";
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="w-4 h-4" />;
      case "PendingPayment":
      case "Draft":
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleDownloadPDF = async (settlementId: string) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/cms/settlements/${settlementId}`,
        { withCredentials: true },
      );
      downloadSettlementPDF(res.data);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  };

  const handleViewPDF = async (settlementId: string) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/cms/settlements/${settlementId}`,
        { withCredentials: true },
      );
      viewSettlementPDF(res.data);
    } catch (error) {
      toast.error("Failed to view PDF");
    }
  };

  if (!user || user.accountType !== "Admin") {
    return <div className="p-8">Unauthorized</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Seller Settlements
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and generate settlement statements for consignors
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </Button>

          <Button
            variant="outline"
            onClick={handleBulkGenerate}
            disabled={bulkGenerateMutation.isPending}
            className="border-[#9F13FB] text-[#9F13FB] hover:bg-purple-50"
          >
            {bulkGenerateMutation.isPending
              ? "Generating..."
              : "Bulk Generate All"}
          </Button>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-[#9F13FB] hover:bg-[#E95AFF] flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Generate Settlement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-sans">
              <DialogHeader>
                <DialogTitle>Generate New Settlement</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Auction
                  </label>
                  <select
                    value={selectedAuction}
                    onChange={(e) => setSelectedAuction(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">-- Select Auction --</option>
                    {auctions.map((auction) => (
                      <option key={auction.id} value={auction.id}>
                        {auction.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Seller
                  </label>
                  <select
                    value={selectedSeller}
                    onChange={(e) => setSelectedSeller(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">-- Select Seller --</option>
                    {sellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.companyName ||
                          `${seller.firstName} ${seller.lastName}`}{" "}
                        ({seller.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Fees/Adjustments
                    </label>
                    <button
                      type="button"
                      onClick={addAdjustment}
                      className="text-[#9F13FB] text-sm font-medium"
                    >
                      + Add Fee
                    </button>
                  </div>
                  {adjustments.map((adj, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={adj.type}
                        onChange={(e) =>
                          updateAdjustment(index, "type", e.target.value)
                        }
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="expense">Expense (-)</option>
                        <option value="deduction">Deduction (-)</option>
                      </select>
                      <input
                        type="text"
                        value={adj.description}
                        onChange={(e) =>
                          updateAdjustment(index, "description", e.target.value)
                        }
                        placeholder="Description"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        value={adj.amount}
                        onChange={(e) =>
                          updateAdjustment(
                            index,
                            "amount",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="Amount"
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeAdjustment(index)}
                        className="text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleCreateSettlement}
                  disabled={createSettlementMutation.isPending}
                  className="w-full bg-[#9F13FB] hover:bg-[#E95AFF]"
                >
                  {createSettlementMutation.isPending
                    ? "Creating..."
                    : "Create Settlement"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="PendingPayment">Pending Payment</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {selectedSettlements.length > 0 && (
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <span className="text-sm font-medium text-gray-600">
                {selectedSettlements.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  batchUpdateMutation.mutate({
                    ids: selectedSettlements,
                    status: "PendingPayment",
                  })
                }
                disabled={batchUpdateMutation.isPending}
              >
                Mark as Sent
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-200 hover:bg-green-50"
                onClick={() =>
                  batchUpdateMutation.mutate({
                    ids: selectedSettlements,
                    status: "Paid",
                  })
                }
                disabled={batchUpdateMutation.isPending}
              >
                Mark as Paid
              </Button>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9F13FB]"></div>
        </div>
      ) : settlements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Settlements Yet
          </h3>
          <p className="text-gray-500">
            Generate settlement statements for sellers after auctions close
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedSettlements.length === settlements.length &&
                      settlements.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-[#9F13FB] focus:ring-[#9F13FB]"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Net Payout
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settlements.map((settlement) => (
                <tr key={settlement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedSettlements.includes(settlement.id)}
                      onChange={() => toggleSelect(settlement.id)}
                      className="rounded border-gray-300 text-[#9F13FB] focus:ring-[#9F13FB]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {settlement.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">
                      {settlement.seller.companyName ||
                        `${settlement.seller.firstName} ${settlement.seller.lastName}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {settlement.seller.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    £{settlement.totalSales.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">
                    £{settlement.netPayout.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(settlement.status)}`}
                    >
                      {getStatusIcon(settlement.status)}
                      {settlement.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(settlement.generatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {settlement.status === "Draft" && (
                      <button
                        onClick={() => {
                          setEditingSettlementId(settlement.id);
                          setAdjustments(settlement.adjustments || []);
                          setIsEditDialogOpen(true);
                        }}
                        className="text-blue-600 font-medium ml-2"
                      >
                        Edit
                      </button>
                    )}
                    {settlement.status === "Draft" && (
                      <button
                        onClick={() =>
                          batchUpdateMutation.mutate({
                            ids: [settlement.id],
                            status: "PendingPayment",
                          })
                        }
                        className="text-[#9F13FB] font-medium"
                      >
                        Send
                      </button>
                    )}
                    {settlement.status === "PendingPayment" && (
                      <button
                        onClick={() =>
                          batchUpdateMutation.mutate({
                            ids: [settlement.id],
                            status: "Paid",
                          })
                        }
                        className="text-green-600 font-medium"
                      >
                        Mark Paid
                      </button>
                    )}
                    {settlement.status === "PendingPayment" && (
                      <button
                        onClick={async () => {
                          const tId = toast.loading("Sending reminder...");
                          try {
                            await axios.post(
                              `${API_BASE_URL}/cms/settlements/${settlement.id}/remind`,
                              {},
                              { withCredentials: true },
                            );
                            toast.success("Reminder sent successfully", {
                              id: tId,
                            });
                          } catch (e) {
                            toast.error("Failed to send reminder", { id: tId });
                          }
                        }}
                        className="text-orange-500 font-medium ml-2"
                      >
                        Remind
                      </button>
                    )}
                    <button
                      onClick={() => handleViewPDF(settlement.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(settlement.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {(settlement.status === "Draft" ||
                      settlement.status === "Cancelled") && (
                      <button
                        onClick={async () => {
                          if (
                            confirm(
                              "Are you sure you want to delete this settlement?",
                            )
                          ) {
                            deleteSettlementMutation.mutate(settlement.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-600"
                        title="Delete Settlement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Settlement Adjustments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Fees/Adjustments
                </label>
                <button
                  type="button"
                  onClick={addAdjustment}
                  className="text-[#9F13FB] text-sm font-medium"
                >
                  + Add Fee
                </button>
              </div>
              {adjustments.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  No adjustments added.
                </p>
              )}
              {adjustments.map((adj, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={adj.type}
                    onChange={(e) =>
                      updateAdjustment(index, "type", e.target.value)
                    }
                    className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="expense">Expense (-)</option>
                    <option value="deduction">Deduction (-)</option>
                  </select>
                  <input
                    type="text"
                    value={adj.description}
                    onChange={(e) =>
                      updateAdjustment(index, "description", e.target.value)
                    }
                    placeholder="Description"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    value={adj.amount}
                    onChange={(e) =>
                      updateAdjustment(
                        index,
                        "amount",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="Amount"
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeAdjustment(index)}
                    className="text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingSettlementId) {
                    updateSettlementMutation.mutate({
                      id: editingSettlementId,
                      adjustments: adjustments,
                    });
                  }
                }}
                disabled={updateSettlementMutation.isPending}
                className="bg-[#9F13FB] hover:bg-[#E95AFF]"
              >
                {updateSettlementMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
