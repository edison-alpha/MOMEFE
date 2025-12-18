import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Filter, Search, X, Trophy, Ticket, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

type ActivityType = "LISTED" | "JOIN" | "WINNER";

interface ActivityFilter {
  label: string;
  value: ActivityType;
  checked: boolean;
}

const mockActivity = [
  { action: "JOIN" as ActivityType, icon: "◆", item: { id: "843095", name: "manayev (manayev)", type: "Raffle Entry" }, user: "0x1E51 ... 93CB", tickets: 2, time: "4 hrs ago", avatar: "🔵" },
  { action: "JOIN" as ActivityType, icon: "◆", item: { id: "843095", name: "manayev (manayev)", type: "Raffle Entry" }, user: "0x1E51 ... 93CB", tickets: 4, time: "4 hrs ago", avatar: "🔵" },
  { action: "JOIN" as ActivityType, icon: "◆", item: { id: "843095", name: "manayev (manayev)", type: "Raffle Entry" }, user: "0xF635 ... 7A7a", tickets: 7, time: "5 hrs ago", avatar: "🔵" },
  { action: "JOIN" as ActivityType, icon: "◆", item: { id: "4904750", name: "shinzwrld999 (shinzwrld999)", type: "Raffle Entry" }, user: "0x0Fe7 ... d6dD", tickets: 1, time: "6 hrs ago", avatar: "🟣" },
  { action: "JOIN" as ActivityType, icon: "◆", item: { id: "525", name: "Zora (ZORA)", type: "Raffle Entry" }, user: "0x7553 ... 83eA", tickets: 2, time: "6 hrs ago", avatar: "⚪" },
  { action: "LISTED" as ActivityType, icon: "📋", item: { id: "843095", name: "manayev (manayev)", type: "New Listing" }, user: "0x1E51 ... 93CB", tickets: 0, time: "7 hrs ago", avatar: "🔵" },
  { action: "JOIN" as ActivityType, icon: "◆", item: { id: "843095", name: "manayev (manayev)", type: "Raffle Entry" }, user: "0x67Ab ... f72d", tickets: 2, time: "7 hrs ago", avatar: "🔵" },
  { action: "WINNER" as ActivityType, icon: "🏆", item: { id: "33.1", name: "Virtual Protocol (VIRTUAL)", type: "Winner Announced" }, user: "0xAF58 ... 98E7", tickets: 1, time: "7 hrs ago", avatar: "🟢" },
  { action: "JOIN" as ActivityType, icon: "◆", item: { id: "8043581", name: "gainchainn (gainchainn)", type: "Raffle Entry" }, user: "0x35c6 ... c656", tickets: 1, time: "8 hrs ago", avatar: "🟠" },
  { action: "LISTED" as ActivityType, icon: "📋", item: { id: "525", name: "Zora (ZORA)", type: "New Listing" }, user: "0x7553 ... 83eA", tickets: 0, time: "8 hrs ago", avatar: "⚪" },
  { action: "JOIN" as ActivityType, icon: "◆", item: { id: "843095", name: "manayev (manayev)", type: "Raffle Entry" }, user: "0x1E51 ... 93CB", tickets: 1, time: "9 hrs ago", avatar: "🔵" },
  { action: "WINNER" as ActivityType, icon: "🏆", item: { id: "4904750", name: "shinzwrld999 (shinzwrld999)", type: "Winner Announced" }, user: "0x0Fe7 ... d6dD", tickets: 5, time: "9 hrs ago", avatar: "🟣" },
  { action: "JOIN" as ActivityType, icon: "◆", item: { id: "843095", name: "manayev (manayev)", type: "Raffle Entry" }, user: "0x1E51 ... 93CB", tickets: 3, time: "9 hrs ago", avatar: "🔵" },
];

const Activity = () => {
  const [filters, setFilters] = useState<ActivityFilter[]>([
    { label: "Listed Item", value: "LISTED", checked: false },
    { label: "Joined Raffle", value: "JOIN", checked: false },
    { label: "Item Winner", value: "WINNER", checked: false },
  ]);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFilter = (value: ActivityType) => {
    setFilters(prev => 
      prev.map(f => f.value === value ? { ...f, checked: !f.checked } : f)
    );
  };

  const clearAllFilters = () => {
    setFilters(prev => prev.map(f => ({ ...f, checked: false })));
    setSearchQuery("");
  };

  const activeFiltersCount = filters.filter(f => f.checked).length;

  const filteredActivity = useMemo(() => {
    let result = [...mockActivity];

    // Apply type filters
    const activeFilterValues = filters.filter(f => f.checked).map(f => f.value);
    if (activeFilterValues.length > 0) {
      result = result.filter(item => activeFilterValues.includes(item.action));
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.item.name.toLowerCase().includes(query) ||
        item.item.id.includes(query) ||
        item.user.toLowerCase().includes(query)
      );
    }

    return result;
  }, [filters, searchQuery]);

  const getActionIcon = (action: ActivityType) => {
    switch (action) {
      case "WINNER": return <Trophy className="w-4 h-4" />;
      case "JOIN": return <Ticket className="w-4 h-4" />;
      case "LISTED": return <ListPlus className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: ActivityType) => {
    switch (action) {
      case "WINNER": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "JOIN": return "bg-primary/10 text-primary border-primary/20";
      case "LISTED": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const FilterSection = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Filter Activity</h3>
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-xs h-7 px-2"
          >
            Clear All
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {filters.map((filter) => (
          <label 
            key={filter.value} 
            className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-primary/5 transition-colors"
            onClick={() => toggleFilter(filter.value)}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              filter.checked 
                ? 'bg-primary border-primary scale-110' 
                : 'border-muted-foreground/50 group-hover:border-primary/50'
            }`}>
              {filter.checked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm font-medium transition-colors ${
              filter.checked ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
            }`}>
              {filter.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <Layout showTicker>
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="w-72 flex-shrink-0 hidden lg:block sticky top-24 self-start">
            <div className="card-surface p-5 space-y-6 border border-border/50">
              <FilterSection />
              
              {/* Stats Summary */}
              <div className="pt-4 border-t border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Activity Stats
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Activities</span>
                    <span className="font-bold text-foreground">{mockActivity.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Filtered Results</span>
                    <span className="font-bold text-primary">{filteredActivity.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl font-bold font-mono tracking-wider text-foreground mb-1">
                    PLATFORM ACTIVITY
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Real-time updates on all platform activities
                  </p>
                </div>

                {/* Mobile Filter Toggle */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden relative">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {activeFiltersCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] bg-card border-border">
                    <div className="mt-6">
                      <FilterSection isMobile />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by item name, ID, or user address..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-card border-border/50 focus:border-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Active Filters Display */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground font-medium">Active filters:</span>
                  {filters.filter(f => f.checked).map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => toggleFilter(filter.value)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                    >
                      {filter.label}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Table */}
            <div className="card-surface overflow-hidden border border-border/50 rounded-xl">
              {/* Desktop View */}
              <div className="hidden md:block">
                <div className="overflow-auto max-h-[calc(100vh-280px)] custom-scrollbar">
                  {/* Table Header - Sticky */}
                  <div className="sticky top-0 z-10 grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-card/95 backdrop-blur-sm">
                    <div className="col-span-2">Action</div>
                    <div className="col-span-4">Item Details</div>
                    <div className="col-span-3">User</div>
                    <div className="col-span-2 text-right">Tickets</div>
                    <div className="col-span-1 text-right">Time</div>
                  </div>

                  {/* Table Body */}
                  {filteredActivity.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {filteredActivity.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-primary/5 transition-all duration-200 group cursor-pointer"
                        >
                          {/* Action */}
                          <div className="col-span-2 flex items-center gap-3">
                            <div className={`p-2 rounded-lg border ${getActionColor(item.action)} transition-all group-hover:scale-110`}>
                              {getActionIcon(item.action)}
                            </div>
                            <span className={`font-mono text-xs font-bold ${
                              item.action === "WINNER" ? "text-red-500" : 
                              item.action === "LISTED" ? "text-blue-500" : 
                              "text-primary"
                            }`}>
                              {item.action}
                            </span>
                          </div>

                          {/* Item */}
                          <div className="col-span-4 flex items-center gap-3 min-w-0">
                            <div className="text-2xl bg-secondary/50 rounded-lg p-2 flex-shrink-0 group-hover:scale-110 transition-transform">
                              {item.avatar}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded font-semibold">
                                  #{item.item.id}
                                </span>
                                <span className="text-sm font-semibold text-foreground truncate">
                                  {item.item.name}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground font-medium">
                                {item.item.type}
                              </p>
                            </div>
                          </div>

                          {/* User */}
                          <div className="col-span-3 flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary via-purple-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white shadow-md flex-shrink-0">
                              {item.user.slice(2, 4).toUpperCase()}
                            </div>
                            <span className="font-mono text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                              {item.user}
                            </span>
                          </div>

                          {/* Tickets */}
                          <div className="col-span-2 text-right">
                            {item.action !== "LISTED" ? (
                              <>
                                <span className="font-mono text-lg text-primary font-bold">{item.tickets}</span>
                                <span className="text-xs text-muted-foreground ml-1.5">
                                  {item.tickets === 1 ? 'Ticket' : 'Tickets'}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">N/A</span>
                            )}
                          </div>

                          {/* Time */}
                          <div className="col-span-1 text-right">
                            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                              {item.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Activities Found</h3>
                      <p className="text-sm text-muted-foreground text-center max-w-md">
                        {searchQuery || activeFiltersCount > 0 
                          ? "Try adjusting your filters or search query to see more results."
                          : "There are no activities to display at the moment."}
                      </p>
                      {(searchQuery || activeFiltersCount > 0) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={clearAllFilters}
                          className="mt-4"
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile View */}
              <div className="md:hidden">
                <div className="divide-y divide-border/50 max-h-[calc(100vh-280px)] overflow-auto">
                  {filteredActivity.length > 0 ? (
                    filteredActivity.map((item, idx) => (
                      <div key={idx} className="p-4 hover:bg-primary/5 transition-colors">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg border ${getActionColor(item.action)} flex-shrink-0`}>
                            {getActionIcon(item.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-mono text-xs font-bold ${
                                item.action === "WINNER" ? "text-red-500" : 
                                item.action === "LISTED" ? "text-blue-500" : 
                                "text-primary"
                              }`}>
                                {item.action}
                              </span>
                              <span className="text-xs text-muted-foreground">{item.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{item.avatar}</span>
                              <div className="min-w-0">
                                <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  #{item.item.id}
                                </span>
                                <p className="text-sm font-medium text-foreground mt-0.5 truncate">
                                  {item.item.name}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs pl-11">
                          <span className="font-mono text-muted-foreground truncate">{item.user}</span>
                          {item.action !== "LISTED" && (
                            <span className="font-mono text-primary font-bold ml-2">
                              {item.tickets} {item.tickets === 1 ? 'Ticket' : 'Tickets'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                        <Search className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground mb-1">No Activities Found</h3>
                      <p className="text-xs text-muted-foreground text-center">
                        {searchQuery || activeFiltersCount > 0 
                          ? "Try adjusting your filters"
                          : "No activities yet"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Activity;
