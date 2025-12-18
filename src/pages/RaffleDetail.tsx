import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { ArrowLeft, ArrowRight, Share2, Eye, Heart, Minus, Plus } from "lucide-react";

// Mock raffle data
const mockRaffle = {
  id: "1",
  title: "10000 jesse (jesse)",
  priceChange: "-$94.05",
  owner: "0xe6a7 ... 6e2E",
  image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&h=600&fit=crop",
  currentPrice: "$0.0094",
  priceChange24h: "+0.42%",
  volume24h: "$551.7400 K",
  saleEnds: new Date(2025, 11, 26),
  ticketsSold: 62,
  totalTickets: 100,
  fundingCurrent: 62,
  fundingTotal: 100,
  assetValue: "$100",
  itemPrice: "1.0000 USDC",
  userTickets: 0,
  views: 52,
  likes: 1,
  details: {
    itemName: "Unknown",
    symbol: "Unknown",
    decimals: 0,
    standard: "ERC20",
    contractAddress: "Unknown",
    network: "Base",
  },
  activity: [
    { user: "0xF635 ... 7A7a", tickets: 10, time: "14 hrs ago" },
    { user: "0x6659 ... EA04", tickets: 5, time: "3 days ago" },
    { user: "0x8Da4 ... 2946", tickets: 1, time: "3 days ago" },
    { user: "0xDFe5 ... C729", tickets: 1, time: "4 days ago" },
    { user: "0xAF58 ... 98E7", tickets: 20, time: "4 days ago" },
    { user: "0x673B ... 8B99", tickets: 10, time: "5 days ago" },
    { user: "0xF635 ... 7A7a", tickets: 15, time: "5 days ago" },
  ],
  leaderboard: [
    { rank: 1, user: "0xF635 ... 7A7a", tickets: 25 },
    { rank: 2, user: "0xAF58 ... 98E7", tickets: 20 },
    { rank: 3, user: "0x673B ... 8B99", tickets: 10 },
    { rank: 4, user: "0x6659 ... EA04", tickets: 5 },
    { rank: 5, user: "0x8Da4 ... 2946", tickets: 1 },
    { rank: 6, user: "0xDFe5 ... C729", tickets: 1 },
  ],
};

const RaffleDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "leaderboard">("overview");
  const [ticketAmount, setTicketAmount] = useState(1);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = mockRaffle.saleEnds.getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => String(num).padStart(2, "0");
  const progress = (mockRaffle.ticketsSold / mockRaffle.totalTickets) * 100;
  const totalPrice = (ticketAmount * 1).toFixed(2);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "activity", label: "Activity" },
    { id: "leaderboard", label: "Leaderboard" },
  ];

  return (
    <Layout showTicker>
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-[1.8fr_3.2fr] gap-4 items-start">
          {/* Left: Image & Breadcrumb - Sticky */}
          <div className="sticky top-24 flex flex-col gap-6 self-start">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-gray-400 hover:text-[#A04545] transition-colors">
                Explore
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-white truncate max-w-[200px]">{mockRaffle.title}</span>
              <div className="flex items-center gap-2 ml-auto">
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-[#A04545]">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="aspect-square rounded-xl overflow-hidden bg-black border-2 border-white/20 w-full">
              <img
                src={mockRaffle.image}
                alt={mockRaffle.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right: Details - Scrollable with Page */}
          <div className="space-y-6 pb-20 pt-1.5">
            {/* Title & Actions */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2 text-white">
                  {mockRaffle.title}
                  <span className="text-gray-400 font-normal text-base">({mockRaffle.priceChange})</span>
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#A04545] flex items-center justify-center text-[10px] font-bold text-white">R</div>
                  <span className="text-gray-400 font-mono text-xs">{mockRaffle.owner}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-gray-400 hover:text-[#A04545] transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 text-gray-400">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-xs">{mockRaffle.views}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400 hover:text-[#A04545] transition-colors cursor-pointer">
                  <Heart className="w-3.5 h-3.5" />
                  <span className="text-xs">{mockRaffle.likes}</span>
                </div>
              </div>
            </div>

            {/* Price Stats */}
            <div className="bg-[#1A1A1E] border border-white/10 rounded-xl p-3 space-y-3">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-gray-400 text-[10px]">Current Price</p>
                  <p className="font-mono font-medium text-white text-sm">{mockRaffle.currentPrice}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px]">1D Changes (%)</p>
                  <p className="font-mono font-medium text-green-500 text-sm">{mockRaffle.priceChange24h}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px]">Volume 1D</p>
                  <p className="font-mono font-medium text-white text-sm">{mockRaffle.volume24h}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400">
                <span>Price data provided by</span>
                <span className="flex items-center gap-1 text-white">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  coingecko
                </span>
              </div>
            </div>

            {/* Sale Countdown */}
            <div className="bg-[#1A1A1E] border border-white/10 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">⏰ Sale Ends</span>
                  <span className="text-white text-xs">{mockRaffle.saleEnds.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <span className="font-mono text-[#A04545] font-bold text-xs">
                  {formatTime(timeLeft.days)}D : {formatTime(timeLeft.hours)}H : {formatTime(timeLeft.minutes)}M : {formatTime(timeLeft.seconds)}S
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden p-[1px]">
                <div
                  className="h-full bg-gradient-to-r from-[#A04545] to-[#D65D5D] rounded-full shadow-[0_0_10px_rgba(160,69,69,0.5)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-[10px]">Ticket Sold / Total</span>
                  <span className="font-mono text-white text-xs">
                    <span className="text-[#A04545] font-bold">🎫 {mockRaffle.ticketsSold}</span>/{mockRaffle.totalTickets} ({Math.round(progress)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-[10px]">Funding / Total</span>
                  <span className="font-mono text-white text-xs">
                    <span className="text-[#A04545] font-bold">⊛ {mockRaffle.fundingCurrent.toFixed(2)}</span>/{mockRaffle.fundingTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Asset Value */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-gray-400 text-[10px]">Asset Value</p>
                <p className="font-mono text-base font-bold text-white">{mockRaffle.assetValue}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] flex items-center gap-1">
                  <span className="text-[#A04545]">🎫</span> Item Price
                </p>
                <p className="font-mono text-base font-bold text-white">{mockRaffle.itemPrice}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">Your Ticket</p>
                <p className="font-mono text-base font-bold flex items-center gap-1 text-white">
                  <span className="text-[#A04545]">🎫</span> {mockRaffle.userTickets}
                </p>
              </div>
            </div>

            {/* Buy Section */}
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Buy Amount</p>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 p-2.5 bg-[#1A1A1E] rounded-lg border border-white/10">
                  <span className="text-lg">🎫</span>
                  <span className="font-mono text-base text-white">{ticketAmount}</span>
                  <span className="text-gray-400 text-xs">TICKET</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      onClick={() => setTicketAmount(Math.max(1, ticketAmount - 1))}
                      className="w-7 h-7 bg-[#A04545] rounded flex items-center justify-center hover:bg-[#8a3b3b] transition-all"
                    >
                      <Minus className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button
                      onClick={() => setTicketAmount(ticketAmount + 1)}
                      className="w-7 h-7 bg-[#A04545] rounded flex items-center justify-center hover:bg-[#8a3b3b] transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-[#A04545] hover:bg-[#8a3b3b] text-white font-bold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-[#A04545]/20 text-sm">
                  <span>BUY NOW</span>
                  <span className="font-mono">{totalPrice}</span>
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-[9px] font-bold">$</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10">
              <div className="flex gap-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === tab.id ? "text-white" : "text-gray-400 hover:text-white"
                      }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A04545]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <h3 className="font-medium text-white">Details</h3>
                  <div className="space-y-3">
                    {Object.entries(mockRaffle.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className={`font-mono ${key === 'contractAddress' ? 'text-[#A04545]' : 'text-white'}`}>
                          {value} {key === 'contractAddress' && '↗'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "activity" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 text-xs text-gray-400 uppercase tracking-wider pb-2">
                    <span>User</span>
                    <span className="text-right">Ticket Qty</span>
                    <span className="text-right">Time</span>
                  </div>
                  {mockRaffle.activity.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-3 text-sm py-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#A04545] flex items-center justify-center text-xs font-bold text-white">R</div>
                        <span className="font-mono text-white">{item.user}</span>
                      </div>
                      <span className="text-right font-mono text-[#A04545] font-bold">🎫 {item.tickets} Ticket{item.tickets > 1 ? 's' : ''}</span>
                      <span className="text-right text-gray-400">{item.time}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "leaderboard" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 text-xs text-gray-400 uppercase tracking-wider pb-2">
                    <span>Rank</span>
                    <span>User</span>
                    <span className="text-right">Ticket Qty</span>
                  </div>
                  {mockRaffle.leaderboard.map((item) => (
                    <div key={item.rank} className="grid grid-cols-3 text-sm py-2 border-t border-white/10">
                      <span className="font-mono text-white">#{item.rank}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#A04545] flex items-center justify-center text-xs font-bold text-white">R</div>
                        <span className="font-mono text-white">{item.user}</span>
                      </div>
                      <span className="text-right font-mono text-[#A04545] font-bold">🎫 {item.tickets} Ticket{item.tickets > 1 ? 's' : ''}</span>
                    </div>
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

export default RaffleDetail;
