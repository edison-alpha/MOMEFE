import { useRaffleActivity } from '@/hooks/useRaffleActivity';
import { Loader2, Activity, Sparkles, Trophy } from 'lucide-react';
import { getAvatarFromAddress } from '@/lib/avatarUtils';
import { formatUsd } from '@/hooks/useUsdConversion';
import { useUsdConversion } from '@/hooks/useUsdConversion';
import type { RaffleActivity as RaffleActivityType } from '@/services/raffleActivityService';

interface RaffleActivityProps {
  raffleId: number;
  prizeSymbol?: string; // Token symbol for the prize (e.g., "MOVE", "tUSDT")
}

const RaffleActivity = ({ raffleId, prizeSymbol = 'MOVE' }: RaffleActivityProps) => {
  const { data: activities, isLoading } = useRaffleActivity(raffleId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No activity yet</p>
        <p className="text-sm text-gray-500 mt-1">Be the first to buy tickets!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity, index) => (
        <ActivityItem 
          key={`${activity.transactionVersion}-${index}`} 
          activity={activity} 
          prizeSymbol={prizeSymbol}
        />
      ))}
    </div>
  );
};

const ActivityItem = ({ activity, prizeSymbol }: { activity: RaffleActivityType; prizeSymbol: string }) => {
  const { usdValue } = useUsdConversion(activity.totalPaid || activity.prizeAmount || 0);

  // Render berdasarkan type
  if (activity.type === 'ticket_purchase') {
    return (
      <div className="bg-[#1A1A1E] border border-white/10 rounded-lg p-3 hover:border-primary/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="text-3xl flex-shrink-0">
            {getAvatarFromAddress(activity.buyer!)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-white truncate">
                {activity.buyer!.slice(0, 8)}...{activity.buyer!.slice(-6)}
              </span>
              <span className="text-xs text-gray-500">bought</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-primary font-bold text-sm">
                {activity.ticketCount} ticket{activity.ticketCount! > 1 ? 's' : ''}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="font-mono text-xs text-gray-400">
                {activity.totalPaid!.toFixed(4)} MOVE
              </span>
              <span className="text-[10px] text-gray-600">
                {formatUsd(usdValue)}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <a
              href={`https://explorer.movementlabs.xyz/txn/${activity.transactionVersion}?network=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View Tx ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (activity.type === 'raffle_created') {
    return (
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-blue-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm text-white font-medium">Raffle Created</div>
            <div className="text-xs text-gray-400 mt-0.5">
              Prize: {activity.prizeAmount!.toFixed(4)} {prizeSymbol}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activity.type === 'raffle_finalized') {
    return (
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm text-white font-medium">Winner Drawn!</div>
            <div className="text-xs text-gray-400 mt-0.5 font-mono">
              {activity.winner!.slice(0, 8)}...{activity.winner!.slice(-6)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RaffleActivity;
