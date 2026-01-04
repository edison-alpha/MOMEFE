import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import momeLogo from "@/assets/mome.png";
import { useNavigationWithLoading } from "@/hooks/useNavigationWithLoading";

const LandingNavbar = () => {
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

  return (
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
            <Link to="/faq" className="hover:text-[#F3B664] transition-colors">FAQ</Link>
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
          <Link
            to="/faq"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-[#9CA3AF] hover:text-[#F3B664] font-bold text-base transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
          >
            FAQ
          </Link>
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
  );
};

export default LandingNavbar;