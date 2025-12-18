import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import RaffleCard from "@/components/RaffleCard";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import bannerImg from "@/assets/banner.png";
import bannerImg2 from "@/assets/banner2.png";
import cardImg from "@/assets/0e16e6a4ca1f4d967b09bb796566ddf3.jpg";

// Mock data for raffles
const mockRaffles = [
  {
    id: "1",
    image: cardImg,
    title: "#108",
    subtitle: "Warplet #854434",
    endTime: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000 + 43 * 60 * 1000 + 29 * 1000),
    ticketsSold: 31,
    totalTickets: 100,
    ticketPrice: 10,
    startFromPrice: 0.1
  },
  {
    id: "2",
    image: cardImg,
    title: "#109",
    subtitle: "Warplet #854435",
    endTime: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
    ticketsSold: 45,
    totalTickets: 100,
    ticketPrice: 10,
    startFromPrice: 0.1
  },
  {
    id: "3",
    image: cardImg,
    title: "#110",
    subtitle: "Warplet #854436",
    endTime: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000),
    ticketsSold: 12,
    totalTickets: 100,
    ticketPrice: 10,
    startFromPrice: 0.1
  },
  {
    id: "4",
    image: cardImg,
    title: "#111",
    subtitle: "Warplet #854437",
    endTime: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
    ticketsSold: 88,
    totalTickets: 100,
    ticketPrice: 10,
    startFromPrice: 0.1
  },
  {
    id: "5",
    image: cardImg,
    title: "#112",
    subtitle: "Warplet #854438",
    endTime: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
    ticketsSold: 5,
    totalTickets: 100,
    ticketPrice: 10,
    startFromPrice: 0.1
  },
  {
    id: "6",
    image: cardImg,
    title: "#113",
    subtitle: "Warplet #854439",
    endTime: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
    ticketsSold: 67,
    totalTickets: 100,
    ticketPrice: 10,
    startFromPrice: 0.1
  },
  {
    id: "7",
    image: cardImg,
    title: "#114",
    subtitle: "Warplet #854440",
    endTime: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000),
    ticketsSold: 99,
    totalTickets: 100,
    ticketPrice: 10,
    startFromPrice: 0.1
  },
  {
    id: "8",
    image: cardImg,
    title: "#115",
    subtitle: "Warplet #854441",
    endTime: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
    ticketsSold: 23,
    totalTickets: 100,
    ticketPrice: 10,
    startFromPrice: 0.1
  },
  {
    id: "9",
    image: cardImg,
    title: "#116",
    subtitle: "Warplet #854442",
    endTime: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
    ticketsSold: 41,
    totalTickets: 100,
    ticketPrice: 10,
    startFromPrice: 0.1
  },
  {
    id: "10",
    image: cardImg,
    title: "#117",
    subtitle: "Warplet #854443",
    endTime: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
    ticketsSold: 10,
    totalTickets: 100,
    ticketPrice: 10,
    startFromPrice: 0.1
  },
];

const sortOptions = [
  { id: "trending", label: "Trending", active: true },
  { id: "recently-added", label: "Recently Added", active: false },
  { id: "ends-soon", label: "Ends Soon", active: false },
  { id: "highest-item-value", label: "Highest Item Value", active: false },
  { id: "lowest-item-value", label: "Lowest Item Value", active: false },
  { id: "highest-ticket-price", label: "Highest Ticket Price", active: false },
  { id: "lowest-ticket-price", label: "Lowest Ticket Price", active: false },
  { id: "raffled", label: "Raffled", active: false },
];

const typeOptions = [
  { label: "NFT", checked: true },
  { label: "Token", checked: false },
];

const sourceOptions = [
  { label: "All Sources", checked: true },
  { label: "Tradeport Only", checked: false },
];

const Index = () => {
  const [selectedSort, setSelectedSort] = useState("Trending");
  const [selectedType, setSelectedType] = useState("NFT");
  const [selectedSource, setSelectedSource] = useState("All Sources");

  // Carousel state
  const banners = [bannerImg, bannerImg2];
  const [currentBanner, setCurrentBanner] = useState(0);

  // Auto-rotate banner every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToBanner = (index: number) => {
    setCurrentBanner(index);
  };

  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    sort: true,
    type: true,
    source: true,
    floorPrice: true,
  });

  // Toggle section visibility
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Reusable Sidebar Section Component
  const SidebarSection = ({
    title,
    children,
    sectionKey
  }: {
    title: string,
    children: React.ReactNode,
    sectionKey: keyof typeof expandedSections
  }) => (
    <div className="mb-8">
      <div
        className="flex items-center justify-between mb-4 cursor-pointer group"
        onClick={() => toggleSection(sectionKey)}
      >
        <h3 className="font-bold text-white text-base group-hover:text-gray-300 transition-colors">{title}</h3>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-all duration-200 ${expandedSections[sectionKey] ? '' : '-rotate-90'
            }`}
        />
      </div>
      {expandedSections[sectionKey] && (
        <div>{children}</div>
      )}
    </div>
  );

  const RadioOption = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
    <div
      onClick={onClick}
      className="flex items-center gap-3 mb-3 cursor-pointer group"
    >
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? "border-[#A04545]" : "border-gray-600 group-hover:border-gray-400"
        }`}>
        {selected && (
          <div className="w-2.5 h-2.5 rounded-full bg-[#A04545]" />
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
      <div className="max-w-[1920px] mx-auto px-6 py-4">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-[280px] flex-shrink-0 hidden xl:block sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
            <SidebarSection title="Sort" sectionKey="sort">
              <div className="space-y-3">
                {sortOptions.map((option) => (
                  <RadioOption
                    key={option.id}
                    label={option.label}
                    selected={selectedSort === option.label}
                    onClick={() => setSelectedSort(option.label)}
                  />
                ))}
              </div>
            </SidebarSection>

            <div className="w-full h-px bg-white/5 my-6" />

            <SidebarSection title="Type" sectionKey="type">
              {typeOptions.map((option) => (
                <RadioOption
                  key={option.label}
                  label={option.label}
                  selected={selectedType === option.label}
                  onClick={() => setSelectedType(option.label)}
                />
              ))}
            </SidebarSection>

            <div className="w-full h-px bg-white/5 my-6" />

            <SidebarSection title="All Source" sectionKey="source">
              {sourceOptions.map((option) => (
                <RadioOption
                  key={option.label}
                  label={option.label}
                  selected={selectedSource === option.label}
                  onClick={() => setSelectedSource(option.label)}
                />
              ))}
            </SidebarSection>

            <div className="w-full h-px bg-white/5 my-6" />

            <SidebarSection title="Floor Price" sectionKey="floorPrice">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="text"
                  placeholder="min"
                  className="w-full bg-[#1A1A1E] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="text"
                  placeholder="max"
                  className="w-full bg-[#1A1A1E] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                />
              </div>
              <button className="w-full bg-[#A04545] hover:bg-[#8a3b3b] text-white font-bold py-3 rounded-lg text-sm tracking-wide transition-colors">
                APPLY
              </button>
            </SidebarSection>

          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Hero Banner Carousel */}
            <div className="relative rounded-3xl overflow-hidden min-h-[260px] md:min-h-[350px] group">
              {/* Banner Images */}
              <div className="relative w-full h-full">
                {banners.map((banner, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentBanner ? 'opacity-100' : 'opacity-0'
                      }`}
                  >
                    <img
                      src={banner}
                      alt={`Banner ${index + 1}`}
                      className="w-full h-full object-cover min-h-[260px] md:min-h-[350px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f13] via-transparent to-transparent opacity-20" />
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevBanner}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="Previous banner"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextBanner}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="Next banner"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Indicator Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToBanner(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentBanner
                      ? 'bg-white w-8'
                      : 'bg-white/50 hover:bg-white/75'
                      }`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Raffle Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {mockRaffles.map((raffle) => (
                <RaffleCard key={raffle.id} {...raffle} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
