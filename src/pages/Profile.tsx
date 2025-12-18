import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { ChevronDown, Search, Copy } from "lucide-react";
import CreateListingModal from "@/components/CreateListingModal";
import { usePrivy } from '@privy-io/react-auth';
import { getAvatarFromAddress } from "@/lib/avatarUtils";

const tabs = ["NFT", "Token", "Listings", "Tickets", "Watchlist", "Activity", "Telegram"];

const collections = [
  { name: "Citizens of Zo Wor...", count: 1, avatar: "🟠" },
  { name: "Cubes 189", count: 1, avatar: "🔵" },
  { name: "Developer DAO", count: 1, avatar: "🟢" },
  { name: "jupnft-received.co...", count: 1, avatar: "⚪" },
];

const mockNFTs = [
  { id: "12892", name: "vpass badge # 12888", image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300", listed: false },
  { id: "186", name: "the TUMBLR sketches . untitled 013", image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=300", listed: false },
  { id: "7", name: "SESSION 2 AIRDROP - TUNAD", image: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=300", listed: false },
  { id: "104438", name: "Citizens of Zo World", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300", listed: false },
  { id: "0", name: "3D Cube 189", image: "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=300", listed: false },
  { id: "1", name: "20248914", image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300", listed: false },
];

const mockTokens = [
  { name: "Ether", symbol: "ETH", balance: "0.0000", icon: "💎" },
];

const Profile = () => {
  const [activeTab, setActiveTab] = useState("NFT");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { authenticated, user } = usePrivy();
  const [movementAddress, setMovementAddress] = useState<string>('');

  // Get Movement wallet address
  useEffect(() => {
    if (!authenticated || !user) return;

    const moveWallet = user.linkedAccounts?.find(
      (account: any) => account.chainType === 'aptos'
    ) as any;

    if (moveWallet) {
      setMovementAddress(moveWallet.address as string);
    }
  }, [authenticated, user]);

  const walletAddress = movementAddress || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto">
        {/* Profile Banner */}
        <div className="relative h-48 md:h-64 overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        </div>

        <div className="px-4 -mt-8 relative z-10">
          {/* Profile Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 flex items-center justify-center">
                <span className="text-5xl">{getAvatarFromAddress(walletAddress)}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-mono">{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '0xf39F ... 2266'}</h1>
                  <button className="text-muted-foreground hover:text-foreground">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded font-mono">MOVEMENT TESTNET</span>
                  <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded font-mono">DEC 2025</span>
                </div>
              </div>
            </div>
            <div className="text-right text-sm bg-background/80 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-muted-foreground">Listed Items</p>
                  <p className="font-mono text-lg">0</p>
                </div>
                <div>
                  <p className="text-muted-foreground">NFTs</p>
                  <p className="font-mono text-lg">10</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Token</p>
                  <p className="font-mono text-lg">1</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6">

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          {activeTab === "NFT" && (
            <aside className="w-64 flex-shrink-0 space-y-6 hidden lg:block">
              {/* Source */}
              <div className="card-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Source</h3>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">All Sources</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground">OpenSea Only</span>
                  </label>
                </div>
              </div>

              {/* Collections */}
              <div className="card-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Collections</h3>
                  <button className="px-2 py-1 bg-primary text-xs rounded font-mono">RESET</button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search on Raflux"
                    className="w-full h-9 pl-10 pr-4 rounded-lg input-dark text-sm"
                  />
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider flex justify-between px-1">
                  <span>Collection</span>
                  <span>Held</span>
                </div>
                <div className="space-y-2">
                  {collections.map((col) => (
                    <label key={col.name} className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-4 h-4 rounded border border-muted-foreground" />
                      <span className="text-xl">{col.avatar}</span>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground flex-1 truncate">
                        {col.name}
                      </span>
                      <span className="text-sm text-muted-foreground">{col.count}</span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "NFT" && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search for Items"
                      className="w-full h-9 pl-10 pr-4 rounded-lg input-dark text-sm"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-sm">
                    <span>Recently Received</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {mockNFTs.map((nft) => (
                    <div key={nft.id} className="card-surface group relative overflow-hidden">
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="font-mono text-sm text-primary">#{nft.id}</p>
                        <div className="relative overflow-hidden">
                          <p className="text-sm truncate">{nft.name}</p>
                          <p className="text-xs text-muted-foreground">Not Listed</p>
                          
                          {/* Button List Item yang muncul dari bawah menutupi text nama dan status */}
                          <div className="absolute inset-x-0 bottom-0 h-full translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-[#A04545] rounded-lg flex items-center justify-center">
                            <button 
                              onClick={() => setShowCreateModal(true)}
                              className="w-full h-full hover:bg-[#8a3b3b] text-white font-semibold text-sm transition-colors rounded-lg"
                            >
                              List Item
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "Token" && (
              <>
                <div className="relative max-w-md mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search for Tokens"
                    className="w-full h-9 pl-10 pr-4 rounded-lg input-dark text-sm"
                  />
                </div>

                <div className="card-surface overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                    <div className="col-span-6">Token</div>
                    <div className="col-span-3 text-right">Balance</div>
                    <div className="col-span-3 text-right">Action</div>
                  </div>
                  {mockTokens.map((token) => (
                    <div key={token.symbol} className="grid grid-cols-12 gap-4 px-4 py-4 items-center border-b border-border last:border-0">
                      <div className="col-span-6 flex items-center gap-3">
                        <span className="text-2xl">{token.icon}</span>
                        <div>
                          <p className="font-medium">{token.name}</p>
                          <p className="text-xs text-muted-foreground">{token.symbol}</p>
                        </div>
                      </div>
                      <div className="col-span-3 text-right font-mono">{token.balance}</div>
                      <div className="col-span-3 text-right">
                        <button 
                          onClick={() => setShowCreateModal(true)}
                          className="px-4 py-1.5 btn-orange rounded text-xs"
                        >
                          LIST ITEM
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        </div>
      </div>

      <CreateListingModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </Layout>
  );
};

export default Profile;
