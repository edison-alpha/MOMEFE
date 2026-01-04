// Activity parser untuk mengkonversi raw activity data menjadi user-friendly format

// AMM Router address for swap detection
export const AMM_ROUTER_ADDRESS = '0xc4e68f29fa608d2630d11513c8de731b09a975f2f75ea945160491b9bfd36992';

import { formatNumber } from './utils';

// Token info with logos for swap activities
// Using the same data as razor-swap.ts SUPPORTED_TOKENS
export interface SwapTokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logo: string;
}

// Testnet token addresses (same as razor-swap.ts)
const TESTNET_TOKENS = {
  tUSDT: '0xe5df458e0bb7020247d5e8c4f5fda70adaccff5318bb456bad8f7c1e3d2bf744',
  tDAI: '0xfdae7b1bf4b0009f2373ff9e2a636f04bcc8b2d82563de84f4b511f19278c417',
  WMOVE: '0x000000000000000000000000000000000000000000000000000000000000000a',
  tUSDC: '0x63299f5dcc23daa43c841fb740ba094845a1b9c36f69e8ba5f387574f2dd6e7c',
  tWBTC: '0x502ce7e025310f676585dab2d2f317e71b6232bb2a8eae90fba6a7a2a83dbcbd',
};

// Token list matching razor-swap.ts SUPPORTED_TOKENS
export const SWAP_TOKEN_LIST: SwapTokenInfo[] = [
  {
    symbol: 'MOVE',
    name: 'Movement',
    address: 'native',
    decimals: 8,
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png',
  },
  {
    symbol: 'MOVE',
    name: 'Movement',
    address: TESTNET_TOKENS.WMOVE,
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

// Build lookup map for quick access by address
export const SWAP_TOKENS: Record<string, SwapTokenInfo> = {};

// Populate the map with all tokens
SWAP_TOKEN_LIST.forEach(token => {
  // Add by exact address
  SWAP_TOKENS[token.address.toLowerCase()] = token;
});

// Also add common aliases
SWAP_TOKENS['native'] = SWAP_TOKEN_LIST[0]; // MOVE
SWAP_TOKENS['0xa'] = SWAP_TOKEN_LIST[1]; // WMOVE shorthand

// Get token info from address - matches against known token addresses
export function getSwapTokenInfo(address: string): SwapTokenInfo {
  if (!address) {
    return SWAP_TOKEN_LIST[0]; // Default to MOVE
  }
  
  const lowerAddress = address.toLowerCase();
  
  // Check exact match first
  if (SWAP_TOKENS[lowerAddress]) {
    return SWAP_TOKENS[lowerAddress];
  }
  
  // Check if address contains any known token address (for wrapped addresses)
  for (const token of SWAP_TOKEN_LIST) {
    if (lowerAddress.includes(token.address.toLowerCase()) || 
        token.address.toLowerCase().includes(lowerAddress)) {
      return token;
    }
  }
  
  // Return default unknown token with gradient fallback
  return {
    symbol: address.length > 10 ? address.slice(0, 6) + '...' : address,
    name: 'Unknown Token',
    address: address,
    decimals: 8,
    logo: '',
  };
}

export interface ParsedActivity {
  type: 'raffle_created' | 'ticket_bought' | 'raffle_finalized' | 'winner_claimed' | 'raffle_cancelled' | 'transfer' | 'deposit' | 'withdraw' | 'swap' | 'unknown';
  title: string;
  description: string;
  icon: 'create' | 'buy' | 'finalize' | 'claim' | 'cancel' | 'send' | 'receive' | 'swap' | 'unknown';
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray' | 'yellow' | 'cyan';
  amount?: string;
  isIncoming: boolean;
  isOutgoing: boolean;
  raffleId?: string;
  ticketCount?: number;
  ticketPrice?: string;
  // Swap-specific fields
  swapFromToken?: SwapTokenInfo;
  swapToToken?: SwapTokenInfo;
  swapFromAmount?: string;
  swapToAmount?: string;
}

// Extract raffle ID from entry function if available
function extractRaffleId(entryFunctionId: string | null): string | undefined {
  if (!entryFunctionId) return undefined;
  // Try to extract raffle ID from function path if it contains it
  const match = entryFunctionId.match(/raffle_(\d+)/);
  return match ? match[1] : undefined;
}

export function parseActivity(
  entryFunctionId: string | null,
  activityType: string,
  amount: string,
  ownerAddress: string,
  currentUserAddress: string,
  eventData?: any // Event data from BuyTicketEvent or SwapEvent
): ParsedActivity {
  // Convert amount from octas (smallest unit) to MOVE with full precision
  // Use BigInt to avoid precision loss
  const amountBigInt = BigInt(amount);
  const divisor = BigInt(100000000); // 10^8 for MOVE decimals
  const wholePart = amountBigInt / divisor;
  const remainder = amountBigInt % divisor;
  const decimalPart = Number(remainder) / 100000000;
  const amountInMove = Number(wholePart) + decimalPart;
  const normalizedAmount = formatNumber(amountInMove);
  
  // Parse entry function ID
  if (entryFunctionId) {
    const parts = entryFunctionId.split('::');
    const functionName = parts[parts.length - 1];
    const moduleAddress = parts[0];
    
    // Check if this is a swap transaction (AMM Router)
    if (moduleAddress.toLowerCase() === AMM_ROUTER_ADDRESS.toLowerCase() || 
        entryFunctionId.includes('amm_router::swap')) {
      // Get token info from event data
      const fromTokenInfo = eventData?.fromTokenAddress 
        ? getSwapTokenInfo(eventData.fromTokenAddress)
        : getSwapTokenInfo('native');
      const toTokenInfo = eventData?.toTokenAddress 
        ? getSwapTokenInfo(eventData.toTokenAddress)
        : getSwapTokenInfo('native');
      
      // Determine swap direction from function name
      let swapFromToken = fromTokenInfo;
      let swapToToken = toTokenInfo;
      
      if (functionName.includes('swap_exact_move_for_tokens')) {
        swapFromToken = getSwapTokenInfo('native');
        swapToToken = eventData?.toTokenAddress ? getSwapTokenInfo(eventData.toTokenAddress) : toTokenInfo;
      } else if (functionName.includes('swap_exact_tokens_for_move')) {
        swapFromToken = eventData?.fromTokenAddress ? getSwapTokenInfo(eventData.fromTokenAddress) : fromTokenInfo;
        swapToToken = getSwapTokenInfo('native');
      }
      
      // Calculate amounts with proper decimals using BigInt for precision
      let fromAmount: string;
      if (eventData?.fromAmount) {
        const fromAmountBigInt = BigInt(eventData.fromAmount);
        const fromDivisor = BigInt(Math.pow(10, swapFromToken.decimals));
        const fromWhole = fromAmountBigInt / fromDivisor;
        const fromRemainder = fromAmountBigInt % fromDivisor;
        const fromDecimal = Number(fromRemainder) / Math.pow(10, swapFromToken.decimals);
        fromAmount = formatNumber(Number(fromWhole) + fromDecimal);
      } else {
        fromAmount = normalizedAmount;
      }
      
      let toAmount: string | undefined;
      if (eventData?.toAmount) {
        const toAmountBigInt = BigInt(eventData.toAmount);
        const toDivisor = BigInt(Math.pow(10, swapToToken.decimals));
        const toWhole = toAmountBigInt / toDivisor;
        const toRemainder = toAmountBigInt % toDivisor;
        const toDecimal = Number(toRemainder) / Math.pow(10, swapToToken.decimals);
        toAmount = formatNumber(Number(toWhole) + toDecimal);
      }
      
      const swapDescription = `${fromAmount} ${swapFromToken.symbol} → ${toAmount || '?'} ${swapToToken.symbol}`;
      
      return {
        type: 'swap',
        title: 'Token Swap',
        description: swapDescription,
        icon: 'swap',
        color: 'cyan',
        amount: fromAmount,
        isIncoming: false,
        isOutgoing: false,
        swapFromToken,
        swapToToken,
        swapFromAmount: fromAmount,
        swapToAmount: toAmount,
      };
    }
    
    // Raffle-related activities
    if (functionName.includes('create_raffle') || functionName.includes('initialize_raffle')) {
      return {
        type: 'raffle_created',
        title: 'Raffle Created',
        description: `Created a new raffle`,
        icon: 'create',
        color: 'blue',
        amount: normalizedAmount,
        isIncoming: false,
        isOutgoing: true,
        raffleId: extractRaffleId(entryFunctionId),
      };
    }
    
    if (functionName.includes('buy_ticket') || functionName.includes('purchase_ticket')) {
      // Get ticket count from event data
      let ticketCount = 1;
      let ticketPrice = normalizedAmount;
      
      if (eventData && eventData.ticket_count) {
        ticketCount = parseInt(eventData.ticket_count);
        if (ticketCount > 0) {
          // Calculate ticket price from total amount
          ticketPrice = formatNumber(amountInMove / ticketCount);
        }
      }
      
      const ticketText = ticketCount === 1 ? 'ticket' : 'tickets';
      
      return {
        type: 'ticket_bought',
        title: 'Ticket Purchased',
        description: `Bought ${ticketCount} ${ticketText}`,
        icon: 'buy',
        color: 'green',
        amount: normalizedAmount,
        isIncoming: false,
        isOutgoing: true,
        ticketCount: ticketCount,
        ticketPrice: ticketPrice,
        raffleId: eventData?.raffle_id || extractRaffleId(entryFunctionId),
      };
    }
    
    if (functionName.includes('finalize') || functionName.includes('draw_winner')) {
      return {
        type: 'raffle_finalized',
        title: 'Raffle Finalized',
        description: `Raffle completed`,
        icon: 'finalize',
        color: 'purple',
        amount: normalizedAmount,
        isIncoming: false,
        isOutgoing: false,
        raffleId: extractRaffleId(entryFunctionId),
      };
    }
    
    if (functionName.includes('claim') || functionName.includes('withdraw_prize')) {
      return {
        type: 'winner_claimed',
        title: 'Prize Claimed',
        description: `Claimed raffle prize`,
        icon: 'claim',
        color: 'orange',
        amount: normalizedAmount,
        isIncoming: true,
        isOutgoing: false,
        raffleId: extractRaffleId(entryFunctionId),
      };
    }
    
    if (functionName.includes('cancel') || functionName.includes('refund')) {
      return {
        type: 'raffle_cancelled',
        title: 'Raffle Cancelled',
        description: `Raffle was cancelled and refunded`,
        icon: 'cancel',
        color: 'red',
        amount: normalizedAmount,
        isIncoming: true,
        isOutgoing: false,
        raffleId: extractRaffleId(entryFunctionId),
      };
    }
    
    // Transfer activities
    if (functionName.includes('transfer')) {
      const isOutgoing = ownerAddress.toLowerCase() === currentUserAddress.toLowerCase();
      return {
        type: 'transfer',
        title: isOutgoing ? 'Sent' : 'Received',
        description: isOutgoing ? `Sent MOVE tokens` : `Received MOVE tokens`,
        icon: isOutgoing ? 'send' : 'receive',
        color: isOutgoing ? 'red' : 'green',
        amount: normalizedAmount,
        isIncoming: !isOutgoing,
        isOutgoing: isOutgoing,
      };
    }
  }
  
  // Parse by activity type (skip gas fees)
  const typeStr = activityType.toLowerCase();
  
  if (typeStr.includes('withdraw')) {
    return {
      type: 'withdraw',
      title: 'Withdraw',
      description: 'Withdrew tokens',
      icon: 'send',
      color: 'red',
      amount: normalizedAmount,
      isIncoming: false,
      isOutgoing: true,
    };
  }
  
  if (typeStr.includes('deposit')) {
    return {
      type: 'deposit',
      title: 'Deposit',
      description: 'Deposited tokens',
      icon: 'receive',
      color: 'green',
      amount: normalizedAmount,
      isIncoming: true,
      isOutgoing: false,
    };
  }
  
  // Default unknown activity
  return {
    type: 'unknown',
    title: 'Transaction',
    description: activityType.split('::').pop() || 'Unknown activity',
    icon: 'unknown',
    color: 'gray',
    amount: normalizedAmount,
    isIncoming: false,
    isOutgoing: false,
  };
}

export function getActivityIcon(icon: ParsedActivity['icon']): string {
  const icons = {
    create: '🎨',
    buy: '🎫',
    finalize: '🎲',
    claim: '🏆',
    cancel: '❌',
    send: '📤',
    receive: '📥',
    swap: '🔄',
    unknown: '📝',
  };
  return icons[icon] || icons.unknown;
}

export function getActivityColorClasses(color: ParsedActivity['color']) {
  const colors = {
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-500',
      border: 'border-blue-500/20',
    },
    green: {
      bg: 'bg-green-500/10',
      text: 'text-green-500',
      border: 'border-green-500/20',
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-500',
      border: 'border-purple-500/20',
    },
    orange: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-500',
      border: 'border-orange-500/20',
    },
    red: {
      bg: 'bg-red-500/10',
      text: 'text-red-500',
      border: 'border-red-500/20',
    },
    gray: {
      bg: 'bg-gray-500/10',
      text: 'text-gray-500',
      border: 'border-gray-500/20',
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-500',
      border: 'border-yellow-500/20',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-500',
      border: 'border-cyan-500/20',
    },
  };
  return colors[color] || colors.gray;
}
