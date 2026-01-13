'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AuctionItemForm from '@/components/cms/auction-items/AuctionItemForm';
import AuctionItemList from '@/components/cms/auction-items/AuctionItemList';
import { API_BASE_URL } from '@/lib/api';
import toast from 'react-hot-toast';

interface Auction {
  id: string;
  name: string;
}

// Shape used in this CMS page and matches AuctionItemForm + API schema
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
  reservePrice?: number;
  buyersPremium?: number;
  taxPercentage?: number;
  currentBid?: number;
  estimatedPrice?: number;
  productImages: { url: string; altText: string }[];
  createdAt: string;
}

export default function AuctionItemsPage() {
  const { user } = useUser();
  const [editingItem, setEditingItem] = useState<AuctionItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const { data: auctionItems = [], isLoading: loading } = useQuery<AuctionItem[]>({
    queryKey: ['auction-items'],
    queryFn: async (): Promise<AuctionItem[]> => {
      const res = await axios.get(`${API_BASE_URL}/auction-item`, { withCredentials: true });
      // API returns array directly, not wrapped in success/data object
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (itemData: Omit<AuctionItem, 'id' | 'createdAt'>) => axios.post(`${API_BASE_URL}/auction-item`, itemData, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-items'] });
      setIsDialogOpen(false);
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<AuctionItem, 'id' | 'createdAt'> }) => axios.patch(`${API_BASE_URL}/auction-item/${id}`, data, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-items'] });
      setEditingItem(null);
      setIsDialogOpen(false);
      toast.success('Auction item updated successfully!');
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to update auction item';
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

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => axios.delete(`${API_BASE_URL}/auction-item/${itemId}`, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-items'] });
      toast.success('Auction item deleted successfully!');
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to delete auction item';
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

  const handleEdit = (item: AuctionItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (itemData: Omit<AuctionItem, 'id' | 'createdAt'>) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: itemData });
    } else {
      createMutation.mutate(itemData);
    }
  };

  // const handleDialogClose = () => {
  //   setEditingItem(null);
  //   setIsDialogOpen(false);
  // };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Auction Items Management</h1>
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingItem(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              Add New Auction Item
            </Button>
          </DialogTrigger>
          <DialogContent style={{ maxWidth: '700px' }} className=" max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Auction Item' : 'Create New Auction Item'}
              </DialogTitle>
            </DialogHeader>
            <AuctionItemForm
              onSubmit={handleFormSubmit}
              initialData={editingItem || {}}
              isEditing={!!editingItem}
            />
          </DialogContent>
        </Dialog>
      </div>

      <AuctionItemList
        auctionItems={auctionItems}
        onEdit={handleEdit}
        onDelete={async (id: string) => { await deleteMutation.mutateAsync(id); }}
        loading={loading}
      />
    </div>
  );
}