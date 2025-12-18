import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface NFTItem {
  id: string;
  name: string;
  image: string;
  count: number;
}

interface TokenItem {
  id: string;
  name: string;
  symbol: string;
  image: string;
  count: number;
}

type FilterType = "All" | "NFT" | "Token" | "Wallet";

const SearchDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("All");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock data - replace with real data
  const topNFTs: NFTItem[] = [
    { id: "1", name: "Espresso Martinii #12", image: "https://via.placeholder.com/40", count: 10 },
    { id: "2", name: "Warplet #854434 #854434", image: "https://via.placeholder.com/40", count: 10 },
    { id: "3", name: "Warplet #276528 #276528", image: "https://via.placeholder.com/40", count: 12 },
    { id: "4", name: "Rodeo post #225 #225", image: "https://via.placeholder.com/40", count: 100 },
    { id: "5", name: "T(RE:)AT #1026106", image: "https://via.placeholder.com/40", count: 100 },
  ];

  const topTokens: TokenItem[] = [
    { id: "1", name: "0.5 ETH", symbol: "ETH", image: "https://cryptologos.cc/logos/ethereum-eth-logo.png", count: 1600 },
    { id: "2", name: "0.05 Coinbase Wrapped BTC (cbBTC)", symbol: "cbBTC", image: "https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png", count: 5500 },
    { id: "3", name: "0.1 ETH", symbol: "ETH", image: "https://cryptologos.cc/logos/ethereum-eth-logo.png", count: 350 },
    { id: "4", name: "1800 jesse (Jesse)", symbol: "Jesse", image: "https://via.placeholder.com/40", count: 22 },
    { id: "5", name: "0.01 ETH", symbol: "ETH", image: "https://cryptologos.cc/logos/ethereum-eth-logo.png", count: 50 },
    { id: "6", name: "0.005 ETH", symbol: "ETH", image: "https://cryptologos.cc/logos/ethereum-eth-logo.png", count: 20 },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNFTs = topNFTs.filter(nft =>
    nft.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTokens = topTokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showNFTs = selectedFilter === "All" || selectedFilter === "NFT";
  const showTokens = selectedFilter === "All" || selectedFilter === "Token";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search NFTs, Tokens, Wallets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-[#151515] border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-white/20 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-[600px] overflow-y-auto">
          {/* Filter Tabs */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold mr-2">Type</span>
              {(["All", "NFT", "Token", "Wallet"] as FilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedFilter === filter
                      ? "bg-[#A04545] text-white"
                      : "bg-[#151515] text-gray-400 hover:text-white hover:bg-[#202020]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            {/* TOP NFTs Section */}
            {showNFTs && filteredNFTs.length > 0 && (
              <div className="mb-6">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
                  TOP NFTS
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {filteredNFTs.map((nft) => (
                    <button
                      key={nft.id}
                      className="flex items-center gap-3 p-3 bg-[#151515] hover:bg-[#202020] rounded-lg transition-colors border border-white/5 hover:border-white/10"
                    >
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-white text-sm font-semibold truncate">
                          {nft.name}
                        </p>
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gray-500" />
                          {nft.count}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TOP TOKEN Section */}
            {showTokens && filteredTokens.length > 0 && (
              <div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
                  TOP TOKEN
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.id}
                      className="flex items-center gap-3 p-3 bg-[#151515] hover:bg-[#202020] rounded-lg transition-colors border border-white/5 hover:border-white/10"
                    >
                      <img
                        src={token.image}
                        alt={token.symbol}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-white text-sm font-semibold truncate">
                          {token.name}
                        </p>
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gray-500" />
                          {token.count}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {((showNFTs && filteredNFTs.length === 0) && (showTokens && filteredTokens.length === 0)) && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No results found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
