import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import RaffleCard from "@/components/RaffleCard";
import RaffleCardSkeleton from "@/components/RaffleCardSkeleton";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import bannerImg from "@/assets/banner.png";
import bannerImg2 from "@/assets/banner2.png";
import { useAllRaffles } from "@/hooks/useAllRaffles";
import { RAFFLE_STATUS } from "@/lib/raffle-contract";

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
    { label: "MoME Only", checked: false },
];

const Dashboard = () => {
    const [selectedSort, setSelectedSort] = useState("Trending");
    const [selectedType, setSelectedType] = useState("NFT");
    const [selectedSource, setSelectedSource] = useState("All Sources");
    const [minFloorPrice, setMinFloorPrice] = useState("");
    const [maxFloorPrice, setMaxFloorPrice] = useState("");
    const [appliedMinPrice, setAppliedMinPrice] = useState<number | null>(null);
    const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | null>(null);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Fetch real raffle data
    const { data: raffles, isLoading, error } = useAllRaffles();

    // Filter and sort raffles
    const filteredRaffles = raffles
        ?.filter((raffle) => {
            // Filter by status for "Raffled"
            if (selectedSort === "Raffled") {
                return raffle.status >= RAFFLE_STATUS.ITEM_RAFFLED;
            }

            // Filter by floor price
            if (appliedMinPrice !== null && raffle.ticketPrice < appliedMinPrice) {
                return false;
            }
            if (appliedMaxPrice !== null && raffle.ticketPrice > appliedMaxPrice) {
                return false;
            }

            return true;
        })
        .sort((a, b) => {
            switch (selectedSort) {
                case "Recently Added":
                    return b.id - a.id; // Newer raffles first
                case "Ends Soon":
                    return a.endTime.getTime() - b.endTime.getTime();
                case "Highest Item Value":
                    return b.prizeAmount - a.prizeAmount;
                case "Lowest Item Value":
                    return a.prizeAmount - b.prizeAmount;
                case "Highest Ticket Price":
                    return b.ticketPrice - a.ticketPrice;
                case "Lowest Ticket Price":
                    return a.ticketPrice - b.ticketPrice;
                case "Raffled":
                    // Sort by most recently finalized
                    return b.id - a.id;
                default: // Trending
                    return b.ticketsSold - a.ticketsSold;
            }
        }) || [];

    const handleApplyFloorPrice = () => {
        const min = minFloorPrice ? parseFloat(minFloorPrice) : null;
        const max = maxFloorPrice ? parseFloat(maxFloorPrice) : null;

        if (min !== null && isNaN(min)) {
            alert("Please enter a valid minimum price");
            return;
        }
        if (max !== null && isNaN(max)) {
            alert("Please enter a valid maximum price");
            return;
        }
        if (min !== null && max !== null && min > max) {
            alert("Minimum price cannot be greater than maximum price");
            return;
        }

        setAppliedMinPrice(min);
        setAppliedMaxPrice(max);
        setIsMobileFilterOpen(false); // Close mobile filter after applying
    };

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
            <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 py-4">


                {/* Mobile Filter Overlay */}
                {isMobileFilterOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileFilterOpen(false)} />
                        <div className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-[#0a0a0a] border-l border-white/10 overflow-y-auto">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-white">Filters</h2>
                                    <button
                                        onClick={() => setIsMobileFilterOpen(false)}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>

                                {/* Mobile Filter Content - Same as Desktop Sidebar */}
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
                                            value={minFloorPrice}
                                            onChange={(e) => setMinFloorPrice(e.target.value)}
                                            className="w-full bg-[#1A1A1E] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                                        />
                                        <span className="text-gray-500">-</span>
                                        <input
                                            type="text"
                                            placeholder="max"
                                            value={maxFloorPrice}
                                            onChange={(e) => setMaxFloorPrice(e.target.value)}
                                            className="w-full bg-[#1A1A1E] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                                        />
                                    </div>
                                    <button
                                        onClick={handleApplyFloorPrice}
                                        className="w-full bg-[#A04545] hover:bg-[#8a3b3b] text-white font-bold py-3 rounded-lg text-sm tracking-wide transition-colors"
                                    >
                                        APPLY
                                    </button>
                                    {(appliedMinPrice !== null || appliedMaxPrice !== null) && (
                                        <button
                                            onClick={() => {
                                                setMinFloorPrice("");
                                                setMaxFloorPrice("");
                                                setAppliedMinPrice(null);
                                                setAppliedMaxPrice(null);
                                            }}
                                            className="w-full mt-2 text-xs text-gray-400 hover:text-white transition-colors"
                                        >
                                            Clear Filter
                                        </button>
                                    )}
                                </SidebarSection>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 md:gap-8">
                    {/* Sidebar */}
                    <aside className="w-[260px] flex-shrink-0 hidden lg:block sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
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
                                    value={minFloorPrice}
                                    onChange={(e) => setMinFloorPrice(e.target.value)}
                                    className="w-full bg-[#1A1A1E] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                    type="text"
                                    placeholder="max"
                                    value={maxFloorPrice}
                                    onChange={(e) => setMaxFloorPrice(e.target.value)}
                                    className="w-full bg-[#1A1A1E] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                                />
                            </div>
                            <button
                                onClick={handleApplyFloorPrice}
                                className="w-full bg-[#A04545] hover:bg-[#8a3b3b] text-white font-bold py-3 rounded-lg text-sm tracking-wide transition-colors"
                            >
                                APPLY
                            </button>
                            {(appliedMinPrice !== null || appliedMaxPrice !== null) && (
                                <button
                                    onClick={() => {
                                        setMinFloorPrice("");
                                        setMaxFloorPrice("");
                                        setAppliedMinPrice(null);
                                        setAppliedMaxPrice(null);
                                    }}
                                    className="w-full mt-2 text-xs text-gray-400 hover:text-white transition-colors"
                                >
                                    Clear Filter
                                </button>
                            )}
                        </SidebarSection>

                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 space-y-6 md:space-y-8">
                        {/* Hero Banner and Filter Section */}
                        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                            {/* Hero Banner Carousel */}
                            <div className="flex-1 relative rounded-2xl md:rounded-3xl overflow-hidden min-h-[160px] sm:min-h-[200px] md:min-h-[280px] lg:min-h-[350px] group">
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
                                                className="w-full h-full object-cover object-center min-h-[160px] sm:min-h-[200px] md:min-h-[280px] lg:min-h-[350px]"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f13] via-transparent to-transparent opacity-20" />
                                        </div>
                                    ))}
                                </div>

                                {/* Navigation Arrows */}
                                <button
                                    onClick={prevBanner}
                                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 md:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    aria-label="Previous banner"
                                >
                                    <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                                </button>
                                <button
                                    onClick={nextBanner}
                                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 md:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    aria-label="Next banner"
                                >
                                    <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                                </button>

                                {/* Indicator Dots */}
                                <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2">
                                    {banners.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => goToBanner(index)}
                                            className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-300 ${index === currentBanner
                                                ? 'bg-white w-6 md:w-8'
                                                : 'bg-white/50 hover:bg-white/75'
                                                }`}
                                            aria-label={`Go to banner ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Mobile Filter Button & Quick Filters */}
                            <div className="lg:hidden flex items-center justify-between">
                                <button
                                    onClick={() => setIsMobileFilterOpen(true)}
                                    className="flex items-center gap-2 bg-[#1A1A1E] border border-white/10 rounded-lg px-4 py-2 text-white hover:bg-[#202020] transition-colors"
                                >
                                    <Filter className="w-4 h-4" />
                                    <span className="font-medium">Filters</span>
                                    {(appliedMinPrice !== null || appliedMaxPrice !== null) && (
                                        <span className="bg-[#A04545] text-white text-xs px-2 py-0.5 rounded-full">1</span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Raffle Grid */}
                        <div>
                            {isLoading ? (
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <RaffleCardSkeleton key={i} />
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="text-center py-20">
                                    <p className="text-red-400">Error loading raffles</p>
                                    <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
                                </div>
                            ) : filteredRaffles.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-muted-foreground">No active raffles found</p>
                                    <p className="text-sm text-muted-foreground mt-2">Check back later for new raffles!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                                    {filteredRaffles.map((raffle) => (
                                        <RaffleCard
                                            key={`${raffle.isV3 ? 'v3' : 'v2'}-${raffle.id}`}
                                            id={raffle.id.toString()}
                                            image={raffle.imageUrl}
                                            title={raffle.title}
                                            subtitle={raffle.description}
                                            endTime={raffle.endTime}
                                            ticketsSold={raffle.ticketsSold}
                                            totalTickets={raffle.totalTickets}
                                            ticketPrice={raffle.ticketPrice}
                                            prizeAmount={raffle.prizeAmount}
                                            status={raffle.status}
                                            winner={raffle.winner}
                                            prizeAssetType={raffle.prizeAssetType}
                                            prizeSymbol={raffle.prizeSymbol}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
