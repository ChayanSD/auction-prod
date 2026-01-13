/**
 * Auction Logic Utilities
 */

/**
 * Calculates the minimum bid increment based on the current price.
 * 
 * Rules:
 * £0–£50 → £2 increment
 * £51–£100 → £5 increment
 * £101–£250 → £10 increment
 * £251–£1000 → £25 increment
 * £1000+ → £50 increment
 */
export function getBidIncrement(currentPrice: number): number {
  if (currentPrice < 50) return 2;
  if (currentPrice < 100) return 5;
  if (currentPrice < 250) return 10;
  if (currentPrice < 1000) return 25;
  return 50;
}

/**
 * Calculates the next minimum valid bid amount.
 * It is simply currentPrice + increment.
 */
export function getNextMinimumBid(currentPrice: number): number {
  return currentPrice + getBidIncrement(currentPrice);
}

/**
 * Calculates the new display price (current bid) based on two competing max bids.
 * 
 * @param highestBid The amount of the highest max bid
 * @param secondHighestBid The amount of the second highest max bid (0 if none)
 * @param basePrice The manual start price of the item
 */
export function calculateNewCurrentBid(
  highestBid: number,
  secondHighestBid: number,
  basePrice: number
): number {
  // If there's no second bidder, the price is the base price 
  // UNLESS the base price is higher than the max bid (impossible typically, but safe to check)
  // OR if we want to start at basePrice.
  // Actually, standard proxy bidding:
  // If only one bidder: Current Bid = Base Price (or Starting Bid).
  // But if the bidder placed a max bid lower than base price (error), but let's assume valid.
  
  if (secondHighestBid === 0) {
    // If only one bidder, current price is the base price.
    // However, if the user bids, say, 200 on a 100 item, and it's the first bid,
    // The current price should settle at 100.
    // Ensure we don't go below basePrice.
    return Math.max(basePrice, 0); // Logic check: actually it should be basePrice.
    // But wait, if basePrice is 100, and I bid 200. Current is 100.
    // If basePrice is 100, and I bid 101. Current is 100.
  }

  // If there are two bidders:
  // Highest Bidder A: 200
  // Second Highest B: 120
  // Increment at 120 is 10 (range 101-250).
  // New Price = 120 + 10 = 130.
  
  // What if A: 125, B: 120?
  // Increment at 120 is 10. 120+10 = 130.
  // But A's max is only 125.
  // So result should be 125.
  
  const increment = getBidIncrement(secondHighestBid);
  const potentialPrice = secondHighestBid + increment;
  
  // The price cannot exceed the highest bidder's max bid.
  return Math.min(potentialPrice, highestBid);
}
