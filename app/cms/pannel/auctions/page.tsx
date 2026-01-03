'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AuctionForm from '@/components/cms/auction/AuctionForm';
import AuctionList from '@/components/cms/auction/AuctionList';
import { API_BASE_URL } from '@/lib/api';
import toast from 'react-hot-toast';

interface Auction {
  id: string | number;
  name: string;
  description?: string;
  location: string;
  status: 'Draft' | 'Upcoming' | 'Active' | 'Ended' | 'Cancelled';
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
  status: string;
  categoryId: string;
  imageUrl?: string;
  tags: { name: string }[];
}

export default function AuctionsPage() {
  const { user } = useUser();
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
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

  const createMutation = useMutation({
    mutationFn: (auctionData: AuctionFormData) => axios.post(`${API_BASE_URL}/auction`, auctionData, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      setIsDialogOpen(false);
      toast.success('Auction created successfully!');
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
      toast.success('Auction updated successfully!');
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
      toast.success('Auction deleted successfully!');
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
        <h1 className="text-3xl font-bold text-gray-900">Auctions Management</h1>
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
              Add New Auction
            </Button>
          </DialogTrigger>
          <DialogContent style={{ maxWidth: '700px' }} className=" max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle>
                {editingAuction ? 'Edit Auction' : 'Create New Auction'}
              </DialogTitle>
            </DialogHeader>
            <AuctionForm
              onSubmit={handleFormSubmit}
              initialData={editingAuction || {}}
              isEditing={!!editingAuction}
            />
          </DialogContent>
        </Dialog>
      </div>

      <AuctionList
        auctions={auctions}
        onEdit={handleEdit}
        onDelete={async (id) => { await deleteMutation.mutateAsync(id); }}
        loading={loading}
      />
    </div>
  );
}