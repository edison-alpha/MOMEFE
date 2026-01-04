import { useState, useEffect, useCallback } from 'react';
import { getSwapQuote, SUPPORTED_TOKENS } from '@/lib/razor-swap';

// Global cache for MOVE price
let cachedPrice: number = 0;
let lastFetchTime: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

export function useMovePrice() {
  const [movePrice, setMovePrice] = useState<number>(cachedPrice);
  const [isLoading, setIsLoading] = useState<boolean>(cachedPrice === 0);

  const fetchPrice = useCallback(async () => {
    // Use cache if still valid
    if (cachedPrice > 0 && Date.now() - lastFetchTime < CACHE_DURATION) {
      setMovePrice(cachedPrice);
      setIsLoading(false);
      return;
    }

    try {
      const moveToken = SUPPORTED_TOKENS.find(t => t.symbol === 'MOVE');
      const usdtToken = SUPPORTED_TOKENS.find(t => t.symbol === 'tUSDT');
      
      if (moveToken && usdtToken) {
        const quote = await getSwapQuote(moveToken, usdtToken, '1');
        if (quote) {
          const price = parseFloat(quote.outputAmount);
          cachedPrice = price;
          lastFetchTime = Date.now();
          setMovePrice(price);
        }
      }
    } catch (error) {
      console.error('Error fetching MOVE price:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    
    // Refresh price every 30 seconds
    const interval = setInterval(fetchPrice, CACHE_DURATION);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  // Convert MOVE amount to USD
  const moveToUsd = useCallback((moveAmount: number): number => {
    if (movePrice <= 0) return 0;
    return moveAmount * movePrice;
  }, [movePrice]);

  // Format MOVE to USD string
  const formatMoveToUsd = useCallback((moveAmount: number): string => {
    if (movePrice <= 0) return '...';
    const usdValue = moveAmount * movePrice;
    if (usdValue < 0.01) return '<$0.01';
    return `$${usdValue.toFixed(2)}`;
  }, [movePrice]);

  return {
    movePrice,
    isLoading,
    moveToUsd,
    formatMoveToUsd,
    refetch: fetchPrice,
  };
}

// Helper function for components that don't use hooks
export function formatMoveAmount(amount: number | string, decimals: number = 8): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num / Math.pow(10, decimals);
}
