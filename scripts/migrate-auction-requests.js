/**
 * Migration script to clean up old auction_requests data
 * Run this before applying the new schema
 * 
 * Usage: node scripts/migrate-auction-requests.js
 */

const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log('Cleaning up old auction_requests data...');
    
    // Delete all old auction requests
    const result = await prisma.$executeRaw`
      DELETE FROM auction_requests;
    `;
    
    console.log(`Cleaned up old auction request records.`);
    console.log('✅ You can now run: npx prisma db push');
    
  } catch (error) {
    console.error('Error cleaning up:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();

