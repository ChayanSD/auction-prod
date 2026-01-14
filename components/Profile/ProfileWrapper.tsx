'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import PremiumLoader from '@/components/shared/PremiumLoader';

interface ProfileWrapperProps {
  children: React.ReactNode;
}

/**
 * Profile Wrapper Component
 * Provides header and layout for profile page
 * Pixel-perfect design matching Figma
 */
const ProfileWrapper: React.FC<ProfileWrapperProps> = ({ children }) => {
  const { user, logout, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  if (loading) {
    return <PremiumLoader text="Loading your account..." />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to access this page.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-[#9F13FB] text-white rounded-full hover:bg-[#E95AFF] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const userName = user?.firstName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F2F0E9] to-white overflow-x-hidden">
      {/* Header Section */}
      <Header />

      {/* Spacer for fixed header */}
      {/* <div className="h-16 lg:h-20"></div> */}

      <main className="max-w-6xl xl:max-w-300 mx-auto px-4 py-10 md:px-6 md:py-10 lg:px-10 lg:py-8">
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

