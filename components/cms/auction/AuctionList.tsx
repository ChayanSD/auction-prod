'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit, Trash2 } from 'lucide-react';

interface Auction {
  id: string | number;
  name: string;
  location: string;
  // status: 'Draft' | 'Upcoming' | 'Active' | 'Ended' | 'Cancelled';
  category?: { id: string; name: string };
}

interface AuctionListProps {
  auctions: Auction[];
  onEdit: (auction: Auction) => void;
  onDelete: (auctionId: string | number) => Promise<void>;
  loading: boolean;
}

export default function AuctionList({ auctions, onEdit, onDelete, loading }: AuctionListProps) {
  const [deleteLoading, setDeleteLoading] = useState<string | number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [auctionToDelete, setAuctionToDelete] = useState<string | number | null>(null);

  const handleDelete = (auctionId: string | number) => {
    setAuctionToDelete(auctionId);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (auctionToDelete) {
      setDeleteLoading(auctionToDelete);
      setShowModal(false);
      try {
        await onDelete(auctionToDelete);
      } catch (error) {
        console.error('Error deleting auction:', error);
      } finally {
        setDeleteLoading(null);
        setAuctionToDelete(null);
      }
    }
  };

  const cancelDelete = () => {
    setShowModal(false);
    setAuctionToDelete(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'Upcoming':
        return <Badge variant="secondary">Upcoming</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">All Auctions</h3>
        {auctions.length === 0 ? (
          <p className="text-gray-500">No auctions found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auctions.map((auction) => (
                <TableRow key={auction.id}>
                  <TableCell className="font-medium">{auction.name}</TableCell>
                  <TableCell>{auction.location}</TableCell>
                  {/* <TableCell>{getStatusBadge(auction.status)}</TableCell> */}
                  <TableCell>{auction.category?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(auction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(auction.id)}
                        disabled={deleteLoading === auction.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this auction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}