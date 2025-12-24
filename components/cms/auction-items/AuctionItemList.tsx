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
  id: string;
  name: string;
}

interface AuctionItem {
  id: string;
  name: string;
  description: string;
  auctionId: string;
  auction?: Auction;
  shipping?: {
    address: string;
    cost: number;
    deliveryTime: string;
  };
  terms: string;
  baseBidPrice: number;
  additionalFee?: number;
  currentBid?: number;
  estimatedPrice?: number;
  productImages: { url: string; altText: string }[];
  createdAt: string;
}

interface Props {
  auctionItems: AuctionItem[];
  onEdit: (item: AuctionItem) => void;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

export default function AuctionItemList({ auctionItems, onEdit, onDelete, loading }: Props) {
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleDelete = (itemId: string) => {
    setItemToDelete(itemId);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      setDeleteLoading(itemToDelete);
      setShowModal(false);
      try {
        await onDelete(itemToDelete);
      } catch (error) {
        console.error('Error deleting auction item:', error);
      } finally {
        setDeleteLoading(null);
        setItemToDelete(null);
      }
    }
  };

  const cancelDelete = () => {
    setShowModal(false);
    setItemToDelete(null);
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
        <h3 className="text-lg font-semibold mb-4">All Auction Items</h3>
        {auctionItems.length === 0 ? (
          <p className="text-gray-500">No auction items found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Auction</TableHead>
                <TableHead>Base Bid Price</TableHead>
                <TableHead>Current Bid</TableHead>
                <TableHead>Estimated Price</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auctionItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.auction?.name || 'N/A'}</TableCell>
                  <TableCell>${item.baseBidPrice}</TableCell>
                  <TableCell>${item.currentBid}</TableCell>
                  <TableCell>${item.estimatedPrice}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteLoading === item.id}
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
              Are you sure you want to delete this auction item? This action cannot be undone.
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