import { useRaffleStats } from '@/hooks/useRaffleActivity';
import { Loader2, TrendingUp, Users, Ticket, DollarSign } from 'lucide-react';
import { useUsdConversion, formatUsd } from '@/hooks/useUsdConversion';

interface RaffleStatsCardProps {
  raffleId?: number;
  title?: string;
}

const RaffleStatsCard = ({ raffleId, title = 'Statistics' }: RaffleStatsCardProps) => {
  const { data: stats, isLoading } = useRaffleStats(raffleId);
  const { usdValue: volumeUsd } = useUsdConversion(stats?.totalVolume || 0);

  if (isLoading) {
    return (
      <div className="bg-[#1A1A1E] border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-[#1A1A1E] border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Total Tickets */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Ticket className="w-4 h-4 text-primary" />
            <span className="text-xs text-gray-400">Total Tickets</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.totalTicketsSold.toLocaleString()}
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-400">Total Volume</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.totalVolume.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            MOVE • {formatUsd(volumeUsd)}
          </div>
        </div>

        {/* Unique Participants */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-400">Participants</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.uniqueParticipants}
          </div>
        </div>

        {/* Average Tickets */}
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-400">Avg per User</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.averageTicketsPerUser.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 mt-1">tickets</div>
        </div>
      </div>
    </div>
  );
};

export default RaffleStatsCard;
