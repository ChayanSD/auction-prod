"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/fetcher";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import VerifySellerDialog from "@/components/cms/sellers/VerifySellerDialog";

export default function SellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const selectedSeller = sellers.find((s) => s.id === selectedSellerId);

  const fetchSellers = async () => {
    try {
      const data = await apiClient.get<any[]>("/cms/sellers");
      if (Array.isArray(data)) {
        setSellers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Seller Management
          </h1>
          <p className="text-muted-foreground">
            Verify and manage seller accounts.
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : sellers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No seller accounts found.
                </TableCell>
              </TableRow>
            ) : (
              sellers.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell className="font-medium">
                    {seller.companyName || "N/A"}
                  </TableCell>
                  <TableCell>
                    {seller.firstName} {seller.lastName}
                  </TableCell>
                  <TableCell>{seller.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        seller.sellerStatus === "Approved"
                          ? "default"
                          : seller.sellerStatus === "Rejected"
                            ? "destructive"
                            : "secondary"
                      }
                      className={
                        seller.sellerStatus === "Approved"
                          ? "bg-green-600"
                          : seller.sellerStatus === "Pending"
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : ""
                      }
                    >
                      {seller.sellerStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {seller.infoDocuments?.length || 0} Submitted
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSellerId(seller.id)}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedSeller && (
        <VerifySellerDialog
          seller={selectedSeller}
          onClose={() => setSelectedSellerId(null)}
          onUpdate={fetchSellers}
        />
      )}
    </div>
  );
}
