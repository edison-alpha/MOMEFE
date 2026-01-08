import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Loader2, Ticket, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { useAllRaffles } from "@/hooks/useAllRaffles";
import { RAFFLE_STATUS } from "@/lib/raffle-contract";

type FilterType = "All" | "Active" | "Ended" | "Address";

const SearchDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("All");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: raffles, isLoading } = useAllRaffles();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter raffles based on search query and filter type
  const filteredRaffles = useMemo(() => {
    if (!raffles) return [];
    
    let filtered = raffles;

    // Apply filter type
    if (selectedFilter === "Active") {
      filtered = filtered.filter(r => r.status === RAFFLE_STATUS.LISTED);
    } else if (selectedFilter === "Ended") {
      filtered = filtered.filter(r => r.status >= RAFFLE_STATUS.RAFFLING);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.creator.toLowerCase().includes(query) ||
        r.id.toString() === query
      );
    }

    return filtered.slice(0, 10); // Limit to 10 results
  }, [raffles, searchQuery, selectedFilter]);

  // Search by creator address
  const creatorResults = useMemo(() => {
    if (!raffles || !searchQuery.trim() || selectedFilter !== "Address") return [];
    
    const query = searchQuery.toLowerCase();
    // Group raffles by creator that matches query
    const creators = new Map<string, { address: string; count: number; totalPrize: number }>();
    
    raffles.forEach(r => {
      if (r.creator.toLowerCase().includes(query)) {
        const existing = creators.get(r.creator) || { address: r.creator, count: 0, totalPrize: 0 };
        existing.count++;
        existing.totalPrize += r.prizePool;
        creators.set(r.creator, existing);
      }
    });

    return Array.from(creators.values()).slice(0, 5);
  }, [raffles, searchQuery, selectedFilter]);

  const handleRaffleClick = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  const getStatusBadge = (status: number) => {
    if (status === RAFFLE_STATUS.LISTED) {
      return <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded">Active</span>;
    } else if (status === RAFFLE_STATUS.RAFFLING) {
      return <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] rounded">Drawing</span>;
    } else if (status === RAFFLE_STATUS.CANCELLED) {
      return <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded">Cancelled</span>;
    } else {
      return <span className="px-1.5 py-0.5 bg-gray-500/20 text-gray-400 text-[10px] rounded">Ended</span>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search raffles... (Ctrl+K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-[#151515] border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
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
        <div className="absolute top-full mt-2 w-full bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-[500px] overflow-y-auto">
          {/* Filter Tabs */}
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white text-xs font-semibold mr-1">Filter:</span>
              {(["All", "Active", "Ended", "Address"] as FilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedFilter === filter
                      ? "bg-primary text-white"
                      : "bg-[#151515] text-gray-400 hover:text-white hover:bg-[#202020]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : selectedFilter === "Address" && creatorResults.length > 0 ? (
              /* Creator Address Results */
              <div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Creator Addresses
                </h3>
                <div className="space-y-2">
                  {creatorResults.map((creator) => (
                    <Link
                      key={creator.address}
                      to={`/?creator=${creator.address}`}
                      onClick={handleRaffleClick}
                      className="flex items-center gap-3 p-3 bg-[#151515] hover:bg-[#202020] rounded-lg transition-colors border border-white/5 hover:border-primary/30"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                        👤
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-mono truncate">
                          {creator.address.slice(0, 8)}...{creator.address.slice(-6)}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {creator.count} raffles • {creator.totalPrize.toFixed(2)} MOVE total
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : filteredRaffles.length > 0 ? (
              /* Raffle Results */
              <div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                  {searchQuery ? "Search Results" : "Recent Raffles"} ({filteredRaffles.length})
                </h3>
                <div className="space-y-2">
                  {filteredRaffles.map((raffle) => (
                    <Link
                      key={raffle.id}
                      to={`/raffle/${raffle.id}`}
                      onClick={handleRaffleClick}
                      className="flex items-center gap-3 p-3 bg-[#151515] hover:bg-[#202020] rounded-lg transition-colors border border-white/5 hover:border-primary/30"
                    >
                      <img
                        src={raffle.imageUrl}
                        alt={raffle.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-white text-sm font-semibold truncate">
                            {raffle.title}
                          </p>
                          {getStatusBadge(raffle.status)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Ticket className="w-3 h-3" />
                            {raffle.ticketsSold}/{raffle.totalTickets}
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-primary" />
                            {raffle.prizePool.toFixed(2)} MOVE
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">#{raffle.id}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              /* No Results */
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  {searchQuery ? "No raffles found" : "Start typing to search"}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Search by title, description, raffle ID, or wallet address
                </p>
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="p-3 border-t border-white/5 bg-[#0A0A0A]">
            <p className="text-gray-600 text-xs text-center">
              Press <kbd className="px-1.5 py-0.5 bg-[#151515] rounded text-gray-400">Esc</kbd> to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
