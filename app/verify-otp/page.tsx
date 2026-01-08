'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PremiumLoader from '@/components/shared/PremiumLoader';
import { apiClient } from '@/lib/fetcher';

function VerifyOTPContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(120); // Start with 2 minutes (120 seconds)
  const [otpExpiryTimer, setOtpExpiryTimer] = useState(120); // OTP expiry timer (2 minutes)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP expiry timer - starts when page loads
  useEffect(() => {
    if (otpExpiryTimer > 0) {
      const timer = setTimeout(() => setOtpExpiryTimer(otpExpiryTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // OTP expired
      toast.error('OTP has expired. Please request a new one.');
    }
  }, [otpExpiryTimer]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      router.push('/forgot-password');
    }
  }, [email, router]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, ''); // Only numbers
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4).replace(/\D/g, '');
    if (pastedData.length === 4) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[3]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 4) {
      toast.error('Please enter a valid 4-digit OTP');
      return;
    }

    if (otpExpiryTimer === 0) {
      toast.error('OTP has expired. Please request a new one.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post<{ resetToken: string }>('/auth/verify-otp', {
        email,
        otp: otpString,
      });
      
      toast.success('OTP verified successfully!');
      // Navigate to reset password page with email and reset token
      router.push(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(response.resetToken)}`);
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error?.message || 'Invalid OTP. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      toast.success('OTP has been resent to your email');
      setResendCooldown(120); // 2 minutes cooldown
      setOtpExpiryTimer(120); // Reset OTP expiry timer
      setOtp(['', '', '', '']); // Clear OTP inputs
      inputRefs.current[0]?.focus(); // Focus first input
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast.error(error?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !resendCooldown) {
    return <PremiumLoader text="Verifying OTP..." />;
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
              <h2>Verify OTP</h2>
            </div>

            <p className="text-gray-600 mb-2 text-sm md:text-base">
              We&apos;ve sent a 4-digit OTP code to:
            </p>
            <p className="text-[#9F13FB] font-semibold mb-2 text-sm md:text-base">
              {email}
            </p>
            
            {/* OTP Expiry Timer */}
            <div className="mb-6 text-center">
              {otpExpiryTimer > 0 ? (
                <p className="text-sm md:text-base">
                  <span className="text-gray-600">OTP expires in: </span>
                  <span className={`font-bold ${otpExpiryTimer <= 30 ? 'text-red-500' : 'text-[#9F13FB]'}`}>
                    {Math.floor(otpExpiryTimer / 60)}:{(otpExpiryTimer % 60).toString().padStart(2, '0')}
                  </span>
                </p>
              ) : (
                <p className="text-sm md:text-base text-red-500 font-semibold">
                  OTP has expired. Please request a new one.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <div className="flex flex-col">
                <label className="mb-3 text-sm md:text-base font-semibold text-center">
                  Enter OTP Code
                </label>
                <div className="flex justify-center gap-3 md:gap-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-14 h-14 md:w-16 md:h-16 text-center text-2xl md:text-3xl font-bold border-2 border-[#E3E3E3] bg-[#F7F7F7] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-[#9F13FB] transition-all"
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 4 || otpExpiryTimer === 0}
                  className="w-full text-white py-2.5 md:py-3 rounded-full bg-gradient-to-br from-[#E95AFF] to-[#9F13FB] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm md:text-base transition-all hover:shadow-lg active:scale-95"
                >
                  {loading ? 'Verifying...' : otpExpiryTimer === 0 ? 'OTP Expired' : 'Verify OTP'}
                </button>
              </div>

              <div className="text-center text-sm md:text-base space-y-2">
                <p className="text-gray-600">
                  Didn&apos;t receive the code?{' '}
                  {resendCooldown > 0 ? (
                    <span className="text-gray-500">
                      Resend in {Math.floor(resendCooldown / 60)}:{(resendCooldown % 60).toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-[#9F13FB] underline font-semibold hover:text-[#E95AFF] transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
                <div>
                  <Link href="/forgot-password" className="text-[#0E0E0E] underline font-semibold hover:text-[#9F13FB] transition-colors">
                    Change Email
                  </Link>
                </div>
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
              <h2>Verify OTP</h2>
            </div>

            <p className="text-gray-600 mb-2 text-base">
              We&apos;ve sent a 4-digit OTP code to:
            </p>
            <p className="text-[#9F13FB] font-semibold mb-2 text-base">
              {email}
            </p>
            
            {/* OTP Expiry Timer */}
            <div className="mb-6 text-center">
              {otpExpiryTimer > 0 ? (
                <p className="text-base">
                  <span className="text-gray-600">OTP expires in: </span>
                  <span className={`font-bold ${otpExpiryTimer <= 30 ? 'text-red-500' : 'text-[#9F13FB]'}`}>
                    {Math.floor(otpExpiryTimer / 60)}:{(otpExpiryTimer % 60).toString().padStart(2, '0')}
                  </span>
                </p>
              ) : (
                <p className="text-base text-red-500 font-semibold">
                  OTP has expired. Please request a new one.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col">
                <label className="mb-4 text-base font-semibold text-center">
                  Enter OTP Code
                </label>
                <div className="flex justify-center gap-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-16 h-16 text-center text-3xl font-bold border-2 border-[#E3E3E3] bg-[#F7F7F7] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-[#9F13FB] transition-all"
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 4 || otpExpiryTimer === 0}
                  className="w-full text-white py-3 rounded-full bg-gradient-to-br from-[#E95AFF] to-[#9F13FB] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base transition-all hover:shadow-lg active:scale-95"
                >
                  {loading ? 'Verifying...' : otpExpiryTimer === 0 ? 'OTP Expired' : 'Verify OTP'}
                </button>
              </div>

              <div className="text-center text-base space-y-2">
                <p className="text-gray-600">
                  Didn&apos;t receive the code?{' '}
                  {resendCooldown > 0 ? (
                    <span className="text-gray-500">
                      Resend in {Math.floor(resendCooldown / 60)}:{(resendCooldown % 60).toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-[#9F13FB] underline font-semibold hover:text-[#E95AFF] transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
                <div>
                  <Link href="/forgot-password" className="text-[#0E0E0E] underline font-semibold hover:text-[#9F13FB] transition-colors">
                    Change Email
                  </Link>
                </div>
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

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<PremiumLoader text="Loading..." />}>
      <VerifyOTPContent />
    </Suspense>
  );
}

