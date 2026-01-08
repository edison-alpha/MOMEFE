import { useState, useRef } from "react";
import { X, Send, Download, Check, Trophy } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import logoImg from "@/assets/mw.png";
import { useMovePrice } from "@/hooks/useMovePrice";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    ticketPrice: number;
    prizeAmount: number;
    prizePool?: number;
    status: number;
  };
  isWinner?: boolean; // New prop to indicate winner mode
}

// Color themes for the share card
const themes = [
  { id: "orange", bg: "from-orange-900 via-orange-800 to-black", accent: "text-orange-500" },
  { id: "green", bg: "from-emerald-900 via-emerald-800 to-black", accent: "text-emerald-500" },
  { id: "blue", bg: "from-blue-900 via-blue-800 to-black", accent: "text-blue-500" },
];

// Winner-specific themes
const winnerThemes = [
  { id: "gold", bg: "from-yellow-900 via-amber-800 to-black", accent: "text-yellow-400" },
  { id: "purple", bg: "from-purple-900 via-violet-800 to-black", accent: "text-purple-400" },
  { id: "cyan", bg: "from-cyan-900 via-teal-800 to-black", accent: "text-cyan-400" },
];

const ShareModal = ({ isOpen, onClose, raffle, isWinner = false }: ShareModalProps) => {
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { formatMoveToUsd } = useMovePrice();

  const activeThemes = isWinner ? winnerThemes : themes;

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/raffle/${raffle.id}`;
  
  // Calculate prize won
  const prizeWon = raffle.status === 3 
    ? raffle.prizeAmount 
    : raffle.status === 4 
      ? (raffle.prizePool || 0) * 0.95 
      : 0;
  
  // USD conversions
  const prizeWonUsd = formatMoveToUsd(prizeWon);
  const prizeAmountUsd = formatMoveToUsd(raffle.prizeAmount);

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
    const text = isWinner 
      ? `🏆 I WON ${prizeWon.toFixed(2)} MOVE on "${raffle.title}"!\n\nJoin raffles on MoME!`
      : `🎟️ ${raffle.title}\n\nJoin this raffle on MoME!`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleShareTwitter = () => {
    const text = isWinner 
      ? `🏆 I just WON ${prizeWon.toFixed(2)} MOVE on "${raffle.title}"!\n\nJoin raffles on @MoME_xyz!\n\n${shareUrl}`
      : `🎟️ ${raffle.title}\n\nJoin this raffle on @MoME_xyz!\n\n${shareUrl}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
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
      link.download = isWinner 
        ? `mome-winner-${raffle.id}.png`
        : `mome-raffle-${raffle.id}.png`;
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

  const getStatusText = () => {
    if (isWinner) return "🏆 WINNER!";
    if (raffle.status === 1) return "Raffle is live!";
    if (raffle.status === 2) return "Drawing winner...";
    if (raffle.status === 5) return "Raffle cancelled";
    if (raffle.status >= 3) return "Raffle ended";
    return "Raffle";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal - Medium size */}
      <div className="relative bg-[#0A0A0A] border border-white/10 rounded-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between px-3 py-2 border-b ${isWinner ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/10'}`}>
          <h2 className={`font-semibold text-xs uppercase tracking-wide ${isWinner ? 'text-yellow-400' : 'text-white'}`}>
            {isWinner ? '🎉 Share Your Win!' : 'Share Raffle'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Share Card Preview */}
        <div className="p-3">
          <div
            ref={cardRef}
            className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${activeThemes[selectedTheme].bg} p-3`}
          >
            {/* Winner Badge */}
            {isWinner && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Trophy className="w-2.5 h-2.5" />
                WINNER
              </div>
            )}
            
            {/* Logo */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <img src={logoImg} alt="MoME" className="h-4 w-auto object-contain" />
                <span className="text-white font-bold text-xs">MoME</span>
              </div>
              <span className="text-gray-400 text-[10px]">#{raffle.id}</span>
            </div>

            {/* Status */}
            <p className={`${activeThemes[selectedTheme].accent} text-[10px] font-semibold mb-0.5`}>
              {getStatusText()}
            </p>

            {/* Title */}
            <h3 className="text-white font-bold text-sm mb-0.5 line-clamp-1">{raffle.title}</h3>
            
            {/* Prize */}
            <p className={`text-[10px] mb-2 ${isWinner ? 'text-yellow-400 font-semibold' : 'text-gray-400'}`}>
              {isWinner ? `Won: ${prizeWon.toFixed(2)} MOVE (~$${prizeWonUsd}) 🎉` : `(~${raffle.prizeAmount.toFixed(2)} MOVE / ~$${prizeAmountUsd})`}
            </p>

            {/* Image */}
            <div className="flex justify-center mb-2">
              <div className="relative">
                <img
                  src={raffle.imageUrl}
                  alt={raffle.title}
                  className={`w-20 h-20 object-cover rounded-lg border ${isWinner ? 'border-yellow-500/50' : 'border-white/20'}`}
                  crossOrigin="anonymous"
                />
                {isWinner && (
                  <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
                    <Trophy className="w-3 h-3 text-black" />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-white font-medium text-[10px] line-clamp-1">{raffle.title}</p>
              <p className="text-gray-500 text-[9px]">MoME</p>
            </div>

            {/* QR Code placeholder + CTA */}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
              <div className="w-7 h-7 bg-white rounded flex items-center justify-center flex-shrink-0">
                <div className="w-5 h-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTMgM2g2djZIM3ptMiAydjJoMlY1em0tMiA4aDZ2Nkgzem0yIDJ2Mmgydi0yem04LTEyaDZ2NmgtNnptMiAydjJoMlY1em0tMiA4aDJ2Mmgydi0yaC0ydi0ySDl2MmgydjJoMnYtMmgydi0yaC0yem0wIDRoMnYyaC0yem00IDBoMnYyaC0yem0wLTRoMnYyaC0yeiIvPjwvc3ZnPg==')] bg-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[10px] font-semibold">
                  {isWinner ? 'Share your victory!' : 'Share your listing!'}
                </p>
                <p className="text-gray-500 text-[9px] truncate">
                  {isWinner ? 'Let everyone know you won' : 'Invite community to join'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Selector */}
        <div className="flex justify-center gap-2 pb-2">
          {activeThemes.map((theme, index) => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(index)}
              className={`w-5 h-5 rounded-full transition-all ${
                theme.id === "orange" ? "bg-orange-500" :
                theme.id === "green" ? "bg-emerald-500" : 
                theme.id === "blue" ? "bg-blue-500" :
                theme.id === "gold" ? "bg-yellow-500" :
                theme.id === "purple" ? "bg-purple-500" : "bg-cyan-500"
              } ${selectedTheme === index ? "ring-2 ring-white ring-offset-1 ring-offset-[#0A0A0A]" : ""}`}
            />
          ))}
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-3 gap-1.5 px-3 pb-2">
          <button
            onClick={handleShareTelegram}
            className="flex items-center justify-center py-2 bg-[#151515] hover:bg-[#202020] border border-white/10 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4 text-primary" />
          </button>
          <button
            onClick={handleShareTwitter}
            className="flex items-center justify-center py-2 bg-[#151515] hover:bg-[#202020] border border-white/10 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>
          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="flex items-center justify-center py-2 bg-[#151515] hover:bg-[#202020] border border-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className={`w-4 h-4 text-primary ${isDownloading ? "animate-pulse" : ""}`} />
          </button>
        </div>

        {/* Copy Link */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-1.5 bg-[#151515] border border-white/10 rounded-lg p-1.5">
            <span className="flex-1 text-gray-400 text-[10px] truncate px-1.5 font-mono">
              {shareUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className={`px-2.5 py-1 ${isWinner ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-primary hover:bg-primary/80 text-white'} font-bold text-[10px] rounded transition-colors min-w-[50px]`}
            >
              {copied ? <Check className="w-3 h-3 mx-auto" /> : "COPY"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
