import { useRaffleLeaderboard } from '@/hooks/useRaffleActivity';
import { Loader2, Trophy, Medal, Award } from 'lucide-react';
import { getAvatarFromAddress } from '@/lib/avatarUtils';
import { formatUsd } from '@/hooks/useUsdConversion';
import { useUsdConversion } from '@/hooks/useUsdConversion';
import type { LeaderboardEntry } from '@/services/raffleActivityService';

interface RaffleLeaderboardProps {
  raffleId: number;
}

const RaffleLeaderboard = ({ raffleId }: RaffleLeaderboardProps) => {
  const { data: leaderboard, isLoading } = useRaffleLeaderboard(raffleId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No participants yet</p>
        <p className="text-sm text-gray-500 mt-1">Buy tickets to appear on the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leaderboard.map((entry) => (
        <LeaderboardItem key={entry.address} entry={entry} />
      ))}
    </div>
  );
};

const LeaderboardItem = ({ entry }: { entry: LeaderboardEntry }) => {
  const { usdValue } = useUsdConversion(entry.totalSpent);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="text-gray-500 font-bold text-sm w-5 text-center">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/10 to-gray-500/5 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-orange-600/10 to-orange-700/5 border-orange-600/30';
      default:
        return 'bg-[#1A1A1E] border-white/10';
    }
  };

  return (
    <div className={`border rounded-lg p-3 hover:border-primary/30 transition-colors ${getRankBg(entry.rank)}`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-8 flex items-center justify-center">
          {getRankIcon(entry.rank)}
        </div>
        <div className="text-3xl flex-shrink-0">
          {getAvatarFromAddress(entry.address)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm text-white truncate">
            {entry.address.slice(0, 8)}...{entry.address.slice(-6)}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">Spent:</span>
            <span className="font-mono text-xs text-gray-400">
              {entry.totalSpent.toFixed(4)} MOVE
            </span>
            <span className="text-[10px] text-gray-600">
              {formatUsd(usdValue)}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-primary font-bold text-lg">
            {entry.totalTickets}
          </div>
          <div className="text-[10px] text-gray-500">
            ticket{entry.totalTickets > 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaffleLeaderboard;
