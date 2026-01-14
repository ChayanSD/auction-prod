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
 * Calculates the new display price (current bid) based on two competing max bids and an optional reserve price.
 * 
 * @param highestBid The amount of the highest max bid
 * @param secondHighestBid The amount of the second highest max bid (0 if none)
 * @param basePrice The manual start price of the item
 * @param reservePrice Optional reserve price (hidden floor)
 */
export function calculateNewCurrentBid(
  highestBid: number,
  secondHighestBid: number,
  basePrice: number,
  reservePrice: number | null = null
): number {
  let tentativePrice = basePrice;
  
  if (secondHighestBid > 0) {
    // Standard competition logic
    const increment = getBidIncrement(secondHighestBid);
    tentativePrice = Math.min(secondHighestBid + increment, highestBid);
  } else {
    // Only one bidder (highestBid)
    // Price starts at basePrice
    tentativePrice = basePrice;
  }
  
  // Reserve Logic:
  // If the highest bidder has met or exceeded the reserve price,
  // the displayed price must be at least the reserve price.
  if (reservePrice && highestBid >= reservePrice) {
    tentativePrice = Math.max(tentativePrice, reservePrice);
  }
  
  // Final safety: Price used cannot exceed the highest bid (unless reserve forces it? No, max bid is ceiling)
  // Actually, if Max Bid >= Reserve, we set Price = Reserve.
  // Exception: If current tentative price (due to competition) is HIGHER than Reserve, we keep that.
  
  return Math.min(tentativePrice, highestBid);
}
