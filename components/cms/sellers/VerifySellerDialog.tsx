import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

interface SellerDocument {
  id: string;
  type: string;
  url: string;
  status: string;
  createdAt: string;
}

interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  sellerStatus: string;
  infoDocuments: SellerDocument[];
}

interface VerifySellerDialogProps {
  seller: Seller | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function VerifySellerDialog({
  seller,
  onClose,
  onUpdate,
}: VerifySellerDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!seller) return null;

  const handleStatusUpdate = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cms/sellers/${seller.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`Seller ${status} successfully`);
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setLoading(true);
    const toastId = toast.loading("Deleting document...");
    try {
      const res = await fetch(
        `/api/cms/sellers/${seller.id}/documents/${docId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) throw new Error("Failed to delete document");

      toast.success("Document deleted", { id: toastId });
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete document", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!seller} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Verify Seller: {seller.companyName}</DialogTitle>
          <DialogDescription>
            Review the documents and approve or reject the seller account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Applicant Name
              </p>
              <p className="font-semibold">
                {seller.firstName} {seller.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="font-semibold">{seller.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Current Status
              </p>
              <Badge>{seller.sellerStatus}</Badge>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Submitted Documents</h4>
              <div className="flex items-center gap-2">
                <select
                  id="admin-doc-type"
                  className="text-xs border rounded px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-purple-500"
                  defaultValue="Contract"
                >
                  <option value="Contract">Contract</option>
                  <option value="Identity">Identity (KYC)</option>
                  <option value="ProofOfAddress">Address (KYC)</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="file"
                  id="admin-upload"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const type = (
                      document.getElementById(
                        "admin-doc-type",
                      ) as HTMLSelectElement
                    ).value;
                    const toastId = toast.loading(`Uploading ${type}...`);
                    setLoading(true);

                    try {
                      const { uploadToCloudinary } =
                        await import("@/lib/cloudinary");
                      const uploadRes = await uploadToCloudinary(file, {
                        folder: "seller-documents",
                      });

                      const res = await fetch(
                        `/api/cms/sellers/${seller.id}/documents`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            type,
                            url: uploadRes.secure_url,
                            name: file.name,
                          }),
                        },
                      );

                      if (!res.ok) throw new Error("Failed to save document");

                      toast.success(`${type} uploaded successfully`, {
                        id: toastId,
                      });
                      onUpdate();
                    } catch (error) {
                      console.error(error);
                      toast.error("Upload failed", { id: toastId });
                    } finally {
                      setLoading(false);
                      // Reset input
                      e.target.value = "";
                    }
                  }}
                  disabled={loading}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg text/plain"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("admin-upload")?.click()
                  }
                  disabled={loading}
                >
                  + Upload
                </Button>
              </div>
            </div>
            {seller.infoDocuments.length === 0 ? (
              <p className="text-sm text-gray-500">
                No documents uploaded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {seller.infoDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-sm">{doc.type}</div>
                      <Badge variant="outline" className="text-xs">
                        {doc.status}
                      </Badge>
                      {(doc as any).providedByAdmin && (
                        <Badge className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
                          Admin Upload
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-600 hover:underline cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Document
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                        onClick={() => handleDocumentDelete(doc.id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleStatusUpdate("Rejected")}
            disabled={loading || seller.sellerStatus === "Rejected"}
          >
            Reject
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleStatusUpdate("Approved")}
            disabled={loading || seller.sellerStatus === "Approved"}
          >
            Approve Seller
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
