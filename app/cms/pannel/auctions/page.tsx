'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AuctionForm from '@/components/cms/auction/AuctionForm';
import AuctionList from '@/components/cms/auction/AuctionList';
import AuctionItemForm from '@/components/cms/auction-items/AuctionItemForm';
import { API_BASE_URL } from '@/lib/api';
import toast from 'react-hot-toast';

interface Auction {
  id: string | number;
  name: string;
  description?: string;
  location: string;
  status?: 'Upcoming' | 'Live' | 'Closed';
  categoryId?: string;
  category?: { id: string; name: string };
  imageUrl?: string;
  tags?: { name: string }[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface AuctionFormData {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  imageUrl?: string;
  tags: { name: string }[];
}

interface AuctionItem {
  name: string;
  description: string;
  auctionId: string;
  shipping?: {
    address: string;
    cost: number;
    deliveryTime: string;
  };
  terms: string;
  baseBidPrice: number;
  buyersPremium?: number;
  taxPercentage?: number;
  currentBid?: number;
  estimatedPrice?: number;
  productImages: { url: string; altText: string }[];
}

export default function AuctionsPage() {
  const { user } = useUser();
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState<boolean>(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | number | null>(null);
  const queryClient = useQueryClient();

  const { data: auctions = [], isLoading: loading } = useQuery<Auction[]>({
    queryKey: ['auctions'],
    queryFn: async (): Promise<Auction[]> => {
      const res = await axios.get(`${API_BASE_URL}/auction`, { withCredentials: true });
      // API returns array directly, not wrapped in success/data object
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!user,
  });

  const createItemMutation = useMutation({
    mutationFn: (itemData: AuctionItem) => axios.post(`${API_BASE_URL}/auction-item`, itemData, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['auction-items'] });
      setIsItemDialogOpen(false);
      setSelectedAuctionId(null);
      toast.success('Auction item created successfully!');
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to create auction item';
      if (error instanceof Error) {
        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.error ||
                        error.response?.data?.errors?.[0]?.message ||
                        error.message;
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    },
  });

  const createMutation = useMutation({
    mutationFn: (auctionData: AuctionFormData) => axios.post(`${API_BASE_URL}/auction`, auctionData, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      setIsDialogOpen(false);
      toast.success('Auction lot created successfully!');
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to create auction';
      if (error instanceof Error) {
        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.error ||
                        error.response?.data?.details?.[0]?.message ||
                        error.message;
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: AuctionFormData }) => axios.patch(`${API_BASE_URL}/auction/${id}`, data, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      setEditingAuction(null);
      setIsDialogOpen(false);
      toast.success('Auction lot updated successfully!');
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to update auction';
      if (error instanceof Error) {
        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.error ||
                        error.response?.data?.details?.[0]?.message ||
                        error.message;
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (auctionId: string | number) => axios.delete(`${API_BASE_URL}/auction/${auctionId}`, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      toast.success('Auction lot deleted successfully!');
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to delete auction';
      if (error instanceof Error) {
        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.error || error.message;
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    },
  });

  const statusUpdateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: 'Upcoming' | 'Live' | 'Closed' }) => 
      axios.patch(`${API_BASE_URL}/auction/${id}`, { status }, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      toast.success('Auction status updated successfully!');
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to update auction status';
      if (error instanceof Error) {
        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.error ||
                        error.response?.data?.details?.[0]?.message ||
                        error.message;
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    },
  });

  const handleEdit = (auction: Auction) => {
    setEditingAuction(auction);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (auctionData: AuctionFormData) => {
    if (editingAuction) {
      updateMutation.mutate({ id: editingAuction.id, data: auctionData });
    } else {
      createMutation.mutate(auctionData);
    }
  };

  const handleAddItem = (auctionId: string | number) => {
    setSelectedAuctionId(auctionId);
    setIsItemDialogOpen(true);
  };

  const handleItemFormSubmit = async (itemData: AuctionItem) => {
    if (selectedAuctionId) {
      createItemMutation.mutate({
        ...itemData,
        auctionId: selectedAuctionId.toString(),
      });
    }
  };

  const handleStatusChange = async (auctionId: string | number, newStatus: 'Upcoming' | 'Live' | 'Closed') => {
    statusUpdateMutation.mutate({ id: auctionId, status: newStatus });
  };

  // const handleDialogClose = () => {
  //   setEditingAuction(null);
  //   setIsDialogOpen(false);
  // };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Auction Lots Management</h1>
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingAuction(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              Add New Auction Lot 
            </Button>
          </DialogTrigger>
          <DialogContent style={{ maxWidth: '700px' }} className=" max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle>
                {editingAuction ? 'Edit Auction Lot' : 'Create New Auction Lot'}
              </DialogTitle>
            </DialogHeader>
            <AuctionForm
              onSubmit={handleFormSubmit}
              initialData={editingAuction || {}}
              isEditing={!!editingAuction}
              auctionId={editingAuction?.id?.toString()}
            />
          </DialogContent>
        </Dialog>
      </div>

      <AuctionList
        auctions={auctions}
        onEdit={handleEdit}
        onDelete={async (id) => { await deleteMutation.mutateAsync(id); }}
        onAddItem={handleAddItem}
        onStatusChange={handleStatusChange}
        loading={loading}
      />

      {/* Auction Item Dialog */}
      <Dialog 
        open={isItemDialogOpen} 
        onOpenChange={(open) => {
          setIsItemDialogOpen(open);
          if (!open) {
            setSelectedAuctionId(null);
          }
        }}
      >
        <DialogContent style={{ maxWidth: '700px' }} className="max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle>Create New Auction Item</DialogTitle>
          </DialogHeader>
          {selectedAuctionId && (
            <AuctionItemForm
              onSubmit={handleItemFormSubmit}
              initialData={{ auctionId: selectedAuctionId.toString() }}
              isEditing={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}