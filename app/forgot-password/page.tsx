'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PremiumLoader from '@/components/shared/PremiumLoader';
import { apiClient } from '@/lib/fetcher';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email });
      toast.success('If an account exists with this email, an OTP has been sent.');
      // Navigate to OTP verification page with email
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast.error(error?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PremiumLoader text="Sending OTP..." />;
  }

  return (
    <>
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
                <h2>Forgot Password</h2>
              </div>

              <p className="text-gray-600 mb-6 text-sm md:text-base">
                Enter your email address and we&apos;ll send you a 4-digit OTP code to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                <div className="flex flex-col">
                  <label htmlFor="email" className="mb-2 text-sm md:text-base font-semibold">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                    required
                    disabled={loading}
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white py-2.5 md:py-3 rounded-full bg-gradient-to-br from-[#E95AFF] to-[#9F13FB] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm md:text-base transition-all hover:shadow-lg active:scale-95"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>

                <div className="text-center text-sm md:text-base">
                  Remember your password?{' '}
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
                <h2>Forgot Password</h2>
              </div>

              <p className="text-gray-600 mb-6 text-base">
                Enter your email address and we&apos;ll send you a 4-digit OTP code to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col">
                  <label htmlFor="email-desktop" className="mb-2 text-base font-semibold">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email-desktop"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                    required
                    disabled={loading}
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white py-3 rounded-full bg-gradient-to-br from-[#E95AFF] to-[#9F13FB] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base transition-all hover:shadow-lg active:scale-95"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>

                <div className="text-center text-base">
                  Remember your password?{' '}
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
    </>
  );
}

