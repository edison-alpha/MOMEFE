const RaffleCardSkeleton = () => {
  return (
    <div className="bg-[#151515] rounded-[16px] md:rounded-xl overflow-hidden border border-white/5 animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-square bg-white/5" />
      
      {/* Countdown strip skeleton */}
      <div className="h-6 bg-white/10" />
      
      {/* Content */}
      <div className="p-2.5 md:p-3 space-y-2 md:space-y-3">
        {/* Title */}
        <div className="h-3 md:h-4 bg-white/10 rounded w-3/4" />
        
        {/* Subtitle */}
        <div className="h-2.5 md:h-3 bg-white/5 rounded w-1/2" />
        
        {/* Progress bar */}
        <div className="space-y-1 md:space-y-1.5">
          <div className="h-2 md:h-2.5 bg-white/5 rounded-full" />
          <div className="flex justify-between">
            <div className="h-2.5 md:h-3 bg-white/5 rounded w-12 md:w-16" />
            <div className="h-2.5 md:h-3 bg-white/5 rounded w-10 md:w-12" />
          </div>
        </div>
        
        {/* Button section */}
        <div className="flex gap-1 md:gap-1.5 pt-2">
          <div className="flex-1 h-10 md:h-12 bg-white/10 rounded-xl" />
          <div className="flex-1 h-10 md:h-12 bg-white/10 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default RaffleCardSkeleton;
