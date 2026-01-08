'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import PremiumLoader from '@/components/shared/PremiumLoader';
import { apiClient } from '@/lib/fetcher';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  const resetToken = searchParams.get('token') || '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if no email or token
  useEffect(() => {
    if (!email || !resetToken) {
      router.push('/forgot-password');
    }
  }, [email, resetToken, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Client-side validation
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      toast.error('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast.error('Password must contain at least one number');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      toast.error('Password must contain at least one special character');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/reset-password', {
        email,
        resetToken,
        newPassword,
        confirmPassword,
      });
      
      toast.success('Password reset successfully! You can now login with your new password.');
      router.push('/login');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PremiumLoader text="Resetting password..." />;
  }

  return (
    <div className="min-h-screen bg-[#F2F0E9] overflow-x-hidden">
      {/* Mobile/Tablet: Single column */}
      <div className="lg:hidden min-h-screen flex flex-col">
        <div
          className="absolute inset-0 opacity-10 lg:opacity-0 pointer-events-none"
          style={{
            backgroundImage: "url('/image 67.png')",
            backgroundPosition: "center",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        />
        
        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8 md:px-8 md:py-12 text-[#0E0E0E] flex-1">
          <div className="w-full max-w-2xl bg-white border border-[#D4D0C5] rounded-xl md:rounded-3xl p-6 md:p-8 lg:p-10 shadow-lg">
            <div className="font-bold text-2xl md:text-3xl mb-6 md:mb-8">
              <h2>Reset Password</h2>
            </div>

            <p className="text-gray-600 mb-6 text-sm md:text-base">
              Enter your new password below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <div className="flex flex-col relative">
                <label htmlFor="newPassword" className="mb-2 text-sm md:text-base font-semibold">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 pr-10 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                    required
                    disabled={loading}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                    disabled={loading}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              <div className="flex flex-col relative">
                <label htmlFor="confirmPassword" className="mb-2 text-sm md:text-base font-semibold">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 pr-10 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                    required
                    disabled={loading}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white py-2.5 md:py-3 rounded-full bg-gradient-to-br from-[#E95AFF] to-[#9F13FB] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm md:text-base transition-all hover:shadow-lg active:scale-95"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>

              <div className="text-center text-sm md:text-base">
                <Link href="/login" className="text-[#0E0E0E] underline font-semibold hover:text-[#9F13FB] transition-colors">
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Desktop: Two column layout */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[965px_1fr] 2xl:grid-cols-[965px_1fr] min-h-screen overflow-x-hidden max-w-screen-2xl mx-auto">
        <div className="bg-[#F2F0E9] flex flex-col items-center justify-center text-[#0E0E0E] px-4 xl:px-8">
          <div className="bg-white border border-[#D4D0C5] rounded-3xl p-8 xl:p-10 w-full max-w-lg">
            <div className="font-bold text-2xl xl:text-3xl mb-6 xl:mb-8">
              <h2>Reset Password</h2>
            </div>

            <p className="text-gray-600 mb-6 text-base">
              Enter your new password below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col relative">
                <label htmlFor="newPassword-desktop" className="mb-2 text-base font-semibold">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="newPassword-desktop"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-4 py-3.5 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                    required
                    disabled={loading}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                    disabled={loading}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              <div className="flex flex-col relative">
                <label htmlFor="confirmPassword-desktop" className="mb-2 text-base font-semibold">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword-desktop"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-4 py-3.5 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                    required
                    disabled={loading}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white py-3 rounded-full bg-gradient-to-br from-[#E95AFF] to-[#9F13FB] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base transition-all hover:shadow-lg active:scale-95"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>

              <div className="text-center text-base">
                <Link href="/login" className="text-[#0E0E0E] underline font-semibold hover:text-[#9F13FB] transition-colors">
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div
          className="hidden lg:block bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/image 67.png')",
          }}
        />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PremiumLoader text="Loading..." />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

