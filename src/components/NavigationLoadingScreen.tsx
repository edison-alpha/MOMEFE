import { useEffect, useState } from 'react';
import mwLogo from '@/assets/mw.png';

interface NavigationLoadingScreenProps {
  onLoadingComplete: () => void;
}

const NavigationLoadingScreen = ({ 
  onLoadingComplete
}: NavigationLoadingScreenProps) => {
  const [showLogo, setShowLogo] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  useEffect(() => {
    // Show logo immediately
    const logoTimer = setTimeout(() => {
      setShowLogo(true);
    }, 100);

    // Start expanding animation
    const expandTimer = setTimeout(() => {
      setIsExpanding(true);
    }, 1500);

    // Complete loading after expansion
    const completeTimer = setTimeout(() => {
      onLoadingComplete();
    }, 2500);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(expandTimer);
      clearTimeout(completeTimer);
    };
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Red expanding circle from logo */}
      <div 
        className="absolute rounded-full"
        style={{
          width: '160px',
          height: '160px',
          backgroundColor: '#A04545',
          transform: isExpanding ? 'scale(150)' : 'scale(0)',
          transition: 'transform 1000ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          willChange: 'transform',
        }}
      />
      
      {/* Logo with fade-in animation */}
      <div 
        className={`relative z-10 transition-all duration-500 ${
          showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        } ${isExpanding ? 'opacity-0 scale-75' : ''}`}
      >
        <img 
          src={mwLogo} 
          alt="MoME Logo" 
          className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain"
        />
      </div>
    </div>
  );
};

export default NavigationLoadingScreen;