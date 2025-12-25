'use client';

import { Suspense } from 'react';
import AuctionPage from '@/components/AuctionPage/AuctionPage';

/**
 * Auction Listing Page Route
 * Wrapped in Suspense for useSearchParams
 */
function AuctionPageWrapper() {
  return <AuctionPage />;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuctionPageWrapper />
    </Suspense>
  );
}
