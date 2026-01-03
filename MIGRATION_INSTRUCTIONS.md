# Migration Instructions for Auction Requests

## Problem
The database schema has changed from storing Auction data to storing AuctionItem data, but the old data structure is still in the database, causing 500 errors.

## Solution

### Step 1: Clean up old data

**Option A: Use the cleanup API endpoint (Recommended)**
1. Make sure you're logged in as an Admin user
2. Open your browser's developer console (F12)
3. Run this command:
```javascript
fetch('/api/cleanup-auction-requests', { method: 'DELETE', credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Option B: Use Prisma Studio**
1. Run: `npx prisma studio`
2. Navigate to `auction_requests` table
3. Delete all records

**Option C: Direct SQL (if you have database access)**
```sql
DELETE FROM auction_requests;
```

### Step 2: Apply the new schema

```bash
npx prisma db push
npx prisma generate
```

### Step 3: Verify

Try submitting a new auction item request. It should work now.

### Step 4: Clean up (Optional)

After migration is complete, you can delete the cleanup endpoint:
```bash
rm app/api/cleanup-auction-requests/route.ts
```

