/**
 * MoME V3 - Multi-Asset Raffle Contract Interface
 * Supports: Native MOVE, Fungible Assets (FA), Digital Assets (NFT), and RWA
 */

import { aptos } from './aptos';
import { submitTransaction } from './transactions';

// Contract address - deployed on Movement Testnet (V4 - Multi-Asset with Refund)
export const RAFFLE_CONTRACT_ADDRESS_V3 = '0x139b57d91686291b2b07d827a84fdc6cf81a80d29a8228a941c3b11fc66c59cf';
export const RAFFLE_MODULE_V3 = 'draw_v4';
export const RAFFLE_ADMIN_ADDRESS_V3 = '0x139b57d91686291b2b07d827a84fdc6cf81a80d29a8228a941c3b11fc66c59cf';

// Re-export for backward compatibility
export const RAFFLE_CONTRACT_ADDRESS = RAFFLE_CONTRACT_ADDRESS_V3;
export const RAFFLE_MODULE = RAFFLE_MODULE_V3;
export const RAFFLE_ADMIN_ADDRESS = RAFFLE_ADMIN_ADDRESS_V3;

// Asset Types
export const ASSET_TYPE = {
  NATIVE: 0,           // Native MOVE/APT
  FUNGIBLE_ASSET: 1,   // FA standard tokens (tUSDT, tDAI, etc)
  DIGITAL_ASSET: 2,    // NFT / Digital Assets
  RWA: 3,              // Real World Assets
} as const;

export type AssetType = typeof ASSET_TYPE[keyof typeof ASSET_TYPE];

// Prize Asset Interface
export interface PrizeAsset {
  assetType: AssetType;
  amount: number;
  decimals: number;
  faMetadata?: string;    // FA metadata address
  nftAddress?: string;    // NFT object address
  symbol: string;
  name: string;
}

// Raffle Interface
export interface RaffleV3 {
  id: number;
  creator: string;
  title: string;
  description: string;
  imageUrl: string;
  ticketPrice: number;
  totalTickets: number;
  ticketsSold: number;
  targetAmount: number;
  prizeAsset: PrizeAsset;
  endTime: Date;
  status: number;
  winner: string;
  prizePool: number;
  isClaimed: boolean;
  assetInEscrow: boolean;
  // V5 fields
  totalRefunded?: number;
  maxTicketsPerUser?: number;
  winnerClaimableAmount?: number;
}

// Helper functions
const octasToMove = (octas: number | string | any): number => {
  const octasNum = typeof octas === 'string' ? parseInt(octas) : Number(octas);
  return Math.round(octasNum) / 100000000;
};

const padAddress = (address: string): string => {
  let cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  return '0x' + cleanAddress.padStart(64, '0');
};

const toOctas = (amount: number, decimals: number = 8): number => {
  return Math.round(amount * Math.pow(10, decimals));
};

/**
 * Initialize contract (admin only, one-time)
 */
export const initializeContractV3 = async (
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
 * Create raffle with Native MOVE as prize
 */
export const createRaffleNative = async (
  title: string,
  description: string,
  imageUrl: string,
  ticketPrice: number,
  totalTickets: number,
  targetAmount: number,
  prizeAmount: number,
  durationDays: number,
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string,
  maxTicketsPerUser?: number // V5: max tickets per user (0 = default 10%)
) => {
  const ticketPriceOctas = toOctas(ticketPrice);
  const targetAmountOctas = toOctas(targetAmount);
  const prizeAmountOctas = toOctas(prizeAmount);
  const durationSeconds = durationDays * 24 * 60 * 60;
  const maxTickets = maxTicketsPerUser || 0;

  const paddedWallet = padAddress(walletAddress);
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);

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
      maxTickets, // V5
    ],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * Create raffle with Fungible Asset (FA) as prize
 * For tokens like tUSDT, tDAI, etc.
 */
export const createRaffleFA = async (
  title: string,
  description: string,
  imageUrl: string,
  ticketPrice: number,
  totalTickets: number,
  targetAmount: number,
  prizeAmount: number,
  durationDays: number,
  faMetadataAddress: string,
  tokenSymbol: string,
  tokenName: string,
  tokenDecimals: number,
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string,
  maxTicketsPerUser?: number // V5
) => {
  const ticketPriceOctas = toOctas(ticketPrice);
  const targetAmountOctas = toOctas(targetAmount);
  const prizeAmountRaw = toOctas(prizeAmount, tokenDecimals);
  const durationSeconds = durationDays * 24 * 60 * 60;
  const maxTickets = maxTicketsPerUser || 0;

  const paddedWallet = padAddress(walletAddress);
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
  const paddedFaMetadata = padAddress(faMetadataAddress);

  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::create_raffle_fa`,
    [
      paddedStore,
      title,
      description,
      imageUrl,
      ticketPriceOctas,
      totalTickets,
      targetAmountOctas,
      prizeAmountRaw,
      durationSeconds,
      paddedFaMetadata,
      tokenSymbol,
      tokenName,
      tokenDecimals,
      maxTickets, // V5
    ],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * Create raffle with NFT/Digital Asset as prize
 */
export const createRaffleNFT = async (
  title: string,
  description: string,
  imageUrl: string,
  ticketPrice: number,
  totalTickets: number,
  targetAmount: number,
  durationDays: number,
  nftObjectAddress: string,
  nftName: string,
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string,
  maxTicketsPerUser?: number // V5
) => {
  const ticketPriceOctas = toOctas(ticketPrice);
  const targetAmountOctas = toOctas(targetAmount);
  const durationSeconds = durationDays * 24 * 60 * 60;
  const maxTickets = maxTicketsPerUser || 0;

  const paddedWallet = padAddress(walletAddress);
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
  const paddedNftAddress = padAddress(nftObjectAddress);

  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::create_raffle_nft`,
    [
      paddedStore,
      title,
      description,
      imageUrl,
      ticketPriceOctas,
      totalTickets,
      targetAmountOctas,
      durationSeconds,
      paddedNftAddress,
      nftName,
      maxTickets, // V5
    ],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * Create raffle with RWA (Real World Asset) as prize
 */
export const createRaffleRWA = async (
  title: string,
  description: string,
  imageUrl: string,
  ticketPrice: number,
  totalTickets: number,
  targetAmount: number,
  prizeAmount: number,
  durationDays: number,
  rwaMetadataAddress: string,
  rwaSymbol: string,
  rwaName: string,
  rwaDecimals: number,
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string,
  maxTicketsPerUser?: number // V5
) => {
  const ticketPriceOctas = toOctas(ticketPrice);
  const targetAmountOctas = toOctas(targetAmount);
  const prizeAmountRaw = toOctas(prizeAmount, rwaDecimals);
  const durationSeconds = durationDays * 24 * 60 * 60;
  const maxTickets = maxTicketsPerUser || 0;

  const paddedWallet = padAddress(walletAddress);
  const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
  const paddedRwaMetadata = padAddress(rwaMetadataAddress);

  return await submitTransaction(
    RAFFLE_CONTRACT_ADDRESS,
    `${RAFFLE_MODULE}::create_raffle_rwa`,
    [
      paddedStore,
      title,
      description,
      imageUrl,
      ticketPriceOctas,
      totalTickets,
      targetAmountOctas,
      prizeAmountRaw,
      durationSeconds,
      paddedRwaMetadata,
      rwaSymbol,
      rwaName,
      rwaDecimals,
      maxTickets, // V5
    ],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * Buy tickets (always with MOVE)
 */
export const buyTicketsV3 = async (
  raffleId: number,
  ticketCount: number,
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string
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
export const finalizeRaffleV3 = async (
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
export const claimPrizeV3 = async (
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
    `${RAFFLE_MODULE}::claim_prize`,
    [paddedStore, raffleId],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * Claim back asset (creator only)
 */
export const claimBackAssetV3 = async (
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
    `${RAFFLE_MODULE}::claim_back_asset`,
    [paddedStore, raffleId],
    paddedWallet,
    publicKey,
    signRawHash
  );
};

/**
 * Cancel raffle (creator only)
 */
export const cancelRaffleV3 = async (
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
 * Withdraw platform fees (admin only)
 */
export const withdrawFeesV3 = async (
  amount: number,
  walletAddress: string,
  publicKey: string,
  signRawHash: any,
  storeAddress?: string
) => {
  const amountOctas = toOctas(amount);
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

// ==================== View Functions ====================

/**
 * Get raffle details (V3 with multi-asset support)
 */
export const getRaffleV3 = async (raffleId: number, storeAddress?: string): Promise<RaffleV3> => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::get_raffle`,
        typeArguments: [],
        functionArguments: [paddedStore, raffleId],
      },
    });

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
      prizeSymbol,
      prizeName,
      prizeDecimals,
      totalRefunded,
      maxTicketsPerUser,
      winnerClaimableAmount,
    ] = result;

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
      prizeAsset: {
        assetType: Number(assetType) as AssetType,
        amount: Number(prizeAmount) / Math.pow(10, Number(prizeDecimals)),
        decimals: Number(prizeDecimals),
        symbol: String(prizeSymbol),
        name: String(prizeName),
      },
      endTime: new Date(Number(endTime) * 1000),
      status: Number(status),
      winner: String(winner),
      prizePool: octasToMove(prizePool),
      isClaimed: Boolean(isClaimed),
      assetInEscrow: Boolean(assetInEscrow),
      // V5 fields
      totalRefunded: octasToMove(totalRefunded || 0),
      maxTicketsPerUser: Number(maxTicketsPerUser || 0),
      winnerClaimableAmount: octasToMove(winnerClaimableAmount || 0),
    };
  } catch (error) {
    console.error('Error fetching raffle V3:', error);
    throw error;
  }
};

/**
 * Get raffle prize asset details
 */
export const getRafflePrizeAsset = async (raffleId: number, storeAddress?: string): Promise<PrizeAsset> => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::get_raffle_prize_asset`,
        typeArguments: [],
        functionArguments: [paddedStore, raffleId],
      },
    });

    const [
      assetType,
      amount,
      decimals,
      faMetadata,
      nftAddress,
      symbol,
      name,
    ] = result;

    return {
      assetType: Number(assetType) as AssetType,
      amount: Number(amount) / Math.pow(10, Number(decimals)),
      decimals: Number(decimals),
      faMetadata: (faMetadata as any)?.vec?.[0] || undefined,
      nftAddress: (nftAddress as any)?.vec?.[0] || undefined,
      symbol: String(symbol),
      name: String(name),
    };
  } catch (error) {
    console.error('Error fetching prize asset:', error);
    throw error;
  }
};

/**
 * Get total raffle count
 */
export const getRaffleCountV3 = async (storeAddress?: string): Promise<number> => {
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
    console.error('Error fetching raffle count V3:', error);
    return 0;
  }
};

/**
 * Get all raffles (V3)
 */
export const getAllRafflesV3 = async (storeAddress?: string): Promise<RaffleV3[]> => {
  try {
    const count = await getRaffleCountV3(storeAddress);
    const raffles: RaffleV3[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const raffle = await getRaffleV3(i, storeAddress);
        raffles.push(raffle);
      } catch (error) {
        console.error(`Error fetching raffle ${i}:`, error);
      }
    }

    return raffles;
  } catch (error) {
    console.error('Error fetching all raffles V3:', error);
    return [];
  }
};

/**
 * Get platform fees
 */
export const getPlatformFeesV3 = async (storeAddress?: string): Promise<number> => {
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
    console.error('Error fetching platform fees V3:', error);
    return 0;
  }
};

/**
 * Get user's tickets across all raffles
 */
export const getUserTicketsV3 = async (userAddress: string, storeAddress?: string) => {
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
    console.error('Error fetching user tickets V3:', error);
    return [];
  }
};

/**
 * Get raffle tickets
 */
export const getRaffleTicketsV3 = async (raffleId: number, storeAddress?: string) => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::get_raffle_tickets`,
        typeArguments: [],
        functionArguments: [paddedStore, raffleId],
      },
    });

    return result[0] || [];
  } catch (error) {
    console.error('Error fetching raffle tickets V3:', error);
    return [];
  }
};

/**
 * Check if raffle target is met
 */
export const isTargetMetV3 = async (raffleId: number, storeAddress?: string): Promise<boolean> => {
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
    console.error('Error checking target V3:', error);
    return false;
  }
};

/**
 * Get escrow balance
 */
export const getEscrowBalanceV3 = async (storeAddress?: string): Promise<number> => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::get_escrow_balance`,
        typeArguments: [],
        functionArguments: [paddedStore],
      },
    });

    return octasToMove(result[0] as number);
  } catch (error) {
    console.error('Error fetching escrow balance V3:', error);
    return 0;
  }
};

/**
 * Get global ticket count
 */
export const getGlobalTicketCountV3 = async (storeAddress?: string): Promise<number> => {
  try {
    const paddedStore = padAddress(storeAddress || RAFFLE_ADMIN_ADDRESS);
    
    const result = await aptos.view({
      payload: {
        function: `${RAFFLE_CONTRACT_ADDRESS}::${RAFFLE_MODULE}::get_global_ticket_count`,
        typeArguments: [],
        functionArguments: [paddedStore],
      },
    });

    return Number(result[0]);
  } catch (error) {
    console.error('Error fetching global ticket count V3:', error);
    return 0;
  }
};

// ==================== Status Constants ====================

export const RAFFLE_STATUS_V3 = {
  LISTED: 1,
  RAFFLING: 2,
  ITEM_RAFFLED: 3,
  FUND_RAFFLED: 4,
  CANCELLED: 5,
} as const;

/**
 * Get raffle status label
 */
export const getRaffleStatusLabelV3 = (status: number): string => {
  switch (status) {
    case RAFFLE_STATUS_V3.LISTED:
      return '🟢 Listed';
    case RAFFLE_STATUS_V3.RAFFLING:
      return '🟡 Raffling';
    case RAFFLE_STATUS_V3.ITEM_RAFFLED:
      return '🟣 Item Raffled';
    case RAFFLE_STATUS_V3.FUND_RAFFLED:
      return '🔵 Fund Raffled';
    case RAFFLE_STATUS_V3.CANCELLED:
      return '🔴 Cancelled';
    default:
      return 'Unknown';
  }
};

/**
 * Get asset type label
 */
export const getAssetTypeLabel = (assetType: AssetType): string => {
  switch (assetType) {
    case ASSET_TYPE.NATIVE:
      return 'Native MOVE';
    case ASSET_TYPE.FUNGIBLE_ASSET:
      return 'Fungible Asset';
    case ASSET_TYPE.DIGITAL_ASSET:
      return 'NFT / Digital Asset';
    case ASSET_TYPE.RWA:
      return 'Real World Asset';
    default:
      return 'Unknown';
  }
};

/**
 * Check if address is null/zero address
 */
export const isNullAddressV3 = (address: string): boolean => {
  if (!address) return true;
  const nullPatterns = [
    '0x0',
    '0x00',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '@0x0',
  ];
  if (nullPatterns.includes(address)) return true;
  const hexPart = address.replace(/^(0x|@0x)/, '');
  return /^0+$/.test(hexPart);
};