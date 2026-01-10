import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LandingLayout from "@/components/LandingLayout";
import bigBrain from "@/assets/Moveus/big brain moveus.png";
import moveee3 from "@/assets/Moveus/MOVEEEE3.png";
import integrated from "@/assets/Moveus/integrated.png";
import moveusCig from "@/assets/Moveus/Moveus Cig.png";
import movementLogo from "@/assets/movement_logo.png";
import founderImg from "@/assets/founder.png";

const About = () => {
  const navigate = useNavigate();

  return (
    <LandingLayout>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-96 h-96 bg-[#FCD34D] rounded-full blur-[120px]" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#FCD34D] rounded-full blur-[120px]" />
          </div>

          <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-12 md:mb-16"
            >
              <h1 className="text-4xl md:text-6xl font-black text-[#FCD34D] mb-4 md:mb-6">
                ABOUT MOME
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Revolutionizing digital asset raffles with blockchain-native transparency. 
                MOME is the first decentralized raffle protocol on Movement Network, leveraging 
                Aptos Native Randomness for cryptographically provable fairness.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  The Problem We Solve
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Traditional raffle platforms suffer from a fundamental trust problem: participants have no way 
                  to verify if the selection process is truly random. Centralized systems can be manipulated, 
                  and winners are often predetermined. This lack of transparency has eroded trust in the entire industry.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  MOME eliminates this problem entirely by bringing raffles on-chain. Every ticket purchase, 
                  winner selection, and prize distribution is recorded immutably on Movement Network. Our integration 
                  with <span className="text-[#FCD34D] font-semibold">Aptos Native Randomness API</span> ensures 
                  cryptographically secure, verifiable randomness that no one—not even us—can manipulate.
                </p>
              </motion.div>

              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center"
              >
                <img 
                  src={bigBrain} 
                  alt="MOME Character" 
                  className="w-64 md:w-80 h-auto object-contain drop-shadow-2xl"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 md:py-24 bg-[#111]">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              className="text-3xl md:text-5xl font-black text-center text-white mb-12 md:mb-16"
            >
              OUR CORE VALUES
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ValueCard
                img={moveee3}
                title="100% On-Chain Transparency"
                description="Every raffle, ticket, and winner selection is recorded on Movement Network. Verify any transaction on the blockchain explorer—no trust required, just cryptographic proof."
              />
              <ValueCard
                img={integrated}
                title="Multi-Asset Support"
                description="Raffle any digital asset: Native MOVE tokens, fungible tokens (tUSDT, tDAI), NFTs from any collection, or Real World Asset (RWA) certificates. Our smart contracts handle all asset types securely."
              />
              <ValueCard
                img={moveusCig}
                title="Provably Fair Randomness"
                description="Powered by Aptos Native Randomness API—the same cryptographic randomness used by leading DeFi protocols. Mathematical proof that every participant has an equal chance."
              />
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="py-16 md:py-24 bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
                POWERED BY MOVEMENT
              </h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                We chose Movement Network for its speed, security, and innovative approach to blockchain technology.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-xl md:text-2xl font-bold text-[#FCD34D]">
                    Technical Architecture
                  </h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-[#FCD34D] mt-1">⚡</span>
                      <span><strong>Sub-second finality</strong> — Instant ticket purchases and prize claims with Movement's high-performance consensus</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#FCD34D] mt-1">🎲</span>
                      <span><strong>Aptos On-Chain Randomness</strong> — Secure, instant randomness generated directly on-chain for tamper-proof winner selection</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#FCD34D] mt-1">🔐</span>
                      <span><strong>Smart Contract Escrow</strong> — Prizes locked in audited contracts until raffle completion</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#FCD34D] mt-1">📊</span>
                      <span><strong>Real-time Indexing</strong> — GraphQL-powered data layer for instant UI updates</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <img 
                    src={movementLogo} 
                    alt="Movement Network" 
                    className="w-48 md:w-64 h-auto object-contain opacity-80"
                  />
                  <div className="absolute inset-0 bg-[#FCD34D]/20 rounded-full blur-xl" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-24 bg-[#111]">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
                MEET THE TEAM
              </h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                We're a passionate team of blockchain developers, designers, and community builders 
                dedicated to creating the best raffle experience on Movement Network.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <TeamMember
                img={founderImg}
                name="Core Team"
                role="Founders & Architects"
                description="Blockchain veterans with experience building DeFi protocols. Passionate about bringing fairness and transparency to digital gaming."
              />
              <TeamMember
                img={moveusCig}
                name="Smart Contract Team"
                role="Move Language Engineers"
                description="Specialized in Move smart contract development. Building secure, gas-optimized contracts with comprehensive test coverage."
              />
              <TeamMember
                img={bigBrain}
                name="Product & Design"
                role="UX Engineers"
                description="Creating intuitive interfaces that make blockchain technology accessible to everyone, from crypto natives to newcomers."
              />
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="relative bg-[#050505] text-white overflow-hidden border-t border-white/5">
          {/* Red Bar */}
          <div className="h-8 bg-[#991B1B] border-b-4 border-black" />

          {/* Yellow Bar */}
          <div className="bg-[#FCD34D] py-8 md:py-12 text-black text-center relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 md:border-4 border-black px-4 md:px-8 py-1 md:py-2 shadow-[3px_3px_0px_#000] md:shadow-[4px_4px_0px_#000]">
              <h3 className="font-black text-xl md:text-2xl uppercase tracking-tighter">GMOVE</h3>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
              >
                <h2 className="font-black text-2xl md:text-5xl mt-4 md:mt-6 mb-6">
                  JOIN THE MOVEMENT
                </h2>
                <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                  Ready to experience the future of fair raffles? Connect your wallet and start winning today!
                </p>
                <button 
                  onClick={() => navigate('/app')}
                  className="bg-black hover:bg-gray-800 text-white text-lg font-bold px-8 py-4 rounded-xl border-2 border-gray-800 shadow-[4px_4px_0px_#333] hover:scale-105 active:translate-y-1 active:shadow-none transition-all"
                >
                  Launch App
                </button>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </LandingLayout>
  );
};

// Sub-components
const ValueCard = ({ img, title, description }: { img: string; title: string; description: string }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    whileHover={{ scale: 1.05, y: -5 }}
    className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-2xl p-6 md:p-8 text-center group hover:border-[#FCD34D]/50 transition-all duration-300"
  >
    <div className="mb-6">
      <img 
        src={img} 
        alt={title} 
        className="w-24 md:w-32 h-24 md:h-32 object-contain mx-auto drop-shadow-2xl group-hover:drop-shadow-[0_0_20px_rgba(252,211,77,0.5)] transition-all duration-300"
      />
    </div>
    <h3 className="text-xl md:text-2xl font-bold text-white mb-4 group-hover:text-[#FCD34D] transition-colors">
      {title}
    </h3>
    <p className="text-gray-300 leading-relaxed">
      {description}
    </p>
  </motion.div>
);

const TeamMember = ({ img, name, role, description }: { img: string; name: string; role: string; description: string }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    whileHover={{ scale: 1.05 }}
    className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-2xl p-6 text-center group hover:border-[#FCD34D]/50 transition-all duration-300"
  >
    <div className="mb-4">
      <img 
        src={img} 
        alt={name} 
        className="w-32 h-32 object-contain mx-auto drop-shadow-xl group-hover:drop-shadow-[0_0_15px_rgba(252,211,77,0.5)] transition-all duration-300"
      />
    </div>
    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#FCD34D] transition-colors">
      {name}
    </h3>
    <p className="text-[#FCD34D] text-sm font-semibold mb-3">
      {role}
    </p>
    <p className="text-gray-300 text-sm leading-relaxed">
      {description}
    </p>
  </motion.div>
);

export default About;