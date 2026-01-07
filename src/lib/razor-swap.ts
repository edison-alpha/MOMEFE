// Razor DEX SDK Integration for Movement Network
import {
  Token,
  CurrencyAmount,
  Percent,
  TradeType,
  ChainId,
  Move,
  Fetcher,
  Pair,
  Route,
  Trade,
  WMOVE,
  Router,
} from '@razorlabs/amm-sdk';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Movement Network Chain IDs
export const MOVEMENT_TESTNET_CHAIN_ID = ChainId.BARDOCK_TESTNET; // 250
export const MOVEMENT_MAINNET_CHAIN_ID = ChainId.MAINNET; // 126

// Current network - Using testnet
export const CURRENT_CHAIN_ID = MOVEMENT_TESTNET_CHAIN_ID;

// Movement Testnet RPC URL (using Sentio RPC which is compatible with Razor DEX SDK)
const MOVEMENT_TESTNET_RPC = 'https://rpc.sentio.xyz/movement-testnet/v1';

// Suppress SDK console.log messages about CUSTOM network
const suppressedMessages = ['Note: using CUSTOM network'];
const originalConsoleLog = console.log;
const suppressConsoleLog = (...args: any[]) => {
  const message = args.join(' ');
  if (suppressedMessages.some(m => message.includes(m))) {
    return; // Suppress this message
  }
  originalConsoleLog.apply(console, args);
};

// Create custom Aptos provider for Movement testnet
export const getProvider = () => {
  const config = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: MOVEMENT_TESTNET_RPC,
  });
  return new Aptos(config);
};

// Testnet token addresses (fungible asset metadata addresses)
// These are the actual addresses from Razor DEX on Movement Testnet
const TESTNET_TOKENS = {
  // tUSDT - Test Tether USD
  tUSDT: '0xe5df458e0bb7020247d5e8c4f5fda70adaccff5318bb456bad8f7c1e3d2bf744',
  // tDAI - Test Dai Stablecoin  
  tDAI: '0xfdae7b1bf4b0009f2373ff9e2a636f04bcc8b2d82563de84f4b511f19278c417',
  // WMOVE - Wrapped MOVE (native token)
  WMOVE: '0x000000000000000000000000000000000000000000000000000000000000000a',
  // tUSDC - Test USD Coin (Bardock Testnet)
  tUSDC: '0x63299f5dcc23daa43c841fb740ba094845a1b9c36f69e8ba5f387574f2dd6e7c',
  // tWBTC - Test Wrapped BTC (Bardock Testnet)
  tWBTC: '0x502ce7e025310f676585dab2d2f317e71b6232bb2a8eae90fba6a7a2a83dbcbd',
};

// Common tokens on Movement Network
export const COMMON_TOKENS = {
  MOVE: Move.onChain(CURRENT_CHAIN_ID),
  WMOVE: WMOVE[CURRENT_CHAIN_ID],
  // Testnet tokens with correct fungible asset addresses
  tUSDT: new Token(
    CURRENT_CHAIN_ID,
    TESTNET_TOKENS.tUSDT,
    6,
    'tUSDT',
    'Test Tether USD'
  ),
  tDAI: new Token(
    CURRENT_CHAIN_ID,
    TESTNET_TOKENS.tDAI,
    6,
    'tDAI',
    'Test Dai Stablecoin'
  ),
  tUSDC: new Token(
    CURRENT_CHAIN_ID,
    TESTNET_TOKENS.tUSDC,
    6,
    'tUSDC',
    'Test USD Coin'
  ),
  tWBTC: new Token(
    CURRENT_CHAIN_ID,
    TESTNET_TOKENS.tWBTC,
    8,
    'tWBTC',
    'Test Wrapped BTC'
  ),
};

// Token list for UI
export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logo: string;
  token?: Token;
}

export const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    symbol: 'MOVE',
    name: 'Movement',
    address: 'native',
    decimals: 8,
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png',
  },
  {
    symbol: 'tUSDC',
    name: 'Test USD Coin',
    address: TESTNET_TOKENS.tUSDC,
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/razorlabsorg/chainlist/refs/heads/main/chain/aptos/asset/USDC.png',
  },
  {
    symbol: 'tWBTC',
    name: 'Test Wrapped BTC',
    address: TESTNET_TOKENS.tWBTC,
    decimals: 8,
    logo: 'https://raw.githubusercontent.com/razorlabsorg/chainlist/refs/heads/main/chain/aptos/asset/WBTC.png',
  },
  {
    symbol: 'tUSDT',
    name: 'Test Tether USD',
    address: TESTNET_TOKENS.tUSDT,
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/razorlabsorg/chainlist/refs/heads/main/chain/aptos/asset/USDT.png',
  },
  {
    symbol: 'tDAI',
    name: 'Test Dai Stablecoin',
    address: TESTNET_TOKENS.tDAI,
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/razorlabsorg/chainlist/refs/heads/main/chain/aptos/asset/DAI.png',
  },
];

/**
 * Get Token instance from token info
 */
export function getToken(tokenInfo: TokenInfo): Token | Move {
  if (tokenInfo.address === 'native') {
    return Move.onChain(CURRENT_CHAIN_ID);
  }
  return new Token(
    CURRENT_CHAIN_ID,
    tokenInfo.address,
    tokenInfo.decimals,
    tokenInfo.symbol,
    tokenInfo.name
  );
}

/**
 * Fetch pair data for two tokens
 */
export async function fetchPair(tokenA: Token | Move, tokenB: Token | Move): Promise<Pair | null> {
  // Temporarily suppress SDK console messages
  console.log = suppressConsoleLog;
  
  try {
    const provider = getProvider();
    
    // Convert Move to WMOVE for pair lookup
    const actualTokenA = tokenA instanceof Move ? WMOVE[CURRENT_CHAIN_ID] : tokenA;
    const actualTokenB = tokenB instanceof Move ? WMOVE[CURRENT_CHAIN_ID] : tokenB;
    
    const pair = await Fetcher.fetchPairData(actualTokenA, actualTokenB, provider as any);
    return pair;
  } catch (error) {
    console.error('Error fetching pair:', error);
    return null;
  } finally {
    // Restore original console.log
    console.log = originalConsoleLog;
  }
}

/**
 * Get swap quote using Razor DEX SDK
 */
export async function getSwapQuote(
  inputToken: TokenInfo,
  outputToken: TokenInfo,
  inputAmount: string
): Promise<{
  outputAmount: string;
  priceImpact: string;
  executionPrice: string;
  minimumReceived: string;
  route: string[];
  trade: Trade<any, any, TradeType> | null;
  autoSlippage: number; // Auto-calculated optimal slippage
} | null> {
  try {
    const tokenIn = getToken(inputToken);
    const tokenOut = getToken(outputToken);
    
    // Parse input amount
    const parsedAmount = parseFloat(inputAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return null;
    }
    
    // Convert to raw amount with decimals
    const rawAmount = BigInt(Math.floor(parsedAmount * Math.pow(10, inputToken.decimals)));
    
    // Fetch pair
    const pair = await fetchPair(tokenIn, tokenOut);
    if (!pair) {
      return null;
    }
    
    // For route and trade, we need to use WMOVE instead of Move (native)
    // because the pair uses WMOVE internally
    const actualTokenIn = tokenIn instanceof Move ? WMOVE[CURRENT_CHAIN_ID] : tokenIn;
    const actualTokenOut = tokenOut instanceof Move ? WMOVE[CURRENT_CHAIN_ID] : tokenOut;
    
    // Create route with actual tokens (WMOVE instead of Move)
    const route = new Route([pair], actualTokenIn, actualTokenOut);
    
    // Create currency amount - use the actual token's decimals
    // WMOVE has 8 decimals same as native MOVE
    const amountIn = CurrencyAmount.fromRawAmount(actualTokenIn, rawAmount.toString());
    
    // Create trade
    const trade = Trade.exactIn(route, amountIn);
    
    // Calculate auto slippage based on price impact
    const priceImpactNum = parseFloat(trade.priceImpact.toSignificant(4));
    const autoSlippage = calculateAutoSlippage(priceImpactNum);
    
    // Calculate minimum received with auto slippage
    const slippageTolerance = new Percent(Math.floor(autoSlippage * 100), 10000);
    const minOut = trade.minimumAmountOut(slippageTolerance);
    
    const result = {
      outputAmount: trade.outputAmount.toSignificant(6),
      priceImpact: trade.priceImpact.toSignificant(2),
      executionPrice: trade.executionPrice.toSignificant(6),
      minimumReceived: minOut.toSignificant(6),
      route: route.path.map(t => t.symbol || 'Unknown'),
      trade,
      autoSlippage,
    };
    
    return result;
  } catch (error) {
    console.error('Error getting swap quote:', error);
    return null;
  }
}

/**
 * Calculate optimal auto slippage based on price impact
 * - Low impact (<0.5%): 0.5% slippage
 * - Medium impact (0.5-2%): 1% slippage  
 * - High impact (2-5%): 2% slippage
 * - Very high impact (>5%): price impact + 1% buffer
 */
export function calculateAutoSlippage(priceImpact: number): number {
  if (priceImpact < 0.5) {
    return 0.5; // Low impact - minimal slippage
  } else if (priceImpact < 2) {
    return 1.0; // Medium impact
  } else if (priceImpact < 5) {
    return 2.0; // High impact
  } else {
    // Very high impact - use price impact + 1% buffer, max 10%
    return Math.min(priceImpact + 1, 10);
  }
}

/**
 * Build swap transaction parameters using Razor DEX SDK Router
 * This properly handles native MOVE swaps
 */
export function buildSwapTransaction(
  trade: Trade<any, any, TradeType>,
  recipient: string,
  slippagePercent: number = 0.5,
  deadlineMinutes: number = 20,
  isInputNative: boolean = false,
  isOutputNative: boolean = false
): {
  functionId: string;
  typeArgs: string[];
  args: any[];
  value?: string; // Amount of native MOVE to send with transaction
} | null {
  try {
    // Use SDK Router to get proper swap parameters
    const slippageTolerance = new Percent(Math.floor(slippagePercent * 100), 10000);
    const deadline = deadlineMinutes * 60; // TTL in seconds
    
    const swapParams = Router.swapCallParameters(trade, {
      allowedSlippage: slippageTolerance,
      ttl: deadline,
      recipient,
    });
    
    const AMM_ROUTER = '0xc4e68f29fa608d2630d11513c8de731b09a975f2f75ea945160491b9bfd36992';
    
    // Get correct amounts from trade
    const amountIn = trade.inputAmount.quotient.toString();
    const minAmountOut = trade.minimumAmountOut(slippageTolerance).quotient.toString();
    
    // Determine the correct method based on native token involvement
    let methodName: string;
    let args: any[];
    
    // Get path from SDK args (index 2 is usually the path)
    const sdkArgs = swapParams.args as any[];
    const path = sdkArgs[2]; // Token path array
    const deadlineTimestamp = sdkArgs[4]; // Deadline timestamp
    
    if (isInputNative && !isOutputNative) {
      // Swapping native MOVE -> Token
      // Use swap_exact_move_for_tokens
      methodName = 'swap_exact_move_for_tokens';
      args = [
        amountIn,           // amount_in (native MOVE in octas)
        minAmountOut,       // amount_out_min
        path,               // path (token addresses)
        recipient,          // to
        deadlineTimestamp,  // deadline
      ];
    } else if (!isInputNative && isOutputNative) {
      // Swapping Token -> native MOVE
      // Use swap_exact_tokens_for_move
      methodName = 'swap_exact_tokens_for_move';
      args = [
        amountIn,           // amount_in
        minAmountOut,       // amount_out_min
        path,               // path
        recipient,          // to
        deadlineTimestamp,  // deadline
      ];
    } else {
      // Token -> Token (no native involved)
      methodName = 'swap_exact_tokens_for_tokens';
      args = [
        amountIn,           // amount_in
        minAmountOut,       // amount_out_min
        path,               // path
        recipient,          // to
        deadlineTimestamp,  // deadline
      ];
    }
    
    const functionId = `${AMM_ROUTER}::amm_router::${methodName}`;
    
    return {
      functionId,
      typeArgs: [],
      args,
      value: isInputNative ? amountIn : undefined, // Send MOVE value if input is native
    };
  } catch (error) {
    console.error('Error building swap transaction:', error);
    return null;
  }
}

/**
 * Check if pair exists and has liquidity
 */
export async function checkPairExists(
  tokenA: TokenInfo,
  tokenB: TokenInfo
): Promise<boolean> {
  try {
    const pair = await fetchPair(getToken(tokenA), getToken(tokenB));
    return pair !== null;
  } catch {
    return false;
  }
}

/**
 * Format amount for display
 */
export function formatAmount(amount: string, decimals: number = 6): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  if (num < 0.000001) return '<0.000001';
  return num.toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Parse user input to raw amount
 */
export function parseAmount(amount: string, decimals: number): bigint {
  const parsed = parseFloat(amount);
  if (isNaN(parsed)) return BigInt(0);
  return BigInt(Math.floor(parsed * Math.pow(10, decimals)));
}
