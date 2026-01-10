import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LandingLayout from "@/components/LandingLayout";
import moveusCig from "@/assets/Moveus/Moveus Cig.png";
import moveusOh from "@/assets/Moveus/Moveus OHHHH.png";
import bigBrain from "@/assets/Moveus/big brain moveus.png";
import popcorn from "@/assets/Moveus/Moveus Popcorn.png";

const Rules = () => {
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
                RAFFLE PROTOCOL
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                A trustless, transparent raffle system where every rule is enforced by smart contracts. 
                No intermediaries, no manipulation—just cryptographic guarantees and on-chain verification.
              </p>
            </motion.div>

            <div className="flex justify-center">
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                src={moveusCig}
                alt="MOME Rules"
                className="w-48 md:w-64 h-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* General Rules */}
        <section className="py-16 md:py-24 bg-[#111]">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              className="text-3xl md:text-5xl font-black text-center text-white mb-12 md:mb-16"
            >
              PROTOCOL MECHANICS
            </motion.h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                className="space-y-6"
              >
                <RuleCard
                  number="01"
                  title="Permissionless Access"
                  description="Anyone with a Movement Network wallet can participate or create raffles. No KYC, no gatekeeping—true decentralization where your wallet is your identity."
                />
                <RuleCard
                  number="02"
                  title="Multi-Asset Raffles"
                  description="Create raffles with various digital assets: Native MOVE tokens, fungible tokens (tUSDT, tDAI), NFTs, or Real World Asset (RWA) certificates. Our smart contracts handle all asset types natively."
                />
                <RuleCard
                  number="03"
                  title="Immutable Parameters"
                  description="Once a raffle goes live, all parameters (ticket price, duration, prize) are locked in the smart contract. No changes possible—what you see is what you get."
                />
                <RuleCard
                  number="04"
                  title="MOVE-Denominated Tickets"
                  description="All ticket purchases are made in MOVE tokens, creating a unified economy. Each ticket is a unique on-chain entry with verifiable timestamp."
                />
              </motion.div>

              <motion.div
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                className="space-y-6"
              >
                <RuleCard
                  number="05"
                  title="Smart Contract Escrow"
                  description="All prizes are deposited into audited smart contracts before raffle activation. Funds are cryptographically secured until winner selection—no trust required."
                />
                <RuleCard
                  number="06"
                  title="Sybil Resistance"
                  description="While multiple entries are allowed, each transaction requires gas fees, making large-scale bot attacks economically unfeasible. Fair play enforced by economics."
                />
                <RuleCard
                  number="07"
                  title="Per-User Ticket Limits"
                  description="Each raffle has a maximum tickets per user limit (default 10% of total tickets) to ensure fair distribution. This prevents single users from dominating raffles while still allowing multiple entries."
                />
                <RuleCard
                  number="08"
                  title="Atomic Transactions"
                  description="All operations (ticket purchase, winner selection, prize distribution) are atomic—they either complete fully or revert entirely. No partial states, no stuck funds."
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Raffle Process */}
        <section className="py-16 md:py-24 bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              className="text-3xl md:text-5xl font-black text-center text-white mb-12 md:mb-16"
            >
              RAFFLE LIFECYCLE
            </motion.h2>

            <div className="space-y-8 md:space-y-12">
              <ProcessStep
                img={bigBrain}
                step="1"
                title="Raffle Creation & Escrow"
                description="Creator deposits prize (NFT, tokens, or RWA certificate) into the smart contract. Parameters are set: ticket price, duration, target amount. Once submitted, the raffle is immutable and publicly visible on-chain."
                reverse={false}
              />
              <ProcessStep
                img={moveusOh}
                step="2"
                title="Ticket Minting"
                description="Participants purchase tickets by sending MOVE to the contract. Each purchase mints a unique ticket ID linked to the buyer's wallet. All entries are timestamped and indexed for real-time tracking via our GraphQL API."
                reverse={true}
              />
              <ProcessStep
                img={popcorn}
                step="3"
                title="On-Chain Random Selection"
                description="When the raffle ends, Aptos Randomness API generates a cryptographically secure random number directly on-chain. This randomness is instant, secure, and tamper-proof—no external oracles needed."
                reverse={false}
              />
              <ProcessStep
                img={moveusCig}
                step="4"
                title="Prize Claiming"
                description="After winner selection, the winner can claim their prize by calling the claim function. For target-met raffles, winner receives the prize asset. For target-not-met raffles, winner receives 95% of the ticket pool. All claims are verified on-chain."
                reverse={true}
              />
            </div>
          </div>
        </section>

        {/* Winning & Prizes */}
        <section className="py-16 md:py-24 bg-[#111]">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              className="text-3xl md:text-5xl font-black text-center text-white mb-12 md:mb-16"
            >
              ECONOMIC MODEL
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <InfoCard
                icon="🎯"
                title="Target-Based Outcomes"
                description="If ticket sales meet the target: creator receives 90% of ticket pool, winner claims the original prize asset. If target not met: winner receives 95% of ticket pool, creator reclaims their prize asset."
              />
              <InfoCard
                icon="🎲"
                title="Aptos On-Chain Randomness"
                description="Winner selection uses Aptos Randomness API—secure, instant on-chain randomness that produces cryptographic proof of fairness. Every selection is auditable on-chain."
              />
              <InfoCard
                icon="💎"
                title="Universal Asset Support"
                description="Raffle Native MOVE, fungible tokens (tUSDT, tDAI), NFTs, or Real World Asset certificates. Our Move smart contracts handle all asset standards natively."
              />
              <InfoCard
                icon="🔒"
                title="Trustless Escrow"
                description="Prizes are locked in audited smart contracts from creation to distribution. No admin keys, no backdoors—code is law."
              />
              <InfoCard
                icon="⚡"
                title="Fast Settlement"
                description="Sub-second finality on Movement Network means transactions confirm instantly. Winners can claim prizes immediately after raffle ends—no waiting periods."
              />
              <InfoCard
                icon="🔄"
                title="Trustless Refunds"
                description="If a raffle is cancelled, participants can claim full refunds directly from the smart contract. No admin approval needed—your funds are always accessible."
              />
              <InfoCard
                icon="📊"
                title="Transparent Fee Structure"
                description="10% platform fee on successful raffles (target met), 5% on partial success. All fees are hardcoded in smart contracts—no hidden charges."
              />
              <InfoCard
                icon="🔍"
                title="Full Auditability"
                description="Every transaction is indexed and queryable. Verify raffle creation, ticket purchases, randomness generation, and prize distribution on Movement explorer."
              />
              <InfoCard
                icon="💰"
                title="Creator Incentives"
                description="Creators earn 90% of ticket sales when targets are met, plus their prize goes to the winner. If target not met, creator reclaims their prize while winner gets 95% of ticket pool."
              />
            </div>
          </div>
        </section>

        {/* Security by Design */}
        <section className="py-16 md:py-24 bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              className="text-3xl md:text-5xl font-black text-center text-white mb-12 md:mb-16"
            >
              SECURITY BY DESIGN
            </motion.h2>

            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#FCD34D]/30 rounded-2xl p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl md:text-2xl font-bold text-[#FCD34D] mb-4">🛡️ Built-in Protections</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-[#FCD34D] mt-1">•</span>
                      <span><strong>Per-wallet ticket limits</strong> — Each raffle has max tickets per user (default 10% of total) to ensure fair distribution</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#FCD34D] mt-1">•</span>
                      <span><strong>On-chain randomness</strong> — Aptos Randomness API cannot be predicted or manipulated</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#FCD34D] mt-1">•</span>
                      <span><strong>Contract pause mechanism</strong> — Admin can pause contract in emergencies</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#FCD34D] mt-1">•</span>
                      <span><strong>Immutable parameters</strong> — Raffle rules locked at creation, no mid-game changes</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl md:text-2xl font-bold text-[#FCD34D] mb-4">🔐 Trustless Guarantees</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-[#FCD34D] mt-1">•</span>
                      <span><strong>No admin override</strong> — Even platform operators cannot change raffle outcomes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#FCD34D] mt-1">•</span>
                      <span><strong>Transparent escrow</strong> — All funds verifiable on-chain at any time</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#FCD34D] mt-1">•</span>
                      <span><strong>Permissionless access</strong> — Anyone can participate, no gatekeeping</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#FCD34D] mt-1">•</span>
                      <span><strong>Open source contracts</strong> — Code is public and verifiable by anyone</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Support */}
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
                  QUESTIONS?
                </h2>
                <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                  If you have any questions about these rules or need support, don't hesitate to reach out to our team.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => navigate('/app')}
                    className="bg-black hover:bg-gray-800 text-white text-lg font-bold px-8 py-4 rounded-xl border-2 border-gray-800 shadow-[4px_4px_0px_#333] hover:scale-105 active:translate-y-1 active:shadow-none transition-all"
                  >
                    Contact Support
                  </button>
                  <button 
                    onClick={() => window.open('https://discord.com', '_blank')}
                    className="bg-white hover:bg-gray-100 text-black text-lg font-bold px-8 py-4 rounded-xl border-2 border-gray-300 shadow-[4px_4px_0px_#ccc] hover:scale-105 active:translate-y-1 active:shadow-none transition-all"
                  >
                    Join Discord
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </LandingLayout>
  );
};

// Sub-components
const RuleCard = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <motion.div
    whileHover={{ scale: 1.02, x: 5 }}
    className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-xl p-6 group hover:border-[#FCD34D]/50 transition-all duration-300"
  >
    <div className="flex items-start gap-4">
      <div className="bg-[#FCD34D] text-black font-black text-lg w-10 h-10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        {number}
      </div>
      <div>
        <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-[#FCD34D] transition-colors">
          {title}
        </h3>
        <p className="text-gray-300 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  </motion.div>
);

const ProcessStep = ({ img, step, title, description, reverse }: { 
  img: string; 
  step: string; 
  title: string; 
  description: string; 
  reverse: boolean;
}) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-12`}
  >
    <div className="flex-shrink-0">
      <div className="relative">
        <img 
          src={img} 
          alt={title} 
          className="w-32 md:w-48 h-32 md:h-48 object-contain drop-shadow-2xl"
        />
        <div className="absolute -top-4 -right-4 bg-[#FCD34D] text-black font-black text-2xl md:text-3xl w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg">
          {step}
        </div>
      </div>
    </div>
    <div className={`flex-1 ${reverse ? 'md:text-right' : 'md:text-left'} text-center`}>
      <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
        {title}
      </h3>
      <p className="text-gray-300 text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
        {description}
      </p>
    </div>
  </motion.div>
);

const InfoCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    whileHover={{ scale: 1.05, y: -5 }}
    className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-2xl p-6 text-center group hover:border-[#FCD34D]/50 transition-all duration-300"
  >
    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-lg md:text-xl font-bold text-white mb-3 group-hover:text-[#FCD34D] transition-colors">
      {title}
    </h3>
    <p className="text-gray-300 leading-relaxed text-sm md:text-base">
      {description}
    </p>
  </motion.div>
);

export default Rules;