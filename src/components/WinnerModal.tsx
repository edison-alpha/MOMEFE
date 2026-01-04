import { useState, useRef, useEffect } from "react";
import { X, Send, Download, Check, Trophy, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import logoImg from "@/assets/mw.png";
import confetti from "canvas-confetti";
import { useMovePrice } from "@/hooks/useMovePrice";

interface WinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: {
    id: number;
    title: string;
    imageUrl: string;
    prizeAmount: number;
    prizePool: number;
  };
  winnerAddress: string;
}

// Color themes for the winner card
const themes = [
  { id: "gold", bg: "from-yellow-900 via-amber-800 to-black", accent: "text-yellow-500" },
  { id: "purple", bg: "from-purple-900 via-violet-800 to-black", accent: "text-purple-500" },
  { id: "green", bg: "from-emerald-900 via-green-800 to-black", accent: "text-emerald-500" },
];

const WinnerModal = ({ isOpen, onClose, raffle, winnerAddress }: WinnerModalProps) => {
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { formatMoveToUsd } = useMovePrice();

  // Trigger confetti on open
  useEffect(() => {
    if (isOpen) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/raffle/${raffle.id}`;
  const totalPrize = raffle.prizeAmount + raffle.prizePool;
  const totalPrizeUsd = formatMoveToUsd(totalPrize);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShareTelegram = () => {
    const text = `🏆 I just won ${totalPrize.toFixed(2)} MOVE on MoME!\n\n"${raffle.title}"\n\nJoin the next raffle:`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleShareTwitter = () => {
    const text = `🏆 I just won ${totalPrize.toFixed(2)} MOVE on @MoME_raffle!\n\n"${raffle.title}"\n\nJoin the next raffle:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#000",
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      const link = document.createElement("a");
      link.download = `mome-winner-raffle-${raffle.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image downloaded!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-[#0A0A0A] border border-yellow-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-yellow-500/20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-white font-bold tracking-wider text-sm uppercase">
              Congratulations! You Won!
            </h2>
            <PartyPopper className="w-5 h-5 text-yellow-500" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Winner Card Preview */}
        <div className="p-4">
          <div
            ref={cardRef}
            className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${themes[selectedTheme].bg} p-4`}
          >
            {/* Logo */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <img src={logoImg} alt="MoME" className="h-6 w-auto object-contain" />
                <span className="text-white font-bold text-sm">MoME</span>
              </div>
              <span className="text-gray-400 text-xs">#{raffle.id}</span>
            </div>

            {/* Winner Badge */}
            <div className="flex items-center justify-center mb-3">
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-full px-4 py-1 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-500 font-bold text-sm">WINNER</span>
                <Trophy className="w-4 h-4 text-yellow-500" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-white font-bold text-xl mb-2 text-center line-clamp-2">{raffle.title}</h3>

            {/* Image */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <img
                  src={raffle.imageUrl}
                  alt={raffle.title}
                  className="w-32 h-32 object-cover rounded-lg border-4 border-yellow-500/50"
                  crossOrigin="anonymous"
                />
                <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1">
                  <Trophy className="w-4 h-4 text-black" />
                </div>
              </div>
            </div>

            {/* Prize Amount */}
            <div className="text-center mb-4">
              <p className="text-gray-400 text-xs mb-1">Total Prize Won</p>
              <div className="flex items-center justify-center gap-2">
                <img 
                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png" 
                  alt="MOVE" 
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-yellow-500 font-bold text-2xl">{totalPrize.toFixed(4)} MOVE</span>
              </div>
              <p className="text-gray-500 text-sm mt-1">~${totalPrizeUsd}</p>
            </div>

            {/* Winner Address */}
            <div className="text-center bg-black/30 rounded-lg p-2">
              <p className="text-gray-500 text-xs mb-1">Winner</p>
              <p className="text-white font-mono text-sm">
                {winnerAddress.slice(0, 10)}...{winnerAddress.slice(-8)}
              </p>
            </div>

            {/* Footer */}
            <div className="text-center mt-3 pt-3 border-t border-white/10">
              <p className="text-gray-500 text-xs">Powered by MoME Raffle</p>
            </div>
          </div>
        </div>

        {/* Theme Selector */}
        <div className="flex justify-center gap-3 pb-4">
          {themes.map((theme, index) => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(index)}
              className={`w-8 h-8 rounded-full transition-all ${
                theme.id === "gold" ? "bg-yellow-500" :
                theme.id === "purple" ? "bg-purple-500" : "bg-emerald-500"
              } ${selectedTheme === index ? "ring-2 ring-white ring-offset-2 ring-offset-[#0A0A0A]" : ""}`}
            />
          ))}
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          <button
            onClick={handleShareTelegram}
            className="flex items-center justify-center py-3 bg-[#151515] hover:bg-[#202020] border border-white/10 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5 text-yellow-500" />
          </button>
          <button
            onClick={handleShareTwitter}
            className="flex items-center justify-center py-3 bg-[#151515] hover:bg-[#202020] border border-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>
          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="flex items-center justify-center py-3 bg-[#151515] hover:bg-[#202020] border border-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className={`w-5 h-5 text-yellow-500 ${isDownloading ? "animate-pulse" : ""}`} />
          </button>
        </div>

        {/* Copy Link */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 bg-[#151515] border border-white/10 rounded-lg p-2">
            <span className="flex-1 text-gray-400 text-sm truncate px-2 font-mono">
              {shareUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-sm rounded-lg transition-colors min-w-[70px]"
            >
              {copied ? <Check className="w-4 h-4 mx-auto" /> : "COPY"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinnerModal;
