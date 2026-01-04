import { useState, useEffect, useRef, useCallback } from 'react';
import { aptos } from '@/lib/aptos';

// Global event name for balance refresh
export const BALANCE_REFRESH_EVENT = 'refreshMoveBalance';

// MOVE token addresses
const MOVE_COIN_TYPE = '0x1::aptos_coin::AptosCoin';
// Fungible Asset MOVE - full 64-char hex format
const MOVE_FA_ADDRESS = '0x000000000000000000000000000000000000000000000000000000000000000a';

// Helper function to trigger global balance refresh
export const triggerBalanceRefresh = () => {
  window.dispatchEvent(new CustomEvent(BALANCE_REFRESH_EVENT));
};

// Indexer URL for Movement testnet
const INDEXER_URL = 'https://indexer.testnet.movementnetwork.xyz/v1/graphql';

export const useMovementBalance = (address: string | null) => {
  const [balance, setBalance] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(true);
  const isFirstLoad = useRef(true);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setBalance('0.00');
      setIsLoading(false);
      return;
    }

    // Only show loading on first load
    if (isFirstLoad.current) {
      setIsLoading(true);
    }

    try {
      let coinBalance = BigInt(0);
      let faBalance = BigInt(0);

      // 1. Get legacy Coin balance
      try {
        const resources = await aptos.getAccountResources({
          accountAddress: address,
        });

        const coinResource = resources.find(
          (r) => r.type === `0x1::coin::CoinStore<${MOVE_COIN_TYPE}>`
        );

        if (coinResource) {
          const coinData = coinResource.data as { coin: { value: string } };
          coinBalance = BigInt(coinData.coin.value);
        }
      } catch (e) {
        console.error('Error fetching Coin balance:', e);
      }

      // 2. Get Fungible Asset balance from indexer
      try {
        const response = await fetch(INDEXER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetAllFABalances($address: String!) {
                current_fungible_asset_balances(
                  where: { 
                    owner_address: { _eq: $address }
                  }
                ) {
                  amount
                  asset_type
                }
              }
            `,
            variables: { 
              address: address
            },
          }),
        });
        
        const data = await response.json();
        
        // Find MOVE FA balance - check multiple possible formats
        const faBalances = data.data?.current_fungible_asset_balances || [];
        
        // Find ALL MOVE FA balances (there might be multiple!)
        const moveFaBalances = faBalances.filter((b: any) => {
          const assetType = b.asset_type?.toLowerCase() || '';
          return assetType === '0xa' || 
                 assetType === '0x000000000000000000000000000000000000000000000000000000000000000a' ||
                 assetType.includes('aptos_coin') ||
                 assetType === '0x0a';
        });
        
        if (moveFaBalances.length > 0) {
          // If there are multiple MOVE FA entries, sum them (shouldn't happen but let's be safe)
          if (moveFaBalances.length > 1) {
            faBalance = moveFaBalances.reduce((sum: bigint, b: any) => sum + BigInt(b.amount), BigInt(0));
          } else {
            faBalance = BigInt(moveFaBalances[0].amount);
          }
        }
      } catch (e) {
        console.error('Error fetching FA balance:', e);
      }

      // Smart balance calculation with tolerance for sync lag
      let totalBalanceInOctas = BigInt(0);
      
      if (coinBalance === BigInt(0) && faBalance === BigInt(0)) {
        // Both empty
        totalBalanceInOctas = BigInt(0);
      } else if (coinBalance === BigInt(0)) {
        // Only FA has balance
        totalBalanceInOctas = faBalance;
      } else if (faBalance === BigInt(0)) {
        // Only Coin has balance
        totalBalanceInOctas = coinBalance;
      } else if (coinBalance === faBalance) {
        // Exactly same balance = they're synced, use one
        totalBalanceInOctas = faBalance;
      } else {
        // Check if they're "close enough" (within 1% tolerance for sync lag)
        const larger = coinBalance > faBalance ? coinBalance : faBalance;
        const smaller = coinBalance < faBalance ? coinBalance : faBalance;
        const difference = larger - smaller;
        const percentDiff = (Number(difference) / Number(larger)) * 100;
        
        if (percentDiff < 1.0) {
          // Less than 1% difference = likely synced with minor lag, use the larger value
          totalBalanceInOctas = larger;
        } else {
          // More than 1% difference = truly separate storage, sum them
          totalBalanceInOctas = coinBalance + faBalance;
        }
      }

      // Convert total from octas (10^8) to MOVE
      const divisor = BigInt(100000000); // 10^8
      const wholePart = totalBalanceInOctas / divisor;
      const remainder = totalBalanceInOctas % divisor;
      const decimalPart = Number(remainder) / 100000000;
      const balanceInMove = Number(wholePart) + decimalPart;
      
      setBalance(balanceInMove.toFixed(2));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0.00');
    } finally {
      if (isFirstLoad.current) {
        setIsLoading(false);
        isFirstLoad.current = false;
      }
    }
  }, [address]);

  useEffect(() => {
    fetchBalance();

    // Refresh balance every 10 seconds in background
    const interval = setInterval(fetchBalance, 10000);

    // Listen for global balance refresh events
    const handleRefresh = () => {
      fetchBalance();
    };
    window.addEventListener(BALANCE_REFRESH_EVENT, handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener(BALANCE_REFRESH_EVENT, handleRefresh);
    };
  }, [fetchBalance]);

  return { balance, isLoading, refetch: fetchBalance };
};
