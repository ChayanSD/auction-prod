'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useUser } from '@/contexts/UserContext';
import { API_BASE_URL } from '@/lib/api';
import toast from 'react-hot-toast';
import { Mail, Phone, Calendar, MessageSquare, User, Search, Filter, X } from 'lucide-react';
import PremiumLoader from '@/components/shared/PremiumLoader';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  type: 'General' | 'Consignment' | 'Support' | 'Bidding' | 'Other';
  status: 'New' | 'InProgress' | 'Resolved' | 'Archived';
  userId: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  respondedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ContactsPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [notes, setNotes] = useState('');

  const { data: contacts = [], isLoading: loading } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: async (): Promise<Contact[]> => {
      const res = await axios.get(`${API_BASE_URL}/contact`, { withCredentials: true });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      axios.patch(
        `${API_BASE_URL}/contact/${id}`,
        { body: { status, notes } },
        { withCredentials: true }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact status updated successfully!');
      setSelectedContact(null);
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to update contact status';
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

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    const matchesType = typeFilter === 'all' || contact.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusUpdate = (contactId: string, newStatus: string) => {
    updateStatusMutation.mutate({
      id: contactId,
      status: newStatus,
      notes: notes || undefined,
    });
    setNotes('');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      New: 'bg-blue-100 text-blue-800 border-blue-200',
      InProgress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Resolved: 'bg-green-100 text-green-800 border-green-200',
      Archived: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return styles[status as keyof typeof styles] || styles.New;
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      General: 'bg-gray-100 text-gray-800',
      Consignment: 'bg-purple-100 text-purple-800',
      Support: 'bg-blue-100 text-blue-800',
      Bidding: 'bg-green-100 text-green-800',
      Other: 'bg-orange-100 text-orange-800',
    };
    return styles[type as keyof typeof styles] || styles.General;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <PremiumLoader text="Loading contacts..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Inquiries</h1>
          <p className="text-gray-600 mt-1">Manage all contact form submissions</p>
        </div>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold text-gray-900">{filteredContacts.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contacts..."
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
              <option value="New">New</option>
              <option value="InProgress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              <option value="General">General</option>
              <option value="Consignment">Consignment</option>
              <option value="Support">Support</option>
              <option value="Bidding">Bidding</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTypeFilter('all');
            }}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredContacts.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No contacts found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedContact(contact)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(contact.status)}`}>
                        {contact.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(contact.type)}`}>
                        {contact.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{contact.email}</span>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(contact.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{contact.subject}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{contact.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Contact Details</h2>
              <button
                onClick={() => {
                  setSelectedContact(null);
                  setNotes('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{selectedContact.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <a href={`mailto:${selectedContact.email}`} className="text-purple-600 hover:underline">
                    {selectedContact.email}
                  </a>
                </div>
                {selectedContact.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <a href={`tel:${selectedContact.phone}`} className="text-purple-600 hover:underline">
                      {selectedContact.phone}
                    </a>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(selectedContact.type)}`}>
                    {selectedContact.type}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedContact.status)}`}>
                    {selectedContact.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                  <p className="text-gray-900">
                    {new Date(selectedContact.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <p className="text-gray-900">{selectedContact.subject}</p>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedContact.message}</p>
              </div>

              {/* User Info (if logged in) */}
              {selectedContact.user && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">User Account</label>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900">
                      {selectedContact.user.firstName} {selectedContact.user.lastName}
                    </span>
                    <span className="text-gray-500">({selectedContact.user.email})</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  id="notes"
                  value={notes || selectedContact.notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Add notes about this contact..."
                />
              </div>

              {/* Status Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  {['New', 'InProgress', 'Resolved', 'Archived'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(selectedContact.id, status)}
                      disabled={updateStatusMutation.isPending}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedContact.status === status
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

