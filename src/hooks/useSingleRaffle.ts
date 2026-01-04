import { useQuery } from '@tanstack/react-query';
import { getRaffleV3, RaffleV3 } from '@/lib/raffle-contract-v3';
import { UnifiedRaffle } from './useAllRaffles';

// Convert V3 raffle to unified format
const convertV3ToUnified = (raffle: RaffleV3): UnifiedRaffle => ({
  id: raffle.id,
  creator: raffle.creator,
  title: raffle.title,
  description: raffle.description,
  imageUrl: raffle.imageUrl,
  ticketPrice: raffle.ticketPrice,
  totalTickets: raffle.totalTickets,
  ticketsSold: raffle.ticketsSold,
  targetAmount: raffle.targetAmount,
  prizeAmount: raffle.prizeAsset.amount,
  endTime: raffle.endTime,
  status: raffle.status,
  winner: raffle.winner,
  prizePool: raffle.prizePool,
  isClaimed: raffle.isClaimed,
  assetInEscrow: raffle.assetInEscrow,
  prizeAssetType: raffle.prizeAsset.assetType,
  prizeSymbol: raffle.prizeAsset.symbol,
  prizeName: raffle.prizeAsset.name,
  prizeDecimals: raffle.prizeAsset.decimals,
  prizeFaMetadata: raffle.prizeAsset.faMetadata,
  isV3: true,
  // V5 fields
  maxTicketsPerUser: raffle.maxTicketsPerUser,
  totalRefunded: raffle.totalRefunded,
  winnerClaimableAmount: raffle.winnerClaimableAmount,
});

export function useSingleRaffle(raffleId: number | undefined, _isV3: boolean = true) {
  return useQuery({
    queryKey: ['raffle', raffleId],
    queryFn: async (): Promise<UnifiedRaffle> => {
      if (raffleId === undefined) throw new Error('Raffle ID is required');
      
      const raffle = await getRaffleV3(raffleId);
      return convertV3ToUnified(raffle);
    },
    enabled: raffleId !== undefined,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
  });
}

// Alias for backward compatibility - all raffles are now V3
export const useSingleRaffleAuto = useSingleRaffle;
