'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useUser } from '@/contexts/UserContext';
import { API_BASE_URL } from '@/lib/api';
import toast from 'react-hot-toast';
import { Calendar, User, Search, X, CheckCircle, XCircle, Image as ImageIcon, Tag, MapPin } from 'lucide-react';
import PremiumLoader from '@/components/shared/PremiumLoader';
import Image from 'next/image';

interface AuctionRequest {
  id: string;
  userId: string;
  name: string;
  description: string;
  auctionId: string;
  auction: {
    id: string;
    name: string;
    location?: string;
    category?: {
      id: string;
      name: string;
    };
  };
  startDate: string;
  endDate: string;
  baseBidPrice: number;
  additionalFee: number | null;
  estimatedPrice: number | null;
  shipping: {
    address: string;
    cost: number;
    deliveryTime?: string;
  } | null;
  terms: string | null;
  productImages: Array<{ url: string; altText?: string }> | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AuctionRequestsPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<AuctionRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notes, setNotes] = useState('');

  const { data: requests = [], isLoading: loading } = useQuery<AuctionRequest[]>({
    queryKey: ['auction-requests'],
    queryFn: async (): Promise<AuctionRequest[]> => {
      const res = await axios.get(`${API_BASE_URL}/auction-request`, { withCredentials: true });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!user,
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: 'approve' | 'reject'; notes?: string }) =>
      axios.patch(
        `${API_BASE_URL}/auction-request/${id}`,
        { action, notes },
        { withCredentials: true }
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction-requests'] });
      queryClient.invalidateQueries({ queryKey: ['auction-items'] }); // Refresh auction items list
      toast.success(
        variables.action === 'approve'
          ? 'Auction request approved and auction created successfully!'
          : 'Auction request rejected successfully!'
      );
      setSelectedRequest(null);
      setNotes('');
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to update auction request';
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

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${request.user.firstName} ${request.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleApprove = (requestId: string) => {
    updateRequestMutation.mutate({
      id: requestId,
      action: 'approve',
      notes: notes || undefined,
    });
  };

  const handleReject = (requestId: string) => {
    updateRequestMutation.mutate({
      id: requestId,
      action: 'reject',
      notes: notes || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Approved: 'bg-green-100 text-green-800 border-green-200',
      Rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return styles[status as keyof typeof styles] || styles.Pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <PremiumLoader text="Loading auction requests..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auction Requests</h1>
          <p className="text-gray-600 mt-1">Review and manage auction listing requests</p>
        </div>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold text-gray-900">{filteredRequests.length}</span>
          {' | '}
          Pending: <span className="font-semibold text-yellow-600">
            {requests.filter(r => r.status === 'Pending').length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || statusFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No auction requests found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{request.user.firstName} {request.user.lastName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        <span>{request.auction.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">${request.baseBidPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>
                  </div>
                  {request.productImages && request.productImages.length > 0 && (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <Image
                        src={request.productImages[0].url}
                        alt={request.productImages[0].altText || request.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Auction Request Details</h2>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setNotes('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <p className="text-gray-900 font-semibold">{selectedRequest.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auction</label>
                  <p className="text-gray-900">{selectedRequest.auction.name}</p>
                  {selectedRequest.auction.category && (
                    <p className="text-sm text-gray-600">{selectedRequest.auction.category.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Bid Price</label>
                  <p className="text-gray-900 font-semibold">${selectedRequest.baseBidPrice.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <p className="text-gray-900">
                    {new Date(selectedRequest.startDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <p className="text-gray-900">
                    {new Date(selectedRequest.endDate).toLocaleString()}
                  </p>
                </div>
                {selectedRequest.additionalFee && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Fee</label>
                    <p className="text-gray-900">${selectedRequest.additionalFee.toFixed(2)}</p>
                  </div>
                )}
                {selectedRequest.estimatedPrice && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Price</label>
                    <p className="text-gray-900">${selectedRequest.estimatedPrice.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted By</label>
                  <p className="text-gray-900">
                    {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedRequest.user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                  <p className="text-gray-900">
                    {new Date(selectedRequest.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedRequest.reviewedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reviewed At</label>
                    <p className="text-gray-900">
                      {new Date(selectedRequest.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>

              {/* Shipping */}
              {selectedRequest.shipping && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Information</label>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span className="font-semibold">Address:</span> {selectedRequest.shipping.address}</p>
                    <p><span className="font-semibold">Cost:</span> ${selectedRequest.shipping.cost.toFixed(2)}</p>
                    {selectedRequest.shipping.deliveryTime && (
                      <p><span className="font-semibold">Delivery Time:</span> {selectedRequest.shipping.deliveryTime}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Terms */}
              {selectedRequest.terms && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.terms}</p>
                </div>
              )}

              {/* Product Images */}
              {selectedRequest.productImages && selectedRequest.productImages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedRequest.productImages.map((image, index) => (
                      <div key={index} className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={image.url}
                          alt={image.altText || `${selectedRequest.name} - Image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes {selectedRequest.notes && <span className="text-gray-500">(Current: {selectedRequest.notes})</span>}
                </label>
                <textarea
                  id="notes"
                  value={notes || selectedRequest.notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Add notes about this request..."
                />
              </div>

              {/* Actions */}
              {selectedRequest.status === 'Pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={updateRequestMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-full hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve & Create Auction Item
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest.id)}
                    disabled={updateRequestMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-full hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Request
                  </button>
                </div>
              )}

              {selectedRequest.status !== 'Pending' && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    This request has already been {selectedRequest.status.toLowerCase()}.
                    {selectedRequest.notes && (
                      <span className="block mt-2 text-gray-900 font-medium">Notes: {selectedRequest.notes}</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

