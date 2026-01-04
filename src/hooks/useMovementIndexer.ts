import { useState, useEffect, useCallback } from 'react';
import movementIndexerService from '../services/movementIndexerService';
import { BALANCE_REFRESH_EVENT } from './useMovementBalance';

interface TokenBalance {
  amount: string;
  asset_type: string;
  owner_address: string;
  storage_id: string;
  is_frozen: boolean;
  is_primary: boolean;
  last_transaction_version: string;
  last_transaction_timestamp: string;
}

interface TokenActivity {
  amount: string;
  asset_type: string;
  entry_function_id_str: string;
  event_index: string;
  owner_address: string;
  transaction_timestamp: string;
  transaction_version: string;
  type: string;
  storage_refund_amount?: string;
  eventData?: {
    ticket_count?: string;
    raffle_id?: string;
    total_paid?: string;
    ticket_ids?: string[];
    // Swap event data
    fromToken?: string;
    toToken?: string;
    fromAmount?: string;
    toAmount?: string;
    fromTokenAddress?: string;
    toTokenAddress?: string;
  };
}

export const useTokenBalances = (ownerAddress: string | null) => {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!ownerAddress) return;

    setLoading(true);
    setError(null);
    try {
      const data = await movementIndexerService.getTokenBalances(ownerAddress);
      setBalances(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [ownerAddress]);

  useEffect(() => {
    fetchBalances();

    // Listen for global balance refresh events
    const handleRefresh = () => {
      fetchBalances();
    };
    window.addEventListener(BALANCE_REFRESH_EVENT, handleRefresh);

    return () => {
      window.removeEventListener(BALANCE_REFRESH_EVENT, handleRefresh);
    };
  }, [fetchBalances]);

  return { balances, loading, error, refetch: fetchBalances };
};

export const useTokenActivities = (address: string | null, limit = 20) => {
  const [activities, setActivities] = useState<TokenActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError(null);
    try {
      const data = await movementIndexerService.getTokenActivitiesWithTransactions(address, limit);
      setActivities(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [address, limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, error, refetch: fetchActivities };
};

export const useAccountTransactions = (address: string | null, limit = 50) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError(null);
    try {
      const data = await movementIndexerService.getAccountTransactions(address, limit);
      setTransactions(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [address, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, refetch: fetchTransactions };
};

export const useLargeTransfers = (minAmount: string, limit = 20) => {
  const [transfers, setTransfers] = useState<TokenActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await movementIndexerService.getLargeTransfers(minAmount, limit);
      setTransfers(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [minAmount, limit]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  return { transfers, loading, error, refetch: fetchTransfers };
};

export const useUserNFTs = (ownerAddress: string | null) => {
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchNFTs = useCallback(async () => {
    if (!ownerAddress) return;

    setLoading(true);
    setError(null);
    try {
      const data = await movementIndexerService.getUserNFTs(ownerAddress);
      setNfts(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [ownerAddress]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  return { nfts, loading, error, refetch: fetchNFTs };
};
