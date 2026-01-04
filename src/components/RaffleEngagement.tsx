import { Eye, Heart, MessageCircle, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useRaffleSocial } from '@/hooks/useSocialFeatures';
import { toast } from 'sonner';

interface RaffleEngagementProps {
  raffleId: number;
  compact?: boolean;
}

const RaffleEngagement = ({ raffleId, compact = false }: RaffleEngagementProps) => {
  const {
    userAddress,
    engagement,
    isEngagementLoading,
    isWatching,
    isWatchingLoading,
    toggleWatchlist,
  } = useRaffleSocial(raffleId);

  const handleToggleWatchlist = () => {
    if (!userAddress) {
      toast.error('Please connect your wallet to add to watchlist');
      return;
    }
    toggleWatchlist(isWatching);
    toast.success(isWatching ? 'Removed from watchlist' : 'Added to watchlist');
  };

  if (isEngagementLoading) {
    return (
      <div className="flex items-center gap-4 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />
          <span>{engagement?.view_count || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <Bookmark className="w-3.5 h-3.5" />
          <span>{engagement?.watchlist_count || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{engagement?.comment_count || 0}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* View Count */}
      <div className="flex items-center gap-1.5 text-gray-400">
        <Eye className="w-4 h-4" />
        <span className="text-sm font-mono">{engagement?.view_count || 0}</span>
        <span className="text-xs text-gray-500">views</span>
      </div>

      {/* Watchlist Count */}
      <div className="flex items-center gap-1.5 text-gray-400">
        <Bookmark className="w-4 h-4" />
        <span className="text-sm font-mono">{engagement?.watchlist_count || 0}</span>
        <span className="text-xs text-gray-500">watching</span>
      </div>

      {/* Comments Count */}
      <div className="flex items-center gap-1.5 text-gray-400">
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm font-mono">{engagement?.comment_count || 0}</span>
        <span className="text-xs text-gray-500">comments</span>
      </div>

      {/* Watchlist Button */}
      <button
        onClick={handleToggleWatchlist}
        disabled={isWatchingLoading}
        className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          isWatching
            ? 'bg-primary/20 text-primary border border-primary/30'
            : 'bg-white/5 text-gray-400 border border-white/10 hover:border-primary/30 hover:text-primary'
        }`}
      >
        {isWatchingLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isWatching ? (
          <>
            <BookmarkCheck className="w-4 h-4" />
            <span>Watching</span>
          </>
        ) : (
          <>
            <Bookmark className="w-4 h-4" />
            <span>Watch</span>
          </>
        )}
      </button>
    </div>
  );
};

export default RaffleEngagement;
