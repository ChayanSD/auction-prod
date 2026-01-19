"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/fetcher";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PremiumLoader from "@/components/shared/PremiumLoader";
import { Download, ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface Invoice {
  id: string;
  invoiceNumber: string;
  // Legacy single-item fields
  bidAmount?: number | null;
  buyersPremium?: number | null;
  taxAmount?: number | null;
  // New combined-invoice fields
  subtotal?: number | null;
  totalAmount: number;
  status: "Unpaid" | "Paid" | "Cancelled";
  shippingStatus:
    | "NotRequested"
    | "Requested"
    | "Quoted"
    | "SelfArranged"
    | "Shipped";
  quotedShippingPrice?: number | null;
  carrierName?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
  paidAt?: string;
  notes?: string;
  // Legacy: single auction item invoice (may be null for combined invoices)
  auctionItem?: {
    id: string;
    name: string;
    lotNumber?: string | null;
    startDate?: string;
    endDate?: string;
    productImages?: Array<{
      url: string;
      altText?: string;
    }>;
    auction: {
      id: string;
      name: string;
      endDate?: string | null;
    };
  } | null;
  // New: parent auction for combined invoices
  auction?: {
    id: string;
    name: string;
    endDate?: string | null;
  } | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  winningBid?: {
    id: string;
    amount: number;
    createdAt: string;
  };
  stripePaymentLink?: string | null;
}

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<Invoice>(`/invoice/${invoiceId}`);
      setInvoice(data);
    } catch (err: unknown) {
      console.error("Error fetching invoice:", err);
      const errorMessage =
        (err as any)?.message ||
        (err as any)?.data?.error ||
        "Failed to load invoice";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId, fetchInvoice]);

  const handleRequestQuote = async () => {
    try {
      setIsUpdating(true);
      await apiClient.patch(`/invoice/${invoiceId}`, {
        shippingStatus: "Requested",
      });
      toast.success("Shipping quote requested! We will notify you shortly.");
      await fetchInvoice();
    } catch (err: unknown) {
      console.error("Error requesting quote:", err);
      toast.error((err as any)?.data?.error || "Failed to request quote");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelfArrange = async () => {
    try {
      setIsUpdating(true);
      await apiClient.patch(`/invoice/${invoiceId}`, {
        shippingStatus: "SelfArranged",
      });
      toast.success("Updated to self-arranged collection.");
      await fetchInvoice();
    } catch (err: unknown) {
      console.error("Error updating shipping:", err);
      toast.error((err as any)?.data?.error || "Failed to update shipping");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceId) return;

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
      a.download = `invoice-${invoice?.invoiceNumber || invoiceId}.pdf`;
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
      });
    } catch {
      return "Invalid date";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCircle className="w-5 h-5" />
            <span>Paid</span>
          </div>
        );
      case "Unpaid":
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <Clock className="w-5 h-5" />
            <span>Unpaid</span>
          </div>
        );
      case "Cancelled":
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <XCircle className="w-5 h-5" />
            <span>Cancelled</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <Header />
        <div className="h-16 lg:h-20"></div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <PremiumLoader text="Loading invoice..." fullScreen={false} />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <Header />
        <div className="h-16 lg:h-20"></div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 text-lg mb-4">
              {error || "Invoice not found"}
            </p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Company information - using defaults since env vars might not be available on client
  // In production, these should be set as NEXT_PUBLIC_* variables or fetched from API
  const companyName = "Super Media Bros";
  const companyAddress = "N/A";
  const companyCity = "N/A";
  const companyPostcode = "N/A";
  const companyCountry = "United Kingdom";
  const companyPhone = "N/A";
  const companyEmail = "N/A";
  const companyVAT = "N/A";
  const companyNumber = "N/A";

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Header />
      <div className="h-16 lg:h-20"></div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] px-6 py-8 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">INVOICE</h1>
                <p className="text-white/90">
                  Invoice #{invoice.invoiceNumber}
                </p>
                <p className="text-white/90 text-sm mt-1">
                  Date: {formatDate(invoice.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(invoice.status)}
                <Button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="bg-white text-purple-600 hover:bg-gray-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? "Downloading..." : "Download PDF"}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Company Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  From:
                </h2>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-semibold">{companyName}</p>
                  <p>{companyAddress}</p>
                  <p>
                    {companyCity}, {companyPostcode}
                  </p>
                  <p>{companyCountry}</p>
                  <p>Tel: {companyPhone}</p>
                  <p>Email: {companyEmail}</p>
                  <p>VAT NO: {companyVAT}</p>
                  <p>Company Number: {companyNumber}</p>
                </div>
              </div>

              {/* Bill To */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Bill To:
                </h2>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-semibold">
                    {invoice.user.firstName} {invoice.user.lastName}
                  </p>
                  <p>{invoice.user.email}</p>
                  {invoice.user.phone && <p>{invoice.user.phone}</p>}
                </div>
              </div>
            </div>

            {/* Auction Details */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Auction Details:
              </h2>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <span className="font-semibold">Auction:</span>{" "}
                  {invoice.auction?.name ||
                    invoice.auctionItem?.auction?.name ||
                    "N/A"}
                </p>
                {(() => {
                  const auctionDateRaw =
                    invoice.auction?.endDate ||
                    invoice.auctionItem?.auction?.endDate ||
                    invoice.auctionItem?.endDate ||
                    invoice.createdAt;
                  return (
                    <p>
                      <span className="font-semibold">Auction Date:</span>{" "}
                      {auctionDateRaw ? formatDate(auctionDateRaw) : "N/A"}
                    </p>
                  );
                })()}
              </div>
            </div>

            {/* Item Details (legacy single-item invoices only) */}
            {invoice.auctionItem && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Item Details:
                </h2>
                <div className="text-sm text-gray-700 space-y-1">
                  {invoice.auctionItem.lotNumber && (
                    <p>
                      <span className="font-semibold">Lot No:</span>{" "}
                      {invoice.auctionItem.lotNumber}
                    </p>
                  )}
                  <p>
                    <span className="font-semibold">Description:</span>{" "}
                    {invoice.auctionItem.name}
                  </p>
                </div>
                {invoice.auctionItem.productImages &&
                  invoice.auctionItem.productImages.length > 0 && (
                    <div className="mt-4">
                      <img
                        src={invoice.auctionItem.productImages[0].url}
                        alt={
                          invoice.auctionItem.productImages[0].altText ||
                          invoice.auctionItem.name
                        }
                        className="w-full max-w-md h-64 object-contain rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
              </div>
            )}

            {/* Shipping Options */}
            {invoice.status === "Unpaid" && (
              <div className="mb-8 p-6 bg-purple-50 border border-purple-100 rounded-xl">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm">
                    ?
                  </span>
                  How would you like to receive your items?
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Request Quote */}
                  <button
                    onClick={handleRequestQuote}
                    disabled={
                      isUpdating ||
                      invoice.shippingStatus === "Requested" ||
                      invoice.shippingStatus === "Quoted"
                    }
                    className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-1 ${
                      invoice.shippingStatus === "Requested" ||
                      invoice.shippingStatus === "Quoted"
                        ? "border-purple-600 bg-white"
                        : "border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-white"
                    }`}
                  >
                    <span className="font-bold text-gray-900">
                      Request a Shipping Quote
                    </span>
                    <span className="text-sm text-gray-600">
                      Let us handle the logistics for you. We offer competitive,
                      fully insured rates.
                    </span>
                    {invoice.shippingStatus === "Requested" && (
                      <span className="mt-2 text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Quote Pending
                      </span>
                    )}
                    {invoice.shippingStatus === "Quoted" && (
                      <span className="mt-2 text-xs font-bold text-green-600 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Quote Provided
                      </span>
                    )}
                  </button>

                  {/* Option 2: Self Arrange */}
                  <button
                    onClick={handleSelfArrange}
                    disabled={
                      isUpdating || invoice.shippingStatus === "SelfArranged"
                    }
                    className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-1 ${
                      invoice.shippingStatus === "SelfArranged"
                        ? "border-purple-600 bg-white"
                        : "border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-white"
                    }`}
                  >
                    <span className="font-bold text-gray-900">
                      Collection / Self-Arrange
                    </span>
                    <span className="text-sm text-gray-600">
                      I will collect in person or use my own courier. (Free)
                    </span>
                    {invoice.shippingStatus === "SelfArranged" && (
                      <span className="mt-2 text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Summary
              </h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {typeof invoice.bidAmount === "number" && (
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          Hammer (Winning Bid)
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(invoice.bidAmount)}
                        </td>
                      </tr>
                    )}
                    {invoice.buyersPremium && invoice.buyersPremium > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          Auction site additional charges
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(invoice.buyersPremium)}
                        </td>
                      </tr>
                    )}
                    {invoice.taxAmount && invoice.taxAmount > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700">Tax</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(invoice.taxAmount)}
                        </td>
                      </tr>
                    )}
                    {invoice.quotedShippingPrice &&
                      invoice.quotedShippingPrice > 0 && (
                        <tr>
                          <td className="px-4 py-3 text-sm text-purple-600 font-medium">
                            Shipping & Handling
                          </td>
                          <td className="px-4 py-3 text-sm text-purple-600 text-right font-bold">
                            {formatCurrency(invoice.quotedShippingPrice)}
                          </td>
                        </tr>
                      )}
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        Invoice Total
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                    </tr>
                    {invoice.status === "Unpaid" && (
                      <tr className="bg-yellow-50">
                        <td className="px-4 py-3 text-sm font-bold text-red-600">
                          Balance Due
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">
                          {formatCurrency(invoice.totalAmount)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status */}
            {invoice.status === "Unpaid" && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-2xl font-bold text-red-600 text-center">
                  UNPAID
                </p>
              </div>
            )}

            {invoice.status === "Paid" && invoice.paidAt && (
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-lg font-semibold text-green-800 mb-2">
                  PAID
                </p>
                <p className="text-sm text-green-700">
                  Paid At: {formatDate(invoice.paidAt)}
                </p>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Notes:
                </h3>
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            )}

            {/* Payment Instructions */}
            {invoice.status === "Unpaid" && (
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Payment Instructions:
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Please complete your payment within 7 days to secure your
                  purchase.
                </p>
                {invoice.shippingStatus === "Requested" ? (
                  <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg border border-blue-200">
                    <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                    <div>
                      <p className="font-bold text-blue-900">
                        Shipping Quote Pending
                      </p>
                      <p className="text-sm text-blue-700">
                        We are calculating the best rate for you. Payment will
                        be enabled once the quote is ready.
                      </p>
                    </div>
                  </div>
                ) : (
                  invoice.stripePaymentLink && (
                    <a
                      href={invoice.stripePaymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-200 transform hover:-translate-y-0.5"
                    >
                      Pay {formatCurrency(invoice.totalAmount)} Now
                    </a>
                  )
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <Button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloading ? "Downloading..." : "Download PDF"}
              </Button>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
