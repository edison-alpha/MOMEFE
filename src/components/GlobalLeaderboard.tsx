import { useGlobalLeaderboard } from '@/hooks/useRaffleActivity';
import { Loader2, Trophy, Medal, Award, Crown } from 'lucide-react';
import { getAvatarFromAddress } from '@/lib/avatarUtils';
import { formatUsd } from '@/hooks/useUsdConversion';
import { useUsdConversion } from '@/hooks/useUsdConversion';
import type { LeaderboardEntry } from '@/services/raffleActivityService';

interface GlobalLeaderboardProps {
  limit?: number;
}

const GlobalLeaderboard = ({ limit = 100 }: GlobalLeaderboardProps) => {
  const { data: leaderboard, isLoading } = useGlobalLeaderboard(limit);

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
        <GlobalLeaderboardItem key={entry.address} entry={entry} />
      ))}
    </div>
  );
};

const GlobalLeaderboardItem = ({ entry }: { entry: LeaderboardEntry }) => {
  const { usdValue } = useUsdConversion(entry.totalSpent);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="text-gray-500 font-bold text-sm w-6 text-center">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/40 shadow-lg shadow-yellow-500/10';
      case 2:
        return 'bg-gradient-to-r from-gray-400/15 to-gray-500/8 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-orange-600/15 to-orange-700/8 border-orange-600/30';
      default:
        return 'bg-[#1A1A1E] border-white/10';
    }
  };

  return (
    <div className={`border rounded-lg p-4 hover:border-primary/30 transition-all ${getRankBg(entry.rank)}`}>
      <div className="flex items-center gap-3">
        {/* Rank Icon */}
        <div className="flex-shrink-0 w-10 flex items-center justify-center">
          {getRankIcon(entry.rank)}
        </div>

        {/* Avatar */}
        <div className="text-4xl flex-shrink-0">
          {getAvatarFromAddress(entry.address)}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm text-white truncate font-medium">
            {entry.address.slice(0, 10)}...{entry.address.slice(-8)}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Spent:</span>
              <span className="font-mono text-xs text-gray-300">
                {entry.totalSpent.toFixed(2)} MOVE
              </span>
            </div>
            <span className="text-[10px] text-gray-600">
              {formatUsd(usdValue)}
            </span>
            <span className="text-xs text-gray-600">•</span>
            <span className="text-xs text-gray-500">
              {entry.raffleCount} raffle{entry.raffleCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Ticket Count */}
        <div className="text-right flex-shrink-0">
          <div className="text-primary font-bold text-2xl">
            {entry.totalTickets.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">
            tickets
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLeaderboard;
