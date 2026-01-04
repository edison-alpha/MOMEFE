import { queryClient } from '@/App';

// Type for raffle data
interface RaffleData {
  id: number;
  ticketsSold: number;
  prizePool: number;
  ticketPrice: number;
  [key: string]: any;
}

/**
 * Invalidate all raffle-related queries
 * Call this after buy ticket, create raffle, finalize, claim, etc.
 */
export const invalidateRaffleQueries = async (raffleId?: number) => {
  // Invalidate specific raffle if ID provided
  if (raffleId !== undefined) {
    await queryClient.invalidateQueries({ queryKey: ['raffle', raffleId] });
    await queryClient.invalidateQueries({ queryKey: ['raffle-activity', raffleId] });
    await queryClient.invalidateQueries({ queryKey: ['raffle-leaderboard', raffleId] });
    await queryClient.invalidateQueries({ queryKey: ['raffle-stats', raffleId] });
    await queryClient.invalidateQueries({ queryKey: ['engagement', raffleId] });
    await queryClient.invalidateQueries({ queryKey: ['comments', raffleId] });
  }
  
  // Always invalidate global queries
  await queryClient.invalidateQueries({ queryKey: ['allRaffles'] });
  await queryClient.invalidateQueries({ queryKey: ['global-raffle-activity'] });
  await queryClient.invalidateQueries({ queryKey: ['global-leaderboard'] });
  await queryClient.invalidateQueries({ queryKey: ['raffle-stats'] });
};

/**
 * Invalidate user-specific queries
 * Call this after user actions that affect their data
 */
export const invalidateUserQueries = async (userAddress?: string) => {
  if (userAddress) {
    await queryClient.invalidateQueries({ queryKey: ['user-tickets', userAddress] });
    await queryClient.invalidateQueries({ queryKey: ['userPortfolio', userAddress] });
    await queryClient.invalidateQueries({ queryKey: ['watchlist', userAddress] });
  }
  // Invalidate all user-related queries
  await queryClient.invalidateQueries({ queryKey: ['user-tickets'] });
  await queryClient.invalidateQueries({ queryKey: ['userPortfolio'] });
};

/**
 * Invalidate all queries after a major action
 * Use sparingly - prefer specific invalidation
 */
export const invalidateAllRaffleData = async (raffleId?: number, userAddress?: string) => {
  await invalidateRaffleQueries(raffleId);
  await invalidateUserQueries(userAddress);
};

/**
 * Refetch specific raffle data immediately
 */
export const refetchRaffle = async (raffleId: number) => {
  await queryClient.refetchQueries({ queryKey: ['raffle', raffleId] });
};

/**
 * Optimistic update for buying tickets
 * Updates the cache immediately before the transaction completes
 */
export const optimisticBuyTickets = (raffleId: number, ticketCount: number) => {
  // Get current raffle data
  const previousData = queryClient.getQueryData<RaffleData>(['raffle', raffleId]);
  
  if (previousData) {
    // Optimistically update the raffle data
    queryClient.setQueryData<RaffleData>(['raffle', raffleId], {
      ...previousData,
      ticketsSold: previousData.ticketsSold + ticketCount,
      prizePool: previousData.prizePool + (ticketCount * previousData.ticketPrice),
    });
  }
  
  // Return rollback function
  return () => {
    if (previousData) {
      queryClient.setQueryData(['raffle', raffleId], previousData);
    }
  };
};

/**
 * Optimistic update for creating a raffle
 * Adds a placeholder raffle to the list
 */
export const optimisticCreateRaffle = (raffleData: Partial<RaffleData>) => {
  const previousData = queryClient.getQueryData<RaffleData[]>(['allRaffles']);
  
  if (previousData) {
    // Add optimistic raffle at the beginning
    queryClient.setQueryData<RaffleData[]>(['allRaffles'], [
      { ...raffleData, id: -1, _optimistic: true } as RaffleData,
      ...previousData,
    ]);
  }
  
  // Return rollback function
  return () => {
    if (previousData) {
      queryClient.setQueryData(['allRaffles'], previousData);
    }
  };
};
