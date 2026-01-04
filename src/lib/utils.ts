import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely convert token amount from smallest unit to human-readable format
 * Uses BigInt to handle large numbers without precision loss
 * 
 * @param amount - Amount in smallest unit (string or number)
 * @param decimals - Number of decimal places (default 8 for MOVE)
 * @returns Number in human-readable format
 */
export function fromSmallestUnit(amount: string | number | bigint, decimals: number = 8): number {
  try {
    const amountBigInt = typeof amount === 'bigint' ? amount : BigInt(amount.toString());
    const divisor = BigInt(10 ** decimals);
    const wholePart = amountBigInt / divisor;
    const remainder = amountBigInt % divisor;
    const decimalPart = Number(remainder) / (10 ** decimals);
    return Number(wholePart) + decimalPart;
  } catch {
    return 0;
  }
}

/**
 * Format token balance with appropriate decimal places
 * Removes trailing zeros for cleaner display
 * 
 * @param amount - Amount in smallest unit (string or number)
 * @param decimals - Number of decimal places (default 8 for MOVE)
 * @param displayDecimals - Maximum number of decimals to display (default 8)
 * @returns Formatted string without trailing zeros
 */
export function formatTokenBalance(amount: string | number | bigint, decimals: number = 8, displayDecimals: number = 8): string {
  const value = fromSmallestUnit(amount, decimals);
  if (value === 0) return '0';
  if (value < 0.0001) return '<0.0001';
  
  // Format with appropriate precision
  let formatted: string;
  if (value < 1) {
    // For small values, show up to displayDecimals (default 8)
    formatted = value.toFixed(Math.min(displayDecimals, 8));
  } else if (value < 1000) {
    // For medium values, show up to displayDecimals (default 8)
    formatted = value.toFixed(Math.min(displayDecimals, 6));
  } else {
    // For large values, show up to 4 decimals
    formatted = value.toFixed(4);
  }
  
  // Remove trailing zeros and unnecessary decimal point
  return formatted.replace(/\.?0+$/, '');
}

/**
 * Format a number value (already converted from smallest unit) with trailing zero removal
 * Use this for values that are already in human-readable format
 * 
 * @param value - Numeric value (already converted)
 * @param maxDecimals - Maximum decimals to show (default 8)
 * @returns Formatted string without trailing zeros
 */
export function formatNumber(value: number, maxDecimals: number = 8): string {
  if (value === 0) return '0';
  if (value < 0.0001) return '<0.0001';
  
  // Format with appropriate precision
  let formatted: string;
  if (value < 1) {
    formatted = value.toFixed(Math.min(maxDecimals, 8));
  } else if (value < 1000) {
    formatted = value.toFixed(Math.min(maxDecimals, 6));
  } else {
    formatted = value.toFixed(Math.min(maxDecimals, 4));
  }
  
  // Remove trailing zeros and unnecessary decimal point
  return formatted.replace(/\.?0+$/, '');
}
