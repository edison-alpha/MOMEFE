import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import wonCharacter from "@/assets/Gemini_Generated_Image_8nlivz8nlivz8nli (1).png";
import lostCharacter from "@/assets/NOT LUCK (1).png";
import bgWon from "@/assets/bgwon.png";
import bgLost from "@/assets/bglost.png";
import confetti from "canvas-confetti";

interface RaffleResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  isWinner: boolean;
  raffle: {
    id: number;
    title: string;
    imageUrl: string;
    prizeAmount: number;
    prizePool: number;
    prizeSymbol?: string;
  };
}

const RaffleResultModal = ({ isOpen, onClose, isWinner, raffle }: RaffleResultModalProps) => {
  const [showContent, setShowContent] = useState(false);

  // Trigger confetti for winners
  useEffect(() => {
    if (isOpen && isWinner) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        });
        confetti({
          particleCount: 5,
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
  }, [isOpen, isWinner]);

  // Fade in animation
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShowContent(true), 100);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: showContent ? 1 : 0 }}
        onClick={onClose} 
      />
      
      {/* Modal - Win or Lose Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: showContent ? 1 : 0, scale: showContent ? 1 : 0.9 }}
        className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl"
      >
        {isWinner ? (
          <WinCardContent raffle={raffle} onClose={onClose} />
        ) : (
          <LoseCardContent raffle={raffle} onClose={onClose} />
        )}
      </motion.div>
    </div>
  );
};

const WinCardContent = ({ raffle, onClose }: { raffle: any; onClose: () => void }) => {
  const totalPrize = raffle.prizeAmount + raffle.prizePool;
  const prizeSymbol = raffle.prizeSymbol || 'MOVE';

  return (
    <div className="relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgWon})`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors z-50 text-xs"
        >
          ✕
        </button>

        {/* MoME Logo */}
        <div className="text-center mb-1">
          <h1
            className="text-2xl md:text-3xl font-black italic tracking-tight"
            style={{
              color: "#EF4444",
              textShadow: "2px 2px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000",
              WebkitTextStroke: "1px #000000",
            }}
          >
            Mo
            <span style={{ color: "#FCD34D" }}>ME</span>
          </h1>
        </div>

        {/* YOU WON Text */}
        <div className="text-center mb-2">
          <h2
            className="text-3xl md:text-4xl font-black tracking-wider"
            style={{
              color: "#FCD34D",
              textShadow:
                "2px 2px 0px #78350F, 4px 4px 0px rgba(0,0,0,0.4)",
              letterSpacing: "0.02em",
              WebkitTextStroke: "1.5px #92400E",
            }}
          >
            YOU WON!
          </h2>
        </div>

        {/* Character and Confetti */}
        <div className="relative flex justify-center items-center mb-3 h-36">
          {/* Confetti Elements */}
          <div className="absolute inset-0 pointer-events-none">
            {[
              { color: "#EF4444", left: "15%", top: "20%", rotate: 45 },
              { color: "#10B981", left: "20%", top: "50%", rotate: -30 },
              { color: "#3B82F6", right: "15%", top: "25%", rotate: -60 },
              { color: "#FCD34D", right: "20%", top: "55%", rotate: 30 },
            ].map((conf, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-1 rounded-sm"
                style={{
                  background: conf.color,
                  left: conf.left,
                  right: conf.right,
                  top: conf.top,
                  transform: `rotate(${conf.rotate}deg)`,
                }}
                animate={{
                  y: [0, -6, 0],
                  rotate: [conf.rotate, conf.rotate + 180, conf.rotate],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random(),
                }}
              />
            ))}
            
            {/* Gold coins */}
            {[
              { left: "18%", top: "40%" },
              { right: "18%", top: "45%" },
            ].map((pos, i) => (
              <motion.div
                key={`coin-${i}`}
                className="absolute w-3 h-3 rounded-full border border-yellow-700"
                style={{
                  background: "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)",
                  ...pos,
                }}
                animate={{
                  y: [0, -4, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>

          {/* Character Image */}
          <motion.img
            src={wonCharacter}
            alt="Winner Character"
            className="w-32 h-32 object-contain relative z-10"
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Crown */}
          <motion.div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20"
            animate={{
              rotate: [-8, 8, -8],
              y: [0, -3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="text-3xl">👑</div>
          </motion.div>

          {/* Trophy */}
          <motion.div
            className="absolute right-[18%] top-[25%] z-20"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [-5, 5, -5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            <div className="text-2xl">🏆</div>
          </motion.div>

          {/* Coin stack */}
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5 z-20">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-5 h-5 rounded-full border border-yellow-800"
                style={{
                  background: "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)",
                }}
                animate={{
                  y: [0, -2, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        </div>

        {/* Message Box */}
        <div
          className="rounded-xl p-3 mb-3 mx-1"
          style={{
            background: "#1E40AF",
            border: "2px solid #D97706",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          <p className="text-white text-xs md:text-sm font-bold text-center leading-tight mb-2">
            Congratulations! Your raffle prize is
            <br />
            secured on the Movement Network.
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <img 
              src="https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png" 
              alt={prizeSymbol}
              className="w-4 h-4 rounded-full"
            />
            <span className="text-yellow-300 font-bold text-base">
              {totalPrize.toFixed(4)} {prizeSymbol}
            </span>
          </div>
        </div>

        {/* Claim Button */}
        <div className="px-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full py-2.5 rounded-full text-base md:text-lg font-black relative"
            style={{
              background: "linear-gradient(180deg, #FDE047 0%, #EAB308 50%, #CA8A04 100%)",
              color: "#000",
              textShadow: "1px 1px 0px rgba(255,255,255,0.3)",
              boxShadow: "0 4px 0 #78350F, 0 6px 15px rgba(0,0,0,0.4)",
              border: "2px solid #92400E",
            }}
          >
            CLAIM PRIZE
          </motion.button>
        </div>
      </div>
    </div>
  );
};

const LoseCardContent = ({ raffle, onClose }: { raffle: any; onClose: () => void }) => {
  return (
    <div className="relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgLost})`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors z-50 text-xs"
        >
          ✕
        </button>

        {/* MoME Logo */}
        <div className="text-center mb-1">
          <h1
            className="text-2xl md:text-3xl font-black italic tracking-tight"
            style={{
              color: "#EF4444",
              textShadow: "2px 2px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000",
              WebkitTextStroke: "1px #000000",
            }}
          >
            Mo
            <span style={{ color: "#FCD34D" }}>ME</span>
          </h1>
        </div>

        {/* BETTER LUCK NEXT TIME Text */}
        <div className="text-center mb-2">
          <h2
            className="text-2xl md:text-3xl font-black leading-tight"
            style={{
              color: "#93C5FD",
              textShadow:
                "2px 2px 0px #1E3A8A, 4px 4px 0px rgba(0,0,0,0.4)",
              letterSpacing: "0.02em",
              WebkitTextStroke: "1.5px #1E40AF",
            }}
          >
            BETTER LUCK
            <br />
            NEXT TIME
          </h2>
        </div>

        {/* Character and Rain Clouds */}
        <div className="relative flex justify-center items-center mb-3 h-36">
          {/* Rain Cloud Left */}
          <div className="absolute top-2 left-[12%] z-20">
            <motion.div
              animate={{
                x: [-2, 2, -2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
            >
              <div className="relative">
                <div className="w-12 h-8 bg-gray-500 rounded-full" />
                <div className="absolute top-1 left-2 w-10 h-7 bg-gray-500 rounded-full" />
                <div className="absolute top-2 left-4 w-8 h-5 bg-gray-600 rounded-full" />
              </div>
            </motion.div>
            <div className="relative">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-0.5 h-2 bg-blue-300 rounded-full"
                  style={{
                    left: `${i * 8}px`,
                    top: "6px",
                  }}
                  animate={{
                    y: [0, 25],
                    opacity: [0.8, 0],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Rain Cloud Right */}
          <div className="absolute top-2 right-[12%] z-20">
            <motion.div
              animate={{
                x: [2, -2, 2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
            >
              <div className="relative">
                <div className="w-12 h-8 bg-gray-500 rounded-full" />
                <div className="absolute top-1 right-2 w-10 h-7 bg-gray-500 rounded-full" />
                <div className="absolute top-2 right-4 w-8 h-5 bg-gray-600 rounded-full" />
              </div>
            </motion.div>
            <div className="relative">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`right-${i}`}
                  className="absolute w-0.5 h-2 bg-blue-300 rounded-full"
                  style={{
                    left: `${i * 8}px`,
                    top: "6px",
                  }}
                  animate={{
                    y: [0, 25],
                    opacity: [0.8, 0],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15 + 0.6,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Character Image */}
          <motion.img
            src={lostCharacter}
            alt="Better Luck Character"
            className="w-32 h-32 object-contain relative z-10"
            animate={{
              y: [0, 2, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Ticket */}
          <motion.div
            className="absolute right-[20%] top-[40%] z-20"
            animate={{
              rotate: [-12, 12, -12],
              y: [0, -3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <div className="text-2xl">🎫</div>
          </motion.div>
        </div>

        {/* Message Box */}
        <div
          className="rounded-xl p-3 mb-3 mx-1"
          style={{
            background: "#334155",
            border: "2px solid #60A5FA",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)",
          }}
        >
          <p className="text-white text-xs md:text-sm font-bold text-center leading-tight">
            Don't give up, join another fair raffle!
          </p>
        </div>

        {/* Try Again Button */}
        <div className="px-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full py-2.5 rounded-full text-base md:text-lg font-black relative"
            style={{
              background: "linear-gradient(180deg, #93C5FD 0%, #60A5FA 50%, #3B82F6 100%)",
              color: "#000",
              textShadow: "1px 1px 0px rgba(255,255,255,0.3)",
              boxShadow: "0 4px 0 #1E3A8A, 0 6px 15px rgba(0,0,0,0.4)",
              border: "2px solid #1E40AF",
            }}
          >
            TRY AGAIN
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default RaffleResultModal;
