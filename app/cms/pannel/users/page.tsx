'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useUser } from '@/contexts/UserContext';
import UserList from '@/components/cms/user/UserList';
import { API_BASE_URL } from '@/lib/api';

export default function Users(){
    const { user } = useUser();

    const { data: users = [], isLoading: loading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE_URL}/user`, { withCredentials: true });
            // API returns array directly, not wrapped in success/data object
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: !!user,
    });

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
            </div>

            <UserList users={users} loading={loading} />
        </div>
    )
}