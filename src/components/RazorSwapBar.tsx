import { useState, useEffect, useCallback } from "react";
import { ArrowLeftRight, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useRazorSwap } from "@/hooks/useRazorSwap";
import { getExplorerUrl, aptos } from "@/lib/aptos";
import { usePrivy } from '@privy-io/react-auth';
import { TokenInfo, SUPPORTED_TOKENS } from "@/lib/razor-swap";
import { triggerBalanceRefresh } from "@/hooks/useMovementBalance";
import { formatNumber } from "@/lib/utils";
import MobileSwapDropdown from "./MobileSwapDropdown";

// SVG Icons
const XIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DiscordIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export const RazorSwapBar = () => {
  const { authenticated, login, user } = usePrivy();
  const [isExpanded, setIsExpanded] = useState(false);
  const [fromToken, setFromToken] = useState<TokenInfo>(SUPPORTED_TOKENS[0]); // MOVE
  const [toToken, setToToken] = useState<TokenInfo>(SUPPORTED_TOKENS[1]); // USDC
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [poolExists, setPoolExists] = useState(false);
  const [isCheckingPool, setIsCheckingPool] = useState(false);
  const [fromBalance, setFromBalance] = useState<string>("0");
  const [toBalance, setToBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const { getQuote, executeSwap, checkPool, isSwapping, isLoadingQuote, quote } = useRazorSwap();

  // Get wallet address
  const walletAddress = (user?.linkedAccounts?.find(
    (account: any) => account.chainType === 'aptos'
  ) as any)?.address as string | undefined;

  // MOVE token addresses
  const MOVE_COIN_TYPE = '0x1::aptos_coin::AptosCoin';
  const INDEXER_URL = 'https://hasura.testnet.movementnetwork.xyz/v1/graphql';

  // Fetch token balance (handles both Coin and FA storage for MOVE)
  const fetchTokenBalance = useCallback(async (token: TokenInfo, address: string): Promise<string> => {
    try {
      if (token.address === 'native' || token.symbol === 'MOVE') {
        let coinBalance = BigInt(0);
        let faBalance = BigInt(0);

        // 1. Get legacy Coin balance
        try {
          const resources = await aptos.getAccountResources({ accountAddress: address });
          const coinResource = resources.find(
            (r) => r.type === `0x1::coin::CoinStore<${MOVE_COIN_TYPE}>`
          );
          if (coinResource) {
            const coinData = coinResource.data as { coin: { value: string } };
            coinBalance = BigInt(coinData.coin.value);
          }
        } catch (e) {
          console.error('Error fetching Coin balance:', e);
        }

        // 2. Get Fungible Asset balance from indexer
        try {
          const response = await fetch(INDEXER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `
                query GetAllFABalances($address: String!) {
                  current_fungible_asset_balances(
                    where: { owner_address: { _eq: $address } }
                  ) {
                    amount
                    asset_type
                  }
                }
              `,
              variables: { address },
            }),
          });
          const data = await response.json();
          const faBalances = data.data?.current_fungible_asset_balances || [];
          
          // Find MOVE FA balance
          const moveFaBalance = faBalances.find((b: any) => {
            const assetType = b.asset_type?.toLowerCase() || '';
            return assetType === '0xa' || 
                   assetType === '0x000000000000000000000000000000000000000000000000000000000000000a' ||
                   assetType.includes('aptos_coin') ||
                   assetType === '0x0a';
          });
          
          if (moveFaBalance) {
            faBalance = BigInt(moveFaBalance.amount);
          }
        } catch (e) {
          console.error('Error fetching FA balance:', e);
        }

        // Smart balance calculation with tolerance for sync lag
        let totalBalanceInOctas = BigInt(0);
        
        if (coinBalance === BigInt(0) && faBalance === BigInt(0)) {
          totalBalanceInOctas = BigInt(0);
        } else if (coinBalance === BigInt(0)) {
          totalBalanceInOctas = faBalance;
        } else if (faBalance === BigInt(0)) {
          totalBalanceInOctas = coinBalance;
        } else if (coinBalance === faBalance) {
          // Exactly same balance = they're synced, use one
          totalBalanceInOctas = faBalance;
        } else {
          // Check if they're "close enough" (within 1% tolerance for sync lag)
          const larger = coinBalance > faBalance ? coinBalance : faBalance;
          const smaller = coinBalance < faBalance ? coinBalance : faBalance;
          const difference = larger - smaller;
          const percentDiff = (Number(difference) / Number(larger)) * 100;
          
          if (percentDiff < 1.0) {
            // Less than 1% difference = likely synced with minor lag, use the larger value
            totalBalanceInOctas = larger;
          } else {
            // More than 1% difference = truly separate storage, sum them
            totalBalanceInOctas = coinBalance + faBalance;
          }
        }

        // Convert total
        const divisor = BigInt(Math.pow(10, token.decimals));
        const wholePart = totalBalanceInOctas / divisor;
        const remainder = totalBalanceInOctas % divisor;
        const decimalPart = Number(remainder) / Math.pow(10, token.decimals);
        const balance = Number(wholePart) + decimalPart;
        return formatNumber(balance);
      } else {
        // Other Fungible Asset balance - query indexer
        const response = await fetch(INDEXER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetTokenBalance($address: String!, $asset_type: String!) {
                current_fungible_asset_balances(
                  where: { 
                    owner_address: { _eq: $address },
                    asset_type: { _eq: $asset_type }
                  }
                ) {
                  amount
                }
              }
            `,
            variables: { address, asset_type: token.address },
          }),
        });
        const data = await response.json();
        const balanceStr = data.data?.current_fungible_asset_balances?.[0]?.amount || '0';
        // Use BigInt for precision
        const balanceInSmallest = BigInt(balanceStr);
        const divisor = BigInt(Math.pow(10, token.decimals));
        const wholePart = balanceInSmallest / divisor;
        const remainder = balanceInSmallest % divisor;
        const decimalPart = Number(remainder) / Math.pow(10, token.decimals);
        const balance = Number(wholePart) + decimalPart;
        return formatNumber(balance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      return "0";
    }
  }, []);

  // Fetch balances when tokens or wallet changes
  useEffect(() => {
    const fetchBalances = async () => {
      if (!walletAddress || !authenticated) {
        setFromBalance("0");
        setToBalance("0");
        return;
      }

      setIsLoadingBalance(true);
      try {
        const [fromBal, toBal] = await Promise.all([
          fetchTokenBalance(fromToken, walletAddress),
          fetchTokenBalance(toToken, walletAddress),
        ]);
        setFromBalance(fromBal);
        setToBalance(toBal);
      } catch (error) {
        console.error('Error fetching balances:', error);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalances();
  }, [fromToken, toToken, walletAddress, authenticated, fetchTokenBalance]);

  // Set max amount
  const handleSetMax = () => {
    if (fromBalance && parseFloat(fromBalance) > 0) {
      // Leave a small amount for gas if it's native token
      if (fromToken.address === '0x1::aptos_coin::AptosCoin') {
        const maxAmount = Math.max(0, parseFloat(fromBalance) - 0.01);
        setFromAmount(formatNumber(maxAmount));
      } else {
        setFromAmount(fromBalance);
      }
    }
  };

  // Listen for open swap event from Navbar
  useEffect(() => {
    const handleOpenSwap = () => {
      setIsExpanded(true);
    };

    window.addEventListener('openSwapBar', handleOpenSwap);
    return () => window.removeEventListener('openSwapBar', handleOpenSwap);
  }, []);

  // Check if pool exists when tokens change
  useEffect(() => {
    const checkPoolExists = async () => {
      if (fromToken.symbol === toToken.symbol) {
        setPoolExists(false);
        return;
      }
      
      setIsCheckingPool(true);
      try {
        const exists = await checkPool(fromToken, toToken);
        setPoolExists(exists);
      } catch {
        setPoolExists(false);
      } finally {
        setIsCheckingPool(false);
      }
    };
    
    checkPoolExists();
  }, [fromToken, toToken, checkPool]);

  // Get quote when input amount changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0 || !poolExists) {
        setToAmount("");
        return;
      }

      const quoteData = await getQuote(fromToken, toToken, fromAmount);
      
      if (quoteData) {
        setToAmount(quoteData.outputAmount);
      } else {
        setToAmount("");
      }
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [fromAmount, fromToken, toToken, poolExists, getQuote]);

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
  };

  const handleSwapNow = async () => {
    if (!authenticated) {
      login();
      return;
    }

    if (!fromAmount || !toAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Invalid amount');
      return;
    }

    if (!poolExists) {
      toast.error('Pool unavailable', {
        description: 'No liquidity pool found for this pair on Razor DEX',
      });
      return;
    }

    const result = await executeSwap(fromToken, toToken, fromAmount);

    if (result.success && result.txHash) {
      toast.success('Swap successful!', {
        description: `Swapped ${fromAmount} ${fromToken.symbol} for ~${toAmount} ${toToken.symbol}`,
        action: {
          label: 'View',
          onClick: () => window.open(getExplorerUrl(result.txHash!), '_blank'),
        },
      });
      setFromAmount("");
      setToAmount("");
      setIsExpanded(false);
      
      // Trigger global balance refresh after successful swap
      // Wait a bit for the blockchain to update
      setTimeout(() => {
        triggerBalanceRefresh();
        // Also refresh local balances
        if (walletAddress) {
          Promise.all([
            fetchTokenBalance(fromToken, walletAddress),
            fetchTokenBalance(toToken, walletAddress),
          ]).then(([fromBal, toBal]) => {
            setFromBalance(fromBal);
            setToBalance(toBal);
          });
        }
      }, 2000);
    } else {
      toast.error('Swap failed', {
        description: result.error || 'Please try again',
      });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a] border-t border-white/10">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 py-2 lg:py-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Mobile: Show Dropdown Button */}
            <div className="lg:hidden">
              <MobileSwapDropdown />
            </div>

            {/* Desktop: Show Swap Bar */}
            <div className="hidden lg:flex items-center gap-2.5">
              {/* Swap Label - Clickable */}
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-semibold text-white whitespace-nowrap hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="flex items-center gap-1">
                  Swap
                  <span className="text-[10px] text-gray-500 font-normal">via Razor</span>
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Swap Form - Collapsible */}
              <div className={`flex items-center gap-2.5 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-w-[900px] opacity-100' : 'max-w-0 opacity-0'}`}>
                
                {/* Pool Status */}
                {isCheckingPool && isExpanded && (
                  <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1">
                    <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                    <span className="text-xs text-blue-500 whitespace-nowrap">Checking pool...</span>
                  </div>
                )}
                
                {!isCheckingPool && poolExists && isExpanded && fromToken.symbol !== toToken.symbol && (
                  <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-lg px-2 py-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-green-500 whitespace-nowrap">Pool ready</span>
                  </div>
                )}
                
                {!isCheckingPool && !poolExists && isExpanded && fromToken.symbol !== toToken.symbol && (
                  <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2 py-1">
                    <AlertCircle className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                    <span className="text-xs text-yellow-500 whitespace-nowrap">No pool</span>
                  </div>
                )}
                
                {/* From Token */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-lg px-2.5 py-1.5 min-w-[200px]">
                    <Input
                      type="number"
                      placeholder="0"
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                      disabled={isSwapping}
                      className="flex-1 bg-transparent border-none text-white text-xs focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1.5 hover:bg-white/5 rounded px-1.5 py-0.5 transition-colors">
                          <img src={fromToken.logo} alt={fromToken.symbol} className="w-4 h-4 rounded-full" />
                          <span className="text-xs font-semibold text-white">{fromToken.symbol}</span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                        {SUPPORTED_TOKENS.map((token) => (
                          <DropdownMenuItem
                            key={token.symbol}
                            onClick={() => setFromToken(token)}
                            className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white"
                          >
                            <div className="flex items-center gap-2">
                              <img src={token.logo} alt={token.symbol} className="w-4 h-4 rounded-full" />
                              <span className="text-sm">{token.symbol}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {authenticated && (
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] text-gray-500">
                        Balance: {isLoadingBalance ? '...' : fromBalance}
                      </span>
                      <button 
                        onClick={handleSetMax}
                        className="text-[10px] text-primary hover:text-primary/80 font-medium"
                      >
                        MAX
                      </button>
                    </div>
                  )}
                </div>

                {/* Swap Direction Button */}
                <button
                  onClick={handleSwapTokens}
                  className="p-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {/* To Token */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-lg px-2.5 py-1.5 min-w-[200px]">
                    {isLoadingQuote ? (
                      <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                    ) : (
                      <span className="text-xs text-gray-400">~</span>
                    )}
                    <Input
                      type="number"
                      placeholder="0.0000"
                      value={toAmount}
                      readOnly
                      className="flex-1 bg-transparent border-none text-white text-xs focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1.5 hover:bg-white/5 rounded px-1.5 py-0.5 transition-colors">
                          <img src={toToken.logo} alt={toToken.symbol} className="w-4 h-4 rounded-full" />
                          <span className="text-xs font-semibold text-white">{toToken.symbol}</span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                        {SUPPORTED_TOKENS.map((token) => (
                          <DropdownMenuItem
                            key={token.symbol}
                            onClick={() => setToToken(token)}
                            className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white"
                          >
                            <div className="flex items-center gap-2">
                              <img src={token.logo} alt={token.symbol} className="w-4 h-4 rounded-full" />
                              <span className="text-sm">{token.symbol}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {authenticated && (
                    <div className="flex items-center px-1">
                      <span className="text-[10px] text-gray-500">
                        Balance: {isLoadingBalance ? '...' : toBalance}
                      </span>
                    </div>
                  )}
                </div>

                {/* Swap Button */}
                <Button
                  onClick={handleSwapNow}
                  disabled={!fromAmount || parseFloat(fromAmount) <= 0 || !poolExists || isSwapping || isLoadingQuote || !authenticated || isCheckingPool}
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed h-auto whitespace-nowrap"
                >
                  {!authenticated ? (
                    'Connect'
                  ) : isSwapping ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Swapping...
                    </>
                  ) : (
                    'Swap'
                  )}
                </Button>

                {/* Quote Info - Compact with Auto Slippage */}
                {quote && fromAmount && toAmount && isExpanded && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-md">
                    <span className="text-[10px] text-gray-500">
                      1 {fromToken.symbol} ≈ {quote.executionPrice} {toToken.symbol}
                    </span>
                    <span className={`text-[10px] ${parseFloat(quote.priceImpact) > 5 ? 'text-red-400' : parseFloat(quote.priceImpact) > 1 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {parseFloat(quote.priceImpact) > 0.01 ? `(${quote.priceImpact}%)` : '(<0.01%)'}
                    </span>
                    <span className="text-[10px] text-blue-400" title="Auto-calculated optimal slippage">
                      Slip: {quote.autoSlippage}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Live Info & Social */}
          <div className="flex items-center gap-2 lg:gap-3">

            {/* Live Indicator - Hidden on small mobile */}
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-400">Live</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-1 sm:gap-2">
              <a
                href="https://x.com/momeraffle"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <XIcon />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <DiscordIcon />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorSwapBar;
