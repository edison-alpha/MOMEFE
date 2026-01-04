import { useQuery } from '@tanstack/react-query';
import { getUserPortfolio, UserPortfolio } from '@/services/indexer';

export function useUserPortfolio(address: string | undefined) {
  return useQuery<UserPortfolio>({
    queryKey: ['userPortfolio', address],
    queryFn: async () => {
      if (!address) throw new Error('Address is required');
      const result = await getUserPortfolio(address);
      return result;
    },
    enabled: !!address && address.length > 0,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: 2,
  });
}
