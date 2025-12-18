import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface RaffleCardProps {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  endTime: Date;
  ticketsSold: number;
  totalTickets: number;
  ticketPrice: number;
  startFromPrice?: number;
}

const RaffleCard = ({
  id,
  image,
  title,
  subtitle = "Warplet #854434", // Default mock subtitle if not provided
  endTime,
  ticketsSold,
  totalTickets,
  ticketPrice,
  startFromPrice = 0.1
}: RaffleCardProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

  return (
    <Link to={`/raffle/${id}`} className="group block h-full">
      <div className="bg-black rounded-[24px] overflow-hidden transition-all duration-300 h-full flex flex-col border-2 border-white/20 relative">
        {/* Image Section */}
        <div className="relative aspect-square">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Countdown Strip */}
        <div className="bg-[#A04545] py-1 text-center relative z-10 -mt-1">
          <span className="font-medium text-white/90 text-[11px] tracking-wide font-mono">
            {timeLeft.days}D : {formatTime(timeLeft.hours)}H : {formatTime(timeLeft.minutes)}M : {formatTime(timeLeft.seconds)}S
          </span>
        </div>

        {/* Info Section */}
        <div className="p-3 pt-3 flex-1 flex flex-col">
          <div className="mb-3">
            <h3 className="text-white font-bold text-base mb-0.5">{title}</h3>
            <p className="text-white font-semibold text-sm">{subtitle}</p>
          </div>

          <div className="space-y-1 mb-4">
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden p-[1px] relative">
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
            <div className="flex justify-between text-[10px] font-bold tracking-wide">
              <span className="text-[#A04545]">{ticketsSold}/{totalTickets}</span>
              <span className="text-[#A04545]">({Math.round(progress)}%)</span>
            </div>
          </div>

          <div className="mt-auto flex gap-1.5 min-h-[50px]">
            {/* Buy All - Left Button */}
            <button
              className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 bg-[#151515] hover:bg-[#202020] rounded-xl transition-colors border border-white/10 hover:border-white/20"
            >
              <span className="text-[9px] text-gray-400 font-medium mb-0.5">Buy All</span>
              <div className="flex items-center gap-1">
                <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png" alt="MOVE" className="w-4 h-4 rounded-full" />
                <span className="text-white font-bold text-base">{Math.floor(ticketPrice * 10)}</span>
              </div>
            </button>

            {/* Start From - Right Button */}
            <button
              className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 bg-[#151515] hover:bg-[#202020] rounded-xl transition-colors border border-white/10 hover:border-white/20"
            >
              <span className="text-[9px] text-gray-400 font-medium mb-0.5">Start From</span>
              <div className="flex items-center gap-1 align-baseline">
                <span className="text-sm">🎫</span>
                <span className="text-white font-bold text-sm">{startFromPrice}</span>
                <span className="text-gray-500 text-[10px]">/ 1</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RaffleCard;
