import { useEffect, useState } from 'react';
import mwLogo from '@/assets/mw.png';

const LoadingScreen = ({ onLoadingComplete }: { onLoadingComplete: () => void }) => {
  const [showLogo, setShowLogo] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  useEffect(() => {
    // Show logo after brief delay
    const logoTimer = setTimeout(() => {
      setShowLogo(true);
    }, 300);

    // Start expanding red animation after logo is visible
    const expandTimer = setTimeout(() => {
      setIsExpanding(true);
    }, 2500);

    // Complete loading after expansion animation
    const completeTimer = setTimeout(() => {
      onLoadingComplete();
    }, 4500);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(expandTimer);
      clearTimeout(completeTimer);
    };
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
      {/* Red expanding circle from logo */}
      <div 
        className="absolute rounded-full"
        style={{
          width: '180px',
          height: '180px',
          backgroundColor: '#992424',
          transform: isExpanding ? 'scale(150)' : 'scale(0)',
          transition: 'transform 2000ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          willChange: 'transform',
        }}
      />
      
      {/* Logo with fade-in and bounce animation */}
      <div 
        className={`relative z-10 transition-all duration-700 ${
          showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        } ${showLogo && !isExpanding ? 'animate-bounce' : ''} ${
          isExpanding ? 'opacity-0 scale-75' : ''
        }`}
      >
        <img 
          src={mwLogo} 
          alt="MoME Logo" 
          className="w-36 h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 object-contain"
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
