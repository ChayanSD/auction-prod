/**
 * Utility functions for lot number formatting and cleaning
 */

/**
 * Cleans a lot number by removing any existing "Lot" prefix (case insensitive)
 * @param lotNumber - The lot number string from the database
 * @returns Cleaned lot number without "Lot" prefix
 */
export function cleanLotNumber(lotNumber: string | null | undefined): string | null {
  if (!lotNumber) return null;
  
  // Remove "Lot" prefix if it exists (case insensitive, with or without spaces)
  return lotNumber.replace(/^Lot\s+/i, '').trim() || lotNumber.trim();
}

/**
 * Formats a lot number for display with "Lot #" prefix
 * @param lotNumber - The lot number string from the database (can be null/undefined)
 * @returns Formatted lot number with "Lot #" prefix, or null if no lot number
 */
export function formatLotNumber(lotNumber: string | null | undefined): string | null {
  const cleaned = cleanLotNumber(lotNumber);
  return cleaned ? `Lot #${cleaned}` : null;
}

/**
 * Gets just the lot number value without any prefix (for display in badges/tags)
 * @param lotNumber - The lot number string from the database
 * @returns Just the lot number value, or null if no lot number
 */
export function getLotNumberValue(lotNumber: string | null | undefined): string | null {
  return cleanLotNumber(lotNumber);
}
