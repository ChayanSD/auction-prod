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
import { Edit, Trash2, Plus } from 'lucide-react';

interface Auction {
  id: string | number;
  name: string;
  location: string;
  status?: 'Upcoming' | 'Live' | 'Closed';
  description?: string;
  imageUrl?: string;
  tags?: { name: string }[];
  items?: { id: string }[];
  _count?: {
    items: number;
  };
}

interface AuctionListProps {
  auctions: Auction[];
  onEdit: (auction: Auction) => void;
  onDelete: (auctionId: string | number) => Promise<void>;
  onAddItem: (auctionId: string | number) => void;
  onStatusChange: (auctionId: string | number, newStatus: 'Upcoming' | 'Live' | 'Closed') => Promise<void>;
  loading: boolean;
}

export default function AuctionList({ auctions, onEdit, onDelete, onAddItem, onStatusChange, loading }: AuctionListProps) {
  const [deleteLoading, setDeleteLoading] = useState<string | number | null>(null);
  const [statusLoading, setStatusLoading] = useState<string | number | null>(null);
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

  const handleStatusChange = async (auctionId: string | number, newStatus: 'Upcoming' | 'Live' | 'Closed') => {
    setStatusLoading(auctionId);
    try {
      await onStatusChange(auctionId, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setStatusLoading(null);
    }
  };

  const getStatusBadgeClass = (status: string | undefined) => {
    switch (status) {
      case 'Live':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Upcoming':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Closed':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
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
        <h3 className="text-lg font-semibold mb-4">All Auction Lots</h3>
        {auctions.length === 0 ? (
          <p className="text-gray-500">No auction lots found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Total Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auctions.map((auction) => {
                const itemsCount = auction._count?.items || auction.items?.length || 0;
                const currentStatus = auction.status || 'Upcoming';
                return (
                  <TableRow key={auction.id}>
                    <TableCell className="font-medium">{auction.name}</TableCell>
                    <TableCell>{auction.location}</TableCell>
                    <TableCell>{itemsCount}</TableCell>
                    <TableCell>
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(auction.id, e.target.value as 'Upcoming' | 'Live' | 'Closed')}
                        disabled={statusLoading === auction.id}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium border cursor-pointer transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${getStatusBadgeClass(currentStatus)}`}
                        title={statusLoading === auction.id ? 'Updating status...' : 'Click to change status'}
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Live">Live</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onAddItem(auction.id)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
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
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this auction lot? This action cannot be undone.
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