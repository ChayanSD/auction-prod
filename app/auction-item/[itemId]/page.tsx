import AuctionItemDetail from '@/components/AuctionItemDetail/AuctionItemDetail';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auction Item - Super Media Bros',
  description: 'View auction item details and place your bid.',
};

export default async function AuctionItemPage({
  params,
}: {
  params: Promise<{ itemId: string }> | { itemId: string };
}) {
  // Handle both async (Next.js 15+) and sync params
  const resolvedParams = params instanceof Promise ? await params : params;
  return <AuctionItemDetail itemId={resolvedParams.itemId} />;
}

