import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { usePrivy } from '@privy-io/react-auth';
import { useCreateWallet } from '@privy-io/react-auth/extended-chains';
import { Bell, User, LogOut } from "lucide-react";
import CreateListingModal from "./CreateListingModal";
import SearchDropdown from "./SearchDropdown";
import mwLogo from "@/assets/mw.png";
import { useMovementBalance } from "@/hooks/useMovementBalance";
import { getAvatarFromAddress } from "@/lib/avatarUtils";
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
        console.log('Privy Movement Wallet Address:', address);
      } else {
        // Create a new Aptos/Movement wallet
        console.log('No Movement wallet found. Creating one now...');
        setIsCreatingWallet(true);
        try {
          const wallet = await createWallet({ chainType: 'aptos' });
          const address = (wallet as any).address;
          setMovementAddress(address);
          console.log('Created Privy Movement Wallet Address:', address);
        } catch (error) {
          console.error('Error creating Movement wallet:', error);
        } finally {
          setIsCreatingWallet(false);
        }
      }
    };

    setupMovementWallet();
  }, [authenticated, user, createWallet, isCreatingWallet]);

  const walletAddress = movementAddress;
  const { balance, isLoading: balanceLoading } = useMovementBalance(movementAddress);

  const navLinks = [
    { name: "Explore", path: "/" },
    { name: "Activity", path: "/activity" },
    { name: "Faucet", path: "https://faucet.movementnetwork.xyz/", external: true },
    { name: "Create Draw", path: "/profile" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#0f0f13] border-b border-white/5">
        <div className="max-w-[1920px] mx-auto px-6 h-[64px] flex items-center justify-between gap-8">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-12">
            <Link to="/" className="flex-shrink-0">
              <img src={mwLogo} alt="Logo" className="w-12 h-12 object-contain" />
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                link.external ? (
                  <a
                    key={link.path}
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] font-semibold tracking-wide text-gray-400 hover:text-[#A04545] transition-colors"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-[15px] font-semibold tracking-wide transition-colors ${location.pathname === link.path
                      ? "text-[#A04545]"
                      : "text-gray-400 hover:text-[#A04545]"
                      }`}
                  >
                    {link.name}
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-xl mx-auto hidden lg:block">
            <SearchDropdown />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-6">
            <button className="text-gray-400 hover:text-[#A04545] transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            {authenticated && (
              <div className="hidden sm:flex items-center gap-2 bg-[#1A1A1E] border border-white/10 px-3 py-1.5 rounded-full">
                <span className="font-mono text-sm font-medium text-white">
                  {balanceLoading ? '...' : balance}
                </span>
                <img 
                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png" 
                  alt="MOVE" 
                  className="w-5 h-5 rounded-full" 
                />
              </div>
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
      </nav>

      <CreateListingModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </>
  );
};

export default Navbar;
