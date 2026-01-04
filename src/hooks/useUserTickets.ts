import { useQuery } from '@tanstack/react-query';
import { getUserActivity, type RaffleActivity } from '@/services/raffleActivityService';
import { getRaffle } from '@/lib/raffle-contract';

export interface UserTicketInfo {
  raffleId: number;
  ticketCount: number;
  totalSpent: number;
  lastPurchaseAt: string;
  raffle?: {
    id: number;
    title: string;
    imageUrl: string;
    ticketPrice: number;
    totalTickets: number;
    ticketsSold: number;
    prizeAmount: number;
    prizePool: number;
    endTime: Date;
    status: number;
    winner: string;
    isClaimed: boolean;
    assetInEscrow: boolean;
  };
}

/**
 * Hook to get user's tickets across all raffles
 * Aggregates ticket purchases from activity data
 */
export function useUserTickets(userAddress: string | undefined) {
  return useQuery({
    queryKey: ['user-tickets', userAddress],
    queryFn: async () => {
      if (!userAddress) return [];

      // Get user's activity (ticket purchases)
      const activities = await getUserActivity(userAddress, 500);
      
      // Filter only ticket purchases
      const ticketPurchases = activities.filter(
        (a): a is RaffleActivity & { buyer: string; ticketCount: number; totalPaid: number } =>
          a.type === 'ticket_purchase' && 
          a.buyer?.toLowerCase() === userAddress.toLowerCase()
      );

      // Aggregate by raffle
      const ticketsByRaffle = new Map<number, {
        ticketCount: number;
        totalSpent: number;
        lastPurchaseAt: string;
      }>();

      ticketPurchases.forEach(purchase => {
        const existing = ticketsByRaffle.get(purchase.raffleId);
        const timestamp = typeof purchase.timestamp === 'string' 
          ? purchase.timestamp 
          : new Date(purchase.timestamp).toISOString();

        if (existing) {
          existing.ticketCount += purchase.ticketCount || 0;
          existing.totalSpent += purchase.totalPaid || 0;
          if (timestamp > existing.lastPurchaseAt) {
            existing.lastPurchaseAt = timestamp;
          }
        } else {
          ticketsByRaffle.set(purchase.raffleId, {
            ticketCount: purchase.ticketCount || 0,
            totalSpent: purchase.totalPaid || 0,
            lastPurchaseAt: timestamp,
          });
        }
      });

      // Fetch raffle details for each
      const ticketInfos: UserTicketInfo[] = [];
      
      for (const [raffleId, data] of ticketsByRaffle.entries()) {
        try {
          const raffle = await getRaffle(raffleId);
          ticketInfos.push({
            raffleId,
            ticketCount: data.ticketCount,
            totalSpent: data.totalSpent,
            lastPurchaseAt: data.lastPurchaseAt,
            raffle: {
              id: raffle.id,
              title: raffle.title,
              imageUrl: raffle.imageUrl,
              ticketPrice: raffle.ticketPrice,
              totalTickets: raffle.totalTickets,
              ticketsSold: raffle.ticketsSold,
              prizeAmount: raffle.prizeAmount,
              prizePool: raffle.prizePool,
              endTime: raffle.endTime,
              status: raffle.status,
              winner: raffle.winner,
              isClaimed: raffle.isClaimed,
              assetInEscrow: raffle.assetInEscrow,
            },
          });
        } catch (error) {
          console.error(`Error fetching raffle ${raffleId}:`, error);
          ticketInfos.push({
            raffleId,
            ticketCount: data.ticketCount,
            totalSpent: data.totalSpent,
            lastPurchaseAt: data.lastPurchaseAt,
          });
        }
      }

      // Sort by last purchase date (most recent first)
      return ticketInfos.sort((a, b) => 
        new Date(b.lastPurchaseAt).getTime() - new Date(a.lastPurchaseAt).getTime()
      );
    },
    enabled: !!userAddress,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}
