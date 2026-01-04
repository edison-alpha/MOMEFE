import { useState, useEffect } from 'react';
import { getSwapQuote, SUPPORTED_TOKENS } from '@/lib/razor-swap';

// Global cache for MOVE price
let cachedMovePrice: number = 0;
let lastFetchTime: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Fetch MOVE price from Razor DEX
const fetchMovePrice = async (): Promise<number> => {
  // Use cache if still valid
  if (cachedMovePrice > 0 && Date.now() - lastFetchTime < CACHE_DURATION) {
    return cachedMovePrice;
  }

  try {
    const moveToken = SUPPORTED_TOKENS.find(t => t.symbol === 'MOVE');
    const usdtToken = SUPPORTED_TOKENS.find(t => t.symbol === 'tUSDT');
    
    if (moveToken && usdtToken) {
      const quote = await getSwapQuote(moveToken, usdtToken, '1');
      if (quote) {
        cachedMovePrice = parseFloat(quote.outputAmount);
        lastFetchTime = Date.now();
        return cachedMovePrice;
      }
    }
  } catch (error) {
    console.error('Error fetching MOVE price from Razor:', error);
  }
  
  return cachedMovePrice || 0;
};

export const useUsdConversion = (moveAmount: number) => {
  const [usdValue, setUsdValue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const convertToUsd = async () => {
      try {
        setIsLoading(true);
        const price = await fetchMovePrice();
        if (price > 0) {
          setUsdValue(moveAmount * price);
        } else {
          setUsdValue(null);
        }
      } catch (error) {
        console.error('Error converting to USD:', error);
        setUsdValue(null);
      } finally {
        setIsLoading(false);
      }
    };

    convertToUsd();
  }, [moveAmount]);

  return { usdValue, isLoading };
};

export const formatUsd = (amount: number | null): string => {
  if (amount === null) return '~$...';
  if (amount < 0.01) return '~$<0.01';
  return `~$${amount.toFixed(2)}`;
};

// Get current cached price (for sync access)
export const getCachedMovePrice = (): number => cachedMovePrice;
