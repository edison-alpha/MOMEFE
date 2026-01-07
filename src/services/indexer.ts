// Movement Network Indexer Service
import { aptos, CURRENT_NETWORK } from '@/lib/aptos';

// Movement Indexer GraphQL endpoints - use the correct URLs
const INDEXER_ENDPOINTS = {
  mainnet: 'https://indexer.mainnet.movementnetwork.xyz/v1/graphql',
  testnet: 'https://hasura.testnet.movementnetwork.xyz/v1/graphql',
};

const INDEXER_URL = INDEXER_ENDPOINTS[CURRENT_NETWORK];

export interface TokenBalance {
  token_data_id: string;
  amount: string;
  token_properties: {
    name: string;
    symbol: string;
    decimals: number;
    icon_uri?: string;
  };
  isNative?: boolean;
  asset_type?: string;
}

export interface NFTToken {
  token_data_id: string;
  name: string;
  description: string;
  uri: string;
  collection_name: string;
  property_version: string;
  amount: string;
}

export interface UserPortfolio {
  tokens: TokenBalance[];
  nfts: NFTToken[];
}

// Known token metadata for common tokens on Movement
const KNOWN_TOKENS: Record<string, { name: string; symbol: string; decimals: number; icon_uri?: string }> = {
  // Native/Wrapped MOVE
  '0x000000000000000000000000000000000000000000000000000000000000000a': {
    name: 'Wrapped MOVE',
    symbol: 'WMOVE',
    decimals: 8,
    icon_uri: 'https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png',
  },
  '0x1::aptos_coin::AptosCoin': {
    name: 'Movement',
    symbol: 'MOVE',
    decimals: 8,
    icon_uri: 'https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png',
  },
  // Stablecoins - Movement Testnet
  '0xe5df458e0bb7020247d5e8c4f5fda70adaccff5318bb456bad8f7c1e3d2bf744': {
    name: 'Test Tether USD',
    symbol: 'tUSDT',
    decimals: 6,
    icon_uri: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  },
  '0xfdae7b1bf4b0009f2373ff9e2a636f04bcc8b2d82563de84f4b511f19278c417': {
    name: 'Test Dai Stablecoin',
    symbol: 'tDAI',
    decimals: 6,
    icon_uri: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
  },
  // Additional tokens from razor-resources
  '0x29ed7a3412030945095a1e991065aa3c943bd8e371931c18d50da461e8b287a7': {
    name: 'Token A',
    symbol: 'TKA',
    decimals: 8,
  },
  '0x502ce7e025310f676585dab2d2f317e71b6232bb2a8eae90fba6a7a2a83dbcbd': {
    name: 'Token B',
    symbol: 'TKB',
    decimals: 8,
  },
  '0x63299f5dcc23daa43c841fb740ba094845a1b9c36f69e8ba5f387574f2dd6e7c': {
    name: 'Token C',
    symbol: 'TKC',
    decimals: 8,
  },
  '0xdba435d1962b65a560511084cf7070f353d74fe2bebe8af6c9315f6eb192422d': {
    name: 'Token D',
    symbol: 'TKD',
    decimals: 8,
  },
  '0xfe9ace429136c7a62221156100680aef7e6154b372643f59d54686b3c8016e4e': {
    name: 'Token E',
    symbol: 'TKE',
    decimals: 8,
  },
  '0xa4b8bb637306f283170ad282a19f2c89d6ce2d1349dcd90dc4567ad2552050c0': {
    name: 'Token F',
    symbol: 'TKF',
    decimals: 8,
  },
  '0x7e84c0dd3d1a69e7a6a3ce468279f01bab57f0cce34ed50de18c1b75d0fdf74a': {
    name: 'Token G',
    symbol: 'TKG',
    decimals: 8,
  },
  '0x3932ad8dc3b20b88fd67bdc4fe03f2b06a3fbc17f8f13dbad17f8acf5ee45d6f': {
    name: 'Token H',
    symbol: 'TKH',
    decimals: 8,
  },
  '0x3eb0b581aa715aca25630472d519c9b03bd07bd2bfdb415a2474721ad61b07d5': {
    name: 'Token I',
    symbol: 'TKI',
    decimals: 8,
  },
  '0xb8a7d77ced53b4f7cfdebb79cde3b1ad767e90e5465b6ebd251674e9d2274d10': {
    name: 'Token J',
    symbol: 'TKJ',
    decimals: 8,
  },
  // USDC variants
  '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC': {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    icon_uri: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
  // WETH
  '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH': {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 8,
    icon_uri: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  // WBTC
  '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WBTC': {
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    decimals: 8,
    icon_uri: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png',
  },
};

// Fetch native token balance (MOVE) - handles both Coin and FA storage
async function getNativeBalance(address: string): Promise<TokenBalance | null> {
  try {
    let coinBalance = BigInt(0);
    let faBalance = BigInt(0);

    // 1. Get legacy Coin balance
    try {
      const resources = await aptos.getAccountResources({
        accountAddress: address,
      });

      const coinResource = resources.find(
        (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
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
      const query = `
        query GetAllFABalances($address: String!) {
          current_fungible_asset_balances(
            where: { owner_address: { _eq: $address } }
          ) {
            amount
            asset_type
          }
        }
      `;

      const response = await fetch(INDEXER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { address },
        }),
      });

      const data = await response.json();
      const faBalances = data.data?.current_fungible_asset_balances || [];
      
      // Find MOVE FA balance - check multiple possible formats
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
      // Both empty
      totalBalanceInOctas = BigInt(0);
    } else if (coinBalance === BigInt(0)) {
      // Only FA has balance
      totalBalanceInOctas = faBalance;
    } else if (faBalance === BigInt(0)) {
      // Only Coin has balance
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

    // Return balance if found
    if (totalBalanceInOctas > 0) {
      return {
        token_data_id: 'native_move',
        amount: totalBalanceInOctas.toString(),
        token_properties: {
          name: 'Movement',
          symbol: 'MOVE',
          decimals: 8,
          icon_uri: 'https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png',
        },
        isNative: true,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching native balance:', error);
    return null;
  }
}

// Fetch all fungible asset balances for an address (includes all FA tokens, LP tokens, etc.)
async function getFungibleAssetBalances(address: string): Promise<TokenBalance[]> {
  // Try GraphQL first
  const query = `
    query GetFungibleAssetBalances($address: String!) {
      current_fungible_asset_balances(
        where: { 
          owner_address: { _eq: $address },
          amount: { _gt: "0" }
        }
        order_by: { amount: desc }
      ) {
        amount
        asset_type
        owner_address
        storage_id
        is_frozen
        is_primary
        last_transaction_version
        metadata {
          name
          symbol
          decimals
          icon_uri
          asset_type
          token_standard
          project_uri
        }
      }
    }
  `;

  try {
    const response = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { address },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      // Try fallback to REST API
      return await getFungibleAssetBalancesFromRest(address);
    }

    if (!data.data?.current_fungible_asset_balances) {
      return await getFungibleAssetBalancesFromRest(address);
    }

    const tokens: TokenBalance[] = data.data.current_fungible_asset_balances.map((item: any) => {
      const assetType = item.asset_type;
      const knownToken = KNOWN_TOKENS[assetType];
      
      // Use metadata from indexer, fallback to known tokens, then defaults
      const metadata = item.metadata || {};
      
      // Generate a readable name for LP tokens or unknown tokens
      let tokenName = metadata.name || knownToken?.name;
      let tokenSymbol = metadata.symbol || knownToken?.symbol;
      
      if (!tokenName) {
        // Try to extract name from asset_type
        if (assetType.includes('::')) {
          const parts = assetType.split('::');
          tokenName = parts[parts.length - 1] || 'Unknown Token';
        } else {
          tokenName = 'Unknown Token';
        }
      }
      
      if (!tokenSymbol) {
        // Try to extract symbol from asset_type or use shortened address
        if (assetType.includes('::')) {
          const parts = assetType.split('::');
          tokenSymbol = parts[parts.length - 1]?.slice(0, 8) || assetType.slice(0, 10) + '...';
        } else {
          tokenSymbol = assetType.slice(0, 10) + '...';
        }
      }
      
      return {
        token_data_id: item.storage_id || assetType,
        amount: item.amount,
        asset_type: assetType,
        token_properties: {
          name: tokenName,
          symbol: tokenSymbol,
          decimals: metadata.decimals ?? knownToken?.decimals ?? 8,
          icon_uri: metadata.icon_uri || knownToken?.icon_uri,
        },
        isNative: false,
      };
    });

    return tokens;
  } catch (error) {
    console.error('Error fetching fungible asset balances:', error);
    // Try fallback to REST API
    return await getFungibleAssetBalancesFromRest(address);
  }
}

// Fallback: Fetch fungible assets using REST API (account resources)
async function getFungibleAssetBalancesFromRest(address: string): Promise<TokenBalance[]> {
  try {
    const resources = await aptos.getAccountResources({
      accountAddress: address,
    });
    
    const tokens: TokenBalance[] = [];
    
    // Look for all token-related resources
    for (const resource of resources) {
      // Check for CoinStore resources (legacy coins)
      if (resource.type.startsWith('0x1::coin::CoinStore<')) {
        const coinType = resource.type.match(/CoinStore<(.+)>/)?.[1];
        if (coinType && !coinType.includes('aptos_coin::AptosCoin')) {
          const coinData = resource.data as { coin: { value: string } };
          const balance = coinData.coin?.value || '0';
          
          if (BigInt(balance) > 0) {
            const knownToken = KNOWN_TOKENS[coinType];
            const parts = coinType.split('::');
            const tokenName = knownToken?.name || parts[parts.length - 1] || 'Unknown';
            
            tokens.push({
              token_data_id: coinType,
              amount: balance,
              asset_type: coinType,
              token_properties: {
                name: tokenName,
                symbol: knownToken?.symbol || tokenName.slice(0, 6).toUpperCase(),
                decimals: knownToken?.decimals ?? 8,
                icon_uri: knownToken?.icon_uri,
              },
              isNative: false,
            });
          }
        }
      }
      
      // Check for FungibleStore resources (FA standard)
      if (resource.type.includes('fungible_asset::FungibleStore') || 
          resource.type.includes('primary_fungible_store::DeriveRefPod')) {
        try {
          const storeData = resource.data as any;
          const balance = storeData.balance || '0';
          
          if (BigInt(balance) > 0) {
            const metadataAddr = storeData.metadata?.inner || 'unknown';
            const knownToken = KNOWN_TOKENS[metadataAddr];
            
            tokens.push({
              token_data_id: metadataAddr,
              amount: balance,
              asset_type: metadataAddr,
              token_properties: {
                name: knownToken?.name || 'Fungible Asset',
                symbol: knownToken?.symbol || metadataAddr.slice(2, 8).toUpperCase(),
                decimals: knownToken?.decimals ?? 8,
                icon_uri: knownToken?.icon_uri,
              },
              isNative: false,
            });
          }
        } catch (e) {
          // Error parsing FungibleStore
        }
      }

      // Check for concurrent_fungible_balance (newer FA standard)
      if (resource.type.includes('concurrent_fungible_balance')) {
        try {
          const balanceData = resource.data as any;
          const balance = balanceData.balance?.value || balanceData.balance || '0';
          
          // concurrent_fungible_balance found
        } catch (e) {
          // Error parsing concurrent_fungible_balance
        }
      }
    }
    
    return tokens;
  } catch (error) {
    console.error('Error fetching fungible assets via REST:', error);
    return [];
  }
}

// Fetch user's fungible tokens - combines native MOVE, fungible assets from GraphQL and REST
export async function getUserTokens(address: string): Promise<TokenBalance[]> {
  try {
    // Fetch all token sources in parallel
    const [nativeBalance, fungibleAssets, restAssets] = await Promise.all([
      getNativeBalance(address).catch(() => null),
      getFungibleAssetBalances(address).catch(() => []),
      getFungibleAssetBalancesFromRest(address).catch(() => []),
    ]);

    // Create a map to deduplicate tokens by asset_type
    const tokenMap = new Map<string, TokenBalance>();

    // Add native balance first (this already includes Coin + FA MOVE)
    if (nativeBalance) {
      tokenMap.set('native_move', nativeBalance);
    }

    // Helper to check if asset is MOVE (to skip duplicates)
    const isMoveAsset = (assetType: string) => {
      const lower = assetType?.toLowerCase() || '';
      return lower === '0xa' || 
             lower === '0x000000000000000000000000000000000000000000000000000000000000000a' ||
             lower === '0x0a' ||
             lower.includes('aptos_coin');
    };

    // Add fungible assets from GraphQL
    for (const token of fungibleAssets) {
      const key = token.asset_type || token.token_data_id;
      
      // Skip if it's MOVE token (already combined in native balance)
      if (isMoveAsset(key)) {
        continue;
      }
      
      if (!tokenMap.has(key)) {
        tokenMap.set(key, token);
      }
    }

    // Add tokens from REST API (may have additional tokens not in GraphQL)
    for (const token of restAssets) {
      const key = token.asset_type || token.token_data_id;
      
      // Skip if it's MOVE token (already combined in native balance)
      if (isMoveAsset(key)) {
        continue;
      }
      
      if (!tokenMap.has(key)) {
        tokenMap.set(key, token);
      }
    }

    const allTokens = Array.from(tokenMap.values());
    
    // Sort: native first, then by balance (descending)
    allTokens.sort((a, b) => {
      if (a.isNative) return -1;
      if (b.isNative) return 1;
      try {
        return Number(BigInt(b.amount) - BigInt(a.amount));
      } catch {
        return 0;
      }
    });
    
    return allTokens;
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    // Try to at least return native balance
    try {
      const nativeBalance = await getNativeBalance(address);
      return nativeBalance ? [nativeBalance] : [];
    } catch {
      return [];
    }
  }
}

// Fetch user's NFTs
export async function getUserNFTs(address: string): Promise<NFTToken[]> {
  const query = `
    query GetUserNFTs($address: String!) {
      current_token_ownerships_v2(
        where: {
          owner_address: {_eq: $address},
          amount: {_gt: "0"},
          token_standard: {_eq: "v2"}
        }
      ) {
        token_data_id
        amount
        property_version_v1
        current_token_data {
          token_name
          description
          token_uri
          collection_name
          token_properties
        }
      }
    }
  `;

  try {
    const response = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { address },
      }),
    });

    const data = await response.json();
    
    return data.data?.current_token_ownerships_v2?.map((item: any) => ({
      token_data_id: item.token_data_id,
      name: item.current_token_data?.token_name || 'Unnamed NFT',
      description: item.current_token_data?.description || '',
      uri: item.current_token_data?.token_uri || '',
      collection_name: item.current_token_data?.collection_name || 'Unknown Collection',
      property_version: item.property_version_v1 || '0',
      amount: item.amount,
    })) || [];
  } catch (error) {
    console.error('Error fetching user NFTs:', error);
    return [];
  }
}

// Fetch complete user portfolio
export async function getUserPortfolio(address: string): Promise<UserPortfolio> {
  const [tokens, nfts] = await Promise.all([
    getUserTokens(address),
    getUserNFTs(address),
  ]);

  return {
    tokens,
    nfts,
  };
}
