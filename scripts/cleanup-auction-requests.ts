/**
 * Migration script to clean up old auction_requests data
 * Run this before applying the new schema
 * 
 * Usage: npx tsx scripts/cleanup-auction-requests.ts
 */

import prisma from '../app/lib/prisma';

async function cleanup() {
  try {
    console.log('Cleaning up old auction_requests data...');
    
    const count = await prisma.auctionRequest.deleteMany({});
    
    console.log(`Deleted ${count.count} old auction request records.`);
    console.log('You can now run: npx prisma db push');
    
  } catch (error) {
    console.error('Error cleaning up:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();

