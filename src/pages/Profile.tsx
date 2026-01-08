import { useState, useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import { ChevronDown, Search, Copy, Loader2, ArrowUpRight, ExternalLink, Filter, X, Ticket, Trophy, Gift, XCircle, Dices, Package, CheckCircle, Bookmark } from "lucide-react";
import CreateListingModal from "@/components/CreateListingModal";
import { usePrivy } from '@privy-io/react-auth';
import { getAvatarFromAddress } from "@/lib/avatarUtils";
import { useUserPortfolio } from "@/hooks/useUserPortfolio";
import { useAllRaffles } from "@/hooks/useAllRaffles";
import { getRaffleStatusLabel, RAFFLE_STATUS, isNullAddress, claimPrize, claimBackAsset, cancelRaffle, finalizeRaffle } from "@/lib/raffle-contract";
import { useNavigate } from "react-router-dom";
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import mwLogo from "@/assets/mw.png";
import { useTokenActivities } from "@/hooks/useMovementIndexer";
import { parseActivity, getActivityIcon, getActivityColorClasses } from "@/lib/activityParser";
import { formatIndexerTimestampShort } from "@/lib/timestampUtils";
import { toast } from "sonner";
import { createNotification } from "@/services/notificationService";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUserTickets } from "@/hooks/useUserTickets";
import { invalidateAllRaffleData } from "@/lib/queryInvalidation";
import { getErrorMessage } from "@/lib/errorParser";
import { useWatchlist } from "@/hooks/useSocialFeatures";
import { useMovePrice } from "@/hooks/useMovePrice";
import { triggerBalanceRefresh } from "@/hooks/useMovementBalance";
import { formatNumber } from "@/lib/utils";

type ActivityFilterType = "raffle_created" | "ticket_bought" | "raffle_finalized" | "winner_claimed" | "transfer" | "gas_fee" | "swap";

const tabs = ["NFT", "Token", "Listings", "Tickets", "Watchlist", "Activity"];

const mockNFTs = [
  { id: "12892", name: "vpass badge # 12888", image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300", listed: false },
  { id: "186", name: "the TUMBLR sketches . untitled 013", image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=300", listed: false },
  { id: "7", name: "SESSION 2 AIRDROP - TUNAD", image: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=300", listed: false },
  { id: "104438", name: "Citizens of Zo World", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300", listed: false },
  { id: "0", name: "3D Cube 189", image: "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=300", listed: false },
  { id: "1", name: "20248914", image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300", listed: false },
];

const mockTokens = [
  { name: "Ether", symbol: "ETH", balance: "0.0000", icon: "💎" },
];

// Token Icon Component with fallback
const TokenIcon = ({ iconUri, symbol, isNative }: { iconUri?: string; symbol?: string; isNative?: boolean }) => {
  const [hasError, setHasError] = useState(false);
  
  // Default MOVE icon URL - using CoinMarketCap which is more reliable
  const defaultMoveIcon = 'https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png';
  
  // Fallback gradient icon
  const FallbackIcon = () => (
    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
      {symbol?.slice(0, 2) || '??'}
    </div>
  );

  // For native MOVE token, always show the MOVE icon
  if (isNative) {
    return (
      <img 
        src={defaultMoveIcon}
        alt="MOVE" 
        className="w-6 h-6 md:w-8 md:h-8 rounded-full"
      />
    );
  }

  if (hasError || !iconUri) {
    return <FallbackIcon />;
  }

  return (
    <img 
      src={iconUri}
      alt={symbol || 'Token'} 
      className="w-6 h-6 md:w-8 md:h-8 rounded-full"
      onError={() => setHasError(true)}
    />
  );
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState("NFT");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const { authenticated, user } = usePrivy();
  const { signRawHash } = useSignRawHash();
  const [movementAddress, setMovementAddress] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [isWalletReady, setIsWalletReady] = useState(false);
  const navigate = useNavigate();
  
  // Activity filters
  const [activityFilters, setActivityFilters] = useState([
    { label: "Raffle Created", value: "raffle_created" as ActivityFilterType, checked: false },
    { label: "Ticket Bought", value: "ticket_bought" as ActivityFilterType, checked: false },
    { label: "Raffle Finalized", value: "raffle_finalized" as ActivityFilterType, checked: false },
    { label: "Prize Claimed", value: "winner_claimed" as ActivityFilterType, checked: false },
    { label: "Transfers", value: "transfer" as ActivityFilterType, checked: false },
    { label: "Swaps", value: "swap" as ActivityFilterType, checked: false },
  ]);

  // Get Movement wallet address
  useEffect(() => {
    if (!authenticated || !user) return;

    const moveWallet = user.linkedAccounts?.find(
      (account: any) => account.chainType === 'aptos'
    ) as any;

    if (moveWallet) {
      setMovementAddress(moveWallet.address as string);
    }
  }, [authenticated, user]);

  // Track wallet readiness (signRawHash availability)
  useEffect(() => {
    if (authenticated && signRawHash && movementAddress) {
      // Add a small delay to ensure Privy wallet proxy is fully initialized
      const timer = setTimeout(() => {
        setIsWalletReady(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsWalletReady(false);
    }
  }, [authenticated, signRawHash, movementAddress]);

  const walletAddress = movementAddress || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  
  // Fetch user portfolio from indexer
  const { data: portfolio, isLoading: isLoadingPortfolio } = useUserPortfolio(movementAddress);
  
  // MOVE price hook
  const { movePrice, formatMoveToUsd } = useMovePrice();
  
  // Helper to convert token amount using BigInt for precision
  const convertTokenAmount = (amount: string, decimals: number): number => {
    try {
      const amountBigInt = BigInt(amount);
      const divisor = BigInt(Math.pow(10, decimals));
      const wholePart = amountBigInt / divisor;
      const remainder = amountBigInt % divisor;
      const decimalPart = Number(remainder) / Math.pow(10, decimals);
      return Number(wholePart) + decimalPart;
    } catch {
      return 0;
    }
  };
  
  // Calculate USD value for a token
  const getUsdValue = (token: any): string => {
    const balance = convertTokenAmount(token.amount, token.token_properties.decimals);
    const symbol = token.token_properties.symbol;
    
    // For stablecoins (tUSDT, tDAI), value is 1:1 with USD
    if (symbol === 'tUSDT' || symbol === 'tDAI' || symbol === 'USDC' || symbol === 'USDT') {
      return formatNumber(balance, 2);
    }
    
    // For MOVE, use the fetched price
    if (symbol === 'MOVE' || token.isNative) {
      return formatMoveToUsd(balance).replace('$', '');
    }
    
    // For other tokens, we don't have price data
    return '-';
  };
  
  // Calculate total portfolio value in USD
  const totalPortfolioValue = useMemo(() => {
    if (!portfolio?.tokens || movePrice === 0) return null;
    
    let total = 0;
    for (const token of portfolio.tokens) {
      const balance = convertTokenAmount(token.amount, token.token_properties.decimals);
      const symbol = token.token_properties.symbol;
      
      if (symbol === 'tUSDT' || symbol === 'tDAI' || symbol === 'USDC' || symbol === 'USDT') {
        total += balance;
      } else if (symbol === 'MOVE' || token.isNative) {
        total += balance * movePrice;
      }
    }
    
    return total;
  }, [portfolio?.tokens, movePrice]);
  
  // Fetch all raffles to filter user's created raffles
  const { data: allRaffles, isLoading: isLoadingRaffles } = useAllRaffles();
  
  // Fetch token activities for Activity tab
  const { activities, loading: isLoadingActivities, error: activitiesError, refetch: refetchActivities } = useTokenActivities(movementAddress || null, 50);
  
  // Fetch user's tickets
  const { data: userTickets, isLoading: isLoadingTickets } = useUserTickets(movementAddress);
  
  // Fetch user's watchlist
  const { data: watchlistData, isLoading: isLoadingWatchlist } = useWatchlist();
  
  // Get watched raffles with full data
  const watchedRaffles = useMemo(() => {
    if (!watchlistData || !allRaffles) return [];
    const watchedIds = watchlistData.map(w => w.raffle_id);
    return allRaffles.filter(raffle => watchedIds.includes(raffle.id));
  }, [watchlistData, allRaffles]);
  
  // Filter raffles created by current user
  const userListings = allRaffles?.filter(raffle => {
    if (!movementAddress) return false;
    const userAddr = movementAddress.toLowerCase().replace(/^0x0*/, '');
    const creatorAddr = raffle.creator.toLowerCase().replace(/^0x0*/, '');
    return userAddr === creatorAddr;
  }) || [];
  
  // Activity filter functions
  const toggleActivityFilter = (value: ActivityFilterType) => {
    setActivityFilters(prev => 
      prev.map(f => f.value === value ? { ...f, checked: !f.checked } : f)
    );
  };

  const clearAllActivityFilters = () => {
    setActivityFilters(prev => prev.map(f => ({ ...f, checked: false })));
  };

  const activeActivityFiltersCount = activityFilters.filter(f => f.checked).length;

  // Filtered activities
  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    
    let result = [...activities];

    // Apply type filters
    const activeFilterValues = activityFilters.filter(f => f.checked).map(f => f.value);
    if (activeFilterValues.length > 0) {
      result = result.filter(activity => {
        const parsed = parseActivity(
          activity.entry_function_id_str,
          activity.type,
          activity.amount,
          activity.owner_address,
          movementAddress,
          activity.eventData
        );
        return activeFilterValues.includes(parsed.type as ActivityFilterType);
      });
    }

    return result;
  }, [activities, activityFilters, movementAddress]);

  // Debug logging removed

  const handleListNFT = (nft: any) => {
    setSelectedAsset({
      type: 'nft',
      name: nft.name,
      image: nft.uri || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300',
      floorPrice: 'N/A',
    });
    setShowCreateModal(true);
  };

  const handleListToken = (token: any) => {
    const balance = formatNumber(convertTokenAmount(token.amount, token.token_properties.decimals));
    setSelectedAsset({
      type: 'token',
      name: token.token_properties.name,
      symbol: token.token_properties.symbol,
      balance: balance,
      decimals: token.token_properties.decimals,
      isNative: token.isNative,
    });
    setShowCreateModal(true);
  };

  // Get user's public key for transactions
  const getUserPublicKey = () => {
    const moveWallet = user?.linkedAccounts?.find(
      (account: any) => account.chainType === 'aptos'
    ) as any;
    return moveWallet?.publicKey || '';
  };

  // Handle Claim Prize (Winner only)
  const handleClaimPrize = async (raffleId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!movementAddress || !signRawHash) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Check if wallet is ready (Privy wallet proxy needs time to initialize)
    if (!isWalletReady) {
      toast.error('Wallet not ready', {
        description: 'Please wait a moment and try again. The wallet is still initializing.',
      });
      return;
    }

    const loadingKey = `claim-${raffleId}`;
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }));

    try {
      toast.info('Claiming prize...');
      await claimPrize(raffleId, movementAddress, getUserPublicKey(), signRawHash);
      toast.success('Prize claimed successfully! 🎉');
      await invalidateAllRaffleData(raffleId, movementAddress);
      
      // Trigger global balance refresh
      setTimeout(() => {
        triggerBalanceRefresh();
      }, 2000);
    } catch (error: any) {
      console.error('Error claiming prize:', error);
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description });
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle Cancel Raffle (Creator only - no tickets sold)
  const handleCancelRaffle = async (raffleId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!movementAddress || !signRawHash) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Check if wallet is ready (Privy wallet proxy needs time to initialize)
    if (!isWalletReady) {
      toast.error('Wallet not ready', {
        description: 'Please wait a moment and try again. The wallet is still initializing.',
      });
      return;
    }

    const loadingKey = `cancel-${raffleId}`;
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }));

    try {
      toast.info('Cancelling raffle...');
      await cancelRaffle(raffleId, movementAddress, getUserPublicKey(), signRawHash);
      toast.success('Raffle cancelled successfully!');
      await invalidateAllRaffleData(raffleId, movementAddress);
      
      // Trigger global balance refresh
      setTimeout(() => {
        triggerBalanceRefresh();
      }, 2000);
    } catch (error: any) {
      console.error('Error cancelling raffle:', error);
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description });
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle Finalize Raffle (Select Winner)
  const handleFinalizeRaffle = async (raffleId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!movementAddress || !signRawHash) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Check if wallet is ready (Privy wallet proxy needs time to initialize)
    if (!isWalletReady) {
      toast.error('Wallet not ready', {
        description: 'Please wait a moment and try again. The wallet is still initializing.',
      });
      return;
    }

    const loadingKey = `finalize-${raffleId}`;
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }));

    try {
      toast.info('Finalizing raffle & selecting winner...');
      await finalizeRaffle(raffleId, movementAddress, getUserPublicKey(), signRawHash);
      toast.success('Winner selected! 🎲');
      
      // Send notification to creator
      const raffle = userListings.find(r => r.id === raffleId);
      if (raffle) {
        await createNotification({
          user_address: raffle.creator,
          type: 'raffle_finalized',
          title: 'Raffle Finalized! 🎲',
          message: `Winner has been selected for "${raffle.title}". Check the results!`,
          raffle_id: raffleId,
          amount: raffle.prizePool,
        });
      }
      
      await invalidateAllRaffleData(raffleId, movementAddress);
      
      // Trigger global balance refresh
      setTimeout(() => {
        triggerBalanceRefresh();
      }, 2000);
    } catch (error: any) {
      console.error('Error finalizing raffle:', error);
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description });
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle Claim Back Asset (Creator only)
  const handleClaimBackAsset = async (raffleId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!movementAddress || !signRawHash) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Check if wallet is ready (Privy wallet proxy needs time to initialize)
    if (!isWalletReady) {
      toast.error('Wallet not ready', {
        description: 'Please wait a moment and try again. The wallet is still initializing.',
      });
      return;
    }

    const loadingKey = `claimback-${raffleId}`;
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }));

    try {
      toast.info('Claiming back asset...');
      await claimBackAsset(raffleId, movementAddress, getUserPublicKey(), signRawHash);
      toast.success('Asset claimed back successfully!');
      await invalidateAllRaffleData(raffleId, movementAddress);
      
      // Trigger global balance refresh
      setTimeout(() => {
        triggerBalanceRefresh();
      }, 2000);
    } catch (error: any) {
      console.error('Error claiming back asset:', error);
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description });
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto">
        {/* Profile Banner */}
        <div className="relative h-32 md:h-48 lg:h-64 overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        </div>

        <div className="px-3 md:px-4 -mt-6 md:-mt-8 relative z-10">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 md:mb-6 gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                <span className="text-4xl md:text-5xl">{getAvatarFromAddress(walletAddress)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg md:text-xl font-mono truncate">{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '0xf39F ... 2266'}</h1>
                  <button 
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    onClick={() => {
                      if (walletAddress) {
                        navigator.clipboard.writeText(walletAddress);
                        toast.success('Address copied to clipboard!');
                      }
                    }}
                    title="Copy full address"
                  >
                    <Copy className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] md:text-xs rounded font-mono">MOVEMENT TESTNET</span>
                  <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-[10px] md:text-xs rounded font-mono">DEC 2025</span>
                </div>
              </div>
            </div>
            
            {/* Stats - Mobile: Horizontal scroll, Desktop: Grid */}
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3">
              <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible">
                <div className="flex-shrink-0 text-center md:text-left">
                  <p className="text-muted-foreground text-xs md:text-sm">Listed Items</p>
                  <p className="font-mono text-base md:text-lg">{userListings.length}</p>
                </div>
                <div className="flex-shrink-0 text-center md:text-left">
                  <p className="text-muted-foreground text-xs md:text-sm">NFTs</p>
                  <p className="font-mono text-base md:text-lg">{portfolio?.nfts.length || 0}</p>
                </div>
                <div className="flex-shrink-0 text-center md:text-left">
                  <p className="text-muted-foreground text-xs md:text-sm">Tokens</p>
                  <p className="font-mono text-base md:text-lg">{portfolio?.tokens.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 md:px-4 py-4 md:py-6">

        {/* Tabs */}
        <div className="border-b border-border mb-4 md:mb-6 overflow-x-auto">
          <div className="flex gap-4 md:gap-6 min-w-max px-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 md:pb-3 text-xs md:text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 md:gap-6">
          {/* Sidebar - Only show on desktop for NFT tab */}
          {activeTab === "NFT" && (
            <aside className="w-64 flex-shrink-0 space-y-6 hidden lg:block">
              {/* Source */}
              <div className="card-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Source</h3>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">All Sources</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground">MoME Only</span>
                  </label>
                </div>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "NFT" && (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="relative flex-1 w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search for Items"
                      className="w-full h-9 pl-10 pr-4 rounded-lg input-dark text-sm"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-sm whitespace-nowrap">
                    <span>Recently Received</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {isLoadingPortfolio ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : portfolio?.nfts && portfolio.nfts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {portfolio.nfts.map((nft) => (
                      <div key={nft.token_data_id} className="card-surface group relative overflow-hidden">
                        <div className="relative aspect-square overflow-hidden bg-secondary">
                          <img
                            src={nft.uri || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300'}
                            alt={nft.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300';
                            }}
                          />
                        </div>
                        <div className="p-2 md:p-3 space-y-1">
                          <p className="font-mono text-xs md:text-sm text-primary truncate">{nft.collection_name}</p>
                          <div className="relative overflow-hidden">
                            <p className="text-xs md:text-sm truncate">{nft.name}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">Amount: {nft.amount}</p>
                            
                            <div className="absolute inset-x-0 bottom-0 h-full translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-[#A04545] rounded-lg flex items-center justify-center">
                              <button 
                                onClick={() => handleListNFT(nft)}
                                className="w-full h-full hover:bg-[#8a3b3b] text-white font-semibold text-xs md:text-sm transition-colors rounded-lg"
                              >
                                List Item
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No NFTs found in your wallet</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "Token" && (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="relative w-full sm:max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search for Tokens"
                      className="w-full h-9 pl-10 pr-4 rounded-lg input-dark text-sm"
                    />
                  </div>
                  {totalPortfolioValue !== null && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total Value</p>
                      <p className="text-base md:text-lg font-semibold text-green-400">~${formatNumber(totalPortfolioValue, 2)}</p>
                    </div>
                  )}
                </div>

                {isLoadingPortfolio ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="card-surface overflow-hidden">
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                        <div className="col-span-5">Token</div>
                        <div className="col-span-4 text-right">Balance</div>
                        <div className="col-span-3 text-right">Action</div>
                      </div>
                      {portfolio?.tokens && portfolio.tokens.length > 0 ? (
                        portfolio.tokens.map((token) => {
                          const balance = convertTokenAmount(token.amount, token.token_properties.decimals);
                          const usdValue = getUsdValue(token);
                          
                          return (
                            <div key={token.token_data_id} className="grid grid-cols-12 gap-4 px-4 py-4 items-center border-b border-border last:border-0">
                              <div className="col-span-5 flex items-center gap-3">
                                <TokenIcon 
                                  iconUri={token.token_properties.icon_uri}
                                  symbol={token.token_properties.symbol}
                                  isNative={token.isNative}
                                />
                                <div>
                                  <p className="font-medium">{token.token_properties.name}</p>
                                  <p className="text-xs text-muted-foreground">{token.token_properties.symbol}</p>
                                </div>
                              </div>
                              <div className="col-span-4 text-right">
                                <p className="font-mono">{formatNumber(balance)}</p>
                                {usdValue !== '-' && (
                                  <p className="text-xs text-muted-foreground">~${usdValue}</p>
                                )}
                              </div>
                              <div className="col-span-3 text-right">
                                <button 
                                  onClick={() => handleListToken(token)}
                                  className="px-4 py-1.5 btn-orange rounded text-xs"
                                >
                                  LIST ITEM
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>No tokens found in your wallet</p>
                        </div>
                      )}
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-border">
                      {portfolio?.tokens && portfolio.tokens.length > 0 ? (
                        portfolio.tokens.map((token) => {
                          const balance = convertTokenAmount(token.amount, token.token_properties.decimals);
                          const usdValue = getUsdValue(token);
                          
                          return (
                            <div key={token.token_data_id} className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <TokenIcon 
                                  iconUri={token.token_properties.icon_uri}
                                  symbol={token.token_properties.symbol}
                                  isNative={token.isNative}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{token.token_properties.name}</p>
                                  <p className="text-xs text-muted-foreground">{token.token_properties.symbol}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-mono text-sm">{formatNumber(balance)}</p>
                                  {usdValue !== '-' && (
                                    <p className="text-xs text-muted-foreground">~${usdValue}</p>
                                  )}
                                </div>
                              </div>
                              <button 
                                onClick={() => handleListToken(token)}
                                className="w-full px-4 py-2 btn-orange rounded text-sm"
                              >
                                LIST ITEM
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>No tokens found in your wallet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "Listings" && (
              <>
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search your listings"
                      className="w-full h-9 pl-10 pr-4 rounded-lg input-dark text-sm"
                    />
                  </div>
                </div>

                {isLoadingRaffles ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : userListings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {userListings.map((raffle) => {
                      const canCancel = raffle.status === RAFFLE_STATUS.LISTED && raffle.ticketsSold === 0;
                      // Can finalize if: status is RAFFLING OR (status is LISTED AND (time ended OR sold out))
                      const isTimeEnded = raffle.endTime <= new Date();
                      const isSoldOut = raffle.ticketsSold >= raffle.totalTickets;
                      const canFinalize = raffle.status === RAFFLE_STATUS.RAFFLING || 
                        (raffle.status === RAFFLE_STATUS.LISTED && (isTimeEnded || isSoldOut));
                      const canClaimBack = (raffle.status === RAFFLE_STATUS.CANCELLED || raffle.status === RAFFLE_STATUS.FUND_RAFFLED) && raffle.assetInEscrow;
                      const hasAction = canCancel || canFinalize || canClaimBack;

                      return (
                      <div 
                        key={raffle.id} 
                        className="card-surface group relative overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/raffle/${raffle.id}`)}
                      >
                        <div className="relative aspect-square overflow-hidden bg-secondary">
                          <img
                            src={raffle.imageUrl || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300'}
                            alt={raffle.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300';
                            }}
                          />
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-1 bg-black/70 rounded text-[10px] md:text-xs">
                              {getRaffleStatusLabel(raffle.status)}
                            </span>
                          </div>
                        </div>
                        <div className="p-2 md:p-3 space-y-2">
                          <p className="font-medium text-xs md:text-sm truncate">{raffle.title}</p>
                          <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
                            <span>Tickets</span>
                            <span className="font-mono">{raffle.ticketsSold}/{raffle.totalTickets}</span>
                          </div>
                          <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
                            <span>Prize Pool</span>
                            <span className="font-mono text-primary">{formatNumber(raffle.prizePool, 2)} MOVE</span>
                          </div>
                          <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
                            <span>Ends</span>
                            <span className="font-mono">
                              {raffle.endTime > new Date() 
                                ? raffle.endTime.toLocaleDateString() 
                                : 'Ended'}
                            </span>
                          </div>

                          {/* Action Buttons for Creator */}
                          {hasAction && (
                            <div className="pt-2 border-t border-border/50 space-y-1 md:space-y-2">
                              {canCancel && (
                                <button
                                  onClick={(e) => handleCancelRaffle(raffle.id, e)}
                                  disabled={actionLoading[`cancel-${raffle.id}`]}
                                  className="w-full px-2 md:px-3 py-1.5 md:py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] md:text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1 md:gap-2"
                                >
                                  {actionLoading[`cancel-${raffle.id}`] ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                  )}
                                  Cancel Raffle
                                </button>
                              )}
                              {canFinalize && (
                                <button
                                  onClick={(e) => handleFinalizeRaffle(raffle.id, e)}
                                  disabled={actionLoading[`finalize-${raffle.id}`]}
                                  className="w-full px-2 md:px-3 py-1.5 md:py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 text-[10px] md:text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1 md:gap-2"
                                >
                                  {actionLoading[`finalize-${raffle.id}`] ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Dices className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                  )}
                                  Select Winner
                                </button>
                              )}
                              {canClaimBack && (
                                <button
                                  onClick={(e) => handleClaimBackAsset(raffle.id, e)}
                                  disabled={actionLoading[`claimback-${raffle.id}`]}
                                  className="w-full px-2 md:px-3 py-1.5 md:py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] md:text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1 md:gap-2"
                                >
                                  {actionLoading[`claimback-${raffle.id}`] ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Package className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                  )}
                                  Claim Back Asset
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>You haven't created any raffles yet</p>
                    <p className="text-sm mt-2">Go to NFT or Token tab to list your first item!</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "Activity" && (
              <>
                {/* Activity Filter Section */}
                <div className="flex gap-6">
                  {/* Sidebar - Desktop */}
                  <aside className="w-64 flex-shrink-0 hidden lg:block">
                    <div className="card-surface p-5 space-y-6 border border-border/50 sticky top-24">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Filter Activity</h3>
                        {activeActivityFiltersCount > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearAllActivityFilters}
                            className="text-xs h-7 px-2"
                          >
                            Clear All
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {activityFilters.map((filter) => (
                          <label 
                            key={filter.value} 
                            className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-primary/5 transition-colors"
                            onClick={() => toggleActivityFilter(filter.value)}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              filter.checked 
                                ? 'bg-primary border-primary scale-110' 
                                : 'border-muted-foreground/50 group-hover:border-primary/50'
                            }`}>
                              {filter.checked && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm font-medium transition-colors ${
                              filter.checked ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                            }`}>
                              {filter.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      
                      {/* Stats Summary */}
                      <div className="pt-4 border-t border-border/50">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Activity Stats
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total Activities</span>
                            <span className="font-bold text-foreground">{activities.length}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Filtered Results</span>
                            <span className="font-bold text-primary">{filteredActivities.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </aside>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="mb-6 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <h2 className="text-3xl font-bold font-mono tracking-wider text-foreground mb-1">
                            MY ACTIVITY
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Your transaction history and raffle activities
                          </p>
                        </div>

                        {/* Mobile Filter Toggle */}
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="outline" className="lg:hidden relative">
                              <Filter className="w-4 h-4 mr-2" />
                              Filters
                              {activeActivityFiltersCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                                  {activeActivityFiltersCount}
                                </span>
                              )}
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="left" className="w-[300px] bg-card border-border">
                            <div className="mt-6 space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-foreground">Filter Activity</h3>
                                {activeActivityFiltersCount > 0 && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={clearAllActivityFilters}
                                    className="text-xs h-7 px-2"
                                  >
                                    Clear All
                                  </Button>
                                )}
                              </div>
                              <div className="space-y-2">
                                {activityFilters.map((filter) => (
                                  <label 
                                    key={filter.value} 
                                    className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-primary/5 transition-colors"
                                    onClick={() => toggleActivityFilter(filter.value)}
                                  >
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                      filter.checked 
                                        ? 'bg-primary border-primary scale-110' 
                                        : 'border-muted-foreground/50 group-hover:border-primary/50'
                                    }`}>
                                      {filter.checked && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${
                                      filter.checked ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                                    }`}>
                                      {filter.label}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>

                        {/* Refresh Button */}
                        <button
                          onClick={refetchActivities}
                          disabled={isLoadingActivities}
                          className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-50"
                        >
                          <svg 
                            className={`w-4 h-4 ${isLoadingActivities ? 'animate-spin' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="text-sm font-medium">Refresh</span>
                        </button>
                      </div>


                      {/* Active Filters Display */}
                      {activeActivityFiltersCount > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground font-medium">Active filters:</span>
                          {activityFilters.filter(f => f.checked).map(filter => (
                            <button
                              key={filter.value}
                              onClick={() => toggleActivityFilter(filter.value)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                            >
                              {filter.label}
                              <X className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Activity Content */}
                    {isLoadingActivities ? (
                      <div className="flex items-center justify-center py-12 card-surface border border-border/50 rounded-xl">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : activitiesError ? (
                      <div className="card-surface p-6 text-center border border-border/50 rounded-xl">
                        <p className="text-red-500 mb-4">Error loading activities: {activitiesError.message}</p>
                        <button
                          onClick={refetchActivities}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : !movementAddress ? (
                      <div className="card-surface p-12 text-center border border-border/50 rounded-xl">
                        <p className="text-muted-foreground">Connect your wallet to view activities</p>
                      </div>
                    ) : filteredActivities.length === 0 ? (
                      <div className="card-surface p-12 text-center border border-border/50 rounded-xl">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 mx-auto">
                          <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Activities Found</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-md mx-auto">
                          {activeActivityFiltersCount > 0 
                            ? "Try adjusting your filters to see more results."
                            : "Your transaction history will appear here"}
                        </p>
                        {activeActivityFiltersCount > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={clearAllActivityFilters}
                            className="mt-4"
                          >
                            Clear All Filters
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="card-surface overflow-hidden border border-border/50 rounded-xl">
                        {/* Desktop View */}
                        <div className="hidden md:block">
                          <div className="overflow-auto max-h-[calc(100vh-400px)] custom-scrollbar">
                            {/* Table Header */}
                            <div className="sticky top-0 z-10 grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-card/95 backdrop-blur-sm">
                              <div className="col-span-2">Activity</div>
                              <div className="col-span-3">Details</div>
                              <div className="col-span-2">From / To</div>
                              <div className="col-span-3 text-right">Amount</div>
                              <div className="col-span-2 text-right">Time</div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-border/50">
                              {filteredActivities.map((activity, index) => {
                                const parsed = parseActivity(
                                  activity.entry_function_id_str,
                                  activity.type,
                                  activity.amount,
                                  activity.owner_address,
                                  movementAddress,
                                  activity.eventData
                                );
                                
                                const colors = getActivityColorClasses(parsed.color);
                                const emoji = getActivityIcon(parsed.icon);
                                const timeStr = formatIndexerTimestampShort(activity.transaction_timestamp);
                                const isSwap = parsed.type === 'swap';
                                
                                // AMM Router address for swaps
                                const AMM_ROUTER = '0xc4e68f29fa608d2630d11513c8de731b09a975f2f75ea945160491b9bfd36992';

                                return (
                                  <div 
                                    key={index} 
                                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-primary/5 transition-all duration-200 group cursor-pointer"
                                  >
                                    {/* Activity Type */}
                                    <div className="col-span-2 flex items-center gap-2">
                                      <div className={`p-2 rounded-xl border ${colors.border} ${colors.bg} transition-all group-hover:scale-110`}>
                                        <span className="text-lg">{emoji}</span>
                                      </div>
                                      <div>
                                        <p className={`font-semibold text-xs ${colors.text}`}>
                                          {parsed.title}
                                        </p>
                                        <p className="text-[9px] text-muted-foreground font-mono">
                                          {parsed.type.toUpperCase().replace('_', ' ')}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Details - Special rendering for swaps */}
                                    <div className="col-span-3">
                                      {isSwap && parsed.swapFromToken && parsed.swapToToken ? (
                                        <div className="flex items-center gap-2">
                                          {/* From Token */}
                                          <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2 py-1">
                                            {parsed.swapFromToken.logo ? (
                                              <img 
                                                src={parsed.swapFromToken.logo} 
                                                alt={parsed.swapFromToken.symbol}
                                                className="w-4 h-4 rounded-full"
                                                onError={(e) => {
                                                  e.currentTarget.style.display = 'none';
                                                }}
                                              />
                                            ) : (
                                              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[7px] font-bold">
                                                {parsed.swapFromToken.symbol.slice(0, 2)}
                                              </div>
                                            )}
                                            <span className="text-[10px] font-semibold">{parsed.swapFromToken.symbol}</span>
                                          </div>
                                          
                                          {/* Arrow */}
                                          <span className="text-muted-foreground text-xs">→</span>
                                          
                                          {/* To Token */}
                                          <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2 py-1">
                                            {parsed.swapToToken.logo ? (
                                              <img 
                                                src={parsed.swapToToken.logo} 
                                                alt={parsed.swapToToken.symbol}
                                                className="w-4 h-4 rounded-full"
                                                onError={(e) => {
                                                  e.currentTarget.style.display = 'none';
                                                }}
                                              />
                                            ) : (
                                              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[7px] font-bold">
                                                {parsed.swapToToken.symbol.slice(0, 2)}
                                              </div>
                                            )}
                                            <span className="text-[10px] font-semibold">{parsed.swapToToken.symbol}</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="min-w-0">
                                          <p className="text-xs text-foreground truncate">
                                            {parsed.description}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* From / To Address */}
                                    <div className="col-span-2">
                                      <div className="space-y-0.5">
                                        {/* From Address */}
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[9px] text-muted-foreground w-8">From</span>
                                          <div className="flex items-center gap-1">
                                            <span className="text-sm">{getAvatarFromAddress(activity.owner_address)}</span>
                                            <a 
                                              href={`https://explorer.movementnetwork.xyz/account/${activity.owner_address}?network=testnet`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="font-mono text-[9px] text-muted-foreground hover:text-primary transition-colors"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {activity.owner_address.slice(0, 6)}...{activity.owner_address.slice(-4)}
                                            </a>
                                          </div>
                                        </div>
                                        {/* To Address */}
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[9px] text-muted-foreground w-8">To</span>
                                          <div className="flex items-center gap-1">
                                            {isSwap ? (
                                              <>
                                                <img 
                                                  src="data:image/svg+xml,%3csvg%20width='33'%20height='33'%20viewBox='0%200%2033%2033'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M0%202.21051C0%200.989679%200.989677%200%202.21051%200H29.9682C31.189%200%2032.1787%200.989678%2032.1787%202.21051V29.9682C32.1787%2031.189%2031.189%2032.1787%2029.9682%2032.1787H2.21051C0.989679%2032.1787%200%2031.189%200%2029.9682V2.21051Z'%20fill='url(%23paint0_linear_1_90)'/%3e%3cpath%20d='M22.6678%208.55985C22.6678%208.20966%2022.3839%207.92578%2022.0337%207.92578H14.742C11.9405%207.92578%209.66948%2010.1968%209.66948%2012.9983V14.1079C9.66948%2014.8083%2010.2372%2015.376%2010.9376%2015.376H21.3997C22.1%2015.376%2022.6678%2014.8083%2022.6678%2014.1079V8.55985Z'%20fill='black'/%3e%3cpath%20d='M9.66949%2023.6189C9.66949%2023.969%209.95337%2024.2529%2010.3036%2024.2529H17.5953C20.3968%2024.2529%2022.6678%2021.9819%2022.6678%2019.1804V18.0708C22.6678%2017.3704%2022.1%2016.8027%2021.3997%2016.8027H10.9376C10.2373%2016.8027%209.66949%2017.3704%209.66949%2018.0708V23.6189Z'%20fill='black'/%3e%3cdefs%3e%3clinearGradient%20id='paint0_linear_1_90'%20x1='0'%20y1='16.0894'%20x2='32.1787'%20y2='16.0894'%20gradientUnits='userSpaceOnUse'%3e%3cstop%20stop-color='%23FFC80F'/%3e%3cstop%20offset='1'%20stop-color='%23EE6348'/%3e%3c/linearGradient%3e%3c/defs%3e%3c/svg%3e"
                                                  alt="Razor DEX"
                                                  className="w-4 h-4 rounded"
                                                />
                                                <a 
                                                  href={`https://explorer.movementnetwork.xyz/account/${AMM_ROUTER}?network=testnet`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="font-mono text-[9px] text-orange-500 hover:text-orange-400 transition-colors font-semibold"
                                                  onClick={(e) => e.stopPropagation()}
                                                  title="Razor DEX AMM Router"
                                                >
                                                  RazorDEX
                                                </a>
                                              </>
                                            ) : (
                                              <>
                                                <span className="text-sm">{getAvatarFromAddress(activity.owner_address)}</span>
                                                <span className="font-mono text-[9px] text-muted-foreground">
                                                  Self
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="col-span-3 text-right">
                                      {isSwap && parsed.swapFromAmount && parsed.swapToAmount ? (
                                        <div className="flex flex-col items-end gap-0.5">
                                          <p className="font-mono text-xs text-red-400">
                                            -{parsed.swapFromAmount} {parsed.swapFromToken?.symbol}
                                          </p>
                                          <p className="font-mono text-xs text-green-400">
                                            +{parsed.swapToAmount} {parsed.swapToToken?.symbol}
                                          </p>
                                        </div>
                                      ) : isSwap && parsed.swapFromAmount ? (
                                        <div>
                                          <p className={`font-mono text-sm font-bold ${colors.text}`}>
                                            {parsed.swapFromAmount} {parsed.swapFromToken?.symbol || 'MOVE'}
                                          </p>
                                        </div>
                                      ) : (
                                        <div>
                                          <p className={`font-mono text-sm font-bold ${colors.text}`}>
                                            {parsed.isOutgoing ? '-' : parsed.isIncoming ? '+' : ''}{parsed.amount} MOVE
                                          </p>
                                          {parsed.ticketCount && parsed.ticketPrice && (
                                            <p className="text-[10px] text-muted-foreground">
                                              {parsed.ticketPrice} × {parsed.ticketCount} tickets
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Time & Link */}
                                    <div className="col-span-2 text-right flex items-center justify-end gap-2">
                                      <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                                        {timeStr}
                                      </span>
                                      <a
                                        href={`https://explorer.movementnetwork.xyz/txn/${activity.transaction_version}?network=testnet`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded hover:bg-primary/10 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden divide-y divide-border/50 max-h-[calc(100vh-400px)] overflow-auto">
                          {filteredActivities.map((activity, index) => {
                            const parsed = parseActivity(
                              activity.entry_function_id_str,
                              activity.type,
                              activity.amount,
                              activity.owner_address,
                              movementAddress,
                              activity.eventData
                            );
                            
                            const colors = getActivityColorClasses(parsed.color);
                            const emoji = getActivityIcon(parsed.icon);
                            const timeStr = formatIndexerTimestampShort(activity.transaction_timestamp);
                            const isSwap = parsed.type === 'swap';
                            const AMM_ROUTER = '0xc4e68f29fa608d2630d11513c8de731b09a975f2f75ea945160491b9bfd36992';

                            return (
                              <div key={index} className="p-4 hover:bg-primary/5 transition-colors">
                                {/* Header Row */}
                                <div className="flex items-start gap-3 mb-2">
                                  <div className={`p-2 rounded-xl border ${colors.border} ${colors.bg} flex-shrink-0`}>
                                    <span className="text-lg">{emoji}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <p className={`font-semibold text-sm ${colors.text}`}>
                                        {parsed.title}
                                      </p>
                                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeStr}</span>
                                    </div>
                                    
                                    {/* Swap Token Display */}
                                    {isSwap && parsed.swapFromToken && parsed.swapToToken ? (
                                      <div className="flex items-center gap-2 mt-2">
                                        {/* From Token */}
                                        <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2 py-1">
                                          {parsed.swapFromToken.logo ? (
                                            <img 
                                              src={parsed.swapFromToken.logo} 
                                              alt={parsed.swapFromToken.symbol}
                                              className="w-4 h-4 rounded-full"
                                            />
                                          ) : (
                                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[6px] font-bold">
                                              {parsed.swapFromToken.symbol.slice(0, 2)}
                                            </div>
                                          )}
                                          <span className="text-[10px] font-semibold">{parsed.swapFromToken.symbol}</span>
                                        </div>
                                        
                                        <span className="text-muted-foreground text-xs">→</span>
                                        
                                        {/* To Token */}
                                        <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2 py-1">
                                          {parsed.swapToToken.logo ? (
                                            <img 
                                              src={parsed.swapToToken.logo} 
                                              alt={parsed.swapToToken.symbol}
                                              className="w-4 h-4 rounded-full"
                                            />
                                          ) : (
                                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[6px] font-bold">
                                              {parsed.swapToToken.symbol.slice(0, 2)}
                                            </div>
                                          )}
                                          <span className="text-[10px] font-semibold">{parsed.swapToToken.symbol}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-muted-foreground">
                                        {parsed.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* From/To Address Row */}
                                <div className="pl-11 mb-2 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-muted-foreground w-8">From</span>
                                    <span className="text-sm">{getAvatarFromAddress(activity.owner_address)}</span>
                                    <a 
                                      href={`https://explorer.movementnetwork.xyz/account/${activity.owner_address}?network=testnet`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono text-[9px] text-muted-foreground hover:text-primary"
                                    >
                                      {activity.owner_address.slice(0, 6)}...{activity.owner_address.slice(-4)}
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-muted-foreground w-8">To</span>
                                    {isSwap ? (
                                      <>
                                        <img 
                                          src="data:image/svg+xml,%3csvg%20width='33'%20height='33'%20viewBox='0%200%2033%2033'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M0%202.21051C0%200.989679%200.989677%200%202.21051%200H29.9682C31.189%200%2032.1787%200.989678%2032.1787%202.21051V29.9682C32.1787%2031.189%2031.189%2032.1787%2029.9682%2032.1787H2.21051C0.989679%2032.1787%200%2031.189%200%2029.9682V2.21051Z'%20fill='url(%23paint0_linear_1_90)'/%3e%3cpath%20d='M22.6678%208.55985C22.6678%208.20966%2022.3839%207.92578%2022.0337%207.92578H14.742C11.9405%207.92578%209.66948%2010.1968%209.66948%2012.9983V14.1079C9.66948%2014.8083%2010.2372%2015.376%2010.9376%2015.376H21.3997C22.1%2015.376%2022.6678%2014.8083%2022.6678%2014.1079V8.55985Z'%20fill='black'/%3e%3cpath%20d='M9.66949%2023.6189C9.66949%2023.969%209.95337%2024.2529%2010.3036%2024.2529H17.5953C20.3968%2024.2529%2022.6678%2021.9819%2022.6678%2019.1804V18.0708C22.6678%2017.3704%2022.1%2016.8027%2021.3997%2016.8027H10.9376C10.2373%2016.8027%209.66949%2017.3704%209.66949%2018.0708V23.6189Z'%20fill='black'/%3e%3cdefs%3e%3clinearGradient%20id='paint0_linear_1_90'%20x1='0'%20y1='16.0894'%20x2='32.1787'%20y2='16.0894'%20gradientUnits='userSpaceOnUse'%3e%3cstop%20stop-color='%23FFC80F'/%3e%3cstop%20offset='1'%20stop-color='%23EE6348'/%3e%3c/linearGradient%3e%3c/defs%3e%3c/svg%3e"
                                          alt="Razor DEX"
                                          className="w-4 h-4 rounded"
                                        />
                                        <a 
                                          href={`https://explorer.movementnetwork.xyz/account/${AMM_ROUTER}?network=testnet`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-mono text-[9px] text-orange-500 hover:text-orange-400 font-semibold"
                                        >
                                          RazorDEX
                                        </a>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-sm">{getAvatarFromAddress(activity.owner_address)}</span>
                                        <span className="font-mono text-[9px] text-muted-foreground">Self</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Amount Row */}
                                <div className="pl-11 flex items-center justify-between">
                                  <div>
                                    {isSwap && parsed.swapFromAmount && parsed.swapToAmount ? (
                                      <div className="flex flex-col gap-0.5">
                                        <p className="font-mono text-xs text-red-400">
                                          -{parsed.swapFromAmount} {parsed.swapFromToken?.symbol}
                                        </p>
                                        <p className="font-mono text-xs text-green-400">
                                          +{parsed.swapToAmount} {parsed.swapToToken?.symbol}
                                        </p>
                                      </div>
                                    ) : isSwap && parsed.swapFromAmount ? (
                                      <p className={`font-mono text-sm font-bold ${colors.text}`}>
                                        {parsed.swapFromAmount} {parsed.swapFromToken?.symbol || 'MOVE'}
                                      </p>
                                    ) : (
                                      <>
                                        <p className={`font-mono text-sm font-bold ${colors.text}`}>
                                          {parsed.isOutgoing ? '-' : parsed.isIncoming ? '+' : ''}{parsed.amount} MOVE
                                        </p>
                                        {parsed.ticketCount && parsed.ticketPrice && (
                                          <p className="text-[10px] text-muted-foreground">
                                            {parsed.ticketPrice} MOVE × {parsed.ticketCount} tickets
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  <a
                                    href={`https://explorer.movementnetwork.xyz/txn/${activity.transaction_version}?network=testnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-medium"
                                  >
                                    <span>View</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === "Tickets" && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search your tickets"
                      className="w-full h-9 pl-10 pr-4 rounded-lg input-dark text-sm"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total: <span className="text-primary font-bold">{userTickets?.reduce((sum, t) => sum + t.ticketCount, 0) || 0}</span> tickets
                  </div>
                </div>

                {isLoadingTickets ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : userTickets && userTickets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userTickets.map((ticket) => {
                      const isWinner = ticket.raffle?.winner && 
                        !isNullAddress(ticket.raffle.winner) &&
                        ticket.raffle.winner.toLowerCase().replace(/^0x0*/, '') === movementAddress?.toLowerCase().replace(/^0x0*/, '');
                      const isEnded = ticket.raffle?.status && ticket.raffle.status >= RAFFLE_STATUS.ITEM_RAFFLED;
                      const canClaimPrize = isWinner && !ticket.raffle?.isClaimed;
                      const winChance = ticket.raffle 
                        ? `${formatNumber((ticket.ticketCount / ticket.raffle.ticketsSold) * 100, 1)}%`
                        : '0';

                      return (
                        <div 
                          key={ticket.raffleId} 
                          className={`card-surface group relative overflow-hidden cursor-pointer ${
                            isWinner ? 'ring-2 ring-yellow-500' : ''
                          }`}
                          onClick={() => navigate(`/raffle/${ticket.raffleId}`)}
                        >
                          {/* Winner Badge */}
                          {isWinner && (
                            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
                              <Trophy className="w-3 h-3" />
                              WINNER!
                            </div>
                          )}

                          <div className="relative aspect-video overflow-hidden bg-secondary">
                            <img
                              src={ticket.raffle?.imageUrl || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300'}
                              alt={ticket.raffle?.title || `Raffle #${ticket.raffleId}`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300';
                              }}
                            />
                            <div className="absolute top-2 right-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                isEnded 
                                  ? isWinner 
                                    ? 'bg-yellow-500 text-black' 
                                    : 'bg-gray-600 text-white'
                                  : 'bg-green-500/80 text-white'
                              }`}>
                                {isEnded ? (isWinner ? '🏆 Won' : 'Ended') : '🟢 Active'}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 space-y-3">
                            <p className="font-medium text-sm truncate">
                              {ticket.raffle?.title || `Raffle #${ticket.raffleId}`}
                            </p>

                            {/* Ticket Info */}
                            <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-primary" />
                                <span className="text-2xl font-bold text-primary">{ticket.ticketCount}</span>
                                <span className="text-xs text-muted-foreground">tickets</span>
                              </div>
                              {!isEnded && (
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Win Chance</p>
                                  <p className="text-sm font-bold text-green-400">{winChance}%</p>
                                </div>
                              )}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Spent</span>
                                <span className="font-mono text-primary">{formatNumber(ticket.totalSpent)} MOVE</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Prize Pool</span>
                                <span className="font-mono">{formatNumber(ticket.raffle?.prizePool || 0, 2)} MOVE</span>
                              </div>
                            </div>

                            {/* Progress */}
                            {ticket.raffle && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Tickets Sold</span>
                                  <span>{ticket.raffle.ticketsSold}/{ticket.raffle.totalTickets}</span>
                                </div>
                                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${(ticket.raffle.ticketsSold / ticket.raffle.totalTickets) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Claim Prize Button for Winner */}
                            {canClaimPrize && (
                              <button
                                onClick={(e) => handleClaimPrize(ticket.raffleId, e)}
                                disabled={actionLoading[`claim-${ticket.raffleId}`]}
                                className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-sm rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/30"
                              >
                                {actionLoading[`claim-${ticket.raffleId}`] ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Claiming...
                                  </>
                                ) : (
                                  <>
                                    <Gift className="w-4 h-4" />
                                    Claim Prize
                                  </>
                                )}
                              </button>
                            )}

                            {/* Already Claimed Badge */}
                            {isWinner && ticket.raffle?.isClaimed && (
                              <div className="w-full mt-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded-lg flex items-center justify-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Prize Claimed
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="card-surface p-12 text-center">
                    <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">You haven't bought any tickets yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Browse raffles and buy tickets to participate!
                    </p>
                    <Button 
                      onClick={() => navigate('/')}
                      className="mt-4 bg-primary hover:bg-primary/90"
                    >
                      Explore Raffles
                    </Button>
                  </div>
                )}
              </>
            )}

            {activeTab === "Watchlist" && (
              <>
                {isLoadingWatchlist || isLoadingRaffles ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : watchedRaffles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {watchedRaffles.map((raffle) => {
                      const progress = (raffle.ticketsSold / raffle.totalTickets) * 100;
                      const isEnded = raffle.status >= RAFFLE_STATUS.RAFFLING && raffle.status !== RAFFLE_STATUS.CANCELLED;
                      const hasWinner = raffle.status >= RAFFLE_STATUS.ITEM_RAFFLED && raffle.status !== RAFFLE_STATUS.CANCELLED && !isNullAddress(raffle.winner);
                      const isCancelled = raffle.status === RAFFLE_STATUS.CANCELLED;
                      
                      return (
                        <div
                          key={raffle.id}
                          onClick={() => navigate(`/raffle/${raffle.id}`)}
                          className="card-surface rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all group"
                        >
                          {/* Image */}
                          <div className="relative aspect-square">
                            <img
                              src={raffle.imageUrl}
                              alt={raffle.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Bookmark badge */}
                            <div className="absolute top-2 right-2 bg-primary/90 rounded-full p-1.5">
                              <Bookmark className="w-4 h-4 text-white fill-white" />
                            </div>
                            {/* Status badge */}
                            <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold ${
                              isCancelled ? 'bg-red-500/90 text-white' :
                              hasWinner ? 'bg-purple-500/90 text-white' :
                              isEnded ? 'bg-yellow-500/90 text-black' :
                              'bg-green-500/90 text-white'
                            }`}>
                              {isCancelled ? '🔴 Cancelled' : hasWinner ? '🏆 Ended' : isEnded ? '⏳ Drawing' : '🟢 Active'}
                            </div>
                          </div>
                          
                          {/* Info */}
                          <div className="p-3">
                            <h3 className="font-bold text-white text-sm truncate mb-1">{raffle.title}</h3>
                            <p className="text-gray-400 text-xs truncate mb-2">{raffle.description}</p>
                            
                            {/* Progress */}
                            <div className="mb-2">
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                <span>{raffle.ticketsSold}/{raffle.totalTickets} tickets</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                            </div>
                            
                            {/* Prize */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <img 
                                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png" 
                                  alt="MOVE" 
                                  className="w-4 h-4 rounded-full"
                                />
                                <span className="text-primary font-bold text-sm">
                                  {formatNumber(raffle.prizeAmount + raffle.prizePool, 2)} MOVE
                                </span>
                              </div>
                              <span className="text-gray-500 text-xs">
                                #{raffle.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="card-surface p-12 text-center">
                    <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Your watchlist is empty</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Click the bookmark icon on raffles to add them to your watchlist
                    </p>
                    <Button 
                      onClick={() => navigate('/')}
                      className="mt-4 bg-primary hover:bg-primary/90"
                    >
                      Explore Raffles
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </div>
      </div>

      <CreateListingModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
        asset={selectedAsset}
      />
    </Layout>
  );
};

export default Profile;
