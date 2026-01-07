'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PremiumLoader from '@/components/shared/PremiumLoader';

/**
 * Category route redirects to auction page
 * Categories have been removed - redirecting to main auction page
 */
export default function CategoryAuctionsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main auction page
    router.replace('/auction');
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      <PremiumLoader text="Redirecting to auctions..." />
    </div>
  );
}
