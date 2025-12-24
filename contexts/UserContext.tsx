"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/fetcher';

export type User = {
  id: string;
  stripeCustomerId: string | null;
  accountType: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  phone: string;
  termsAccepted: boolean;
  newsletter: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

interface UserContextType {
  user: User | null;
  logout: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const sessionUser = await apiClient.get<User | null>('/auth/session');
        setUser(sessionUser);
      } catch (error) {
        console.error('Failed to fetch user session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout', {});
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};