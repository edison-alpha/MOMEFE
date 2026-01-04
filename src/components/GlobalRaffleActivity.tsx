import { useGlobalRaffleActivity } from '@/hooks/useRaffleActivity';
import { Loader2, Activity, ExternalLink } from 'lucide-react';
import { getAvatarFromAddress } from '@/lib/avatarUtils';
import { Link } from 'react-router-dom';
import type { RaffleActivity as RaffleActivityType } from '@/services/raffleActivityService';
import { useQuery } from '@tanstack/react-query';
import { getRaffle } from '@/lib/raffle-contract';
import { formatNumber } from '@/lib/utils';

interface GlobalRaffleActivityProps {
  limit?: number;
  filters?: string[];
}

const GlobalRaffleActivity = ({ limit = 50, filters = [] }: GlobalRaffleActivityProps) => {
  const { data: activities, isLoading } = useGlobalRaffleActivity(limit);

  const filteredActivities = activities?.filter(activity => 
    filters.length === 0 || filters.includes(activity.type)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!filteredActivities || filteredActivities.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No activity yet</p>
        <p className="text-sm text-gray-500 mt-1">Be the first to buy tickets!</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        {/* Table Header */}
        <div className="grid grid-cols-[120px_1fr_150px_200px_150px_120px] gap-4 px-6 py-4 border-b border-white/10 bg-[#0A0A0B]">
          <div className="text-xs font-bold text-gray-400 font-mono tracking-wider">ACTION</div>
          <div className="text-xs font-bold text-gray-400 font-mono tracking-wider pl-8">ITEM</div>
          <div className="text-xs font-bold text-gray-400 font-mono tracking-wider">PRICE</div>
          <div className="text-xs font-bold text-gray-400 font-mono tracking-wider">USER</div>
          <div className="text-xs font-bold text-gray-400 font-mono tracking-wider">TICKET QTY</div>
          <div className="text-xs font-bold text-gray-400 font-mono tracking-wider">DETAIL</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/5">
          {filteredActivities.map((activity, index) => (
            <DesktopActivityItem key={`${activity.transactionVersion}-${index}`} activity={activity} />
          ))}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-white/5">
        {filteredActivities.map((activity, index) => (
          <MobileActivityItem key={`${activity.transactionVersion}-${index}`} activity={activity} />
        ))}
      </div>
    </>
  );
};

// Desktop Table Item Component
const DesktopActivityItem = ({ activity }: { activity: RaffleActivityType }) => {
  const { data: fetchedRaffle } = useQuery({
    queryKey: ['raffle', activity.raffleId],
    queryFn: () => getRaffle(activity.raffleId),
    enabled: !activity.raffle,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const raffleData = activity.raffle || fetchedRaffle;

  const getActionIcon = () => {
    switch (activity.type) {
      case 'ticket_purchase': return '🎫';
      case 'raffle_created': return '📋';
      case 'raffle_finalized': return '🏆';
      default: return '📌';
    }
  };

  const getActionText = () => {
    switch (activity.type) {
      case 'ticket_purchase': return 'TICKET BOUGHT';
      case 'raffle_created': return 'ITEM LISTED';
      case 'raffle_finalized': return 'RAFFLE WON';
      default: return 'ACTION';
    }
  };

  const getItemDisplay = () => {
    if (raffleData) {
      return {
        image: raffleData.imageUrl,
        name: raffleData.title || `Raffle #${activity.raffleId}`,
        subtitle: activity.type === 'raffle_finalized' 
          ? `Won ${raffleData.prizeAmount.toFixed(2)} MOVE` 
          : `${raffleData.prizeAmount.toFixed(2)} MOVE`
      };
    }

    const prizeAmount = activity.prizeAmount || 0;
    let itemName = 'Mystery Prize';
    
    if (prizeAmount > 0) {
      if (prizeAmount >= 1000) {
        itemName = `${(prizeAmount / 1000).toFixed(1)}K MOVE Prize`;
      } else if (prizeAmount >= 100) {
        itemName = `${prizeAmount.toFixed(0)} MOVE Prize`;
      } else {
        itemName = `${prizeAmount.toFixed(2)} MOVE Prize`;
      }
    }

    if (activity.type === 'raffle_created') {
      return { image: null, name: itemName, subtitle: 'New Listing' };
    }
    if (activity.type === 'raffle_finalized') {
      return { image: null, name: itemName, subtitle: 'Prize Won' };
    }
    return { image: null, name: `Raffle #${activity.raffleId}`, subtitle: 'Ticket Purchase' };
  };

  const getUserAddress = () => {
    if (activity.type === 'ticket_purchase') return activity.buyer;
    if (activity.type === 'raffle_finalized') return activity.winner;
    if (activity.type === 'raffle_created') return activity.creator;
    return null;
  };

  const getExplorerUrl = () => {
    return `https://explorer.movementlabs.xyz/txn/${activity.transactionVersion}?network=testnet`;
  };

  const getPriceDisplay = () => {
    if (activity.type === 'ticket_purchase' && activity.totalPaid) {
      return { amount: formatNumber(activity.totalPaid), label: 'MOVE' };
    }
    if (activity.type === 'raffle_finalized' && activity.prizeAmount) {
      return { amount: formatNumber(activity.prizeAmount), label: 'Prize' };
    }
    if (raffleData) {
      return { amount: formatNumber(raffleData.ticketPrice), label: 'per ticket' };
    }
    return null;
  };

  const itemDisplay = getItemDisplay();
  const userAddress = getUserAddress();
  const priceDisplay = getPriceDisplay();
  const explorerUrl = getExplorerUrl();

  return (
    <div className="grid grid-cols-[120px_1fr_150px_200px_150px_120px] gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
      {/* ACTION */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">{getActionIcon()}</span>
        <span className="text-xs font-bold text-white font-mono leading-tight whitespace-nowrap">{getActionText()}</span>
      </div>

      {/* ITEM */}
      <div className="flex items-center gap-3 pl-8">
        {itemDisplay.image ? (
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg border border-white/10">
            <img 
              src={itemDisplay.image} 
              alt={itemDisplay.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.className = 'w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg';
                  e.currentTarget.parentElement.innerHTML = '🎁';
                }
              }}
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg">
            🎁
          </div>
        )}
        <div className="min-w-0">
          <Link 
            to={`/raffle/${activity.raffleId}`}
            className="text-sm font-medium text-white hover:text-primary transition-colors block truncate"
          >
            {itemDisplay.name}
          </Link>
          <div className="text-xs text-gray-500 font-mono">{itemDisplay.subtitle}</div>
        </div>
      </div>

      {/* PRICE */}
      <div className="flex items-center">
        {priceDisplay ? (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-orange-400 font-mono">
              {priceDisplay.amount}
            </span>
            <span className="text-xs text-gray-500">
              {priceDisplay.label}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-600">-</span>
        )}
      </div>

      {/* USER */}
      <div className="flex items-center gap-2">
        {userAddress && (
          <>
            <span className="text-xl">{getAvatarFromAddress(userAddress)}</span>
            <div className="flex flex-col min-w-0">
              <span className="text-sm text-white font-mono truncate">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </span>
              {activity.type === 'raffle_finalized' && (
                <span className="text-xs text-yellow-400 font-bold">WINNER</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* TICKET QTY */}
      <div className="flex items-center gap-2">
        {activity.type === 'ticket_purchase' && activity.ticketCount && (
          <>
            <span className="text-orange-500">🎫</span>
            <span className="text-sm text-white font-medium">
              {activity.ticketCount} Ticket{activity.ticketCount > 1 ? 's' : ''}
            </span>
          </>
        )}
        {activity.type === 'raffle_created' && (
          <>
            <span className="text-orange-500">🎫</span>
            <span className="text-sm text-white font-medium">
              {raffleData?.totalTickets || 0} Total
            </span>
          </>
        )}
        {activity.type === 'raffle_finalized' && (
          <span className="text-sm text-yellow-400 font-bold">
            🏆 Winner
          </span>
        )}
      </div>

      {/* DETAIL */}
      <div className="flex items-center">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline transition-colors"
        >
          view on explorer
        </a>
      </div>
    </div>
  );
};

// Mobile Card Item Component
const MobileActivityItem = ({ activity }: { activity: RaffleActivityType }) => {
  const { data: fetchedRaffle } = useQuery({
    queryKey: ['raffle', activity.raffleId],
    queryFn: () => getRaffle(activity.raffleId),
    enabled: !activity.raffle,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const raffleData = activity.raffle || fetchedRaffle;

  const getActionIcon = () => {
    switch (activity.type) {
      case 'ticket_purchase': return '🎫';
      case 'raffle_created': return '📋';
      case 'raffle_finalized': return '🏆';
      default: return '📌';
    }
  };

  const getActionText = () => {
    switch (activity.type) {
      case 'ticket_purchase': return 'Ticket Bought';
      case 'raffle_created': return 'Item Listed';
      case 'raffle_finalized': return 'Raffle Won';
      default: return 'Action';
    }
  };

  const getItemDisplay = () => {
    if (raffleData) {
      return {
        image: raffleData.imageUrl,
        name: raffleData.title || `Raffle #${activity.raffleId}`,
        subtitle: activity.type === 'raffle_finalized' 
          ? `Won ${raffleData.prizeAmount.toFixed(2)} MOVE` 
          : `${raffleData.prizeAmount.toFixed(2)} MOVE`
      };
    }

    const prizeAmount = activity.prizeAmount || 0;
    let itemName = 'Mystery Prize';
    
    if (prizeAmount > 0) {
      if (prizeAmount >= 1000) {
        itemName = `${(prizeAmount / 1000).toFixed(1)}K MOVE Prize`;
      } else if (prizeAmount >= 100) {
        itemName = `${prizeAmount.toFixed(0)} MOVE Prize`;
      } else {
        itemName = `${prizeAmount.toFixed(2)} MOVE Prize`;
      }
    }

    if (activity.type === 'raffle_created') {
      return { image: null, name: itemName, subtitle: 'New Listing' };
    }
    if (activity.type === 'raffle_finalized') {
      return { image: null, name: itemName, subtitle: 'Prize Won' };
    }
    return { image: null, name: `Raffle #${activity.raffleId}`, subtitle: 'Ticket Purchase' };
  };

  const getUserAddress = () => {
    if (activity.type === 'ticket_purchase') return activity.buyer;
    if (activity.type === 'raffle_finalized') return activity.winner;
    if (activity.type === 'raffle_created') return activity.creator;
    return null;
  };

  const getExplorerUrl = () => {
    return `https://explorer.movementlabs.xyz/txn/${activity.transactionVersion}?network=testnet`;
  };

  const getPriceDisplay = () => {
    if (activity.type === 'ticket_purchase' && activity.totalPaid) {
      return { amount: formatNumber(activity.totalPaid), label: 'MOVE' };
    }
    if (activity.type === 'raffle_finalized' && activity.prizeAmount) {
      return { amount: formatNumber(activity.prizeAmount), label: 'Prize' };
    }
    if (raffleData) {
      return { amount: formatNumber(raffleData.ticketPrice), label: 'per ticket' };
    }
    return null;
  };

  const itemDisplay = getItemDisplay();
  const userAddress = getUserAddress();
  const priceDisplay = getPriceDisplay();
  const explorerUrl = getExplorerUrl();

  return (
    <div className="p-4 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-start gap-3">
        {/* Action Icon & Image */}
        <div className="flex-shrink-0">
          <div className="relative">
            {itemDisplay.image ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden shadow-lg border border-white/10">
                <img 
                  src={itemDisplay.image} 
                  alt={itemDisplay.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.className = 'w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xl shadow-lg';
                      e.currentTarget.parentElement.innerHTML = '🎁';
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xl shadow-lg">
                🎁
              </div>
            )}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#A04545] rounded-full flex items-center justify-center text-xs">
              {getActionIcon()}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#A04545] bg-[#A04545]/10 px-2 py-0.5 rounded">
                  {getActionText()}
                </span>
                {activity.type === 'raffle_finalized' && (
                  <span className="text-xs font-bold text-yellow-400">WINNER</span>
                )}
              </div>
              <Link 
                to={`/raffle/${activity.raffleId}`}
                className="text-sm font-medium text-white hover:text-primary transition-colors block truncate"
              >
                {itemDisplay.name}
              </Link>
              <div className="text-xs text-gray-500 font-mono">{itemDisplay.subtitle}</div>
            </div>
            
            {/* Price */}
            {priceDisplay && (
              <div className="text-right ml-2">
                <div className="text-sm font-bold text-orange-400 font-mono">
                  {priceDisplay.amount}
                </div>
                <div className="text-xs text-gray-500">
                  {priceDisplay.label}
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex items-center justify-between text-xs">
            {/* User */}
            <div className="flex items-center gap-2">
              {userAddress && (
                <>
                  <span className="text-sm">{getAvatarFromAddress(userAddress)}</span>
                  <span className="text-gray-400 font-mono">
                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                  </span>
                </>
              )}
            </div>

            {/* Ticket Info & Explorer Link */}
            <div className="flex items-center gap-3">
              {activity.type === 'ticket_purchase' && activity.ticketCount && (
                <div className="flex items-center gap-1">
                  <span className="text-orange-500">🎫</span>
                  <span className="text-white font-medium">
                    {activity.ticketCount}
                  </span>
                </div>
              )}
              {activity.type === 'raffle_created' && (
                <div className="flex items-center gap-1">
                  <span className="text-orange-500">🎫</span>
                  <span className="text-white font-medium">
                    {raffleData?.totalTickets || 0}
                  </span>
                </div>
              )}
              
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalRaffleActivity;
