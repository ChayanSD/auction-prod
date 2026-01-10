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
import { Badge } from '@/components/ui/badge';
import UserModal from './UserModal';

interface User {
  id: string;
  stripeCustomerId?: string | null;
  accountType: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  phone?: string | null;
  termsAccepted?: boolean;
  newsletter?: boolean;
  isVerified: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface UserListProps {
  users: User[];
  loading: boolean;
}

export default function UserList({ users, loading }: UserListProps) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
    };

    const closeModal = () => {
        setSelectedUser(null);
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
                <h3 className="text-lg font-semibold mb-4">All Users</h3>
                {users.length === 0 ? (
                    <p className="text-gray-500">No users found.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Account Type</TableHead>
                                <TableHead>Verified</TableHead>
                                <TableHead>Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow
                                    key={user.id}
                                    className="cursor-pointer hover:bg-gray-50"
                                    onClick={() => handleUserClick(user)}
                                >
                                    <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{user.accountType}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.isVerified ? "default" : "secondary"}>
                                            {user.isVerified ? 'Yes' : 'No'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
            {selectedUser && <UserModal user={selectedUser} onClose={closeModal} />}
        </>
    );
}