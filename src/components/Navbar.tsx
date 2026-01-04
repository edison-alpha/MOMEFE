import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { usePrivy } from '@privy-io/react-auth';
import { useCreateWallet } from '@privy-io/react-auth/extended-chains';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { User, LogOut, ArrowLeftRight, Send, Loader2, ChevronDown, Menu, X, Search } from "lucide-react";
import CreateListingModal from "./CreateListingModal";
import SearchDropdown from "./SearchDropdown";
import NotificationDropdown from "./NotificationDropdown";
import mwLogo from "@/assets/mw.png";
import { useMovementBalance, triggerBalanceRefresh } from "@/hooks/useMovementBalance";
import { useTokenBalances } from "@/hooks/useMovementIndexer";
import { getAvatarFromAddress } from "@/lib/avatarUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { submitTransaction } from '@/lib/transactions';
import { getExplorerUrl } from '@/lib/aptos';
import { SUPPORTED_TOKENS, TokenInfo } from '@/lib/razor-swap';
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const location = useLocation();
  const { login, authenticated, user, logout } = usePrivy();
  const { createWallet } = useCreateWallet();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [movementAddress, setMovementAddress] = useState<string>('');
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(SUPPORTED_TOKENS[0]); // Default to MOVE
  const [isWalletReady, setIsWalletReady] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { signRawHash } = useSignRawHash();

  // Get native MOVE balance - must be called before functions that use it
  const { balance, isLoading: balanceLoading } = useMovementBalance(movementAddress);
  const walletAddress = movementAddress;

  // Get all token balances from indexer (same as Profile > Tokens)
  const { balances: indexerBalances, loading: balancesLoading, refetch: refetchBalances } = useTokenBalances(movementAddress || null);

  // Track wallet readiness (signRawHash availability)
  useEffect(() => {
    if (authenticated && signRawHash && movementAddress) {
      // Add a small delay to ensure Privy wallet proxy is fully initialized
      const timer = setTimeout(() => {
        setIsWalletReady(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsWalletReady(false);
    }
  }, [authenticated, signRawHash, movementAddress]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Helper to format token amount based on decimals (using BigInt for precision)
  const formatTokenAmount = (amount: string, decimals: number = 8): string => {
    try {
      const amountBigInt = BigInt(amount);
      const divisor = BigInt(Math.pow(10, decimals));
      const wholePart = amountBigInt / divisor;
      const remainder = amountBigInt % divisor;
      const decimalPart = Number(remainder) / Math.pow(10, decimals);
      const value = Number(wholePart) + decimalPart;

      if (value === 0) return '0';
      if (value < 0.0001) return '<0.0001';

      // Format with appropriate precision, removing trailing zeros
      let formatted: string;
      if (value < 1) {
        // For small values, show up to 8 decimals but remove trailing zeros
        formatted = value.toFixed(8);
      } else if (value < 1000) {
        // For medium values, show up to 6 decimals but remove trailing zeros
        formatted = value.toFixed(6);
      } else {
        // For large values, show up to 4 decimals but remove trailing zeros
        formatted = value.toFixed(4);
      }

      // Remove trailing zeros and unnecessary decimal point
      return formatted.replace(/\.?0+$/, '');
    } catch {
      return '0';
    }
  };

  // Get balance for a specific token from indexer data
  const getTokenBalance = (token: TokenInfo): string => {
    if (token.address === 'native') {
      // For native MOVE, use the useMovementBalance hook
      return balance;
    }

    // Find the token in indexer balances by matching asset_type
    const tokenBalance = indexerBalances.find(b =>
      b.asset_type === token.address ||
      b.asset_type.toLowerCase() === token.address.toLowerCase()
    );

    if (tokenBalance) {
      return formatTokenAmount(tokenBalance.amount, token.decimals);
    }

    return '0';
  };

  // Get raw balance for MAX button (without formatting)
  const getRawTokenBalance = (token: TokenInfo): string => {
    if (token.address === 'native') {
      return balance;
    }

    const tokenBalance = indexerBalances.find(b =>
      b.asset_type === token.address ||
      b.asset_type.toLowerCase() === token.address.toLowerCase()
    );

    if (tokenBalance) {
      try {
        const amountBigInt = BigInt(tokenBalance.amount);
        const divisor = BigInt(Math.pow(10, token.decimals));
        const wholePart = amountBigInt / divisor;
        const remainder = amountBigInt % divisor;
        const decimalPart = Number(remainder) / Math.pow(10, token.decimals);
        const value = Number(wholePart) + decimalPart;
        return value.toString();
      } catch {
        return '0';
      }
    }

    return '0';
  };

  const handleOpenSwap = () => {
    // Trigger custom event to open swap in footer
    window.dispatchEvent(new CustomEvent('openSwapBar'));
  };

  const handleSendToken = async () => {
    if (!sendRecipient || !sendAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!authenticated || !user) {
      toast.error('Not authenticated', {
        description: 'Please connect your wallet first',
      });
      return;
    }

    // Check if signRawHash is ready (Privy wallet proxy needs time to initialize)
    if (!signRawHash) {
      toast.error('Wallet not ready', {
        description: 'Please wait a moment and try again. The wallet is still initializing.',
      });
      return;
    }

    setIsSending(true);

    try {
      const moveWallet = user.linkedAccounts?.find(
        (account: any) => account.chainType === 'aptos'
      ) as any;

      if (!moveWallet) {
        throw new Error('No Movement wallet found. Please reconnect your wallet.');
      }

      const walletAddress = moveWallet.address;
      const publicKey = moveWallet.publicKey;

      if (!publicKey) {
        throw new Error('Wallet public key not available. Please reconnect your wallet.');
      }

      // Convert amount to smallest unit based on token decimals
      const amountInSmallestUnit = Math.round(parseFloat(sendAmount) * Math.pow(10, selectedToken.decimals));

      let txHash: string;

      if (selectedToken.address === 'native') {
        // Use aptos_account::transfer for native MOVE transfer
        txHash = await submitTransaction(
          '0x1',
          'aptos_account::transfer',
          [sendRecipient, amountInSmallestUnit],
          walletAddress,
          publicKey,
          signRawHash
        );
      } else {
        // Use primary_fungible_store::transfer for fungible asset transfer
        // Function signature: transfer<T: key>(sender: &signer, metadata: Object<T>, recipient: address, amount: u64)
        // Type argument T is the Metadata type: 0x1::fungible_asset::Metadata
        txHash = await submitTransaction(
          '0x1',
          'primary_fungible_store::transfer',
          [
            selectedToken.address,  // metadata: Object<Metadata> address
            sendRecipient,          // recipient address
            amountInSmallestUnit    // amount in smallest unit
          ],
          walletAddress,
          publicKey,
          signRawHash,
          ['0x1::fungible_asset::Metadata']  // Type argument: Metadata struct type
        );
      }

      toast.success('Transaction successful!', {
        description: `Sent ${sendAmount} ${selectedToken.symbol} to ${sendRecipient.slice(0, 6)}...${sendRecipient.slice(-4)}`,
        action: {
          label: 'View',
          onClick: () => window.open(getExplorerUrl(txHash), '_blank'),
        },
      });

      // Reset form
      setSendRecipient('');
      setSendAmount('');

      // Trigger global balance refresh and refresh indexer balances
      setTimeout(() => {
        triggerBalanceRefresh();
        refetchBalances();
      }, 2000); // Wait 2 seconds for indexer to update
    } catch (error: any) {
      console.error('Send error:', error);

      // Handle specific Privy wallet errors
      const errorMessage = error.message || '';
      if (errorMessage.includes('proxy not initialized') || errorMessage.includes('Wallet proxy')) {
        toast.error('Wallet not ready', {
          description: 'Please wait a few seconds for the wallet to initialize and try again.',
        });
      } else {
        toast.error('Transaction failed', {
          description: errorMessage || 'Please try again',
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  // Handle Privy wallet setup
  useEffect(() => {
    const setupMovementWallet = async () => {
      if (!authenticated || !user || isCreatingWallet) return;

      // Check if user already has an Aptos/Movement wallet
      const moveWallet = user.linkedAccounts?.find(
        (account: any) => account.chainType === 'aptos'
      ) as any;

      if (moveWallet) {
        const address = moveWallet.address as string;
        setMovementAddress(address);
      } else {
        // Create a new Aptos/Movement wallet
        setIsCreatingWallet(true);
        try {
          const wallet = await createWallet({ chainType: 'aptos' });
          const address = (wallet as any).address;
          setMovementAddress(address);
        } catch (error) {
          console.error('Error creating Movement wallet:', error);
        } finally {
          setIsCreatingWallet(false);
        }
      }
    };

    setupMovementWallet();
  }, [authenticated, user, createWallet, isCreatingWallet]);

  const navLinks = [
    { name: "Explore", path: "/app" },
    { name: "Activity", path: "/activity" },
    { name: "Faucet", path: "https://faucet.movementnetwork.xyz/", external: true },
    { name: "Create Draw", path: "/profile" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#0f0f13] border-b border-white/5 mobile-menu-container">
        <div className="max-w-[1920px] mx-auto px-3 md:px-6 h-[56px] md:h-[80px] flex items-center justify-between gap-2 md:gap-8">
          
          {/* Mobile Layout: Hamburger -> Logo -> Search -> Address/Avatar */}
          {/* Mobile Left: Hamburger + Logo */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="flex-shrink-0">
              <img src={mwLogo} alt="Logo" className="w-10 h-10 object-contain" />
            </Link>
          </div>

          {/* Mobile Center: Search Icon */}
          <div className="flex lg:hidden items-center flex-1 justify-center">
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Right: Address + Avatar Dropdown */}
          <div className="flex lg:hidden items-center">
            {authenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 bg-[#1A1A1E] border border-white/10 text-white px-1.5 py-1 rounded-full hover:bg-[#2A2A2E] transition-colors">
                    <span className="font-mono text-[9px] font-medium">
                      {walletAddress ? `${walletAddress.slice(0, 4)}..${walletAddress.slice(-3)}` : ''}
                    </span>
                    <span className="text-sm">{getAvatarFromAddress(walletAddress)}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-[#1A1A1E] border-white/10 text-white p-2">
                  {/* Balance - Compact */}
                  <div className="mb-2 pb-2 border-b border-white/10">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] text-gray-400">Balance</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs font-bold text-white">{balance}</span>
                        <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png" alt="MOVE" className="w-3.5 h-3.5 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <DropdownMenuItem className="cursor-pointer hover:bg-[#2A2A2E] focus:bg-[#2A2A2E] focus:text-white py-1.5 text-xs" onClick={() => window.location.href = '/profile'}>
                    <User className="mr-2 h-3 w-3" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-[#2A2A2E] focus:bg-[#2A2A2E] focus:text-white py-1.5 text-xs" onClick={handleOpenSwap}>
                    <Send className="mr-2 h-3 w-3" />
                    <span>Send Token</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10 my-1" />
                  <DropdownMenuItem className="cursor-pointer hover:bg-[#2A2A2E] focus:bg-[#2A2A2E] focus:text-white text-red-400 py-1.5 text-xs" onClick={logout}>
                    <LogOut className="mr-2 h-3 w-3" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button onClick={login} className="bg-[#A04545] text-white px-2.5 py-1 rounded-full font-bold text-[10px] hover:bg-[#8a3b3b] transition-colors">
                Connect
              </button>
            )}
          </div>

          {/* Desktop Layout: Logo + Nav */}
          <div className="hidden lg:flex items-center gap-4 md:gap-12">
            <Link to="/" className="flex-shrink-0">
              <img src={mwLogo} alt="Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
            </Link>
            <div className="flex items-center gap-8">
              {navLinks.map((link) => (
                link.external ? (
                  <a key={link.path} href={link.path} target="_blank" rel="noopener noreferrer" className="text-[15px] font-semibold tracking-wide text-gray-400 hover:text-[#A04545] transition-colors">
                    {link.name}
                  </a>
                ) : (
                  <Link key={link.path} to={link.path} className={`text-[15px] font-semibold tracking-wide transition-colors ${location.pathname === link.path ? "text-[#A04545]" : "text-gray-400 hover:text-[#A04545]"}`}>
                    {link.name}
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* Desktop Center: Search */}
          <div className="flex-1 max-w-xl mx-auto hidden lg:block">
            <SearchDropdown />
          </div>

          {/* Desktop Right: Actions */}
          <div className="hidden lg:flex items-center gap-2 md:gap-6">
            {/* Notification Dropdown - Desktop */}
            {authenticated && movementAddress && (
              <NotificationDropdown userAddress={movementAddress} />
            )}

            {authenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 bg-[#1A1A1E] border border-white/10 px-3 py-1.5 rounded-full hover:bg-[#2A2A2E] transition-colors cursor-pointer">
                    <span className="font-mono text-sm font-medium text-white">
                      {balanceLoading ? '...' : balance}
                    </span>
                    <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png" alt="MOVE" className="w-5 h-5 rounded-full" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 bg-[#1A1A1E] border-white/10 text-white p-4"
                >
                  {/* Balance Display */}
                  <div className="mb-4 pb-3 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Available Balance</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-white">{balance}</span>
                        <img
                          src="https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png"
                          alt="MOVE"
                          className="w-5 h-5 rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3 mb-4">
                    <button
                      onClick={handleOpenSwap}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2A2A2E] transition-colors"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Swap Tokens</span>
                    </button>
                  </div>

                  <DropdownMenuSeparator className="bg-white/10 my-3" />

                  {/* Send Token Form */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">Send Token</span>
                    </div>

                    <div className="space-y-2">
                      {/* Token Selector */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-full flex items-center justify-between px-3 py-2 bg-[#0f0f13] border border-white/10 rounded-md hover:bg-[#1a1a1e] transition-colors">
                            <div className="flex items-center gap-2">
                              <img
                                src={selectedToken.logo}
                                alt={selectedToken.symbol}
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-sm font-medium text-white">{selectedToken.symbol}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                {balancesLoading ? '...' : getTokenBalance(selectedToken)}
                              </span>
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            </div>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-[calc(100%-2rem)] bg-[#1A1A1E] border-white/10 text-white"
                        >
                          {SUPPORTED_TOKENS.map((token) => (
                            <DropdownMenuItem
                              key={token.symbol}
                              onClick={() => {
                                setSelectedToken(token);
                                setSendAmount(''); // Reset amount when changing token
                              }}
                              className="cursor-pointer hover:bg-[#2A2A2E] focus:bg-[#2A2A2E] focus:text-white"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={token.logo}
                                    alt={token.symbol}
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{token.symbol}</span>
                                    <span className="text-xs text-gray-400">{token.name}</span>
                                  </div>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {getTokenBalance(token)}
                                </span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Input
                        placeholder="Recipient address (0x...)"
                        value={sendRecipient}
                        onChange={(e) => setSendRecipient(e.target.value)}
                        className="bg-[#0f0f13] border-white/10 text-white text-xs placeholder:text-gray-500 focus-visible:ring-primary"
                      />

                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                          className="bg-[#0f0f13] border-white/10 text-white text-xs placeholder:text-gray-500 focus-visible:ring-primary pr-16"
                        />
                        <button
                          onClick={() => setSendAmount(getRawTokenBalance(selectedToken))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary/80 font-semibold"
                        >
                          MAX
                        </button>
                      </div>

                      <Button
                        onClick={handleSendToken}
                        disabled={isSending || !isWalletReady || !sendRecipient || !sendAmount || parseFloat(sendAmount) <= 0}
                        className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                            Sending...
                          </>
                        ) : !isWalletReady ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                            Initializing...
                          </>
                        ) : (
                          `Send ${selectedToken.symbol}`
                        )}
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {authenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 bg-[#1A1A1E] border border-white/10 text-white px-4 py-2 rounded-full hover:bg-[#2A2A2E] transition-colors">
                    <span className="font-mono text-sm font-medium">
                      {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'User'}
                    </span>
                    <span className="text-2xl">{getAvatarFromAddress(walletAddress)}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-[#1A1A1E] border-white/10 text-white"
                >
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-[#2A2A2E] focus:bg-[#2A2A2E] focus:text-white"
                    onClick={() => window.location.href = '/profile'}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-[#2A2A2E] focus:bg-[#2A2A2E] focus:text-white text-red-400"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={login}
                className="bg-[#A04545] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#8a3b3b] transition-colors shadow-lg shadow-[#A04545]/20"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="lg:hidden bg-[#0f0f13] border-t border-white/5 overflow-hidden px-3 py-2"
            >
              <SearchDropdown />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu Dropdown - Navigation Only */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="lg:hidden bg-[#0f0f13] border-t border-white/5 overflow-hidden"
            >
              <div className="px-3 py-3 space-y-1">
                {navLinks.map((link) => (
                  link.external ? (
                    <a
                      key={link.path}
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-gray-400 hover:text-[#A04545] hover:bg-white/5"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        location.pathname === link.path
                          ? "text-[#A04545] bg-[#A04545]/10"
                          : "text-gray-400 hover:text-[#A04545] hover:bg-white/5"
                      }`}
                    >
                      {link.name}
                    </Link>
                  )
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <CreateListingModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </>
  );
};

export default Navbar;
