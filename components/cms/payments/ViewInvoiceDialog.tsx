"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/fetcher";
import PremiumLoader from "@/components/shared/PremiumLoader";
import {
  Calendar,
  User,
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";

interface Invoice {
  id: string;
  invoiceNumber: string;
  bidAmount?: number | null;
  additionalFee?: number;
  subtotal?: number;
  totalAmount: number;
  status: "Unpaid" | "Paid" | "Cancelled";
  shippingStatus:
    | "NotRequested"
    | "Requested"
    | "Quoted"
    | "SelfArranged"
    | "Shipped";
  actualShippingCost?: number | null;
  quotedShippingPrice?: number | null;
  carrierName?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
  paidAt?: string;
  notes?: string;
  // Legacy: single item invoice
  auctionItem?: {
    id: string;
    name: string;
    lotNumber?: string | null;
    productImages?: Array<{
      url: string;
      altText?: string;
    }>;
    auction: {
      id: string;
      name: string;
      endDate: string;
    };
  } | null;
  // New: combined invoice
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
      productImages?: Array<{
        url: string;
        altText?: string;
      }>;
    };
    bidAmount: number;
    buyersPremium: number;
    taxAmount: number;
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
  stripePaymentLink?: string | null;
}

interface ViewInvoiceDialogProps {
  invoiceId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function ViewInvoiceDialog({
  invoiceId,
  open,
  onClose,
}: ViewInvoiceDialogProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [updatingShipment, setUpdatingShipment] = useState(false);

  // Form states
  const [actualCost, setActualCost] = useState("");
  const [quotedPrice, setQuotedPrice] = useState("");
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");

  const handleShippingSubmit = async () => {
    if (!invoiceId) return;
    try {
      setUpdatingShipment(true);
      await apiClient.patch(`/invoice/${invoiceId}`, {
        shippingStatus: "Quoted",
        actualShippingCost: parseFloat(actualCost) || 0,
        quotedShippingPrice: parseFloat(quotedPrice) || 0,
        carrierName: carrier,
        trackingNumber: tracking,
      });
      toast.success("Shipping quote updated!");
      // Refresh invoice data
      const updated = await apiClient.get<Invoice>(`/invoice/${invoiceId}`);
      setInvoice(updated);
    } catch (err: unknown) {
      toast.error((err as any)?.data?.error || "Failed to update shipping");
    } finally {
      setUpdatingShipment(false);
    }
  };

  useEffect(() => {
    if (!open || !invoiceId) {
      setInvoice(null);
      setError(null);
      return;
    }

    const fetchInvoice = async () => {
      if (!invoiceId) {
        setError("Invoice ID is required");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await apiClient.get<Invoice>(`/invoice/${invoiceId}`);
        if (!data) {
          setError("Invoice not found");
          return;
        }
        setInvoice(data);
        // Set initial values for shipping form
        setActualCost(data.actualShippingCost?.toString() || "");
        setQuotedPrice(data.quotedShippingPrice?.toString() || "");
        setCarrier(data.carrierName || "");
        setTracking(data.trackingNumber || "");
      } catch (err: unknown) {
        console.error("Error fetching invoice:", err);
        const errorMessage =
          (err as any)?.message ||
          (err as any)?.data?.error ||
          "Failed to load invoice";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [open, invoiceId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceId || !invoice) return;

    try {
      setDownloading(true);
      const response = await fetch(`/api/invoice/${invoiceId}/download`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF downloaded successfully!");
    } catch (err: unknown) {
      console.error("Error downloading PDF:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to download PDF";
      toast.error(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>Paid</span>
          </div>
        );
      case "Unpaid":
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            <span>Unpaid</span>
          </div>
        );
      case "Cancelled":
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            <span>Cancelled</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        style={{ maxWidth: "700px" }}
        className=" max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <DialogHeader className="px-4 sm:px-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
            Invoice Details
          </DialogTitle>
          <DialogDescription className="text-sm">
            View complete invoice information and payment status
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 px-4">
            <PremiumLoader text="Loading invoice..." fullScreen={false} />
          </div>
        ) : error ? (
          <div className="text-center py-12 px-4">
            <div className="text-red-500 mb-4 font-medium">{error}</div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        ) : invoice ? (
          <div className="space-y-4 sm:space-y-6 mt-4 px-4 sm:px-0">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 sm:p-6 border border-purple-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Invoice #{invoice.invoiceNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Created: {formatDate(invoice.createdAt)}
                  </p>
                </div>
                {getStatusBadge(invoice.status)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column - User & Auction Info */}
              <div className="space-y-4 sm:space-y-6">
                {/* User Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">
                      Customer Information
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Name:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {invoice.user.firstName} {invoice.user.lastName}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600">Email:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {invoice.user.email}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Auction Item Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">
                      {invoice.auctionItem ? "Auction Item" : "Auction Details"}
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    {invoice.auctionItem ? (
                      <>
                        <p>
                          <span className="text-gray-600">Item:</span>{" "}
                          <span className="font-medium text-gray-900">
                            {invoice.auctionItem.name}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">Auction:</span>{" "}
                          <span className="font-medium text-gray-900">
                            {invoice.auctionItem.auction.name}
                          </span>
                        </p>
                        {invoice.auctionItem.lotNumber && (
                          <p>
                            <span className="text-gray-600">Lot Number:</span>{" "}
                            <span className="font-medium text-gray-900">
                              {invoice.auctionItem.lotNumber}
                            </span>
                          </p>
                        )}
                        <p>
                          <span className="text-gray-600">Auction End:</span>{" "}
                          <span className="font-medium text-gray-900">
                            {formatDate(invoice.auctionItem.auction.endDate)}
                          </span>
                        </p>
                      </>
                    ) : invoice.auction ? (
                      <>
                        <p>
                          <span className="text-gray-600">Auction:</span>{" "}
                          <span className="font-medium text-gray-900">
                            {invoice.auction.name}
                          </span>
                        </p>
                        {invoice.auction.endDate && (
                          <p>
                            <span className="text-gray-600">Auction End:</span>{" "}
                            <span className="font-medium text-gray-900">
                              {formatDate(invoice.auction.endDate)}
                            </span>
                          </p>
                        )}
                        {invoice.lineItems && invoice.lineItems.length > 0 && (
                          <p>
                            <span className="text-gray-600">Items:</span>{" "}
                            <span className="font-medium text-gray-900">
                              {invoice.lineItems.length} item
                              {invoice.lineItems.length > 1 ? "s" : ""}
                            </span>
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500">
                        No auction information available
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Payment & Bid Info */}
              <div className="space-y-4 sm:space-y-6">
                {/* Product Image - Only for single item invoices */}
                {invoice.auctionItem?.productImages &&
                  invoice.auctionItem.productImages.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-gray-900">
                          Product Image
                        </h4>
                      </div>
                      <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={invoice.auctionItem.productImages[0].url}
                          alt={
                            invoice.auctionItem.productImages[0].altText ||
                            invoice.auctionItem.name
                          }
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                {/* Line Items - For combined invoices */}
                {invoice.lineItems && invoice.lineItems.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">
                        Items Won ({invoice.lineItems.length})
                      </h4>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {invoice.lineItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className="pb-2 border-b border-gray-100 last:border-0"
                        >
                          <p className="text-sm font-medium text-gray-900">
                            {item.auctionItem.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            Bid: {formatCurrency(item.bidAmount)} | Total:{" "}
                            {formatCurrency(item.lineTotal)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">
                      Payment Summary
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {typeof invoice.bidAmount === "number" && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 pb-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">
                          Winning Bid:
                        </span>
                        <span className="text-sm font-semibold text-gray-900 break-words sm:text-right">
                          {formatCurrency(invoice.bidAmount)}
                        </span>
                      </div>
                    )}
                    {invoice.lineItems && invoice.lineItems.length > 0 && (
                      <>
                        <div className="pb-2 border-b border-gray-200">
                          <p className="text-sm text-gray-600 mb-2">
                            Line Items:
                          </p>
                          {invoice.lineItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-xs mb-1"
                            >
                              <span className="text-gray-600">
                                {item.auctionItem.name}:
                              </span>
                              <span className="font-medium text-gray-900">
                                {formatCurrency(item.lineTotal)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 pb-2 border-b border-gray-200">
                          <span className="text-sm text-gray-600">
                            Subtotal:
                          </span>
                          <span className="text-sm font-semibold text-gray-900 break-words sm:text-right">
                            {formatCurrency(
                              invoice.subtotal || invoice.totalAmount,
                            )}
                          </span>
                        </div>
                      </>
                    )}
                    {invoice.additionalFee && invoice.additionalFee > 0 && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 pb-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">
                          Additional Fees:
                        </span>
                        <span className="text-sm font-semibold text-gray-900 break-words sm:text-right">
                          {formatCurrency(invoice.additionalFee)}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1 sm:gap-2 pt-2">
                      <span className="text-base sm:text-lg font-bold text-gray-900">
                        Total Amount:
                      </span>
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 break-words">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bid Information - Only for single item invoices */}
                {invoice.winningBid && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">
                        Bid Information
                      </h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600">Bid Amount:</span>
                        <span className="font-medium text-gray-900 break-words">
                          {formatCurrency(invoice.winningBid.amount)}
                        </span>
                      </div>
                      <p>
                        <span className="text-gray-600">Bid Placed:</span>{" "}
                        <span className="font-medium text-gray-900">
                          {formatDate(invoice.winningBid.createdAt)}
                        </span>
                      </p>
                      {invoice.paidAt && (
                        <p>
                          <span className="text-gray-600">Paid At:</span>{" "}
                          <span className="font-medium text-green-600">
                            {formatDate(invoice.paidAt)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {invoice.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            )}

            {/* Shipping Management Section */}
            {invoice.status === "Unpaid" &&
              (invoice.shippingStatus === "Requested" ||
                invoice.shippingStatus === "Quoted") && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 sm:p-6 mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-purple-600" />
                    <h4 className="font-bold text-gray-900">
                      Shipping Logistics Management
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 uppercase">
                        Actual Cost (Secret)
                      </label>
                      <input
                        type="number"
                        value={actualCost}
                        onChange={(e) => setActualCost(e.target.value)}
                        placeholder="Cost you pay carrier"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 uppercase">
                        Quoted Price (To Buyer)
                      </label>
                      <input
                        type="number"
                        value={quotedPrice}
                        onChange={(e) => setQuotedPrice(e.target.value)}
                        placeholder="Price buyer pays you"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 uppercase">
                        Carrier Name
                      </label>
                      <input
                        type="text"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        placeholder="e.g. DHL, Royal Mail"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 uppercase">
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        value={tracking}
                        onChange={(e) => setTracking(e.target.value)}
                        placeholder="Track #"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-purple-100">
                    <div className="text-sm">
                      <span className="text-gray-600 font-medium">
                        Estimated Profit:{" "}
                      </span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(
                          (parseFloat(quotedPrice) || 0) -
                            (parseFloat(actualCost) || 0),
                        )}
                      </span>
                    </div>
                    <button
                      onClick={handleShippingSubmit}
                      disabled={updatingShipment}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-all disabled:opacity-50"
                    >
                      {updatingShipment
                        ? "Updating..."
                        : "Provide Quote & Update Invoice"}
                    </button>
                  </div>
                </div>
              )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 px-4 sm:px-0 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
              {invoice.status === "Paid" && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {downloading ? "Downloading..." : "Download PDF"}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
