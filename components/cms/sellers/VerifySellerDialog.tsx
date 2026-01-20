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
              <div>
                <input
                  type="file"
                  id="admin-upload"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const toastId = toast.loading("Uploading document...");
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
                            type: "Contract", // Default to Contract for admin uploads
                            url: uploadRes.secure_url,
                            name: file.name,
                          }),
                        },
                      );

                      if (!res.ok) throw new Error("Failed to save document");

                      toast.success("Document uploaded successfully", {
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
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("admin-upload")?.click()
                  }
                  disabled={loading}
                >
                  + Upload Contract
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
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Document
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">No URL</span>
                    )}
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
