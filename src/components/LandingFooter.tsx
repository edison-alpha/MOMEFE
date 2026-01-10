import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import momeLogo from "@/assets/mome.png";

const LandingFooter = () => {
  return (
    <footer className="relative bg-[#050505] text-white overflow-hidden border-t border-white/5">
      {/* Red Bar */}
      <div className="h-8 bg-[#991B1B] border-b-4 border-black" />

      {/* Links */}
      <div className="bg-[#111] pt-12 md:pt-16 pb-0 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col items-center">
          {/* Links Menu */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 lg:gap-12 text-gray-400 font-bold text-sm md:text-lg lg:text-xl tracking-wide mb-0 relative z-10">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/rules" className="hover:text-white transition-colors">Rules</Link>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            <a href="https://mome-4.gitbook.io/mome" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Documentation</a>
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
  );
};

export default LandingFooter;