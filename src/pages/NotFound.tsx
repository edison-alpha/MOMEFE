import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import mwLogo from "@/assets/mw.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
      <div className="text-center space-y-6">
        <img 
          src={mwLogo} 
          alt="Logo" 
          className="w-24 h-24 object-contain mx-auto opacity-80"
        />
        <h1 className="text-6xl font-bold font-mono text-white">404</h1>
        <p className="text-gray-400 text-lg">Page not found</p>
        <Link 
          to="/" 
          className="inline-block px-8 py-3 bg-[#A04545] text-white font-bold rounded-full hover:bg-[#8a3b3b] transition-colors shadow-lg shadow-[#A04545]/20 uppercase tracking-wider text-sm"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
