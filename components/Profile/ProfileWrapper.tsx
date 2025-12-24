'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '@/components/Header';

interface ProfileWrapperProps {
  children: React.ReactNode;
}

/**
 * Profile Wrapper Component
 * Provides header and layout for profile page
 * Pixel-perfect design matching Figma
 */
const ProfileWrapper: React.FC<ProfileWrapperProps> = ({ children }) => {
  const { user, logout } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  const userName = user?.firstName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F2F0E9] to-white overflow-x-hidden">
      {/* Header Section */}
      <Header />

      {/* Spacer for fixed header */}
      <div className="h-16 lg:h-20"></div>

      <main className="max-w-6xl xl:max-w-300 mx-auto px-6 lg:px-10 py-10 lg:py-0">
        {/* Header with welcome message and logout */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-10 lg:mb-12">
          <div>
            <p className="text-sm text-gray-600">Welcome {userName},</p>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
              My Account
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="self-start lg:self-auto flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </header>

        {children}
      </main>
    </div>
  );
};

export default ProfileWrapper;

