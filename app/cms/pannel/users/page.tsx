'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useUser } from '@/contexts/UserContext';
import UserList from '@/components/cms/user/UserList';
import { API_BASE_URL } from '@/lib/api';
import { Search, X } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  phone?: string | null;
  accountType: string;
  isVerified: boolean;
  stripeCustomerId?: string | null;
  termsAccepted?: boolean;
  newsletter?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  billingAddress?: any;
  shippingAddress?: any;
}

export default function Users(){
    const { user } = useUser();
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
    const [verifiedFilter, setVerifiedFilter] = useState<string>('all');

    const { data: users = [], isLoading: loading } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async (): Promise<User[]> => {
            const res = await axios.get(`${API_BASE_URL}/user`, { withCredentials: true });
            // API returns array directly, not wrapped in success/data object
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: !!user,
    });
    
    // Filter users
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            // Search filter
            const matchesSearch = 
                !searchTerm ||
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Account type filter
            const matchesAccountType = 
                accountTypeFilter === 'all' || 
                user.accountType === accountTypeFilter;
            
            // Verified filter
            const matchesVerified = 
                verifiedFilter === 'all' ||
                (verifiedFilter === 'verified' && user.isVerified) ||
                (verifiedFilter === 'unverified' && !user.isVerified);
            
            return matchesSearch && matchesAccountType && matchesVerified;
        });
    }, [users, searchTerm, accountTypeFilter, verifiedFilter]);

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Users Management</h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage all platform users</p>
                </div>
                <div className="text-sm text-gray-600">
                    Total: <span className="font-semibold text-gray-900">{filteredUsers.length}</span>
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
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                        />
                    </div>

                    {/* Account Type Filter */}
                    <div>
                        <select
                            value={accountTypeFilter}
                            onChange={(e) => setAccountTypeFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                        >
                            <option value="all">All Account Types</option>
                            <option value="Bidding">Bidding</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    {/* Verified Filter */}
                    <div>
                        <select
                            value={verifiedFilter}
                            onChange={(e) => setVerifiedFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                        >
                            <option value="all">All Users</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                        </select>
                    </div>
                </div>

                {/* Clear Filters */}
                {(searchTerm || accountTypeFilter !== 'all' || verifiedFilter !== 'all') && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setAccountTypeFilter('all');
                            setVerifiedFilter('all');
                        }}
                        className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Clear Filters
                    </button>
                )}
            </div>

            <UserList users={filteredUsers} loading={loading} />
        </div>
    )
}