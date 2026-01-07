import { useQuery } from '@tanstack/react-query';
import {
  getRaffleActivity,
  getGlobalActivity,
  getRaffleLeaderboard,
  getGlobalLeaderboard,
  getRaffleStats,
  type RaffleActivity,
  type LeaderboardEntry,
  type RaffleStats,
} from '@/services/raffleActivityService';

/**
 * Hook untuk mendapatkan activity feed dari raffle tertentu
 */
export const useRaffleActivity = (raffleId: number | undefined, limit = 50) => {
  return useQuery({
    queryKey: ['raffle-activity', raffleId, limit],
    queryFn: () => getRaffleActivity(raffleId!, limit),
    enabled: raffleId !== undefined,
    refetchInterval: 10000, // Refresh setiap 10 detik
    staleTime: 5000,
  });
};

/**
 * Hook untuk mendapatkan leaderboard dari raffle tertentu
 */
export const useRaffleLeaderboard = (raffleId: number | undefined, limit = 100) => {
  return useQuery({
    queryKey: ['raffle-leaderboard', raffleId, limit],
    queryFn: () => getRaffleLeaderboard(raffleId!, limit),
    enabled: raffleId !== undefined,
    refetchInterval: 15000, // Refresh setiap 15 detik
    staleTime: 10000,
  });
};

/**
 * Hook untuk mendapatkan GLOBAL activity feed (semua raffle)
 */
export const useGlobalRaffleActivity = (limit = 50) => {
  return useQuery({
    queryKey: ['global-raffle-activity', limit],
    queryFn: async () => {
      console.log('[useGlobalRaffleActivity] Fetching activities...');
      const result = await getGlobalActivity(limit);
      console.log('[useGlobalRaffleActivity] Got', result.length, 'activities');
      return result;
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
};

/**
 * Hook untuk mendapatkan GLOBAL leaderboard (semua raffle)
 */
export const useGlobalLeaderboard = (limit = 100) => {
  return useQuery({
    queryKey: ['global-leaderboard', limit],
    queryFn: () => getGlobalLeaderboard(limit),
    refetchInterval: 20000, // Refresh setiap 20 detik
    staleTime: 15000,
  });
};

/**
 * Hook untuk mendapatkan raffle statistics
 */
export const useRaffleStats = (raffleId?: number) => {
  return useQuery({
    queryKey: ['raffle-stats', raffleId],
    queryFn: () => getRaffleStats(raffleId),
    refetchInterval: 30000, // Refresh setiap 30 detik
    staleTime: 20000,
  });
};
