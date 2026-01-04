import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero.png";
import moveusFull from "@/assets/Moveus/Moveus full body png.png";
import lambo from "@/assets/Moveus/Lambo.gif";
import integrated from "@/assets/Moveus/integrated.png";
import bigBrain from "@/assets/Moveus/big brain moveus.png";
import moveusCig from "@/assets/Moveus/Moveus Cig.png";
import moveee3 from "@/assets/Moveus/MOVEEEE3.png";
import momeLogo from "@/assets/mome.png";
import moveusOh from "@/assets/Moveus/Moveus OHHHH.png";
import moveusGreen from "@/assets/Moveus/Moveus green candle.png";
import popcorn from "@/assets/Moveus/Moveus Popcorn.png";
import lazer from "@/assets/Moveus/Lazer_moveus.png";
import movementLogo from "@/assets/movement_logo.png";
import { useAllRaffles } from "@/hooks/useAllRaffles";
import { RAFFLE_STATUS } from "@/lib/raffle-contract";
import { useNavigationWithLoading } from "@/hooks/useNavigationWithLoading";

const LandingPage = () => {
  const { data: raffles, isLoading } = useAllRaffles();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { navigateWithLoading } = useNavigationWithLoading();

  // Close mobile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Always show the 3 most recent raffles (excluding cancelled ones)
  // Raffles are already sorted by ID (newest first) from useAllRaffles hook
  const recentRaffles = raffles
    ?.filter(r => r.status !== RAFFLE_STATUS.CANCELLED)
    .slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white overflow-x-hidden selection:bg-[#FCD34D] selection:text-black">

      {/* Navbar - Fixed Black Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#161616] h-14 md:h-16 flex items-center border-b border-white/5 shadow-lg mobile-menu-container">
        <div className="max-w-7xl mx-auto px-3 md:px-4 w-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            {/* Desktop - Logo as Link */}
            <Link to="/" className="hidden md:block hover:opacity-80 transition-opacity">
              <img src={momeLogo} alt="Mome Logo" className="h-8 md:h-10 object-contain" />
            </Link>
            
            {/* Mobile - Logo with Dropdown Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden hover:opacity-80 transition-opacity flex items-center gap-2"
            >
              <img src={momeLogo} alt="Mome Logo" className="h-8 object-contain" />
              <svg 
                className={`w-4 h-4 text-white transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 9l-7 7-7-7" 
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 text-[#9CA3AF] font-bold text-base tracking-wide">
              <Link to="/about" className="hover:text-[#F3B664] transition-colors">About</Link>
              <Link to="/rules" className="hover:text-[#F3B664] transition-colors">Rules</Link>
              <a href="#contact" className="hover:text-[#F3B664] transition-colors">Contact</a>
              <Link to="/docs" className="hover:text-[#F3B664] transition-colors">Docs</Link>
            </div>

            {/* Mobile Menu Icon - Hidden since we moved it to logo */}
            <div className="md:hidden"></div>

            <button
              onClick={() => navigateWithLoading('/app')}
              className="bg-[#FCD34D] hover:bg-[#F3B664] text-black text-sm md:text-base px-3 md:px-5 py-1 md:py-1.5 rounded-lg border-2 border-[#B45309] font-bold shadow-[2px_2px_0px_#78350F] active:translate-y-[2px] active:shadow-none transition-all"
            >
              Launch App
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <motion.div
          initial={false}
          animate={{
            height: isMobileMenuOpen ? 'auto' : 0,
            opacity: isMobileMenuOpen ? 1 : 0
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="absolute top-full left-0 right-0 bg-[#161616] border-b border-white/5 overflow-hidden md:hidden shadow-lg rounded-b-3xl"
        >
          <div className="flex items-center justify-center py-4 px-4 gap-3">
            <Link
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[#9CA3AF] hover:text-[#F3B664] font-bold text-base transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
            >
              About
            </Link>
            <Link
              to="/rules"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[#9CA3AF] hover:text-[#F3B664] font-bold text-base transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
            >
              Rules
            </Link>
            <a
              href="#contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[#9CA3AF] hover:text-[#F3B664] font-bold text-base transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
            >
              Contact
            </a>
            <Link
              to="/docs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[#9CA3AF] hover:text-[#F3B664] font-bold text-base transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
            >
              Docs
            </Link>
          </div>
        </motion.div>
      </nav>

      {/* Hero Section - The Stage */}
      <section className="relative pt-16 min-h-[70vh] md:min-h-[85vh] flex flex-col justify-end bg-[#1a1a1a] overflow-hidden">

        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Background"
            className="w-full h-full object-cover object-top opacity-50"
          />
          {/* Vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/20" />
        </div>

        {/* Pillars (Decorative) */}
        <div className="absolute left-0 top-0 bottom-24 w-12 md:w-24 bg-[#E5C285] border-r-4 border-[#B45309] z-10 hidden lg:block"
          style={{ backgroundImage: 'linear-gradient(90deg, #FCD34D 0%, #B45309 10%, #FCD34D 20%, #B45309 30%, #FCD34D 100%)', opacity: 0.8 }}></div>
        <div className="absolute right-0 top-0 bottom-24 w-12 md:w-24 bg-[#E5C285] border-l-4 border-[#B45309] z-10 hidden lg:block"
          style={{ backgroundImage: 'linear-gradient(90deg, #FCD34D 0%, #B45309 10%, #FCD34D 20%, #B45309 30%, #FCD34D 100%)', opacity: 0.8 }}></div>

        {/* Content Container */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 w-full flex flex-col items-center pb-6 md:pb-12">

          {/* Mobile Layout - Text and Button First */}
          <div className="md:hidden w-full flex flex-col items-center text-center mb-6 mt-8">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl sm:text-4xl font-black text-[#FCD34D] uppercase leading-tight drop-shadow-[2px_2px_0px_#000] mb-8"
              style={{ textShadow: "2px 2px 0px #000" }}
            >
              Transparent & <br /> Fair Raffles <br />
              <span className="text-white">On Movement</span> <br /> Network
            </motion.h1>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={() => navigateWithLoading('/app')}
                className="bg-[#E5C285] hover:bg-[#d4b983] text-[#3E2C11] text-lg sm:text-xl font-black px-6 py-3 rounded-xl border-2 border-[#5C4018] shadow-[3px_3px_0px_#000] hover:scale-105 active:translate-y-1 active:shadow-none transition-all"
              >
                ENTER RAFFLE
              </button>
            </motion.div>
          </div>

          {/* Mobile Characters - Below Button */}
          <div className="md:hidden w-full flex items-end justify-center relative h-[200px] mb-4">
            {/* Spartan - Left */}
            <motion.img
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              src={moveusFull}
              alt="Spartan"
              className="h-[180px] object-contain relative z-20 shrink-0 -mr-4"
            />

            {/* Lambo Group - Right */}
            <div className="relative mb-2 z-30">
              <motion.img
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                src={lambo}
                alt="Lambo"
                className="w-[140px] object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Desktop Layout - Side by Side */}
          <div className="hidden md:flex w-full flex-row items-end">
            {/* LEFT GROUP: Characters */}
            <div className="w-1/2 flex items-end justify-start relative h-[500px]">
              {/* Spartan - Far Left */}
              <motion.img
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                src={moveusFull}
                alt="Spartan"
                className="h-[480px] object-contain relative z-20 shrink-0 -ml-32"
              />

              {/* Lambo Group - Center/Left */}
              <div className="relative -ml-12 mb-4 z-30">
                <motion.img
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  src={lambo}
                  alt="Lambo"
                  className="w-[380px] object-contain drop-shadow-2xl"
                />
              </div>
            </div>

            {/* RIGHT GROUP: Text */}
            <div className="w-1/2 flex flex-col items-end text-right mb-24 relative z-30">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-6xl lg:text-7xl font-black text-[#FCD34D] uppercase leading-tight drop-shadow-[4px_4px_0px_#000] mb-8"
                style={{ textShadow: "2px 2px 0px #000" }}
              >
                Transparent & <br /> Fair Raffles <br />
                <span className="text-white">On Movement</span> <br /> Network
              </motion.h1>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <button
                  onClick={() => navigateWithLoading('/app')}
                  className="bg-[#E5C285] hover:bg-[#d4b983] text-[#3E2C11] text-3xl font-black px-8 py-4 rounded-xl border-4 border-[#5C4018] shadow-[4px_4px_0px_#000] hover:scale-105 active:translate-y-1 active:shadow-none transition-all"
                >
                  ENTER RAFFLE
                </button>
              </motion.div>
            </div>
          </div>

        </div>

        {/* RED FLOOR */}
        <div className="absolute bottom-0 left-0 right-0 h-16 md:h-32 bg-[#991B1B] border-t-4 md:border-t-8 border-black z-10 shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)]">
          {/* Floor Texture/Detail */}
          <div className="w-full h-full opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0px, #000 10px, transparent 10px, transparent 20px)' }}></div>
        </div>

      </section>

      {/* Movement Infinite Marquee */}
      <section className="bg-[#111] border-y border-white/5 py-8 overflow-hidden relative z-20">
        <div className="flex items-center">
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "-50%" }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex gap-20 pr-20 shrink-0"
            style={{ width: "fit-content" }}
          >
            {[...Array(20)].map((_, i) => (
              <img
                key={i}
                src={movementLogo}
                alt="Movement Network"
                className="h-8 md:h-10 w-auto object-contain opacity-40 hover:opacity-100 transition-opacity duration-300"
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-12 md:py-24 bg-[#0a0a0a] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#FCD34D] rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#FCD34D] rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
          <h2 className="text-2xl md:text-5xl font-black text-center text-white mb-2 md:mb-4">WHY CHOOSE US</h2>
          <p className="text-gray-400 text-sm md:text-base text-center mb-8 md:mb-16 max-w-2xl mx-auto px-4">Experience the future of fair raffles with cutting-edge technology and community-first approach</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <FeatureCardLight
              img={bigBrain}
              title="Fair & Transparent"
              description="Every raffle uses Aptos Native Randomness API for provably fair, verifiable random winner selection. All transactions are on-chain and publicly auditable."
            />
            <FeatureCardLight
              img={moveee3}
              title="Community Powered"
              description="Open to everyone in the Movement ecosystem. Anyone can participate in raffles with equal chances to win. Join a thriving community where fairness and transparency come first."
            />
            <FeatureCardLight
              img={integrated}
              title="Integrated & Secure"
              description="Seamlessly integrated with Movement Network. Smart contracts are audited and battle-tested to ensure your assets are always safe."
            />
          </div>
        </div>
      </section>

      {/* Live Raffles Preview */}
      <section id="raffles" className="py-8 md:py-24 bg-[#111] border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 md:px-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 md:mb-12">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h2 className="text-xl sm:text-2xl md:text-5xl font-black text-[#FCD34D]">LIVE RAFFLES</h2>
              <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-1 md:mt-2">Hurry up! These prizes are hot.</p>
            </div>
            <button 
              onClick={() => navigateWithLoading('/app')}
              className="hidden md:flex items-center gap-2 text-white font-bold hover:text-[#FCD34D] transition-colors"
            >
              View All Raffles &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {isLoading ? (
              // Loading Skeletons
              [1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/5] bg-[#1a1a1a] rounded-xl animate-pulse border border-white/5" />
              ))
            ) : recentRaffles.length > 0 ? (
              recentRaffles.map((raffle) => (
                <RafflePreviewCard
                  key={raffle.id}
                  title={raffle.title}
                  price={`${raffle.ticketPrice} MOVE`}
                  ticketsSold={raffle.ticketsSold}
                  totalTickets={raffle.totalTickets}
                  endTime={raffle.endTime}
                  img={raffle.imageUrl || moveusOh}
                  badge={raffle.status === RAFFLE_STATUS.LISTED ? "LIVE" : "ENDED"}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 md:py-12 text-gray-500">
                <p className="text-sm md:text-base">No raffles found. Check back soon!</p>
              </div>
            )}
          </div>

          <div className="mt-6 md:mt-12 text-center md:hidden">
            <button 
              onClick={() => navigateWithLoading('/app')}
              className="bg-[#A04545] hover:bg-[#8a3b3b] text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              View All Raffles
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 md:py-24 bg-[#0a0a0a] relative overflow-hidden">
        {/* Decoration */}
        <img src={lazer} className="absolute -right-20 top-20 w-[600px] opacity-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10">
          <h2 className="text-2xl md:text-5xl font-black text-center text-white mb-8 md:mb-16">HOW TO WIN</h2>

          <div className="space-y-8 md:space-y-12">
            <StepRow
              num="01"
              title="Connect Wallet"
              desc="Link your Movement wallet in seconds. No registration required."
            />
            <StepRow
              num="02"
              title="Choose Your Prize"
              desc="Browse our curated selection of NFTs, Tokens, and Whitelists."
            />
            <StepRow
              num="03"
              title="Buy Tickets"
              desc="Purchase as many tickets as you want to increase your odds."
            />
            <StepRow
              num="04"
              title="Claim Victory"
              desc="If you win, the prize is automatically transferred to your wallet."
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-12 md:py-24 bg-[#111]">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-5xl font-black text-center text-white mb-8 md:mb-12">F.A.Q</h2>
          <div className="space-y-4">
            <Accordion title="How does MOME ensure fair winner selection?" answer="We use Aptos On-Chain Randomness API to generate cryptographically secure random numbers directly on-chain. This randomness is instant, tamper-proof, and verifiable—no external oracles needed." />
            <Accordion title="What types of assets can be raffled?" answer="MOME supports all digital assets on Movement Network: NFTs, fungible tokens (USDT, DAI, MOVE), and Real World Asset (RWA) certificates. Our smart contracts handle all asset types natively." />
            <Accordion title="What happens if a raffle doesn't meet its target?" answer="If ticket sales don't reach the target: the winner receives 95% of the ticket pool, and the creator can reclaim their original prize. Everyone still has a chance to win!" />
            <Accordion title="Can anyone create a raffle?" answer="Yes! MOME is fully permissionless. Anyone with a Movement wallet can create raffles with any digital asset. Just deposit your prize, set ticket price and duration, and you're live." />
            <Accordion title="What are the platform fees?" answer="10% fee when raffle target is met (creator gets 90% of ticket sales). 5% fee when target not met (winner gets 95% of ticket pool). All fees are hardcoded in smart contracts." />
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="relative bg-[#050505] text-white overflow-hidden border-t border-white/5">

        {/* Red Bar */}
        <div className="h-8 bg-[#991B1B] border-b-4 border-black" />

        {/* Yellow Bar */}
        <div className="bg-[#FCD34D] py-8 md:py-12 text-black text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 md:border-4 border-black px-4 md:px-8 py-1 md:py-2 shadow-[3px_3px_0px_#000] md:shadow-[4px_4px_0px_#000]">
            <h3 className="font-black text-xl md:text-2xl uppercase tracking-tighter">GMOVE</h3>
          </div>

          <h2 className="font-black text-2xl md:text-5xl mt-4 md:mt-6">#JoinTheMovement</h2>


        </div>

        {/* Links */}
        <div className="bg-[#111] pt-12 md:pt-16 pb-0 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col items-center">
            {/* Links Menu */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 lg:gap-12 text-gray-400 font-bold text-sm md:text-lg lg:text-xl tracking-wide mb-0 relative z-10">
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/rules" className="hover:text-white transition-colors">Rules</Link>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
              <Link to="/docs" className="hover:text-white transition-colors">Documentation</Link>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center justify-center gap-4 md:gap-6 mt-4 md:mt-6 mb-3 md:mb-4 relative z-10">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-[#FCD34D] text-gray-400 hover:text-black transition-all duration-300 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-[#FCD34D] text-gray-400 hover:text-black transition-all duration-300 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.14.121.098.155.23.171.324.016.062.036.203.02.313z" />
                </svg>
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-[#FCD34D] text-gray-400 hover:text-black transition-all duration-300 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>


            {/* Massive Footer Logo */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              className="w-full max-w-[150%] md:max-w-7xl mt-0 md:mt-2 -mb-16 md:-mb-48 flex justify-center"
            >
              <img src={momeLogo} alt="Mome Logo" className="w-full h-auto block transform scale-110 md:scale-115 origin-bottom" />
            </motion.div>
          </div>
        </div>
      </footer>

    </div>
  );
};

/* Sub-components for cleaner code */

const FeatureCardLight = ({ img, title, description }: any) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="flex flex-col items-center text-center p-6 md:p-8 pb-0 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 transition-all duration-300 group min-h-[280px] md:min-h-[350px]"
      style={{
        boxShadow: isHovered
          ? '0 0 40px rgba(252, 211, 77, 0.3), 0 20px 60px rgba(0,0,0,0.5)'
          : '0 10px 30px rgba(0,0,0,0.3)'
      }}
    >
      {/* Gradient border glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#FCD34D]/20 via-transparent to-[#FCD34D]/20 blur-xl" />

      <h3 className="text-lg md:text-2xl font-bold mb-auto pt-2 font-sans relative z-10 text-white group-hover:text-[#FCD34D] transition-colors">{title}</h3>
      <img src={img} alt={title} className="h-36 md:h-48 lg:h-56 object-contain object-bottom drop-shadow-2xl relative z-10 group-hover:drop-shadow-[0_0_20px_rgba(252,211,77,0.5)] transition-all duration-300 mt-auto" />

      {/* Hover Description Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 20
        }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-gradient-to-br from-black/95 via-[#1a1a1a]/95 to-black/95 backdrop-blur-md p-4 md:p-6 flex items-center justify-center rounded-2xl"
        style={{ pointerEvents: isHovered ? 'auto' : 'none' }}
      >
        <p className="text-gray-300 text-xs md:text-sm lg:text-base leading-relaxed">
          {description}
        </p>
      </motion.div>
    </motion.div>
  );
};

const RafflePreviewCard = ({ title, price, ticketsSold, totalTickets, endTime, img, badge }: any) => {
  // Calculate progress percentage
  const progressPercent = totalTickets > 0 ? Math.min((ticketsSold / totalTickets) * 100, 100) : 0;
  
  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!endTime) return 'N/A';
    const now = Date.now();
    const end = endTime * 1000; // Convert to milliseconds if in seconds
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="group bg-[#0a0a0a] border border-white/10 rounded-lg md:rounded-xl overflow-hidden hover:border-[#FCD34D] transition-all relative">
      <div className="aspect-square bg-[#161616] relative overflow-hidden">
        <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <span className="absolute top-2 md:top-3 right-2 md:right-3 bg-[#FCD34D] text-black text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded text-center">
          {badge}
        </span>
      </div>
      <div className="p-3 md:p-5">
        <h3 className="font-bold text-sm md:text-lg text-white mb-1 truncate">{title}</h3>
        <div className="flex justify-between items-center text-xs md:text-sm text-gray-400 mb-3 md:mb-4">
          <span>Ticket Price</span>
          <span className="text-[#FCD34D] font-mono font-bold text-xs md:text-sm">{price}</span>
        </div>

        <div className="w-full bg-[#333] h-1.5 md:h-2 rounded-full overflow-hidden mb-2">
          <div 
            className="bg-[#FCD34D] h-full transition-all duration-300" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] md:text-xs text-gray-500">
          <span>{ticketsSold}/{totalTickets} sold</span>
          <span>Ends in {getTimeRemaining()}</span>
        </div>
      </div>
    </div>
  );
};

const StepRow = ({ num, title, desc }: any) => (
  <div className="flex gap-4 md:gap-6 lg:gap-10 items-start md:items-center">
    <div className="font-black text-4xl md:text-6xl lg:text-8xl text-[#222] italic select-none shrink-0">
      {num}
    </div>
    <div>
      <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 md:mb-2">{title}</h3>
      <p className="text-gray-400 text-sm md:text-base max-w-md">{desc}</p>
    </div>
  </div>
);

const Accordion = ({ title, answer }: any) => {
  return (
    <details className="group border-b border-white/10">
      <summary className="flex justify-between items-center cursor-pointer py-4 md:py-6 text-base md:text-lg font-bold text-white list-none hover:text-[#FCD34D] transition-colors">
        {title}
        <span className="block group-open:-rotate-180 transition-transform">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </span>
      </summary>
      <p className="text-gray-400 text-sm md:text-base pb-4 md:pb-6 leading-relaxed">
        {answer}
      </p>
    </details>
  )
}

export default LandingPage;
