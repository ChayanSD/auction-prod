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
import { Edit, Trash2, Eye, Send } from 'lucide-react';
import ViewBidsDialog from './ViewBidsDialog';
import SendInvoiceDialog from './SendInvoiceDialog';

interface Auction {
  id: string;
  name: string;
}

// Keep this in sync with AuctionItemsPage's AuctionItem (no start/end/status fields)
interface AuctionItemRow {
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
  reservePrice?: number;
  buyersPremium?: number;
  taxPercentage?: number;
  currentBid?: number;
  estimatedPrice?: number;
  productImages: { url: string; altText: string | null }[];
  createdAt: string;
}

interface Props {
  auctionItems: AuctionItemRow[];
  onEdit: (item: AuctionItemRow) => void;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

export default function AuctionItemList({ auctionItems, onEdit, onDelete, loading }: Props) {
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewBidsItemId, setViewBidsItemId] = useState<string | null>(null);
  const [sendInvoiceItemId, setSendInvoiceItemId] = useState<string | null>(null);

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
                <TableHead>Auction Lot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Base Bid Price</TableHead>
                <TableHead>Reserve Price</TableHead>
                <TableHead>Current Bid</TableHead>
                {/* <TableHead>Estimated Price</TableHead> */}
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auctionItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.auction?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      Linked to: {item.auction?.name || 'Auction'}
                    </span>
                  </TableCell>
                  <TableCell>£{item.baseBidPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    {item.reservePrice ? `£${item.reservePrice.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>£{(item.currentBid || 0).toFixed(2)}</TableCell>
                  {/* <TableCell>£{(item.estimatedPrice || 0).toFixed(2)}</TableCell> */}
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewBidsItemId(item.id)}
                        title="View Bids"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSendInvoiceItemId(item.id)}
                        title="Send Invoice"
                        className="text-green-600 hover:text-green-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(item)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteLoading === item.id}
                        title="Delete"
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

      {/* View Bids Dialog */}
      {viewBidsItemId && (
        <ViewBidsDialog
          itemId={viewBidsItemId}
          open={!!viewBidsItemId}
          onClose={() => setViewBidsItemId(null)}
        />
      )}

      {/* Send Invoice Dialog */}
      {sendInvoiceItemId && (
        <SendInvoiceDialog
          itemId={sendInvoiceItemId}
          open={!!sendInvoiceItemId}
          onClose={() => setSendInvoiceItemId(null)}
        />
      )}
    </>
  );
}