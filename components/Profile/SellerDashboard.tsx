"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Package,
  FileText,
  AlertTriangle,
  Upload,
  CheckCircle,
  Eye,
  Download,
  Plus,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import ProfileWrapper from "./ProfileWrapper";
import { downloadSettlementPDF, viewSettlementPDF } from "@/lib/pdf-settlement";
import AuctionRequestForm from "../shared/AuctionRequestForm";

// Placeholder components for the tabs
const OverviewTab = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    activeItems: 0,
    pendingPayout: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/seller/stats");
      setStats(res.data);
    } catch (e) {
      console.error("Failed to fetch seller stats", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-xl font-bold mb-4">
        Welcome back, {user?.firstName || "Partner"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="text-sm text-purple-600 font-medium mb-1">
            Total Sales
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {loading ? "..." : `£${stats.totalSales.toFixed(2)}`}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="text-sm text-blue-600 font-medium mb-1">
            Active Items
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {loading ? "..." : stats.activeItems}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="text-sm text-green-600 font-medium mb-1">
            Pending Payout
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {loading ? "..." : `£${stats.pendingPayout.toFixed(2)}`}
          </div>
        </div>
      </div>

      {user?.sellerStatus !== "Approved" && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-yellow-800">Verification Required</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Your seller account is currently{" "}
              {user?.sellerStatus || "Pending Approval"}. You&apos;ll be able to
              list items for auction once our team has verified your documents.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const BankDetailsTab = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    bankName: "",
    bankAccount: "",
    bankSortCode: "",
    companyName: "",
    taxId: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/api/seller/profile");
        setFormData({
          bankName: res.data.bankName || "",
          bankAccount: res.data.bankAccount || "",
          bankSortCode: res.data.bankSortCode || "",
          companyName: res.data.companyName || "",
          taxId: res.data.taxId || "",
        });
      } catch (error) {
        console.error("Error fetching bank details:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.patch("/api/seller/profile", formData);
      toast.success("Details updated successfully");
    } catch (error) {
      toast.error("Failed to update details");
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="p-12 text-center text-gray-500">Loading details...</div>
    );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50/50">
        <h3 className="text-lg font-bold text-gray-900">
          Financial Information
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Manage where you receive your auction proceeds.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Company Name (If applicable)
            </label>
            <input
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Legal Entity Name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              VAT / Tax ID
            </label>
            <input
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h4 className="font-bold text-gray-900 mb-4">Bank Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Bank Name
              </label>
              <input
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="e.g. Barclays, HSBC"
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <label className="text-sm font-semibold text-gray-700">
                Account Number / IBAN
              </label>
              <input
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Sort Code / Swift Code
              </label>
              <input
                name="bankSortCode"
                value={formData.bankSortCode}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2 bg-[#9F13FB] text-white rounded-lg font-bold hover:bg-[#E95AFF] transition-all disabled:opacity-50"
          >
            {loading ? "Saving..." : "Update Details"}
          </button>
        </div>
      </form>
    </div>
  );
};

const DocumentsTab = ({ user }: { user: any }) => {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState<string>("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get("/api/seller/documents");
      const docs = response.data;
      if (Array.isArray(docs)) {
        setDocuments(docs);
      }
    } catch (error) {
      console.error("Failed to fetch documents", error);
    }
  };

  const handleUploadClick = (type: string) => {
    setActiveUploadType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadType) return;

    setLoading(true);
    const toastId = toast.loading("Uploading document...");

    try {
      // 1. Upload File
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes: any = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      }).then((r) => r.json());

      if (uploadRes.error) throw new Error(uploadRes.error);

      // 2. Link Document
      await axios.post("/api/seller/documents", {
        type: activeUploadType,
        url: uploadRes.url,
      });

      // 3. Refresh
      await fetchDocuments();
      toast.success("Document uploaded successfully", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Upload failed", { id: toastId });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getDocStatus = (type: string) => {
    const doc = documents.find((d) => d.type === type);
    if (!doc) return null;
    return (
      <span
        className={`text-xs px-2 py-1 rounded-full font-medium ${
          doc.status === "Approved"
            ? "bg-green-100 text-green-800"
            : doc.status === "Rejected"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {doc.status}
      </span>
    );
  };

  const isUploaded = (type: string) => documents.some((d) => d.type === type);

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,.pdf"
        onChange={handleFileChange}
      />

      {user?.sellerStatus !== "Approved" && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle
                className="h-5 w-5 text-yellow-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Please upload your Proof of Identity and Proof of Address to
                start selling. Your account is currently{" "}
                <span className="font-bold">
                  {user?.sellerStatus || "Pending Approval"}
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            Required Documents
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            We are required by law to verify the identity of our sellers.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Document Item 1 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full border ${isUploaded("Identity") ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}
              >
                {isUploaded("Identity") ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">Identity Proof</h4>
                  {getDocStatus("Identity")}
                </div>
                <p className="text-xs text-gray-500">
                  Passport or Driver&apos;s License
                </p>
              </div>
            </div>
            <button
              onClick={() => handleUploadClick("Identity")}
              disabled={loading || isUploaded("Identity")}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {isUploaded("Identity") ? "Uploaded" : "Upload"}
            </button>
          </div>

          {/* Document Item 2 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full border ${isUploaded("ProofOfAddress") ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}
              >
                {isUploaded("ProofOfAddress") ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">
                    Proof of Address
                  </h4>
                  {getDocStatus("ProofOfAddress")}
                </div>
                <p className="text-xs text-gray-500">
                  Utility Bill or Bank Statement (Recent)
                </p>
              </div>
            </div>
            <button
              onClick={() => handleUploadClick("ProofOfAddress")}
              disabled={loading || isUploaded("ProofOfAddress")}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {isUploaded("ProofOfAddress") ? "Uploaded" : "Upload"}
            </button>
          </div>
        </div>
      </div>

      {/* Additional Documents Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Additional Documents
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Contracts, agreements, and other requested files.
            </p>
          </div>
          <button
            onClick={() => handleUploadClick("Contract")}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        </div>
        <div className="p-6">
          {documents.filter((d) => d.type === "Contract" || d.type === "Other")
            .length === 0 ? (
            <p className="text-gray-400 text-sm italic">
              No additional documents.
            </p>
          ) : (
            <div className="space-y-3">
              {documents
                .filter((d) => d.type === "Contract" || d.type === "Other")
                .map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-full border border-gray-200 text-gray-500">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-sm text-gray-900">
                            {doc.type}
                          </h5>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${doc.status === "Approved" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
                          >
                            {doc.status}
                          </span>
                          {(doc as any).providedByAdmin && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                              Admin Uploaded
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 text-sm hover:underline"
                    >
                      View
                    </a>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ConsignmentsTab = ({ user }: { user: any }) => {
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Submit New Item</h3>
            <p className="text-sm text-gray-500 mt-1">
              Provide details and photos of the item you wish to auction.
            </p>
          </div>
          <button
            onClick={() => setShowForm(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
        <AuctionRequestForm
          compact
          onSuccess={() => {
            setShowForm(false);
            toast.success(
              "Request submitted! You can see it in 'My Items' once approved.",
            );
          }}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Package className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900">No Items Yet</h3>
      <p className="text-gray-500 mt-2 max-w-sm mx-auto">
        {user?.sellerStatus === "Approved"
          ? "You have no active consignments. Start by submitting a new item for valuation."
          : "Once your account is verified, you can submit items for auction valuation here."}
      </p>
      <button
        className="mt-6 px-6 py-2 bg-[#9F13FB] text-white rounded-lg font-medium hover:bg-[#E95AFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
        disabled={user?.sellerStatus !== "Approved"}
        onClick={() => setShowForm(true)}
      >
        <Plus className="w-4 h-4" />
        Submit New Item
      </button>
    </div>
  );
};

const SettlementsTab = () => {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const response = await axios.get("/api/seller/settlements");
        setSettlements(response.data);
      } catch (error) {
        console.error("Error fetching settlements:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettlements();
  }, []);

  const handleDownload = (settlement: any) => {
    // We need to fetch full details first if the listing doesn't have them
    // For now, assume listing API has enough or we call the full detail
    downloadSettlementPDF(settlement);
  };

  const handleView = (settlement: any) => {
    viewSettlementPDF(settlement);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">
          Settlement Statements
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Historical records of your auction payouts and item reports.
        </p>
      </div>

      {settlements.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            No settlement statements generated yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Net Payout</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {settlements.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {s.reference}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(s.generatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-purple-600">
                    £{s.netPayout.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleView(s)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(s)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default function SellerDashboard() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Use tab from URL or default to overview
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update tab if URL changes
  React.useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      ["overview", "consignments", "documents", "settlements"].includes(tab)
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/profile?${params.toString()}`, { scroll: false });
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "consignments", label: "My Items", icon: Package },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "settlements", label: "Settlements", icon: CheckCircle },
    { id: "bank", label: "Bank Details", icon: FileText },
  ];

  return (
    <ProfileWrapper>
      <div className="flex flex-col lg:flex-row gap-8 bg-gray-50/50 min-h-[600px]">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
            <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
              <h2 className="font-bold text-lg">
                {user?.companyName || "Seller Portal"}
              </h2>
              <div className="flex items-center gap-2 mt-2 text-xs opacity-80">
                <span
                  className={`w-2 h-2 rounded-full ${user?.sellerStatus === "Approved" ? "bg-green-400" : "bg-yellow-400"}`}
                ></span>
                {user?.sellerStatus || "Pending"}
              </div>
            </div>
            <nav className="p-2 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? "bg-purple-50 text-[#9F13FB]"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 mt-auto border-t border-gray-100">
              <div className="text-xs text-gray-400">
                Seller ID:{" "}
                <span className="font-mono text-gray-600">
                  {user?.id?.slice(-6)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "documents" && <DocumentsTab user={user} />}
          {activeTab === "consignments" && <ConsignmentsTab user={user} />}
          {activeTab === "settlements" && <SettlementsTab />}
          {activeTab === "bank" && <BankDetailsTab />}
        </div>
      </div>
    </ProfileWrapper>
  );
}
