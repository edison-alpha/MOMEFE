import { useState, useEffect, useRef } from 'react';
import { aptos } from '@/lib/aptos';

export const useMovementBalance = (address: string | null) => {
  const [balance, setBalance] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(true);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const fetchBalance = async () => {
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
        // Get account resources to find APT balance
        const resources = await aptos.getAccountResources({
          accountAddress: address,
        });

        // Find the coin store resource for APT (0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>)
        const coinResource = resources.find(
          (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
        );

        if (coinResource) {
          const coinData = coinResource.data as { coin: { value: string } };
          const balanceInOctas = BigInt(coinData.coin.value);
          // Convert from octas (10^8) to MOVE with 2 decimal places
          const balanceInMove = Number(balanceInOctas) / 100000000;
          setBalance(balanceInMove.toFixed(2));
        } else {
          setBalance('0.00');
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0.00');
      } finally {
        if (isFirstLoad.current) {
          setIsLoading(false);
          isFirstLoad.current = false;
        }
      }
    };

    fetchBalance();

    // Refresh balance every 10 seconds in background
    const interval = setInterval(fetchBalance, 10000);

    return () => clearInterval(interval);
  }, [address]);

  return { balance, isLoading };
};
