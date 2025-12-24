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

interface Auction {
  id: string | number;
  name: string;
  description?: string;
  location: string;
  status: 'Upcoming' | 'Active' | 'Ended';
  startDate: string | Date;
  endDate: string | Date;
  categoryId?: string;
  category?: { id: string; name: string };
  tags?: { name: string }[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface AuctionFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  categoryId: string;
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
      return res.data.success ? res.data.data : [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (auctionData: AuctionFormData) => axios.post(`${API_BASE_URL}/auction`, auctionData, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: AuctionFormData }) => axios.put(`${API_BASE_URL}/auction/${id}`, data, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      setEditingAuction(null);
      setIsDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (auctionId: string | number) => axios.delete(`${API_BASE_URL}/auction/${auctionId}`, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              Add New Auction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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