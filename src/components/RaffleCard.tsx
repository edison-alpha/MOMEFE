import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUsdConversion, formatUsd } from "@/hooks/useUsdConversion";
import { ASSET_TYPE } from "@/lib/raffle-contract-v5";

interface RaffleCardProps {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  endTime: Date;
  ticketsSold: number;
  totalTickets: number;
  ticketPrice: number;
  prizeAmount?: number;
  status?: number;
  winner?: string;
  // Multi-asset support (V3)
  prizeAssetType?: number;
  prizeSymbol?: string;
  prizeLogo?: string;
}

// Token logos mapping
const TOKEN_LOGOS: Record<string, string> = {
  'MOVE': 'https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png',
  'tUSDT': 'https://raw.githubusercontent.com/razorlabsorg/chainlist/refs/heads/main/chain/aptos/asset/USDT.png',
  'tDAI': 'https://raw.githubusercontent.com/razorlabsorg/chainlist/refs/heads/main/chain/aptos/asset/DAI.png',
};

const RaffleCard = ({
  id,
  image,
  title,
  subtitle = "Warplet #854434",
  endTime,
  ticketsSold,
  totalTickets,
  ticketPrice,
  prizeAmount = 0,
  status = 1,
  winner = '0x0',
  prizeAssetType = ASSET_TYPE.NATIVE,
  prizeSymbol = 'MOVE',
  prizeLogo,
}: RaffleCardProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Calculate remaining tickets and buy all price
  const remainingTickets = totalTickets - ticketsSold;
  const buyAllPrice = remainingTickets * ticketPrice;

  // Get prize logo
  const getPrizeLogo = () => {
    if (prizeLogo) return prizeLogo;
    return TOKEN_LOGOS[prizeSymbol] || TOKEN_LOGOS['MOVE'];
  };

  // Check if prize is stablecoin (for USD display)
  const isStablecoin = prizeSymbol === 'tUSDT' || prizeSymbol === 'tDAI' || prizeSymbol === 'USDC';

  // USD conversion for ticket price, prize, and buy all
  const { usdValue: ticketPriceUsd } = useUsdConversion(ticketPrice);
  // For stablecoins, prize USD = prize amount; for MOVE, use conversion
  const { usdValue: prizeAmountUsdFromMove } = useUsdConversion(prizeAssetType === ASSET_TYPE.NATIVE ? prizeAmount : 0);
  const prizeAmountUsd = isStablecoin ? prizeAmount : prizeAmountUsdFromMove;
  const { usdValue: buyAllPriceUsd } = useUsdConversion(buyAllPrice);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime.getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const formatTime = (num: number) => String(num).padStart(2, "0");
  const progress = (ticketsSold / totalTickets) * 100;

  // Check if winner is null address
  const isNullAddress = (address: string): boolean => {
    if (!address) return true;
    const nullPatterns = ['0x0', '0x00', '0x0000000000000000000000000000000000000000000000000000000000000000', '@0x0'];
    if (nullPatterns.includes(address)) return true;
    const hexPart = address.replace(/^(0x|@0x)/, '');
    return /^0+$/.test(hexPart);
  };

  const hasWinner = status >= 3 && status !== 5 && !isNullAddress(winner);
  const isFinalized = status >= 2 && status !== 5;
  const isCancelled = status === 5;

  return (
    <Link to={`/raffle/${id}`} className="group block h-full">
      <div className="bg-black rounded-[16px] md:rounded-[24px] overflow-hidden transition-all duration-300 h-full flex flex-col border-2 border-white/20 relative">
        {/* Image Section */}
        <div className="relative aspect-square">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Prize Badge - Top Right */}
          {prizeAmount > 0 && (
            <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-black/80 backdrop-blur-sm px-1.5 py-1 md:px-2 md:py-1 rounded-lg border border-primary/30">
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] md:text-[10px] text-gray-400 font-medium">Prize:</span>
                  <img src={getPrizeLogo()} alt={prizeSymbol} className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" />
                  <span className="text-[10px] md:text-xs font-bold text-primary">{prizeAmount.toFixed(2)} {prizeSymbol}</span>
                </div>
                <span className="text-[8px] md:text-[9px] text-gray-500 font-medium">{formatUsd(prizeAmountUsd)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Countdown Strip */}
        <div className={`py-1 text-center relative z-10 -mt-1 ${isCancelled ? 'bg-red-600/80' : hasWinner ? 'bg-gradient-to-r from-primary/80 to-purple-600/80' : isFinalized ? 'bg-yellow-600/80' : 'bg-[#A04545]'}`}>
          <span className="font-medium text-white/90 text-[10px] md:text-[11px] tracking-wide font-mono">
            {isCancelled ? (
              '🔴 Cancelled'
            ) : hasWinner ? (
              '🏆 Winner Selected'
            ) : isFinalized ? (
              '⏳ Drawing Winner...'
            ) : (
              `${timeLeft.days}D : ${formatTime(timeLeft.hours)}H : ${formatTime(timeLeft.minutes)}M : ${formatTime(timeLeft.seconds)}S`
            )}
          </span>
        </div>

        {/* Info Section */}
        <div className="p-2.5 md:p-3 pt-2.5 md:pt-3 flex-1 flex flex-col">
          <div className="mb-2">
            <h3 className="text-white font-bold text-xs md:text-sm mb-0.5 line-clamp-1">{title}</h3>
            <p className="text-gray-400 text-[10px] md:text-xs line-clamp-2 leading-tight">{subtitle}</p>
          </div>

          <div className="space-y-1 mb-3 md:mb-4">
            <div className="h-2 md:h-2.5 bg-white/20 rounded-full overflow-hidden p-[1px] relative">
              <div
                className="h-full bg-gradient-to-r from-[#A04545] via-[#D65D5D] to-[#FF6B6B] rounded-full transition-all duration-500 relative"
                style={{
                  width: `${progress}%`,
                  boxShadow: '0 0 20px rgba(160, 69, 69, 0.8), 0 0 40px rgba(160, 69, 69, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.3)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer rounded-full" />
              </div>
            </div>
            <div className="flex justify-between text-[9px] md:text-[10px] font-bold tracking-wide">
              <span className="text-[#A04545]">{ticketsSold}/{totalTickets}</span>
              <span className="text-[#A04545]">({Math.round(progress)}%)</span>
            </div>
          </div>

          <div className="mt-auto flex gap-1 md:gap-1.5 min-h-[45px] md:min-h-[50px]">
            {isCancelled ? (
              /* Cancelled Display */
              <div className="flex-1 flex flex-col items-center justify-center py-1.5 md:py-2 px-1.5 md:px-2 bg-red-500/20 rounded-xl border border-red-500/30">
                <span className="text-[8px] md:text-[9px] text-gray-400 font-medium mb-1">Status</span>
                <span className="font-mono text-[10px] md:text-xs font-bold text-red-500">
                  Raffle Cancelled
                </span>
              </div>
            ) : hasWinner ? (
              /* Winner Display */
              <div className="flex-1 flex flex-col items-center justify-center py-1.5 md:py-2 px-1.5 md:px-2 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-xl border border-primary/30">
                <span className="text-[8px] md:text-[9px] text-gray-400 font-medium mb-1">🏆 Winner</span>
                <span className="font-mono text-[10px] md:text-xs font-bold text-primary truncate max-w-full">
                  {winner.slice(0, 6)}...{winner.slice(-4)}
                </span>
              </div>
            ) : isFinalized ? (
              /* Finalized but no winner yet */
              <div className="flex-1 flex flex-col items-center justify-center py-1.5 md:py-2 px-1.5 md:px-2 bg-secondary/50 rounded-xl border border-white/10">
                <span className="text-[8px] md:text-[9px] text-gray-400 font-medium mb-1">Status</span>
                <span className="font-mono text-[10px] md:text-xs font-bold text-yellow-500">
                  Drawing Winner...
                </span>
              </div>
            ) : (
              /* Active Raffle - Buy Buttons */
              <>
                {/* Buy All - Left Button */}
                <button
                  className="flex-1 flex flex-col items-center justify-center py-1 md:py-1.5 px-0.5 md:px-1 bg-[#151515] hover:bg-[#202020] rounded-xl transition-colors border border-white/10 hover:border-white/20"
                >
                  <span className="text-[8px] md:text-[9px] text-gray-400 font-medium mb-0.5">Buy All ({remainingTickets})</span>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-0.5 md:gap-1">
                      <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png" alt="MOVE" className="w-3 h-3 md:w-4 md:h-4 rounded-full" />
                      <span className="text-white font-bold text-sm md:text-base">{buyAllPrice.toFixed(2)}</span>
                    </div>
                    <span className="text-[8px] md:text-[9px] text-gray-500 font-medium">{formatUsd(buyAllPriceUsd)}</span>
                  </div>
                </button>

                {/* Start From - Right Button */}
                <button
                  className="flex-1 flex flex-col items-center justify-center py-1 md:py-1.5 px-0.5 md:px-1 bg-[#151515] hover:bg-[#202020] rounded-xl transition-colors border border-white/10 hover:border-white/20"
                >
                  <span className="text-[8px] md:text-[9px] text-gray-400 font-medium mb-0.5">Start From</span>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-0.5 md:gap-1 align-baseline">
                      <span className="text-xs md:text-sm">🎫</span>
                      <span className="text-white font-bold text-xs md:text-sm">{ticketPrice.toFixed(4)}</span>
                      <span className="text-gray-500 text-[9px] md:text-[10px]">/ 1</span>
                    </div>
                    <span className="text-[8px] md:text-[9px] text-gray-500 font-medium">{formatUsd(ticketPriceUsd)}</span>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RaffleCard;
