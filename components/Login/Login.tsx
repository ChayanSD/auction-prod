'use client'

import  { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUser as useUserAPI } from '@/lib/useUser';
import { useUser } from '@/contexts/UserContext';
import toast, { Toaster } from 'react-hot-toast';
import PremiumLoader from '@/components/shared/PremiumLoader';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType: string;
  isVerified: boolean;
  stripeCustomerId: string | null;
};

export default function Login() {
    const { login, getUser } = useUserAPI();
    const { user: contextUser, setUser: setContextUser, refreshUser, loading: contextLoading } = useUser();
    const [user, setUser] = useState<User | null>(null);
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [accepted, setAccepted] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [redirecting, setRedirecting] = useState(false)

    const router = useRouter()

    const toggleShow = () => setShowPassword((show) => !show)

    // Check if user is already logged in via UserContext
    useEffect(() => {
        if (!contextLoading && contextUser) {
            setRedirecting(true);
            // Small delay to show loader
            const timer = setTimeout(() => {
                if (contextUser.accountType === 'Admin') {
                    router.push('/cms/pannel');
                } else {
                    router.push('/profile');
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [contextUser, contextLoading, router]);

    useEffect(() => {
        const checkUser = async () => {
            const u = await getUser();
            if (u) {
                setUser(u);
            }
        };
        // Only check if contextUser is not available
        if (!contextUser && !contextLoading) {
            checkUser();
        }
    }, [getUser, contextUser, contextLoading]);

    useEffect(() => {
        if (user && !redirecting && !contextUser) {
            if (user.accountType === 'Admin') {
                router.push('/cms/pannel');
            } else {
                router.push('/profile');
            }
        }
    }, [user, router, redirecting, contextUser]);


    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!accepted) {
            toast.error('Please accept terms and conditions');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const response = await login({ email, password });
            
            // Convert response user to match UserContext type
            const contextUser = {
                id: response.user.id,
                stripeCustomerId: response.user.stripeCustomerId,
                accountType: response.user.accountType,
                firstName: response.user.firstName,
                middleName: null,
                lastName: response.user.lastName,
                email: response.user.email,
                phone: '',
                termsAccepted: true,
                newsletter: false,
                isVerified: response.user.isVerified,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Update UserContext immediately
            setContextUser(contextUser);
            setUser(response.user);
            toast.success('Login successful!');
            
            // Show premium loader
            setRedirecting(true);
            
            // Wait for cookie propagation and verify session
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Refresh user from server to ensure cookie is set
            try {
                await refreshUser();
            } catch (err) {
                console.error('Failed to refresh user, but continuing...', err);
            }
            
            // Additional small delay to ensure everything is ready
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Redirect based on account type
            if (response.user.accountType === 'Admin') {
                router.push('/cms/pannel');
            } else {
                router.push('/profile');
            }
        } catch (error: any) {
            let errorMessage = 'Login failed. Please try again.';
            
            // Handle API error responses
            if (error?.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error?.data?.error) {
                errorMessage = error.data.error;
            } else if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            toast.error(errorMessage);
            setError(errorMessage);
            setRedirecting(false);
        } finally {
            setLoading(false);
        }
    }

    // Show loader if redirecting or checking authentication for already logged in user
    if (redirecting && contextUser) {
        return <PremiumLoader text="Redirecting to dashboard..." />;
    }

    return (
        <>
            {redirecting && <PremiumLoader text="Setting up your account..." />}
            <div className="min-h-screen bg-[#F2F0E9] overflow-x-hidden">
                {/* Mobile/Tablet: Single column with optional background */}
                <div className="lg:hidden min-h-screen flex flex-col">
                    {/* Background image overlay for mobile/tablet */}
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
                                <h2>Login into Your Account</h2>
                            </div>

                            <form onSubmit={onSubmit} className="space-y-4 md:space-y-5">
                                {/* Display error message if login fails */}
                                {error && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="flex flex-col">
                                    <label htmlFor="email" className="mb-2 text-sm md:text-base font-semibold">Email Address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="flex flex-col relative">
                                    <label htmlFor="password" className="mb-2 text-sm md:text-base font-semibold">Password</label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 pr-10 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                                            required
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={toggleShow}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                                            disabled={loading}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={accepted}
                                        onChange={(e) => setAccepted(e.target.checked)}
                                        className="w-4 h-4"
                                        disabled={loading}
                                    />
                                    <label htmlFor="terms" className="text-sm md:text-base">I accept the <Link href="/terms" className='underline hover:text-[#9F13FB] transition-colors'>terms and conditions</Link></label>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full text-white py-2.5 md:py-3 rounded-full bg-gradient-to-br from-[#E95AFF] to-[#9F13FB] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm md:text-base transition-all hover:shadow-lg active:scale-95"
                                    >
                                        {loading ? 'Logging in...' : 'Login Now'}
                                    </button>
                                </div>

                                <div className="text-center text-sm md:text-base">
                                    Don&apos;t have an account?{' '}
                                    <Link href="/signup" className="text-[#0E0E0E] underline font-semibold hover:text-[#9F13FB] transition-colors">
                                        Create an account
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Desktop: Two column layout - 1024px and above */}
                <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[965px_1fr] 2xl:grid-cols-[965px_1fr] min-h-screen overflow-x-hidden max-w-screen-2xl mx-auto">
                    <div className="bg-[#F2F0E9] flex flex-col items-center justify-center text-[#0E0E0E] px-4 xl:px-8">
                        <div className="bg-white border border-[#D4D0C5] rounded-3xl p-8 xl:p-10 w-full max-w-lg">
                            <div className="font-bold text-2xl xl:text-3xl mb-6 xl:mb-8">
                                <h2>Login into Your Account</h2>
                            </div>

                            <form onSubmit={onSubmit} className="space-y-4 xl:space-y-5">
                                {/* Display error message if login fails */}
                                {error && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="flex flex-col">
                                    <label htmlFor="email" className="mb-2 text-sm xl:text-base font-semibold">Email Address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="border border-[#E3E3E3] bg-[#F7F7F7] rounded px-3 py-2.5 xl:py-3 text-sm xl:text-base"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="flex flex-col relative">
                                    <label htmlFor="password" className="mb-2 text-sm xl:text-base font-semibold">Password</label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded px-3 py-2.5 xl:py-3 pr-10 text-sm xl:text-base"
                                            required
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={toggleShow}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                                            disabled={loading}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={accepted}
                                        onChange={(e) => setAccepted(e.target.checked)}
                                        className="w-4 h-4"
                                        disabled={loading}
                                    />
                                    <label htmlFor="terms" className="text-sm xl:text-base">I accept the <Link href="/terms" className='underline hover:text-[#9F13FB] transition-colors'>terms and conditions</Link></label>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full text-white py-2.5 xl:py-3 rounded-full bg-gradient-to-br from-[#E95AFF] to-[#9F13FB] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm xl:text-base lg:text-lg transition-all hover:shadow-lg active:scale-95"
                                    >
                                        {loading ? 'Logging in...' : 'Login Now'}
                                    </button>
                                </div>

                                <div className="text-center text-sm xl:text-base">
                                    Don&apos;t have an account?{' '}
                                    <Link href="/signup" className="text-[#0E0E0E] underline font-semibold hover:text-[#9F13FB] transition-colors">
                                        Create an account
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div 
                        className="hidden lg:block"
                        style={{
                            backgroundImage: "url('/image 67.png')",
                            backgroundPosition: 'center',
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                        }}
                    >
                    </div>
                </div>
            </div>
            <Toaster />
        </>
        )
    }