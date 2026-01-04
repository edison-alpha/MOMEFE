import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import LandingLayout from "@/components/LandingLayout";
import moveusOh from "@/assets/Moveus/Moveus OHHHH.png";
import bigBrain from "@/assets/Moveus/big brain moveus.png";

const FAQ = () => {
  const navigate = useNavigate();

  const faqCategories = [
    {
      title: "Getting Started",
      icon: "🚀",
      faqs: [
        {
          question: "What is MOME and how is it different from traditional raffles?",
          answer: "MOME is a decentralized raffle protocol built on Movement Network. Unlike traditional raffles where you trust a centralized operator, MOME uses smart contracts and Aptos Native Randomness API to ensure provably fair winner selection. Every transaction is on-chain and verifiable—no trust required, just cryptographic proof."
        },
        {
          question: "What do I need to participate in a raffle?",
          answer: "You need: (1) A Movement Network compatible wallet (like Razor Wallet or Petra), (2) MOVE tokens for purchasing tickets and gas fees, and (3) That's it! No KYC, no registration—your wallet is your identity."
        },
        {
          question: "How do I create my own raffle?",
          answer: "Connect your wallet, click 'Create Raffle', deposit your prize (NFT, tokens, or RWA certificate), set ticket price and duration, then submit. Your prize is locked in a smart contract escrow until the raffle completes. Once live, parameters cannot be changed."
        },
        {
          question: "What types of assets can be raffled?",
          answer: "MOME supports all digital assets on Movement Network: NFTs (any collection), fungible tokens (USDT, DAI, MOVE, etc.), and Real World Asset (RWA) certificates. Our smart contracts handle all asset standards natively."
        }
      ]
    },
    {
      title: "Fairness & Security",
      icon: "🔐",
      faqs: [
        {
          question: "How do I know the winner selection is truly random?",
          answer: "We use Aptos On-Chain Randomness API—a secure, instant randomness system built directly into the Aptos framework. The randomness is generated at the moment of selection and cannot be predicted or manipulated by anyone, including us. Unlike external oracle solutions, this is native on-chain randomness that requires no third-party trust."
        },
        {
          question: "Can the raffle creator manipulate the outcome?",
          answer: "No. Once a raffle is created, all parameters are immutable in the smart contract. The creator has no special privileges—they cannot modify ticket prices, extend duration, or influence winner selection. The VRF randomness is generated independently of any user input."
        },
        {
          question: "What happens to my prize if I create a raffle?",
          answer: "Your prize is immediately transferred to the smart contract escrow upon raffle creation. It remains locked until: (1) A winner is selected and receives it, or (2) The raffle is cancelled and you reclaim it. No one—not even the MOME team—can access escrowed assets."
        },
        {
          question: "Are the smart contracts audited?",
          answer: "Our smart contracts are written in Move language with comprehensive test coverage. The code is open-source and verifiable on Movement Network explorer. We follow security best practices including reentrancy protection, overflow checks, and access control patterns."
        }
      ]
    },
    {
      title: "Economics & Fees",
      icon: "💰",
      faqs: [
        {
          question: "What are the platform fees?",
          answer: "Fee structure is simple and transparent: 10% platform fee when raffle target is met (creator receives 90% of ticket sales), 5% fee when target is not met (winner receives 95% of ticket pool). All fees are hardcoded in smart contracts—no hidden charges."
        },
        {
          question: "What happens if a raffle doesn't meet its target?",
          answer: "If ticket sales don't reach the target amount: the winner receives the entire ticket pool (minus 5% fee), and the creator reclaims their original prize. This ensures participants always have a chance to win something, and creators don't lose their assets."
        },
        {
          question: "Can I get a refund on my tickets?",
          answer: "Ticket purchases are final and recorded on-chain. However, if a raffle is cancelled before completion, you can claim a full refund by calling the refund function on the smart contract. The process is trustless—no admin approval needed."
        },
        {
          question: "How do creators earn from raffles?",
          answer: "When a raffle meets its target, creators receive 90% of total ticket sales. For example: 100 tickets at 1 MOVE each = 100 MOVE collected, creator receives 90 MOVE. If target isn't met, creator reclaims their prize while the ticket pool goes to the winner."
        }
      ]
    },
    {
      title: "Technical Details",
      icon: "⚙️",
      faqs: [
        {
          question: "What blockchain is MOME built on?",
          answer: "MOME is built on Movement Network, a high-performance L2 that combines Ethereum's security with Move VM's speed. This gives us sub-second finality, low gas fees, and access to Aptos Native Randomness for provably fair raffles."
        },
        {
          question: "How fast are transactions?",
          answer: "Movement Network provides sub-second transaction finality. Ticket purchases confirm almost instantly, and winner selection + prize distribution happens atomically in a single transaction. No waiting, no pending states."
        },
        {
          question: "Can I verify transactions on-chain?",
          answer: "Yes! Every operation is recorded on Movement Network and can be verified on the blockchain explorer. You can check: raffle creation parameters, all ticket purchases with timestamps, randomness generation proof, and prize distribution transaction."
        },
        {
          question: "What wallets are supported?",
          answer: "MOME supports all Movement Network compatible wallets including Razor Wallet, Petra Wallet, and other Aptos-compatible wallets. We recommend Razor Wallet for the best experience with built-in swap functionality."
        }
      ]
    }
  ];

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
                FAQ
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Everything you need to know about MOME's decentralized raffle protocol. 
                From getting started to technical deep-dives—we've got you covered.
              </p>
            </motion.div>

            <div className="flex justify-center gap-8">
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                src={moveusOh}
                alt="MOME FAQ"
                className="w-32 md:w-48 h-auto object-contain drop-shadow-2xl"
              />
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                src={bigBrain}
                alt="MOME FAQ"
                className="w-32 md:w-48 h-auto object-contain drop-shadow-2xl hidden md:block"
              />
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        {faqCategories.map((category, categoryIndex) => (
          <section 
            key={category.title}
            className={`py-16 md:py-20 ${categoryIndex % 2 === 0 ? 'bg-[#111]' : 'bg-[#0a0a0a]'}`}
          >
            <div className="max-w-4xl mx-auto px-4 md:px-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                className="flex items-center gap-4 mb-8 md:mb-12"
              >
                <span className="text-4xl">{category.icon}</span>
                <h2 className="text-2xl md:text-4xl font-black text-white">
                  {category.title}
                </h2>
              </motion.div>

              <div className="space-y-4">
                {category.faqs.map((faq, faqIndex) => (
                  <FAQItem 
                    key={faqIndex} 
                    question={faq.question} 
                    answer={faq.answer}
                    delay={faqIndex * 0.1}
                  />
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Still Have Questions */}
        <section className="relative bg-[#050505] text-white overflow-hidden border-t border-white/5">
          <div className="h-8 bg-[#991B1B] border-b-4 border-black" />

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
                  STILL HAVE QUESTIONS?
                </h2>
                <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                  Can't find what you're looking for? Our community is always ready to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => navigate('/app')}
                    className="bg-black hover:bg-gray-800 text-white text-lg font-bold px-8 py-4 rounded-xl border-2 border-gray-800 shadow-[4px_4px_0px_#333] hover:scale-105 active:translate-y-1 active:shadow-none transition-all"
                  >
                    Launch App
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

// FAQ Item Component with Accordion
const FAQItem = ({ question, answer, delay }: { question: string; answer: string; delay: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden hover:border-[#FCD34D]/30 transition-all duration-300"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-semibold text-white group-hover:text-[#FCD34D] transition-colors pr-4">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-[#FCD34D]" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-6 pb-5 text-gray-300 leading-relaxed border-t border-white/5 pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FAQ;
