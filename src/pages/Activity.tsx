import { useState } from "react";
import Layout from "@/components/Layout";
import GlobalRaffleActivity from "@/components/GlobalRaffleActivity";
import { ChevronDown, Filter, X } from "lucide-react";

const activityTypeOptions = [
  { id: "all", label: "All Activities" },
  { id: "raffle_created", label: "Listed Item" },
  { id: "ticket_purchase", label: "Joined Raffle" },
  { id: "raffle_finalized", label: "Item Winner" },
];

const Activity = () => {
  const [selectedActivityType, setSelectedActivityType] = useState("all");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const getFilters = () => {
    if (selectedActivityType === "all") {
      return ["raffle_created", "ticket_purchase", "raffle_finalized"];
    }
    return [selectedActivityType];
  };

  // Radio Option Component
  const RadioOption = ({
    label,
    selected,
    onClick
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
  }) => (
    <div
      onClick={onClick}
      className="flex items-center gap-3 mb-3 cursor-pointer group"
    >
      <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? "border-[#A04545]" : "border-gray-600 group-hover:border-gray-400"
        }`}>
        {selected && (
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#A04545]" />
        )}
      </div>
      <span className={`text-sm font-medium transition-colors ${selected ? "text-white" : "text-gray-400 group-hover:text-gray-300"
        }`}>
        {label}
      </span>
    </div>
  );

  return (
    <Layout showTicker>
      <div className="max-w-[1600px] mx-auto px-3 md:px-4 py-4 md:py-6">
        
        {/* Mobile Filter Overlay */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileFilterOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-[#0a0a0a] border-l border-white/10 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">Activity Filter</h2>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="space-y-3">
                  {activityTypeOptions.map((option) => (
                    <RadioOption
                      key={option.id}
                      label={option.label}
                      selected={selectedActivityType === option.id}
                      onClick={() => {
                        setSelectedActivityType(option.id);
                        setIsMobileFilterOpen(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 md:gap-6">
          {/* Desktop Sidebar Filter */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-[#0A0A0B] border border-white/10 rounded-lg p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">
                  Activity Type
                </h3>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>

              <div className="space-y-3">
                {activityTypeOptions.map((option) => (
                  <RadioOption
                    key={option.id}
                    label={option.label}
                    selected={selectedActivityType === option.id}
                    onClick={() => setSelectedActivityType(option.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header with Mobile Filter Button */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h1 className="text-lg md:text-2xl font-bold font-mono tracking-wider text-white mb-1">
                  PLATFORM ACTIVITY
                </h1>
                <p className="text-xs md:text-sm text-gray-400">
                  Real-time raffle activities across the platform
                </p>
              </div>
              
              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 bg-[#1A1A1E] border border-white/10 rounded-lg px-3 py-2 text-white hover:bg-[#202020] transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filter</span>
              </button>
            </div>

            {/* Current Filter Display on Mobile */}
            <div className="lg:hidden mb-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Showing:</span>
                <span className="bg-[#A04545]/20 text-[#A04545] px-2 py-1 rounded text-xs font-medium">
                  {activityTypeOptions.find(opt => opt.id === selectedActivityType)?.label}
                </span>
              </div>
            </div>

            <div className="bg-[#0A0A0B] border border-white/10 rounded-lg overflow-hidden">
              <GlobalRaffleActivity limit={100} filters={getFilters()} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Activity;
