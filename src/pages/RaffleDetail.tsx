import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { ArrowLeft, ArrowRight, Share2, Minus, Plus, Loader2, Gift, XCircle, Dices, Package, CheckCircle, Ticket } from "lucide-react";
import { useSingleRaffle } from "@/hooks/useSingleRaffle";
import { useAllRaffles } from "@/hooks/useAllRaffles";
import { useUserTickets } from "@/hooks/useUserTickets";
import { getRaffleStatusLabel, isNullAddress, RAFFLE_STATUS, claimPrize, claimBackAsset, cancelRaffle, finalizeRaffle } from "@/lib/raffle-contract";
import { ASSET_TYPE } from "@/lib/raffle-contract-v3";
import { usePrivy } from '@privy-io/react-auth';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { buyTickets } from '@/lib/raffle-contract';
import { createNotification } from '@/services/notificationService';
import { toast } from 'sonner';
import { invalidateAllRaffleData } from '@/lib/queryInvalidation';
import { getAvatarFromAddress } from "@/lib/avatarUtils";
import { useUsdConversion, formatUsd } from "@/hooks/useUsdConversion";
import RaffleActivity from "@/components/RaffleActivity";
import RaffleLeaderboard from "@/components/RaffleLeaderboard";
import RaffleComments from "@/components/RaffleComments";
import RaffleEngagement from "@/components/RaffleEngagement";
import { useTrackView } from "@/hooks/useSocialFeatures";
import { getErrorMessage } from "@/lib/errorParser";
import ShareModal from "@/components/ShareModal";
import RaffleResultModal from "@/components/RaffleResultModal";
import { triggerBalanceRefresh } from "@/hooks/useMovementBalance";
import { formatNumber } from "@/lib/utils";

// Token logos mapping
const TOKEN_LOGOS: Record<string, string> = {
  'MOVE': 'https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png',
  'tUSDT': 'https://raw.githubusercontent.com/razorlabsorg/chainlist/refs/heads/main/chain/aptos/asset/USDT.png',
  'tDAI': 'https://raw.githubusercontent.com/razorlabsorg/chainlist/refs/heads/main/chain/aptos/asset/DAI.png',
  'tUSDC': 'https://raw.githubusercontent.com/razorlabsorg/chainlist/refs/heads/main/chain/aptos/asset/USDC.png',
  'tWBTC': 'https://raw.githubusercontent.com/razorlabsorg/chainlist/refs/heads/main/chain/aptos/asset/WBTC.png',
};

// Token contract addresses mapping
const TOKEN_ADDRESSES: Record<string, string> = {
  'MOVE': '0x1::aptos_coin::AptosCoin',
  'tUSDT': '0xe5df458e0bb7020247d5e8c4f5fda70adaccff5318bb456bad8f7c1e3d2bf744',
  'tDAI': '0xfdae7b1bf4b0009f2373ff9e2a636f04bcc8b2d82563de84f4b511f19278c417',
  'tUSDC': '0x63299f5dcc23daa43c841fb740ba094845a1b9c36f69e8ba5f387574f2dd6e7c',
  'tWBTC': '0x502ce7e025310f676585dab2d2f317e71b6232bb2a8eae90fba6a7a2a83dbcbd',
};

const RaffleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const raffleId = id ? parseInt(id) : undefined;

  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "leaderboard" | "comments">("overview");
  const [ticketAmount, setTicketAmount] = useState(1);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isBuying, setIsBuying] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isWalletReady, setIsWalletReady] = useState(false);

  const { user, authenticated } = usePrivy();
  const { signRawHash } = useSignRawHash();

  // Get movement wallet address
  const movementAddress = (user?.linkedAccounts?.find(
    (account: any) => account.chainType === 'aptos'
  ) as any)?.address as string | undefined;

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

  // Track view count
  useTrackView(raffleId);

  // Fetch raffle data
  const { data: raffle, isLoading, error } = useSingleRaffle(raffleId);

  // Fetch user's tickets to check participation
  const { data: userTickets } = useUserTickets(movementAddress);

  // Fetch all raffles for navigation
  const { data: allRaffles } = useAllRaffles();

  // Calculate prev/next raffle IDs
  const { prevRaffleId, nextRaffleId } = useMemo(() => {
    if (!allRaffles || !raffleId) return { prevRaffleId: null, nextRaffleId: null };

    // Sort raffles by ID
    const sortedRaffles = [...allRaffles].sort((a, b) => a.id - b.id);
    const currentIndex = sortedRaffles.findIndex(r => r.id === raffleId);

    if (currentIndex === -1) return { prevRaffleId: null, nextRaffleId: null };

    return {
      prevRaffleId: currentIndex > 0 ? sortedRaffles[currentIndex - 1].id : null,
      nextRaffleId: currentIndex < sortedRaffles.length - 1 ? sortedRaffles[currentIndex + 1].id : null,
    };
  }, [allRaffles, raffleId]);

  // Navigation handlers
  const goToPrevRaffle = () => {
    if (prevRaffleId !== null) {
      navigate(`/raffle/${prevRaffleId}`);
    }
  };

  const goToNextRaffle = () => {
    if (nextRaffleId !== null) {
      navigate(`/raffle/${nextRaffleId}`);
    }
  };

  useEffect(() => {
    if (!raffle) return;

    const calculateTimeLeft = () => {
      const difference = raffle.endTime.getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [raffle]);

  const formatTime = (num: number) => String(num).padStart(2, "0");

  const progress = raffle ? (raffle.ticketsSold / raffle.totalTickets) * 100 : 0;
  const totalPrice = raffle ? formatNumber(ticketAmount * raffle.ticketPrice) : "0";

  // USD conversions
  const { usdValue: ticketPriceUsd } = useUsdConversion(raffle?.ticketPrice || 0);
  // For stablecoins, prize USD = prize amount; for MOVE, use conversion
  const isStablecoin = raffle?.prizeSymbol === 'tUSDT' || raffle?.prizeSymbol === 'tDAI' || raffle?.prizeSymbol === 'USDC';
  const { usdValue: prizeAmountUsdFromMove } = useUsdConversion(
    raffle?.prizeAssetType === ASSET_TYPE.NATIVE ? (raffle?.prizeAmount || 0) : 0
  );
  const prizeAmountUsd = isStablecoin ? (raffle?.prizeAmount || 0) : prizeAmountUsdFromMove;
  const { usdValue: prizePoolUsd } = useUsdConversion(raffle?.prizePool || 0);
  const { usdValue: totalPriceUsd } = useUsdConversion(raffle ? ticketAmount * raffle.ticketPrice : 0);

  // Get prize token info
  const prizeSymbol = raffle?.prizeSymbol || 'MOVE';
  const prizeLogo = TOKEN_LOGOS[prizeSymbol] || TOKEN_LOGOS['MOVE'];

  const handleBuyTickets = async () => {
    if (!user || !raffle) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Check if wallet is ready (Privy wallet proxy needs time to initialize)
    if (!isWalletReady || !signRawHash) {
      toast.error('Wallet not ready', {
        description: 'Please wait a moment and try again. The wallet is still initializing.',
      });
      return;
    }

    const moveWallet = user.linkedAccounts?.find(
      (account: any) => account.chainType === 'aptos'
    ) as any;

    if (!moveWallet) {
      toast.error('Movement wallet not found');
      return;
    }

    // Import optimistic update
    const { optimisticBuyTickets } = await import('@/lib/queryInvalidation');

    // Apply optimistic update immediately
    const rollback = optimisticBuyTickets(raffle.id, ticketAmount);

    try {
      setIsBuying(true);
      toast.info(`Buying ${ticketAmount} ticket(s)...`);

      await buyTickets(
        raffle.id,
        ticketAmount,
        moveWallet.address,
        moveWallet.publicKey,
        signRawHash
      );

      toast.success(`Successfully bought ${ticketAmount} ticket(s)!`);

      // Calculate new tickets sold after this purchase
      const newTicketsSold = raffle.ticketsSold + ticketAmount;
      const isSoldOutNow = newTicketsSold >= raffle.totalTickets;
      const totalPaid = ticketAmount * raffle.ticketPrice;

      // Notify raffle creator about ticket purchase
      if (raffle.creator && raffle.creator.toLowerCase() !== moveWallet.address.toLowerCase()) {
        await createNotification({
          user_address: raffle.creator,
          type: 'ticket_purchased',
          title: 'New Ticket Purchase! 🎫',
          message: `Someone bought ${ticketAmount} ticket(s) for ${formatNumber(totalPaid)} MOVE on "${raffle.title}"`,
          raffle_id: raffle.id,
          related_address: moveWallet.address,
          amount: totalPaid,
        });
      }

      // If sold out, send notifications
      if (isSoldOutNow) {
        // Notify creator to finalize
        await createNotification({
          user_address: raffle.creator,
          type: 'raffle_sold_out',
          title: 'Raffle Sold Out! 🎉',
          message: `All ${raffle.totalTickets} tickets for "${raffle.title}" have been sold! You can now select the winner.`,
          raffle_id: raffle.id,
          amount: raffle.prizePool + totalPaid,
        });

        // Notify the buyer who completed the sold out
        await createNotification({
          user_address: moveWallet.address,
          type: 'raffle_sold_out',
          title: 'Raffle Sold Out! 🎫',
          message: `"${raffle.title}" is now sold out! Please wait for the creator to select the winner. Good luck! 🍀`,
          raffle_id: raffle.id,
          amount: totalPaid,
        });

        // Trigger backend to notify all other participants
        try {
          const API_BASE = import.meta.env.VITE_API_URL;
          if (API_BASE) {
            await fetch(`${API_BASE}/api/notifications/raffle-sold-out`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                raffle_id: raffle.id,
                raffle_title: raffle.title,
                exclude_address: moveWallet.address, // Don't notify the buyer again
              }),
            });
          }
        } catch (e) {
          console.warn('Failed to notify other participants:', e);
        }
      }

      // Invalidate queries to refresh data without page reload
      await invalidateAllRaffleData(raffle.id, moveWallet.address);

      // Trigger global balance refresh
      setTimeout(() => {
        triggerBalanceRefresh();
      }, 2000);

    } catch (error: any) {
      // Rollback optimistic update on error
      rollback();

      console.error('Error buying tickets:', error);
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description });
    } finally {
      setIsBuying(false);
    }
  };

  // Get user's wallet info
  const moveWallet = user?.linkedAccounts?.find(
    (account: any) => account.chainType === 'aptos'
  ) as any;
  const userAddress = moveWallet?.address || '';
  const userPublicKey = moveWallet?.publicKey || '';

  // Check if current user is creator or winner
  const isCreator = userAddress && raffle &&
    userAddress.toLowerCase().replace(/^0x0*/, '') === raffle.creator.toLowerCase().replace(/^0x0*/, '');
  const isWinner = userAddress && raffle && !isNullAddress(raffle.winner) &&
    userAddress.toLowerCase().replace(/^0x0*/, '') === raffle.winner.toLowerCase().replace(/^0x0*/, '');

  // Check if user participated in this raffle
  const userParticipated = userTickets?.some(ticket => ticket.raffleId === raffleId) || false;

  // Auto-show result modal when raffle is finalized and user participated (only once per session)
  useEffect(() => {
    if (!raffle || !userAddress) return;

    // Check if raffle is finalized and has a winner
    const isFinalized = raffle.status >= RAFFLE_STATUS.ITEM_RAFFLED && !isNullAddress(raffle.winner);

    if (isFinalized && userParticipated) {
      const resultShownKey = `result-modal-shown-${raffle.id}`;

      // Only show if not shown before in this session
      if (!sessionStorage.getItem(resultShownKey)) {
        setShowResultModal(true);
        sessionStorage.setItem(resultShownKey, 'true');
      }
    }
  }, [raffle, userAddress, userParticipated]);

  // Action handlers
  const handleClaimPrize = async () => {
    if (!userAddress || !raffle) return;
    if (!isWalletReady || !signRawHash) {
      toast.error('Wallet not ready', {
        description: 'Please wait a moment and try again.',
      });
      return;
    }
    setActionLoading('claim');
    try {
      toast.info('Claiming prize...');
      await claimPrize(raffle.id, userAddress, userPublicKey, signRawHash);
      toast.success('Prize claimed successfully! 🎉');
      await invalidateAllRaffleData(raffle.id, userAddress);

      // Trigger global balance refresh
      setTimeout(() => {
        triggerBalanceRefresh();
      }, 2000);
    } catch (error: any) {
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRaffle = async () => {
    if (!userAddress || !raffle) return;
    if (!isWalletReady || !signRawHash) {
      toast.error('Wallet not ready', {
        description: 'Please wait a moment and try again.',
      });
      return;
    }
    setActionLoading('cancel');
    try {
      toast.info('Cancelling raffle...');
      await cancelRaffle(raffle.id, userAddress, userPublicKey, signRawHash);
      toast.success('Raffle cancelled!');
      await invalidateAllRaffleData(raffle.id, userAddress);

      // Trigger global balance refresh
      setTimeout(() => {
        triggerBalanceRefresh();
      }, 2000);
    } catch (error: any) {
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description });
    } finally {
      setActionLoading(null);
    }
  };

  const handleFinalizeRaffle = async () => {
    if (!userAddress || !raffle) return;
    if (!isWalletReady || !signRawHash) {
      toast.error('Wallet not ready', {
        description: 'Please wait a moment and try again.',
      });
      return;
    }
    setActionLoading('finalize');
    try {
      toast.info('Selecting winner...');
      await finalizeRaffle(raffle.id, userAddress, userPublicKey, signRawHash);
      toast.success('Winner selected! 🎲');

      // Send notification to creator
      await createNotification({
        user_address: raffle.creator,
        type: 'raffle_finalized',
        title: 'Raffle Finalized! 🎲',
        message: `Winner has been selected for "${raffle.title}". Check the results!`,
        raffle_id: raffle.id,
        amount: raffle.prizePool,
      });

      await invalidateAllRaffleData(raffle.id, userAddress);

      // Trigger global balance refresh
      setTimeout(() => {
        triggerBalanceRefresh();
      }, 2000);
    } catch (error: any) {
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description });
    } finally {
      setActionLoading(null);
    }
  };

  const handleClaimBackAsset = async () => {
    if (!userAddress || !raffle) return;
    if (!isWalletReady || !signRawHash) {
      toast.error('Wallet not ready', {
        description: 'Please wait a moment and try again.',
      });
      return;
    }
    setActionLoading('claimback');
    try {
      toast.info('Claiming back asset...');
      await claimBackAsset(raffle.id, userAddress, userPublicKey, signRawHash);
      toast.success('Asset claimed back!');
      await invalidateAllRaffleData(raffle.id, userAddress);

      // Trigger global balance refresh
      setTimeout(() => {
        triggerBalanceRefresh();
      }, 2000);
    } catch (error: any) {
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description });
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "activity", label: "Activity" },
    { id: "leaderboard", label: "Leaderboard" },
    { id: "comments", label: "Comments" },
  ];

  if (isLoading) {
    return (
      <Layout showTicker>
        <div className="max-w-[1600px] mx-auto px-6 py-20">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !raffle) {
    return (
      <Layout showTicker>
        <div className="max-w-[1600px] mx-auto px-6 py-20">
          <div className="text-center">
            <p className="text-red-400">Error loading raffle</p>
            <p className="text-sm text-muted-foreground mt-2">Raffle not found or failed to load</p>
            <Link to="/" className="text-primary hover:underline mt-4 inline-block">
              Back to Explore
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showTicker>
      <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4 md:py-6">
        <div className="grid lg:grid-cols-[1.8fr_3.2fr] gap-4 items-start">
          {/* Left: Image & Breadcrumb - Sticky on desktop, normal flow on mobile */}
          <div className="lg:sticky lg:top-24 flex flex-col gap-4 md:gap-6 lg:self-start">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-gray-400 hover:text-[#A04545] transition-colors">
                Explore
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-white truncate max-w-[120px] md:max-w-[200px]">{raffle.title}</span>
              <div className="flex items-center gap-1 md:gap-2 ml-auto">
                <button
                  onClick={goToPrevRaffle}
                  disabled={prevRaffleId === null}
                  className={`p-1.5 md:p-2 rounded-lg transition-colors ${prevRaffleId !== null
                      ? 'hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer'
                      : 'text-gray-600 cursor-not-allowed'
                    }`}
                  title={prevRaffleId !== null ? `Go to Raffle #${prevRaffleId}` : 'No previous raffle'}
                >
                  <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
                </button>
                <button
                  onClick={goToNextRaffle}
                  disabled={nextRaffleId === null}
                  className={`p-1.5 md:p-2 rounded-lg transition-colors ${nextRaffleId !== null
                      ? 'hover:bg-white/5 text-[#A04545] hover:text-[#D65D5D] cursor-pointer'
                      : 'text-gray-600 cursor-not-allowed'
                    }`}
                  title={nextRaffleId !== null ? `Go to Raffle #${nextRaffleId}` : 'No next raffle'}
                >
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              </div>
            </div>

            <div className="aspect-square rounded-lg md:rounded-xl overflow-hidden bg-black border-2 border-white/20 w-full">
              <img
                src={raffle.imageUrl}
                alt={raffle.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right: Details - Scrollable with Page */}
          <div className="space-y-4 md:space-y-6 pb-8 md:pb-20 pt-1.5">
            {/* Title & Actions */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-white truncate">
                  {raffle.title}
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#A04545] flex items-center justify-center text-[8px] md:text-[10px] font-bold text-white">R</div>
                  <span className="text-gray-400 font-mono text-[10px] md:text-xs">{raffle.creator.slice(0, 6)}...{raffle.creator.slice(-4)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 ml-2">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="text-gray-400 hover:text-[#A04545] transition-colors p-1"
                >
                  <Share2 className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              </div>
            </div>

            {/* Engagement Stats */}
            <RaffleEngagement raffleId={raffle.id} />

            {/* Raffle Info */}
            <div className="bg-[#1A1A1E] border border-white/10 rounded-lg md:rounded-xl p-2.5 md:p-3 space-y-2.5 md:space-y-3">
              <div className="grid grid-cols-3 gap-2 md:gap-3 text-xs">
                <div>
                  <p className="text-gray-400 text-[9px] md:text-[10px]">Ticket Price</p>
                  <p className="font-mono font-medium text-white text-xs md:text-sm">{formatNumber(raffle.ticketPrice)} MOVE</p>
                  <p className="text-[8px] md:text-[9px] text-gray-500 font-medium">{formatUsd(ticketPriceUsd)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[9px] md:text-[10px]">Prize Deposit</p>
                  <div className="flex items-center gap-0.5 md:gap-1">
                    <img src={prizeLogo} alt={prizeSymbol} className="w-3 h-3 md:w-4 md:h-4 rounded-full" />
                    <p className="font-mono font-medium text-primary text-xs md:text-sm">{formatNumber(raffle.prizeAmount)} {prizeSymbol}</p>
                  </div>
                  <p className="text-[8px] md:text-[9px] text-gray-500 font-medium">{formatUsd(prizeAmountUsd)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[9px] md:text-[10px]">Current Pool</p>
                  <p className="font-mono font-medium text-white text-xs md:text-sm">{formatNumber(raffle.prizePool)} MOVE</p>
                  <p className="text-[8px] md:text-[9px] text-gray-500 font-medium">{formatUsd(prizePoolUsd)}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-[9px] md:text-[10px]">Target Progress</span>
                  <span className="font-mono text-[10px] md:text-xs text-white">
                    {formatNumber(raffle.prizePool, 2)} / {formatNumber(raffle.targetAmount, 2)} MOVE
                    <span className="text-primary ml-1">
                      ({formatNumber((raffle.prizePool / raffle.targetAmount) * 100, 1)}%)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sale Countdown */}
            <div className="bg-[#1A1A1E] border border-white/10 rounded-lg md:rounded-xl p-2.5 md:p-3 space-y-2.5 md:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-[10px] md:text-xs">
                    {raffle.status === 1 ? '⏰ Sale Ends' : raffle.status >= 3 && !isNullAddress(raffle.winner) ? '🏆 Winner Selected' : '⏳ Drawing Winner'}
                  </span>
                  <span className="text-white text-[10px] md:text-xs">{raffle.endTime.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <span className={`font-mono font-bold text-[10px] md:text-xs ${raffle.status >= 3 && !isNullAddress(raffle.winner)
                    ? 'text-primary'
                    : raffle.status >= 2
                      ? 'text-yellow-500'
                      : 'text-[#A04545]'
                  }`}>
                  {raffle.status >= 3 && !isNullAddress(raffle.winner)
                    ? 'Raffle Ended'
                    : raffle.status >= 2
                      ? 'Drawing Winner...'
                      : `${formatTime(timeLeft.days)}D : ${formatTime(timeLeft.hours)}H : ${formatTime(timeLeft.minutes)}M : ${formatTime(timeLeft.seconds)}S`
                  }
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 md:h-2.5 bg-white/20 rounded-full overflow-hidden p-[1px]">
                <div
                  className="h-full bg-gradient-to-r from-[#A04545] to-[#D65D5D] rounded-full shadow-[0_0_10px_rgba(160,69,69,0.5)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-[9px] md:text-[10px]">Ticket Sold / Total</span>
                  <span className="font-mono text-white text-[10px] md:text-xs">
                    <span className="text-[#A04545] font-bold">🎫 {raffle.ticketsSold}</span>/{raffle.totalTickets} ({Math.round(progress)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-[9px] md:text-[10px]">Target Amount</span>
                  <span className="font-mono text-white text-[10px] md:text-xs">
                    <span className="text-[#A04545] font-bold">⊛ {formatNumber(raffle.targetAmount, 2)}</span> MOVE
                  </span>
                </div>
              </div>
            </div>

            {/* Asset Value */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <div>
                <p className="text-gray-400 text-[9px] md:text-[10px]">Prize Deposit</p>
                <div className="flex items-center gap-0.5 md:gap-1">
                  <img src={prizeLogo} alt={prizeSymbol} className="w-3 h-3 md:w-4 md:h-4 rounded-full" />
                  <p className="font-mono text-sm md:text-base font-bold text-white">{formatNumber(raffle.prizeAmount)} {prizeSymbol}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-[9px] md:text-[10px] flex items-center gap-1">
                  <span className="text-[#A04545]">🎫</span> Ticket Price
                </p>
                <p className="font-mono text-sm md:text-base font-bold text-white">{formatNumber(raffle.ticketPrice)} MOVE</p>
              </div>
              <div>
                <p className="text-gray-400 text-[9px] md:text-[10px]">Total Value</p>
                <p className="font-mono text-sm md:text-base font-bold text-primary">{formatNumber(raffle.ticketPrice * raffle.totalTickets, 2)} MOVE</p>
              </div>
            </div>

            {/* Buy Section or Status Display */}
            {(() => {
              const isSoldOut = raffle.ticketsSold >= raffle.totalTickets;
              const isTimeEnded = raffle.endTime <= new Date();
              const isRaffling = raffle.status === RAFFLE_STATUS.RAFFLING;
              const canBuy = raffle.status === RAFFLE_STATUS.LISTED && !isSoldOut && !isTimeEnded;
              const ticketsRemaining = raffle.totalTickets - raffle.ticketsSold;
              
              // Calculate user's current tickets for this raffle
              const userCurrentTickets = userTickets?.filter(t => t.raffleId === raffleId)
                .reduce((sum, t) => sum + (t.ticketCount || 0), 0) || 0;
              
              // Calculate max tickets user can still buy
              const maxTicketsPerUser = raffle.maxTicketsPerUser || Math.ceil(raffle.totalTickets * 0.1); // Default 10%
              const userRemainingAllowance = Math.max(0, maxTicketsPerUser - userCurrentTickets);
              const effectiveMaxBuy = Math.min(ticketsRemaining, userRemainingAllowance);
              const hasReachedLimit = userRemainingAllowance <= 0;

              if (canBuy) {
                // Active Raffle - Show Buy Section
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] md:text-xs text-gray-400">Buy Amount</p>
                      <div className="text-right">
                        <p className="text-[10px] md:text-xs text-gray-500">{ticketsRemaining} tickets remaining</p>
                        {maxTicketsPerUser > 0 && (
                          <p className="text-[10px] text-gray-600">
                            Max {maxTicketsPerUser}/user • You: {userCurrentTickets}/{maxTicketsPerUser}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {hasReachedLimit ? (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
                        <p className="text-yellow-400 text-sm font-medium">🎫 Ticket Limit Reached</p>
                        <p className="text-yellow-400/70 text-xs mt-1">
                          You've purchased {userCurrentTickets} tickets (max {maxTicketsPerUser} per user)
                        </p>
                      </div>
                    ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 flex items-center gap-2 p-2 md:p-2.5 bg-[#1A1A1E] rounded-lg border border-white/10">
                        <span className="text-base md:text-lg">🎫</span>
                        <span className="font-mono text-sm md:text-base text-white">{ticketAmount}</span>
                        <span className="text-gray-400 text-[10px] md:text-xs">TICKET{ticketAmount > 1 ? 'S' : ''}</span>
                        <div className="ml-auto flex items-center gap-1 md:gap-1.5">
                          <button
                            onClick={() => setTicketAmount(Math.max(1, ticketAmount - 1))}
                            disabled={ticketAmount <= 1}
                            className="w-6 h-6 md:w-7 md:h-7 bg-[#A04545] rounded flex items-center justify-center hover:bg-[#8a3b3b] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                          </button>
                          <button
                            onClick={() => setTicketAmount(Math.min(effectiveMaxBuy, ticketAmount + 1))}
                            disabled={ticketAmount >= effectiveMaxBuy}
                            className="w-6 h-6 md:w-7 md:h-7 bg-[#A04545] rounded flex items-center justify-center hover:bg-[#8a3b3b] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={handleBuyTickets}
                        disabled={isBuying || ticketAmount > effectiveMaxBuy}
                        className="px-4 md:px-5 py-2 md:py-2.5 bg-[#A04545] hover:bg-[#8a3b3b] text-white font-bold rounded-lg flex items-center justify-center gap-1 md:gap-2 transition-colors shadow-lg shadow-[#A04545]/20 text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
                      >
                        {isBuying ? (
                          <>
                            <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                            <span className="hidden sm:inline">BUYING...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline">BUY NOW</span>
                            <span className="sm:hidden">BUY</span>
                            <span className="font-mono text-[10px] md:text-xs">{totalPrice}</span>
                            <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png" alt="MOVE" className="w-3 h-3 md:w-4 md:h-4 rounded-full" />
                            <span className="text-[8px] md:text-[10px] text-white/60 hidden md:inline">{formatUsd(totalPriceUsd)}</span>
                          </>
                        )}
                      </button>
                    </div>
                    )}
                  </div>
                );
              } else if (isSoldOut && raffle.status === RAFFLE_STATUS.LISTED) {
                // Sold Out - waiting for time to end
                return (
                  <div className="bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Ticket className="w-6 h-6 text-orange-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-orange-400">SOLD OUT</p>
                        <p className="text-xs text-gray-400">All {raffle.totalTickets} tickets have been sold</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 text-center">
                      <p className="text-xs text-gray-400">
                        Waiting for raffle to end • Winner will be selected soon
                      </p>
                    </div>
                  </div>
                );
              } else if (isRaffling || (isTimeEnded && raffle.status === RAFFLE_STATUS.LISTED)) {
                // Raffling in Progress
                return (
                  <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse">
                        <Dices className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-yellow-400">RAFFLING IN PROGRESS</p>
                        <p className="text-xs text-gray-400">Ticket sale has ended</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>Total Tickets Sold</span>
                        <span className="font-mono text-white">{raffle.ticketsSold} / {raffle.totalTickets}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Prize Pool</span>
                        <span className="font-mono text-primary">{formatNumber(raffle.prizePool)} MOVE</span>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Raffle Ended - Show Winner
                const userIsWinner = isWinner;

                return (
                  <div className={`bg-gradient-to-r ${userIsWinner ? 'from-yellow-500/20 via-amber-500/20 to-yellow-500/20 border-yellow-500/50' : 'from-[#A04545]/10 via-purple-600/10 to-[#A04545]/10 border-[#A04545]/30'} border rounded-xl p-4`}>
                    {/* YOU WON Banner for winner */}
                    {userIsWinner && (
                      <div className="flex items-center justify-center gap-2 mb-3 pb-3 border-b border-yellow-500/30">
                        <span className="text-3xl">🎉</span>
                        <span className="text-2xl font-bold text-yellow-400 animate-pulse">YOU WON!</span>
                        <span className="text-3xl">🎉</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isNullAddress(raffle.winner) ? (
                          <div className="text-5xl">
                            ⏳
                          </div>
                        ) : (
                          <div className="text-5xl">
                            {getAvatarFromAddress(raffle.winner)}
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-400 mb-1">{userIsWinner ? 'Congratulations!' : 'The Winner'}</p>
                          {isNullAddress(raffle.winner) ? (
                            <p className="font-mono text-lg font-bold text-yellow-500">Drawing Winner...</p>
                          ) : userIsWinner ? (
                            <p className="font-mono text-lg font-bold text-yellow-400">
                              You are the winner! 🏆
                            </p>
                          ) : (
                            <p className="font-mono text-lg font-bold text-white">
                              {raffle.winner.slice(0, 8)}...{raffle.winner.slice(-6)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-1">Prize Won</p>
                        <div className="flex items-center gap-1 justify-end">
                          <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png" alt="MOVE" className="w-5 h-5 rounded-full" />
                          <span className={`font-mono text-lg font-bold ${userIsWinner ? 'text-yellow-400' : 'text-[#A04545]'}`}>
                            {raffle.status === 3
                              ? formatNumber(raffle.prizeAmount)  // Item Raffled: winner gets prize deposit
                              : raffle.status === 4
                                ? formatNumber(raffle.prizePool * 0.95)  // Fund Raffled: winner gets 95% of pool
                                : '0'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Share Win Button for winner */}
                    {userIsWinner && !isNullAddress(raffle.winner) && (
                      <div className="mt-3 pt-3 border-t border-yellow-500/30">
                        <button
                          onClick={() => setShowShareModal(true)}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/30"
                        >
                          <Share2 className="w-4 h-4" />
                          Share Your Win!
                        </button>
                      </div>
                    )}

                    {!isNullAddress(raffle.winner) && !userIsWinner && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-gray-400 text-center">
                          Verify Winner on{" "}
                          <a
                            href={`https://explorer.movementlabs.xyz/account/${raffle.winner}?network=testnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#A04545] hover:underline font-medium"
                          >
                            Movement Explorer ↗
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                );
              }
            })()}

            {/* Raffle Actions Panel */}
            {raffle && userAddress && (
              <div className="space-y-2">
                {/* Winner: Claim Prize */}
                {isWinner && !raffle.isClaimed && (raffle.status === RAFFLE_STATUS.ITEM_RAFFLED || raffle.status === RAFFLE_STATUS.FUND_RAFFLED) && (
                  <button
                    onClick={handleClaimPrize}
                    disabled={actionLoading === 'claim'}
                    className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/30"
                  >
                    {actionLoading === 'claim' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Claiming...</>
                    ) : (
                      <><Gift className="w-4 h-4" /> Claim Your Prize</>
                    )}
                  </button>
                )}

                {/* Winner: Already Claimed */}
                {isWinner && raffle.isClaimed && (
                  <div className="w-full px-4 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium rounded-lg flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Prize Claimed
                  </div>
                )}

                {/* Creator: Cancel Raffle (only if no tickets sold) */}
                {isCreator && raffle.status === RAFFLE_STATUS.LISTED && raffle.ticketsSold === 0 && (
                  <button
                    onClick={handleCancelRaffle}
                    disabled={actionLoading === 'cancel'}
                    className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'cancel' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</>
                    ) : (
                      <><XCircle className="w-4 h-4" /> Cancel Raffle</>
                    )}
                  </button>
                )}

                {/* Creator Only: Finalize Raffle (select winner) - when RAFFLING or when LISTED but (time ended OR sold out) */}
                {isCreator && (raffle.status === RAFFLE_STATUS.RAFFLING ||
                  (raffle.status === RAFFLE_STATUS.LISTED && (raffle.endTime <= new Date() || raffle.ticketsSold >= raffle.totalTickets))) && (
                    <button
                      onClick={handleFinalizeRaffle}
                      disabled={actionLoading === 'finalize'}
                      className="w-full px-4 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading === 'finalize' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Selecting Winner...</>
                      ) : (
                        <><Dices className="w-4 h-4" /> Select Winner</>
                      )}
                    </button>
                  )}

                {/* Creator: Claim Back Asset */}
                {isCreator && raffle.assetInEscrow && (raffle.status === RAFFLE_STATUS.CANCELLED || raffle.status === RAFFLE_STATUS.FUND_RAFFLED) && (
                  <button
                    onClick={handleClaimBackAsset}
                    disabled={actionLoading === 'claimback'}
                    className="w-full px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'claimback' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Claiming...</>
                    ) : (
                      <><Package className="w-4 h-4" /> Claim Back Asset</>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-white/10 overflow-x-auto">
              <div className="flex gap-4 md:gap-6 min-w-max px-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-2 md:pb-3 text-xs md:text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.id ? "text-white" : "text-gray-400 hover:text-white"
                      }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A04545]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {/* Token Metadata */}
                  <div className="bg-[#151515] border border-white/5 rounded-lg p-3 space-y-2">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Prize Token Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Name</span>
                        <div className="flex items-center gap-1.5">
                          <img src={prizeLogo} alt={prizeSymbol} className="w-4 h-4 rounded-full" />
                          <p className="text-white font-medium">{raffle.prizeName || prizeSymbol}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Symbol</span>
                        <p className="text-white font-medium">{prizeSymbol}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Decimals</span>
                        <p className="text-white font-medium">{raffle.prizeDecimals || 8}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Network</span>
                        <p className="text-white font-medium">Movement Network</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Contract Address</span>
                        <p className="text-white font-mono text-[10px] break-all">
                          {TOKEN_ADDRESSES[prizeSymbol] || raffle.prizeFaMetadata || '0x1::aptos_coin::AptosCoin'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Asset Type</span>
                        <p className="text-white font-medium">
                          {raffle.prizeAssetType === ASSET_TYPE.NATIVE ? 'Native Coin' : 'Fungible Asset'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Chain ID</span>
                        <p className="text-white font-medium">250 (Testnet)</p>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-medium text-white">Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Raffle ID</span>
                      <span className="font-mono text-white">#{raffle.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Creator</span>
                      <span className="font-mono text-primary">{raffle.creator.slice(0, 10)}...{raffle.creator.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Status</span>
                      <span className="font-mono text-white">{getRaffleStatusLabel(raffle.status)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">End Time</span>
                      <span className="font-mono text-white">
                        {raffle.endTime.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Tickets</span>
                      <span className="font-mono text-white">{raffle.totalTickets} tickets</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Tickets Sold</span>
                      <span className="font-mono text-primary">{raffle.ticketsSold} / {raffle.totalTickets} ({Math.round(progress)}%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Ticket Price</span>
                      <div className="text-right">
                        <p className="font-mono text-white">{formatNumber(raffle.ticketPrice)} MOVE</p>
                        <p className="text-[10px] text-gray-500">{formatUsd(ticketPriceUsd)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Target Amount</span>
                      <span className="font-mono text-white">{formatNumber(raffle.targetAmount)} MOVE</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Prize Deposit</span>
                      <div className="text-right flex items-center gap-1">
                        <img src={prizeLogo} alt={prizeSymbol} className="w-4 h-4 rounded-full" />
                        <p className="font-mono text-primary">{formatNumber(raffle.prizeAmount)} {prizeSymbol}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Current Prize Pool</span>
                      <div className="text-right">
                        <p className="font-mono text-white">{formatNumber(raffle.prizePool)} MOVE</p>
                        <p className="text-[10px] text-gray-500">{formatUsd(prizePoolUsd)}</p>
                      </div>
                    </div>
                    {raffle.status !== 1 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Winner</span>
                        <span className="font-mono text-white">
                          {isNullAddress(raffle.winner)
                            ? 'Not drawn yet'
                            : `${raffle.winner.slice(0, 6)}...${raffle.winner.slice(-4)}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <h3 className="font-medium text-white mb-3">Description</h3>
                    <p className="text-sm text-gray-400">{raffle.description}</p>
                  </div>
                </div>
              )}

              {activeTab === "activity" && (
                <RaffleActivity raffleId={raffle.id} prizeSymbol={raffle.prizeSymbol} />
              )}

              {activeTab === "leaderboard" && (
                <RaffleLeaderboard raffleId={raffle.id} />
              )}

              {activeTab === "comments" && (
                <RaffleComments raffleId={raffle.id} userAddress={userAddress} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        raffle={{
          id: raffle.id,
          title: raffle.title,
          description: raffle.description,
          imageUrl: raffle.imageUrl,
          ticketPrice: raffle.ticketPrice,
          prizeAmount: raffle.prizeAmount,
          prizePool: raffle.prizePool,
          status: raffle.status,
        }}
        isWinner={isWinner}
      />

      {/* Result Modal - Show for users who participated when raffle is finalized */}
      {raffle.status >= RAFFLE_STATUS.ITEM_RAFFLED && !isNullAddress(raffle.winner) && userParticipated && (
        <RaffleResultModal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          isWinner={isWinner}
          raffle={{
            id: raffle.id,
            title: raffle.title,
            imageUrl: raffle.imageUrl,
            prizeAmount: raffle.prizeAmount,
            prizePool: raffle.prizePool,
            prizeSymbol: raffle.prizeSymbol,
          }}
        />
      )}
    </Layout>
  );
};

export default RaffleDetail;
