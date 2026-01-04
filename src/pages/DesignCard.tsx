import { useState } from "react";
import { motion } from "framer-motion";
import wonCharacter from "@/assets/Gemini_Generated_Image_8nlivz8nlivz8nli (1).png";
import lostCharacter from "@/assets/NOT LUCK (1).png";
import bgWon from "@/assets/bgwon.png";
import bgLost from "@/assets/bglost.png";

const DesignCard = () => {
  const [showWinCard, setShowWinCard] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Toggle Button */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setShowWinCard(true)}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              showWinCard
                ? "bg-yellow-500 text-black"
                : "bg-gray-700 text-white"
            }`}
          >
            Win Card
          </button>
          <button
            onClick={() => setShowWinCard(false)}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              !showWinCard
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-white"
            }`}
          >
            Lose Card
          </button>
        </div>

        {/* Cards Container */}
        <div className="relative">
          {showWinCard ? <WinCard /> : <LoseCard />}
        </div>
      </div>
    </div>
  );
};

const WinCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgWon})`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-8 md:p-12">
        {/* MoME Logo */}
        <div className="text-center mb-4">
          <h1
            className="text-5xl md:text-7xl font-black italic tracking-tight"
            style={{
              color: "#EF4444",
              textShadow: "3px 3px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000",
              WebkitTextStroke: "2px #000000",
            }}
          >
            Mo
            <span style={{ color: "#FCD34D" }}>ME</span>
          </h1>
        </div>

        {/* YOU WON Text */}
        <div className="text-center mb-6">
          <h2
            className="text-7xl md:text-9xl font-black tracking-wider"
            style={{
              color: "#FCD34D",
              textShadow:
                "5px 5px 0px #78350F, 7px 7px 0px rgba(0,0,0,0.4)",
              letterSpacing: "0.02em",
              WebkitTextStroke: "3px #92400E",
            }}
          >
            YOU WON!
          </h2>
        </div>

        {/* Character and Confetti */}
        <div className="relative flex justify-center items-center mb-8 h-80">
          {/* Confetti Elements - positioned like original */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Colorful confetti pieces */}
            {[
              { color: "#EF4444", left: "15%", top: "20%", rotate: 45 },
              { color: "#10B981", left: "20%", top: "40%", rotate: -30 },
              { color: "#3B82F6", left: "25%", top: "60%", rotate: 60 },
              { color: "#FCD34D", left: "30%", top: "30%", rotate: -45 },
              { color: "#EF4444", right: "15%", top: "25%", rotate: -60 },
              { color: "#10B981", right: "20%", top: "45%", rotate: 30 },
              { color: "#3B82F6", right: "25%", top: "65%", rotate: -45 },
              { color: "#FCD34D", right: "30%", top: "35%", rotate: 45 },
            ].map((conf, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-2 rounded-sm"
                style={{
                  background: conf.color,
                  left: conf.left,
                  right: conf.right,
                  top: conf.top,
                  transform: `rotate(${conf.rotate}deg)`,
                }}
                animate={{
                  y: [0, -10, 0],
                  rotate: [conf.rotate, conf.rotate + 180, conf.rotate],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random(),
                }}
              />
            ))}
            
            {/* Gold coins scattered */}
            {[
              { left: "18%", top: "35%" },
              { left: "22%", top: "55%" },
              { right: "18%", top: "40%" },
              { right: "22%", top: "60%" },
            ].map((pos, i) => (
              <motion.div
                key={`coin-${i}`}
                className="absolute w-6 h-6 rounded-full border-2 border-yellow-700"
                style={{
                  background: "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)",
                  ...pos,
                }}
                animate={{
                  y: [0, -8, 0],
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
            className="w-72 h-72 md:w-96 md:h-96 object-contain relative z-10"
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Crown above character */}
          <motion.div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20"
            animate={{
              rotate: [-8, 8, -8],
              y: [0, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="text-7xl">👑</div>
          </motion.div>

          {/* Trophy on right side */}
          <motion.div
            className="absolute right-[20%] top-[30%] z-20"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [-5, 5, -5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            <div className="text-6xl">🏆</div>
          </motion.div>

          {/* Coin stack at bottom */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1 z-20">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-10 h-10 rounded-full border-3 border-yellow-800"
                style={{
                  background: "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)",
                }}
                animate={{
                  y: [0, -4, 0],
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
          className="rounded-[2rem] p-6 mb-6 mx-4"
          style={{
            background: "#1E40AF",
            border: "5px solid #D97706",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.3)",
          }}
        >
          <p className="text-white text-xl md:text-2xl font-bold text-center leading-tight">
            Congratulations! Your raffle prize is
            <br />
            secured on the Movement Network.
          </p>
        </div>

        {/* Claim Button */}
        <div className="px-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-5 rounded-full text-2xl md:text-4xl font-black relative"
            style={{
              background: "linear-gradient(180deg, #FDE047 0%, #EAB308 50%, #CA8A04 100%)",
              color: "#000",
              textShadow: "2px 2px 0px rgba(255,255,255,0.3)",
              boxShadow: "0 8px 0 #78350F, 0 10px 25px rgba(0,0,0,0.4)",
              border: "3px solid #92400E",
            }}
          >
            CLAIM PRIZE
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const LoseCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgLost})`,
        }}
      />
      {/* Content */}
      <div className="relative z-10 p-8 md:p-12">
        {/* MoME Logo */}
        <div className="text-center mb-4">
          <h1
            className="text-5xl md:text-7xl font-black italic tracking-tight"
            style={{
              color: "#EF4444",
              textShadow: "3px 3px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000",
              WebkitTextStroke: "2px #000000",
            }}
          >
            Mo
            <span style={{ color: "#FCD34D" }}>ME</span>
          </h1>
        </div>

        {/* BETTER LUCK NEXT TIME Text */}
        <div className="text-center mb-6">
          <h2
            className="text-6xl md:text-8xl font-black leading-tight"
            style={{
              color: "#93C5FD",
              textShadow:
                "5px 5px 0px #1E3A8A, 7px 7px 0px rgba(0,0,0,0.4)",
              letterSpacing: "0.02em",
              WebkitTextStroke: "3px #1E40AF",
            }}
          >
            BETTER LUCK
            <br />
            NEXT TIME
          </h2>
        </div>

        {/* Character and Rain Clouds */}
        <div className="relative flex justify-center items-center mb-8 h-80">
          {/* Rain Cloud Left */}
          <div className="absolute top-8 left-[15%] z-20">
            <motion.div
              animate={{
                x: [-3, 3, -3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
            >
              {/* Cloud shape */}
              <div className="relative">
                <div className="w-24 h-16 bg-gray-500 rounded-full" />
                <div className="absolute top-2 left-4 w-20 h-14 bg-gray-500 rounded-full" />
                <div className="absolute top-4 left-8 w-16 h-12 bg-gray-600 rounded-full" />
              </div>
            </motion.div>
            {/* Rain drops */}
            <div className="relative">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-4 bg-blue-300 rounded-full"
                  style={{
                    left: `${i * 12}px`,
                    top: "10px",
                  }}
                  animate={{
                    y: [0, 50],
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
          <div className="absolute top-8 right-[15%] z-20">
            <motion.div
              animate={{
                x: [3, -3, 3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
            >
              {/* Cloud shape */}
              <div className="relative">
                <div className="w-24 h-16 bg-gray-500 rounded-full" />
                <div className="absolute top-2 right-4 w-20 h-14 bg-gray-500 rounded-full" />
                <div className="absolute top-4 right-8 w-16 h-12 bg-gray-600 rounded-full" />
              </div>
            </motion.div>
            {/* Rain drops */}
            <div className="relative">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`right-${i}`}
                  className="absolute w-1.5 h-4 bg-blue-300 rounded-full"
                  style={{
                    left: `${i * 12}px`,
                    top: "10px",
                  }}
                  animate={{
                    y: [0, 50],
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
            className="w-72 h-72 md:w-96 md:h-96 object-contain relative z-10"
            animate={{
              y: [0, 4, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Ticket on right side */}
          <motion.div
            className="absolute right-[22%] top-[45%] z-20"
            animate={{
              rotate: [-12, 12, -12],
              y: [0, -6, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <div className="text-5xl">🎫</div>
          </motion.div>
        </div>

        {/* Message Box */}
        <div
          className="rounded-[2rem] p-6 mb-6 mx-4"
          style={{
            background: "#334155",
            border: "5px solid #60A5FA",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          <p className="text-white text-xl md:text-2xl font-bold text-center leading-tight">
            Don't give up, join another fair raffle!
          </p>
        </div>

        {/* Try Again Button */}
        <div className="px-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-5 rounded-full text-2xl md:text-4xl font-black relative"
            style={{
              background: "linear-gradient(180deg, #93C5FD 0%, #60A5FA 50%, #3B82F6 100%)",
              color: "#000",
              textShadow: "2px 2px 0px rgba(255,255,255,0.3)",
              boxShadow: "0 8px 0 #1E3A8A, 0 10px 25px rgba(0,0,0,0.4)",
              border: "3px solid #1E40AF",
            }}
          >
            TRY AGAIN
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default DesignCard;
