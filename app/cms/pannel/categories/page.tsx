'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CategoryForm from '@/components/cms/category/CategoryForm';
import CategoryList from '@/components/cms/category/CategoryList';
import { API_BASE_URL } from '@/lib/api';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function CategoriesPage() {
  const { user } = useUser();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/category`, { withCredentials: true });
      // API returns array directly, not wrapped in success/data object
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (categoryData: { name: string }) => axios.post(`${API_BASE_URL}/category`, { body: categoryData }, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsDialogOpen(false);
      toast.success('Category created successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.response?.data?.errors?.[0]?.message || error?.message || 'Failed to create category';
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) => axios.put(`${API_BASE_URL}/category/${id}`, { body: data }, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingCategory(null);
      setIsDialogOpen(false);
      toast.success('Category updated successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.response?.data?.errors?.[0]?.message || error?.message || 'Failed to update category';
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => axios.delete(`${API_BASE_URL}/category/${categoryId}`, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete category';
      toast.error(errorMessage);
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (categoryData: { name: string }) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: categoryData });
    } else {
      createMutation.mutate(categoryData);
    }
  };

  // const handleDialogClose = () => {
  //   setEditingCategory(null);
  //   setIsDialogOpen(false);
  // };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Categories Management</h1>
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingCategory(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              Add New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
            </DialogHeader>
            <CategoryForm
              onSubmit={handleFormSubmit}
              initialData={editingCategory || {}}
              isEditing={!!editingCategory}
            />
          </DialogContent>
        </Dialog>
      </div>

      <CategoryList
        categories={categories}
        onEdit={handleEdit}
        onDelete={async (id) => { await deleteMutation.mutateAsync(id); }}
        loading={loading}
      />
    </div>
  );
}