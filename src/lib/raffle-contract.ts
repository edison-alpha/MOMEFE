import { aptos } from './aptos';
import { submitTransaction, submitTransactionNative } from './transactions';

// Contract address - deployed on Movement Testnet (V5 with security fixes)
export const RAFFLE_CONTRACT_ADDRESS = '0x01217f04807991f49109ef548639275de9462bc565895a115f0968edbda74db3';

// Module name - using momeraffle with security enhancements
export const RAFFLE_MODULE = 'momeraffle';

// Admin address - where RaffleStore is initialized
export const RAFFLE_ADMIN_ADDRESS = '0x01217f04807991f49109ef548639275de9462bc565895a115f0968edbda74db3';

/**
 * Convert octas to MOVE with proper rounding to avoid floating point errors
 * @param octas - Amount in octas (1 MOVE = 100,000,000 octas)
 * @returns Amount in MOVE
 */
const octasToMove = (octas: number | string | any): number => {
  const octasNum = typeof octas === 'string' ? parseInt(octas) : Number(octas);
  // Use Math.round to avoid floating point precision errors
  // Round to 8 decimal places (octas precision)
  return Math.round(octasNum) / 100000000;
};

/**
 * Pad address to 64 characters (excluding 0x) for Aptos/Movement
 */
const padAddress = (address: string): string => {
  let cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  return '0x' + cleanAddress.padStart(64, '0');
};

/**
 * Initialize raffle contract (admin only, one-time)
 */
export const initializeContract = async (
  seed: Uint8Array,
  walletAddress: string,
  publicKey: string,
  signRawHash: any
) => {
  const paddedWallet = padAddress(walletAddress);
  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::initialize`,
    [Array.from(seed)],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * Create a new raffle with target amount and prize deposit (Native MOVE)
 * Note: For V5 contract, this calls create_raffle_native with max_tickets_per_user
 */
export const createRaffle = async (
  title: string,
  description: string,
  imageUrl: string,
  ticketPrice: number, // in APT
  totalTickets: number,
  targetAmount: number, // in APT - minimum goal
  prizeAmount: number, // in APT - prize to deposit (0 for NFT)
  durationDays: number,
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string, // Optional: address where RaffleStore is initialized
  maxTicketsPerUser?: number // V5: Optional max tickets per user (0 = default 10%)
) => {
  // Convert MOVE to octas with proper rounding
  // Using Math.round instead of Math.floor to avoid precision loss
  // Example: 0.55555555 * 100000000 = 55555555.5 -> rounds to 55555556
  const ticketPriceOctas = Math.round(ticketPrice * 100000000);
  const targetAmountOctas = Math.round(targetAmount * 100000000);
  const prizeAmountOctas = Math.round(prizeAmount * 100000000);
  const durationSeconds = durationDays * 24 * 60 * 60;
  const maxTickets = maxTicketsPerUser || 0; // 0 = use default (10% of total)

  const paddedWallet = padAddress(walletAddress);
  // Use provided storeAddress, or RAFFLE_ADMIN_ADDRESS (where RaffleStore is initialized)
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);

  // V5 uses create_raffle_native with max_tickets_per_user parameter
  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::create_raffle_native`,
    [
      paddedStore,
      title,
      description,
      imageUrl,
      ticketPriceOctas,
      totalTickets,
      targetAmountOctas,
      prizeAmountOctas,
      durationSeconds,
      maxTickets, // V5: max tickets per user
    ],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * Buy tickets for a raffle
 */
export const buyTickets = async (
  raffleId: number,
  ticketCount: number,
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string // Optional: address where RaffleStore is initialized
) => {
  const paddedWallet = padAddress(walletAddress);
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
  
  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::buy_tickets`,
    [paddedStore, raffleId, ticketCount],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * Finalize raffle and select winner
 */
export const finalizeRaffle = async (
  raffleId: number,
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string // Optional: address where RaffleStore is initialized
) => {
  const paddedWallet = padAddress(walletAddress);
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
  
  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::finalize_raffle`,
    [paddedStore, raffleId],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * Claim prize (winner only)
 */
export const claimPrize = async (
  raffleId: number,
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string // Optional: address where RaffleStore is initialized
) => {
  const paddedWallet = padAddress(walletAddress);
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
  
  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::claim_prize`,
    [paddedStore, raffleId],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * Claim back asset (creator only - for cancelled or target unmet raffles)
 */
export const claimBackAsset = async (
  raffleId: number,
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string // Optional: address where RaffleStore is initialized
) => {
  const paddedWallet = padAddress(walletAddress);
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
  
  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::claim_back_asset`,
    [paddedStore, raffleId],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * Cancel raffle (creator only - only if no tickets sold)
 */
export const cancelRaffle = async (
  raffleId: number,
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string
) => {
  const paddedWallet = padAddress(walletAddress);
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
  
  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::cancel_raffle`,
    [paddedStore, raffleId],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * V4: Claim refund (user only - when raffle is cancelled)
 */
export const claimRefund = async (
  raffleId: number,
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string
) => {
  const paddedWallet = padAddress(walletAddress);
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
  
  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::claim_refund`,
    [paddedStore, raffleId],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * V4: Admin force cancel (admin only - emergency)
 */
export const adminForceCancel = async (
  raffleId: number,
  reason: string,
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string
) => {
  const paddedWallet = padAddress(walletAddress);
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
  
  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::admin_force_cancel`,
    [paddedStore, raffleId, reason],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * Withdraw platform fees (admin only)
 */
export const withdrawFees = async (
  amount: number, // in APT
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string // Optional: address where RaffleStore is initialized
) => {
  const amountOctas = Math.round(amount * 100000000);
  const paddedWallet = padAddress(walletAddress);
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);

  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::withdraw_fees`,
    [paddedStore, amountOctas],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * Get raffle details (V5 format with security enhancements)
 */
export const getRaffle = async (raffleId: number, storeAddress?: string) => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::get_raffle`,
        typeArguments: [],
        functionArguments: [paddedStore, raffleId],
      },
    });

    // V5 returns 23 values including max_tickets_per_user and winner_claimable_amount
    const [
      id,
      creator,
      title,
      description,
      imageUrl,
      ticketPrice,
      totalTickets,
      ticketsSold,
      targetAmount,
      prizeAmount,
      endTime,
      status,
      winner,
      prizePool,
      isClaimed,
      assetInEscrow,
      assetType,
      assetSymbol,
      assetName,
      assetDecimals,
      totalRefunded,
      maxTicketsPerUser,
      winnerClaimableAmount,
    ] = result;

    const decimals = Number(assetDecimals) || 8;
    const divisor = Math.pow(10, decimals);

    return {
      id: Number(id),
      creator: String(creator),
      title: String(title),
      description: String(description),
      imageUrl: String(imageUrl),
      ticketPrice: octasToMove(ticketPrice),
      totalTickets: Number(totalTickets),
      ticketsSold: Number(ticketsSold),
      targetAmount: octasToMove(targetAmount),
      prizeAmount: Number(prizeAmount) / divisor,
      endTime: new Date(Number(endTime) * 1000),
      status: Number(status),
      winner: String(winner),
      prizePool: octasToMove(prizePool),
      isClaimed: Boolean(isClaimed),
      assetInEscrow: Boolean(assetInEscrow),
      prizeAssetType: Number(assetType),
      prizeSymbol: String(assetSymbol),
      prizeName: String(assetName),
      prizeDecimals: decimals,
      totalRefunded: octasToMove(totalRefunded),
      maxTicketsPerUser: Number(maxTicketsPerUser), // V5
      winnerClaimableAmount: octasToMove(winnerClaimableAmount), // V5
    };
  } catch (error) {
    console.error('Error fetching raffle:', error);
    throw error;
  }
};

/**
 * Get total raffle count
 */
export const getRaffleCount = async (storeAddress?: string): Promise<number> => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::get_raffle_count`,
        typeArguments: [],
        functionArguments: [paddedStore],
      },
    });

    return Number(result[0]);
  } catch (error) {
    console.error('Error fetching raffle count:', error);
    return 0;
  }
};

/**
 * Get all raffles
 */
export const getAllRaffles = async (storeAddress?: string) => {
  try {
    const count = await getRaffleCount(storeAddress);
    const raffles = [];

    for (let i = 0; i < count; i++) {
      try {
        const raffle = await getRaffle(i, storeAddress);
        raffles.push(raffle);
      } catch (error) {
        console.error(`Error fetching raffle ${i}:`, error);
      }
    }

    return raffles;
  } catch (error) {
    console.error('Error fetching all raffles:', error);
    return [];
  }
};

/**
 * Get platform fees
 */
export const getPlatformFees = async (storeAddress?: string): Promise<number> => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::get_platform_fees`,
        typeArguments: [],
        functionArguments: [paddedStore],
      },
    });

    return octasToMove(result[0] as number);
  } catch (error) {
    console.error('Error fetching platform fees:', error);
    return 0;
  }
};

/**
 * Get user's tickets across all raffles
 */
export const getUserTickets = async (userAddress: string, storeAddress?: string) => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    const paddedUser = padAddress(userAddress);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::get_user_tickets`,
        typeArguments: [],
        functionArguments: [paddedStore, paddedUser],
      },
    });

    return result[0] || [];
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return [];
  }
};

/**
 * Check if raffle target is met
 */
export const isTargetMet = async (raffleId: number, storeAddress?: string): Promise<boolean> => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::is_target_met`,
        typeArguments: [],
        functionArguments: [paddedStore, raffleId],
      },
    });

    return Boolean(result[0]);
  } catch (error) {
    console.error('Error checking target:', error);
    return false;
  }
};

/**
 * Check if address is null/zero address
 */
export const isNullAddress = (address: string): boolean => {
  if (!address) return true;
  // Check for various null address formats
  const nullPatterns = [
    '0x0',
    '0x00',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '@0x0',
  ];
  
  // Check if address matches any null pattern
  if (nullPatterns.includes(address)) return true;
  
  // Check if address is all zeros after 0x
  const hexPart = address.replace(/^(0x|@0x)/, '');
  return /^0+$/.test(hexPart);
};

/**
 * Raffle status constants
 */
export const RAFFLE_STATUS = {
  LISTED: 1,        // Raffle created, ticket sale ongoing
  RAFFLING: 2,      // Raffle ended, waiting for winner selection
  ITEM_RAFFLED: 3,  // Target met, asset distributed to winner
  FUND_RAFFLED: 4,  // Target unmet, funds distributed to winner
  CANCELLED: 5,     // No sale or cancelled, asset returned to seller
} as const;

/**
 * Get raffle status label
 */
export const getRaffleStatusLabel = (status: number): string => {
  switch (status) {
    case RAFFLE_STATUS.LISTED:
      return '🟢 Listed';
    case RAFFLE_STATUS.RAFFLING:
      return '🟡 Raffling';
    case RAFFLE_STATUS.ITEM_RAFFLED:
      return '🟣 Item Raffled';
    case RAFFLE_STATUS.FUND_RAFFLED:
      return '🔵 Fund Raffled';
    case RAFFLE_STATUS.CANCELLED:
      return '🔴 Cancelled';
    default:
      return 'Unknown';
  }
};

/**
 * Get raffle status description
 */
export const getRaffleStatusDescription = (status: number): string => {
  switch (status) {
    case RAFFLE_STATUS.LISTED:
      return 'Raffle is created and ticket sale is ongoing';
    case RAFFLE_STATUS.RAFFLING:
      return 'Raffle ended; waiting for winner selection';
    case RAFFLE_STATUS.ITEM_RAFFLED:
      return 'Target met, asset distributed to winner';
    case RAFFLE_STATUS.FUND_RAFFLED:
      return 'Target unmet, funds distributed to winner';
    case RAFFLE_STATUS.CANCELLED:
      return 'No sale or cancelled raffle, asset returned to seller';
    default:
      return 'Unknown status';
  }
};


/**
 * V4: Check if user has claimed refund
 */
export const hasClaimedRefund = async (
  raffleId: number,
  userAddress: string,
  storeAddress?: string
): Promise<boolean> => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    const paddedUser = padAddress(userAddress);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::has_claimed_refund`,
        typeArguments: [],
        functionArguments: [paddedStore, raffleId, paddedUser],
      },
    });

    return Boolean(result[0]);
  } catch (error) {
    console.error('Error checking refund status:', error);
    return false;
  }
};

/**
 * V4: Get refundable amount for user
 */
export const getRefundableAmount = async (
  raffleId: number,
  userAddress: string,
  storeAddress?: string
): Promise<number> => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    const paddedUser = padAddress(userAddress);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::get_refundable_amount`,
        typeArguments: [],
        functionArguments: [paddedStore, raffleId, paddedUser],
      },
    });

    return octasToMove(result[0] as number);
  } catch (error) {
    console.error('Error getting refundable amount:', error);
    return 0;
  }
};

/**
 * V4: Get total refunded for a raffle
 */
export const getTotalRefunded = async (
  raffleId: number,
  storeAddress?: string
): Promise<number> => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::get_total_refunded`,
        typeArguments: [],
        functionArguments: [paddedStore, raffleId],
      },
    });

    return octasToMove(result[0] as number);
  } catch (error) {
    console.error('Error getting total refunded:', error);
    return 0;
  }
};


// ============ V5 New Functions ============

/**
 * V5: Get user's remaining ticket allowance for a raffle
 */
export const getUserRemainingTickets = async (
  raffleId: number,
  userAddress: string,
  storeAddress?: string
): Promise<number> => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    const paddedUser = padAddress(userAddress);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::get_user_remaining_tickets`,
        typeArguments: [],
        functionArguments: [paddedStore, raffleId, paddedUser],
      },
    });

    return Number(result[0]);
  } catch (error) {
    console.error('Error getting remaining tickets:', error);
    return 0;
  }
};

/**
 * V5: Check if contract is paused
 */
export const isContractPaused = async (storeAddress?: string): Promise<boolean> => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::is_paused`,
        typeArguments: [],
        functionArguments: [paddedStore],
      },
    });

    return Boolean(result[0]);
  } catch (error) {
    console.error('Error checking pause status:', error);
    return false;
  }
};

/**
 * V5: Pause contract (admin only)
 */
export const pauseContract = async (
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string
) => {
  const paddedWallet = padAddress(walletAddress);
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
  
  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::pause_contract`,
    [paddedStore],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * V5: Unpause contract (admin only)
 */
export const unpauseContract = async (
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string
) => {
  const paddedWallet = padAddress(walletAddress);
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
  
  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::unpause_contract`,
    [paddedStore],
    paddedWallet,
    publicKey,
    signRawHash
  );
};
