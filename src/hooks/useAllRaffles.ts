import { useQuery } from '@tanstack/react-query';
import { getAllRafflesV5, RaffleV5, ASSET_TYPE } from '@/lib/raffle-contract-v5';

// Unified raffle interface - V3 only (multi-asset support)
export interface UnifiedRaffle {
  id: number;
  creator: string;
  title: string;
  description: string;
  imageUrl: string;
  ticketPrice: number;
  totalTickets: number;
  ticketsSold: number;
  targetAmount: number;
  prizeAmount: number;
  endTime: Date;
  status: number;
  winner: string;
  prizePool: number;
  isClaimed: boolean;
  assetInEscrow: boolean;
  // V3 multi-asset fields
  prizeAssetType: number;
  prizeSymbol: string;
  prizeName: string;
  prizeDecimals: number;
  prizeFaMetadata?: string; // FA metadata address for fungible assets
  isV3: boolean;
  // V5 fields
  maxTicketsPerUser?: number;
  totalRefunded?: number;
  winnerClaimableAmount?: number;
}

// Convert V5 raffle to unified format
const convertV5ToUnified = (raffle: RaffleV5): UnifiedRaffle => ({
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

export function useAllRaffles() {
  return useQuery({
    queryKey: ['allRaffles'],
    queryFn: async () => {
      const v5Raffles = await getAllRafflesV5();
      const allRaffles = v5Raffles.map(convertV5ToUnified).sort((a: UnifiedRaffle, b: UnifiedRaffle) => b.id - a.id);
      return allRaffles;
    },
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
  });
}

// Alias for backward compatibility
export const useAllRafflesV5 = useAllRaffles;
export const useAllRafflesV3 = useAllRaffles;
