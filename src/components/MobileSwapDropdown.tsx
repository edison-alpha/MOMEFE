import { useState, useEffect, useCallback } from "react";
import { ArrowLeftRight, ChevronDown, Loader2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRazorSwap } from "@/hooks/useRazorSwap";
import { getExplorerUrl, aptos } from "@/lib/aptos";
import { usePrivy } from '@privy-io/react-auth';
import { TokenInfo, SUPPORTED_TOKENS } from "@/lib/razor-swap";
import { triggerBalanceRefresh } from "@/hooks/useMovementBalance";
import { formatNumber } from "@/lib/utils";

export const MobileSwapDropdown = () => {
  const { authenticated, login, user } = usePrivy();
  const [isOpen, setIsOpen] = useState(false);
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
      setIsOpen(true);
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
      setIsOpen(false);
      
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
    <>
      {/* Trigger Button - Desktop Style */}
      <button 
        onClick={() => setIsOpen(true)}
        className="text-xs font-semibold text-white whitespace-nowrap hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <span className="flex items-center gap-1">
          Swap
          <span className="text-[10px] text-gray-500 font-normal">via Razor</span>
        </span>
        <ChevronDown className="w-3 h-3 transition-transform duration-300" />
      </button>

      {/* Mobile Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-center justify-center p-2 sm:p-3">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-[320px] sm:max-w-sm bg-[#0a0a0a] border border-white/10 rounded-lg max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-3 overflow-y-auto max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-bold text-white">Swap</h2>
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">Razor</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Pool Status */}
              {isCheckingPool && (
                <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md px-2 py-1.5 mb-2">
                  <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                  <span className="text-xs text-blue-500">Checking pool...</span>
                </div>
              )}
              
              {!isCheckingPool && poolExists && fromToken.symbol !== toToken.symbol && (
                <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-md px-2 py-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-green-500">Pool ready</span>
                </div>
              )}
              
              {!isCheckingPool && !poolExists && fromToken.symbol !== toToken.symbol && (
                <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-2 py-1.5 mb-2">
                  <AlertCircle className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-yellow-500">No pool available</span>
                </div>
              )}

              {/* From Token Section */}
              <div className="space-y-2 mb-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">From</label>
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={fromAmount}
                        onChange={(e) => handleFromAmountChange(e.target.value)}
                        disabled={isSwapping}
                        className="bg-transparent border-none text-white text-base sm:text-lg font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded-md px-2 py-1.5 transition-colors">
                            <img src={fromToken.logo} alt={fromToken.symbol} className="w-5 h-5 rounded-full" />
                            <span className="font-semibold text-white text-sm">{fromToken.symbol}</span>
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 z-[60]">
                          {SUPPORTED_TOKENS.map((token) => (
                            <DropdownMenuItem
                              key={token.symbol}
                              onClick={() => setFromToken(token)}
                              className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white"
                            >
                              <div className="flex items-center gap-3">
                                <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                                <span>{token.symbol}</span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {authenticated && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Balance: {isLoadingBalance ? '...' : fromBalance}
                        </span>
                        <button 
                          onClick={handleSetMax}
                          className="text-xs text-primary hover:text-primary/80 font-medium"
                        >
                          MAX
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Swap Direction Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleSwapTokens}
                    className="p-2 bg-[#1a1a1a] border border-white/10 rounded-full hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* To Token Section */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">To</label>
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {isLoadingQuote ? (
                          <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                        ) : (
                          <span className="text-gray-400 text-sm">~</span>
                        )}
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={toAmount}
                          readOnly
                          className="bg-transparent border-none text-white text-base sm:text-lg font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded-md px-2 py-1.5 transition-colors">
                            <img src={toToken.logo} alt={toToken.symbol} className="w-5 h-5 rounded-full" />
                            <span className="font-semibold text-white text-sm">{toToken.symbol}</span>
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 z-[60]">
                          {SUPPORTED_TOKENS.map((token) => (
                            <DropdownMenuItem
                              key={token.symbol}
                              onClick={() => setToToken(token)}
                              className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white"
                            >
                              <div className="flex items-center gap-3">
                                <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                                <span>{token.symbol}</span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {authenticated && (
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500">
                          Balance: {isLoadingBalance ? '...' : toBalance}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quote Info */}
              {quote && fromAmount && toAmount && (
                <div className="bg-white/5 rounded-md p-2 mb-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Rate</span>
                    <span className="text-white">1 {fromToken.symbol} ≈ {quote.executionPrice} {toToken.symbol}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Impact</span>
                    <span className={parseFloat(quote.priceImpact) > 5 ? 'text-red-400' : parseFloat(quote.priceImpact) > 1 ? 'text-yellow-400' : 'text-green-400'}>
                      {parseFloat(quote.priceImpact) > 0.01 ? `${quote.priceImpact}%` : '<0.01%'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Slippage</span>
                    <span className="text-blue-400">{quote.autoSlippage}%</span>
                  </div>
                </div>
              )}

              {/* Swap Button */}
              <Button
                onClick={handleSwapNow}
                disabled={!fromAmount || parseFloat(fromAmount) <= 0 || !poolExists || isSwapping || isLoadingQuote || !authenticated || isCheckingPool}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!authenticated ? (
                  'Connect Wallet'
                ) : isSwapping ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Swapping...
                  </>
                ) : (
                  'Swap Now'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileSwapDropdown;