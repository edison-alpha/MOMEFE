import { useGlobalRaffleActivity } from '@/hooks/useRaffleActivity';
import { useMemo } from 'react';

const LiveTicker = () => {
  const { data: activities, isLoading } = useGlobalRaffleActivity(50);

  // Generate avatar colors based on wallet address
  const getAvatarColor = (address: string | undefined) => {
    const colors = ['🔵', '🟣', '⚪', '🟠', '🟢', '🟡', '🔴', '🟤'];
    if (!address) return '⚪';
    const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Format wallet address
  const formatAddress = (address: string | undefined) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get emoji for activity type
  const getActivityEmoji = (type: string) => {
    switch (type) {
      case 'ticket_purchase':
        return '🎫';
      case 'raffle_finalized':
        return '🏆';
      case 'raffle_created':
        return '✨';
      default:
        return '📌';
    }
  };

  // Transform activities to ticker items
  const tickerItems = useMemo(() => {
    if (!activities || activities.length === 0) {
      return [
        { wallet: "Waiting", tickets: 0, item: "for activity...", avatar: "⏳", type: 'waiting' }
      ];
    }

    // Map all activities (purchases, winners, creations)
    const items = activities.map(activity => {
      if (activity.type === 'ticket_purchase' && activity.buyer) {
        return {
          wallet: formatAddress(activity.buyer),
          tickets: activity.ticketCount || 0,
          item: `Raffle #${activity.raffleId}`,
          avatar: getAvatarColor(activity.buyer),
          timestamp: activity.timestamp,
          type: 'purchase',
          emoji: '🎫',
        };
      } else if (activity.type === 'raffle_finalized' && activity.winner) {
        return {
          wallet: formatAddress(activity.winner),
          tickets: 0,
          item: `Won Raffle #${activity.raffleId}`,
          avatar: '🏆',
          timestamp: activity.timestamp,
          type: 'winner',
          emoji: '🏆',
        };
      } else if (activity.type === 'raffle_created' && activity.creator) {
        return {
          wallet: formatAddress(activity.creator),
          tickets: 0,
          item: `Created Raffle #${activity.raffleId}`,
          avatar: '✨',
          timestamp: activity.timestamp,
          type: 'created',
          emoji: '✨',
        };
      }
      return null;
    }).filter(Boolean);

    // If we have items, return them, otherwise show waiting
    return items.length > 0 ? items : [
      { wallet: "Waiting", tickets: 0, item: "for activity...", avatar: "⏳", type: 'waiting', emoji: '⏳' }
    ];
  }, [activities]);

  // Repeat items multiple times to create seamless loop
  // Minimum 3 repetitions to ensure smooth scrolling
  const repeatedItems = useMemo(() => {
    const minRepetitions = Math.max(3, Math.ceil(20 / tickerItems.length));
    return Array(minRepetitions).fill(tickerItems).flat();
  }, [tickerItems]);

  if (isLoading) {
    return (
      <div className="bg-[#1A1A1E] border-b border-white/5 overflow-hidden">
        <div className="flex items-center justify-center py-2">
          <span className="text-gray-500 text-xs">Loading live activity...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1E] border-b border-white/5 overflow-hidden">
      <div className="animate-slide-ticker flex items-center gap-8 py-2 whitespace-nowrap">
        {repeatedItems.map((item: any, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className="text-2xl">{item.avatar}</span>
            <span className="text-gray-500">{item.wallet}</span>
            {item.type === 'purchase' && (
              <>
                <span className="text-gray-400">Purchased</span>
                <span className="text-[#A04545] font-mono font-bold">
                  {item.tickets} TICKET{item.tickets > 1 ? 'S' : ''}
                </span>
              </>
            )}
            {item.type === 'winner' && (
              <span className="text-yellow-400 font-bold">WON</span>
            )}
            {item.type === 'created' && (
              <span className="text-blue-400">Created</span>
            )}
            {item.type === 'waiting' && (
              <span className="text-gray-400">Waiting</span>
            )}
            <span className="text-white font-medium">{item.item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveTicker;
