import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';

// Type definitions for GraphQL responses
interface FungibleAssetBalance {
  amount: string;
  asset_type: string;
  owner_address: string;
  storage_id: string;
  is_frozen: boolean;
  is_primary: boolean;
  last_transaction_version: string;
  last_transaction_timestamp: string;
}

interface FungibleAssetActivity {
  amount: string;
  asset_type: string;
  entry_function_id_str: string;
  event_index: number;
  owner_address: string;
  transaction_timestamp: string;
  transaction_version: string;
  type: string;
  storage_refund_amount?: string;
  eventData?: {
    fromTokenAddress?: string;
    toTokenAddress?: string;
    fromAmount?: string;
    toAmount?: string;
    ticket_count?: string;
    raffle_id?: string;
    total_paid?: string;
    ticket_ids?: string[];
  };
}

interface IndexerEvent {
  sequence_number: string;
  type: string;
  data: string | Record<string, unknown>;
  indexed_type: string;
  transaction_version: string;
  transaction_block_height?: string;
  creation_number?: string;
  account_address?: string;
}

interface AccountTransaction {
  account_address: string;
  transaction_version: string;
  user_transaction: {
    entry_function_id_str: string;
    timestamp: string;
  };
}

interface TokenOwnership {
  token_data_id: string;
  amount: string;
  owner_address: string;
  current_token_data: {
    token_name: string;
    token_uri: string;
    description: string;
    current_collection: {
      collection_name: string;
      creator_address: string;
      uri: string;
    };
  };
}

interface TransactionInfo {
  version: string;
  block_height: string;
  epoch: string;
  timestamp: string;
}

// Movement Indexer GraphQL endpoints
const INDEXER_ENDPOINTS = {
  mainnet: 'https://indexer.mainnet.movementnetwork.xyz/v1/graphql',
  testnet: 'https://hasura.testnet.movementnetwork.xyz/v1/graphql',
};

// Determine network from environment or default to testnet
const NETWORK = import.meta.env.VITE_NETWORK || 'testnet';

// Use backend proxy in production to avoid CORS issues
const BACKEND_URL = import.meta.env.VITE_API_URL || '';
const USE_PROXY = import.meta.env.PROD && BACKEND_URL;
const INDEXER_URL = USE_PROXY 
  ? `${BACKEND_URL}/api/indexer/graphql`
  : INDEXER_ENDPOINTS[NETWORK as keyof typeof INDEXER_ENDPOINTS];

// Create Apollo Client
const client = new ApolloClient({
  link: new HttpLink({
    uri: INDEXER_URL,
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
});

// GraphQL Queries
export const GET_TOKEN_BALANCES = gql`
  query GetTokenBalances($owner_address: String!) {
    current_fungible_asset_balances(
      where: { owner_address: { _eq: $owner_address } }
    ) {
      amount
      asset_type
      owner_address
      storage_id
      is_frozen
      is_primary
      last_transaction_version
      last_transaction_timestamp
    }
  }
`;

export const GET_TOKEN_ACTIVITIES_WITH_EVENTS = gql`
  query GetTokenActivitiesWithEvents($address: String!, $limit: Int = 20) {
    fungible_asset_activities(
      where: { 
        owner_address: { _eq: $address }
        type: { _nin: ["0x1::aptos_account::GasFeeEvent", "0x1::transaction_fee::FeeStatement"] }
      }
      order_by: { transaction_timestamp: desc }
      limit: $limit
    ) {
      amount
      asset_type
      entry_function_id_str
      event_index
      owner_address
      transaction_timestamp
      transaction_version
      type
      storage_refund_amount
    }
  }
`;

// Query for swap activities from AMM Router
export const GET_SWAP_ACTIVITIES = gql`
  query GetSwapActivities($address: String!, $limit: Int = 20) {
    fungible_asset_activities(
      where: { 
        owner_address: { _eq: $address }
        entry_function_id_str: { _like: "%amm_router::swap%" }
      }
      order_by: { transaction_timestamp: desc }
      limit: $limit
    ) {
      amount
      asset_type
      entry_function_id_str
      event_index
      owner_address
      transaction_timestamp
      transaction_version
      type
      storage_refund_amount
    }
  }
`;

// Query to get all activities for a specific transaction (to find all tokens involved)
export const GET_ACTIVITIES_BY_TRANSACTION = gql`
  query GetActivitiesByTransaction($transaction_version: bigint!) {
    fungible_asset_activities(
      where: { transaction_version: { _eq: $transaction_version } }
    ) {
      amount
      asset_type
      entry_function_id_str
      event_index
      owner_address
      transaction_timestamp
      transaction_version
      type
    }
  }
`;

export const GET_EVENTS_BY_TRANSACTION = gql`
  query GetEventsByTransaction($transaction_version: bigint!) {
    events(
      where: { transaction_version: { _eq: $transaction_version } }
    ) {
      sequence_number
      type
      data
      indexed_type
      transaction_version
    }
  }
`;

export const GET_ACCOUNT_TRANSACTIONS = gql`
  query GetAccountTransactions($address: String!, $limit: Int = 50) {
    account_transactions(
      where: { account_address: { _eq: $address } }
      order_by: { transaction_version: desc }
      limit: $limit
    ) {
      account_address
      transaction_version
      user_transaction {
        entry_function_id_str
        timestamp
      }
    }
  }
`;

// Query untuk raffle events dengan filter yang lebih baik - momeraffle only
export const GET_RAFFLE_TICKET_EVENTS = gql`
  query GetRaffleTicketEvents($contract_address: String!, $limit: Int = 100, $offset: Int = 0) {
    events(
      where: {
        account_address: { _eq: $contract_address }
        _or: [
          { type: { _like: "%momeraffle::BuyTicketEvent%" } }
          { indexed_type: { _like: "%momeraffle::BuyTicketEvent%" } }
        ]
      }
      order_by: { transaction_version: desc }
      limit: $limit
      offset: $offset
    ) {
      sequence_number
      type
      data
      indexed_type
      transaction_version
      transaction_block_height
      creation_number
      account_address
    }
  }
`;

// Query untuk mendapatkan SEMUA events dari contract (untuk debugging)
export const GET_CONTRACT_EVENTS = gql`
  query GetContractEvents($contract_address: String!, $limit: Int = 100) {
    events(
      where: {
        account_address: { _eq: $contract_address }
      }
      order_by: { transaction_version: desc }
      limit: $limit
    ) {
      sequence_number
      type
      data
      indexed_type
      transaction_version
      transaction_block_height
      creation_number
      account_address
    }
  }
`;

// Query untuk semua raffle events (ticket, creation, finalization) - momeraffle only
export const GET_ALL_RAFFLE_EVENTS = gql`
  query GetAllRaffleEvents($contract_address: String!, $limit: Int = 100, $offset: Int = 0) {
    events(
      where: {
        account_address: { _eq: $contract_address }
        _or: [
          { type: { _like: "%momeraffle::BuyTicketEvent%" } }
          { type: { _like: "%momeraffle::CreateRaffleEvent%" } }
          { type: { _like: "%momeraffle::FinalizeRaffleEvent%" } }
          { indexed_type: { _like: "%momeraffle::BuyTicketEvent%" } }
          { indexed_type: { _like: "%momeraffle::CreateRaffleEvent%" } }
          { indexed_type: { _like: "%momeraffle::FinalizeRaffleEvent%" } }
        ]
      }
      order_by: { transaction_version: desc }
      limit: $limit
      offset: $offset
    ) {
      sequence_number
      type
      data
      indexed_type
      transaction_version
      transaction_block_height
      creation_number
      account_address
    }
  }
`;

// Query untuk mendapatkan timestamp dari transaction
export const GET_TRANSACTION_TIMESTAMP = gql`
  query GetTransactionTimestamp($version: bigint!) {
    user_transactions(
      where: { version: { _eq: $version } }
      limit: 1
    ) {
      version
      block_height
      epoch
      timestamp
    }
  }
`;

// Query untuk raffle creation events - momeraffle only
export const GET_RAFFLE_CREATION_EVENTS = gql`
  query GetRaffleCreationEvents($contract_address: String!, $limit: Int = 50) {
    events(
      where: {
        account_address: { _eq: $contract_address }
        _or: [
          { type: { _like: "%momeraffle::CreateRaffleEvent%" } }
          { indexed_type: { _like: "%momeraffle::CreateRaffleEvent%" } }
        ]
      }
      order_by: { transaction_version: desc }
      limit: $limit
    ) {
      sequence_number
      type
      data
      indexed_type
      transaction_version
      transaction_block_height
    }
  }
`;

// Query untuk raffle finalization events - momeraffle only
export const GET_RAFFLE_FINALIZATION_EVENTS = gql`
  query GetRaffleFinalizationEvents($contract_address: String!, $limit: Int = 50) {
    events(
      where: {
        account_address: { _eq: $contract_address }
        _or: [
          { type: { _like: "%momeraffle::FinalizeRaffleEvent%" } }
          { indexed_type: { _like: "%momeraffle::FinalizeRaffleEvent%" } }
        ]
      }
      order_by: { transaction_version: desc }
      limit: $limit
    ) {
      sequence_number
      type
      data
      indexed_type
      transaction_version
      transaction_block_height
    }
  }
`;

export const GET_TRANSACTION_DETAILS = gql`
  query GetTransactionDetails($version: bigint!) {
    transactions(
      where: { version: { _eq: $version } }
    ) {
      version
      success
      gas_used
      payload
      events {
        type
        data
        sequence_number
      }
    }
  }
`;

export const GET_LARGE_TRANSFERS = gql`
  query GetLargeTransfers($min_amount: numeric!, $limit: Int = 20) {
    fungible_asset_activities(
      where: { 
        amount: { _gte: $min_amount }
      }
      order_by: { transaction_timestamp: desc }
      limit: $limit
    ) {
      amount
      asset_type
      owner_address
      transaction_timestamp
      transaction_version
      entry_function_id_str
      type
      storage_refund_amount
    }
  }
`;

export const GET_USER_NFTS = gql`
  query GetUserNFTs($owner_address: String!) {
    current_token_ownerships_v2(
      where: { owner_address: { _eq: $owner_address }, amount: { _gt: "0" } }
    ) {
      token_data_id
      amount
      owner_address
      current_token_data {
        token_name
        token_uri
        description
        current_collection {
          collection_name
          creator_address
          uri
        }
      }
    }
  }
`;

// Service functions

export const movementIndexerService = {
  /**
   * Get token balances for an address
   */
  async getTokenBalances(ownerAddress: string): Promise<FungibleAssetBalance[]> {
    try {
      const { data } = await client.query<{ current_fungible_asset_balances: FungibleAssetBalance[] }>({
        query: GET_TOKEN_BALANCES,
        variables: { owner_address: ownerAddress },
      });
      return data.current_fungible_asset_balances;
    } catch (error) {
      console.error('Error fetching token balances:', error);
      throw error;
    }
  },

  /**
   * Get events for a specific transaction
   */
  async getEventsByTransaction(transactionVersion: string): Promise<IndexerEvent[]> {
    try {
      const { data } = await client.query<{ events: IndexerEvent[] }>({
        query: GET_EVENTS_BY_TRANSACTION,
        variables: { transaction_version: transactionVersion },
      });
      return data.events;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  /**
   * Get all fungible asset activities for a specific transaction
   * This helps find all tokens involved in a swap
   */
  async getActivitiesByTransaction(transactionVersion: string): Promise<FungibleAssetActivity[]> {
    try {
      const { data } = await client.query<{ fungible_asset_activities: FungibleAssetActivity[] }>({
        query: GET_ACTIVITIES_BY_TRANSACTION,
        variables: { transaction_version: transactionVersion },
      });
      return data.fungible_asset_activities || [];
    } catch (error) {
      console.error('Error fetching activities by transaction:', error);
      return [];
    }
  },

  /**
   * Get token activity history for an address with event data
   */
  async getTokenActivitiesWithTransactions(address: string, limit = 20): Promise<FungibleAssetActivity[]> {
    try {
      // Get regular activities
      const { data: activitiesData } = await client.query<{ fungible_asset_activities: FungibleAssetActivity[] }>({
        query: GET_TOKEN_ACTIVITIES_WITH_EVENTS,
        variables: { address, limit: limit * 3 }, // Get more to account for duplicates
      });
      
      // Also get swap activities separately (they might be filtered out)
      let swapActivities: FungibleAssetActivity[] = [];
      try {
        const { data: swapData } = await client.query<{ fungible_asset_activities: FungibleAssetActivity[] }>({
          query: GET_SWAP_ACTIVITIES,
          variables: { address, limit: limit },
        });
        swapActivities = swapData.fungible_asset_activities || [];
      } catch (e) {
        // Swap activities query failed silently
      }
      
      // Combine all activities
      const allActivities = [...activitiesData.fungible_asset_activities, ...swapActivities];
      
      // Group activities by transaction_version
      // For swaps, we need to keep ALL activities to determine from/to tokens
      const activityMap = new Map<string, FungibleAssetActivity[]>();
      
      for (const activity of allActivities) {
        const txVersion = activity.transaction_version;
        
        if (!activityMap.has(txVersion)) {
          activityMap.set(txVersion, []);
        }
        
        // Add activity if not already present (check by event_index)
        const existing = activityMap.get(txVersion)!;
        const isDuplicate = existing.some(a => a.event_index === activity.event_index);
        if (!isDuplicate) {
          existing.push(activity);
        }
      }
      
      // Process each transaction's activities
      const processedActivities: FungibleAssetActivity[] = [];
      
      for (const [txVersion, activities] of activityMap.entries()) {
        // Check if this is a swap transaction
        const swapActivity = activities.find(a => 
          a.entry_function_id_str && a.entry_function_id_str.includes('amm_router::swap')
        );
        
        if (swapActivity) {
          // For swap, find the main activity (largest amount) and enrich with token info
          const mainActivity = activities.reduce((max, curr) => 
            parseInt(curr.amount) > parseInt(max.amount) ? curr : max
          );
          
          // Fetch ALL activities for this transaction to find all tokens involved
          // This is important because the user's activities might only show MOVE
          let allTxActivities = activities;
          try {
            const txActivities = await this.getActivitiesByTransaction(txVersion);
            if (txActivities && txActivities.length > 0) {
              allTxActivities = txActivities;
            }
          } catch (e) {
            // Could not fetch all tx activities, using existing
          }
          
          // Find all unique asset types in this transaction
          const assetTypes = [...new Set(allTxActivities.map((a: FungibleAssetActivity) => a.asset_type).filter(Boolean))];
          
          // Determine from/to tokens based on function name and asset types
          const funcName = swapActivity.entry_function_id_str;
          let fromTokenAddress = 'native';
          let toTokenAddress = 'native';
          
          // MOVE address variants - be more comprehensive
          const moveAddresses = [
            '0x000000000000000000000000000000000000000000000000000000000000000a',
            '0xa',
            '0x1::aptos_coin::AptosCoin',
            '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
          ];
          
          const isMoveAddress = (addr: string | null | undefined): boolean => {
            if (!addr) return true; // null/undefined = assume MOVE
            const lower = addr.toLowerCase();
            // Check if it's a MOVE address
            if (moveAddresses.some(m => lower.includes(m.toLowerCase()))) return true;
            if (lower === '0xa') return true;
            // Check if it starts with 0x1:: (system module)
            if (lower.startsWith('0x1::')) return true;
            return false;
          };
          
          // Find non-MOVE tokens in the transaction
          const nonMoveTokens = assetTypes.filter((t): t is string => typeof t === 'string' && !isMoveAddress(t));
          const nonMoveToken = nonMoveTokens.length > 0 ? nonMoveTokens[0] : null;
          
          if (funcName.includes('swap_exact_move_for_tokens')) {
            fromTokenAddress = 'native';
            // For MOVE -> Token swap, the output token should be in the activities
            toTokenAddress = nonMoveToken || 'native';
          } else if (funcName.includes('swap_exact_tokens_for_move')) {
            // For Token -> MOVE swap, the input token should be in the activities
            fromTokenAddress = nonMoveToken || 'native';
            toTokenAddress = 'native';
          } else if (funcName.includes('swap_exact_tokens_for_tokens')) {
            // For token-to-token, we need both tokens
            fromTokenAddress = nonMoveTokens[0] || 'native';
            toTokenAddress = nonMoveTokens[1] || nonMoveTokens[0] || 'native';
          }
          
          // If we still couldn't find the non-MOVE token, try to extract from entry_function_id_str
          // The function might contain type arguments with token addresses
          if (toTokenAddress === 'native' && funcName.includes('swap_exact_move_for_tokens')) {
            // Try to extract token address from the function call
            const tokenMatch = funcName.match(/0x[a-fA-F0-9]{64}/g);
            if (tokenMatch && tokenMatch.length > 0) {
              // Filter out known MOVE addresses
              const nonMoveMatch = tokenMatch.find(t => !isMoveAddress(t));
              if (nonMoveMatch) {
                toTokenAddress = nonMoveMatch;
              }
            }
          }
          
          // Calculate fromAmount and toAmount based on swap direction
          let fromAmount = mainActivity.amount;
          let toAmount = mainActivity.amount;
          
          // Find activities for each token type
          const fromTokenActivities = allTxActivities.filter((a: FungibleAssetActivity) => {
            if (fromTokenAddress === 'native') {
              return isMoveAddress(a.asset_type);
            }
            return a.asset_type && a.asset_type.toLowerCase().includes(fromTokenAddress.toLowerCase());
          });
          
          const toTokenActivities = allTxActivities.filter((a: FungibleAssetActivity) => {
            if (toTokenAddress === 'native') {
              return isMoveAddress(a.asset_type);
            }
            return a.asset_type && a.asset_type.toLowerCase().includes(toTokenAddress.toLowerCase());
          });
          
          // Get the amounts - use the largest amount for each token
          if (fromTokenActivities.length > 0) {
            const maxFromActivity = fromTokenActivities.reduce((max: FungibleAssetActivity, curr: FungibleAssetActivity) => 
              parseInt(curr.amount) > parseInt(max.amount) ? curr : max
            );
            fromAmount = maxFromActivity.amount;
          }
          
          if (toTokenActivities.length > 0) {
            const maxToActivity = toTokenActivities.reduce((max: FungibleAssetActivity, curr: FungibleAssetActivity) => 
              parseInt(curr.amount) > parseInt(max.amount) ? curr : max
            );
            toAmount = maxToActivity.amount;
          }
          
          processedActivities.push({
            ...mainActivity,
            eventData: {
              fromTokenAddress,
              toTokenAddress,
              fromAmount,
              toAmount,
            },
          });
        } else {
          // For non-swap transactions, keep the one with largest amount
          const mainActivity = activities.reduce((max, curr) => 
            parseInt(curr.amount) > parseInt(max.amount) ? curr : max
          );
          processedActivities.push(mainActivity);
        }
      }
      
      // Sort by timestamp and limit
      const uniqueActivities = processedActivities
        .sort((a, b) => parseInt(b.transaction_timestamp) - parseInt(a.transaction_timestamp))
        .slice(0, limit);
      
      // Enrich activities with event data (only for non-swap activities that need it)
      const enrichedActivities = await Promise.all(
        uniqueActivities.map(async (activity: FungibleAssetActivity) => {
          // Skip if already enriched (swap activities)
          if (activity.eventData) {
            return activity;
          }
          
          // Fetch events for buy_tickets activities
          if (activity.entry_function_id_str && 
              activity.entry_function_id_str.includes('buy_ticket')) {
            try {
              const events = await this.getEventsByTransaction(activity.transaction_version);
              
              // Find BuyTicketEvent
              const buyTicketEvent = events.find((event: IndexerEvent) => 
                event.type && event.type.includes('BuyTicketEvent')
              );
              
              if (buyTicketEvent && buyTicketEvent.data) {
                // Parse event data
                let eventData = buyTicketEvent.data;
                if (typeof eventData === 'string') {
                  eventData = JSON.parse(eventData);
                }
                
                return {
                  ...activity,
                  eventData: {
                    ticket_count: eventData.ticket_count,
                    raffle_id: eventData.raffle_id,
                    total_paid: eventData.total_paid,
                    ticket_ids: eventData.ticket_ids,
                  },
                };
              }
            } catch (e) {
              console.error('Error fetching events:', e);
            }
          }
          
          return activity;
        })
      );
      
      return enrichedActivities;
    } catch (error) {
      console.error('Error fetching token activities:', error);
      throw error;
    }
  },

  /**
   * Get token activity history for an address (legacy method)
   */
  async getTokenActivities(address: string, limit = 20): Promise<FungibleAssetActivity[]> {
    try {
      const { data } = await client.query<{ fungible_asset_activities: FungibleAssetActivity[] }>({
        query: GET_TOKEN_ACTIVITIES_WITH_EVENTS,
        variables: { address, limit },
      });
      return data.fungible_asset_activities;
    } catch (error) {
      console.error('Error fetching token activities:', error);
      throw error;
    }
  },

  /**
   * Get user transactions (legacy method - not used)
   */
  async getUserTransactions(_address: string, _limit = 50): Promise<never[]> {
    console.warn('getUserTransactions is deprecated, use REST API instead');
    return [];
  },

  /**
   * Get account transactions
   */
  async getAccountTransactions(address: string, limit = 50): Promise<AccountTransaction[]> {
    try {
      const { data } = await client.query<{ account_transactions: AccountTransaction[] }>({
        query: GET_ACCOUNT_TRANSACTIONS,
        variables: { address, limit },
      });
      return data.account_transactions;
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      throw error;
    }
  },

  /**
   * Get large token transfers
   */
  async getLargeTransfers(minAmount: string, limit = 20): Promise<FungibleAssetActivity[]> {
    try {
      const { data } = await client.query<{ fungible_asset_activities: FungibleAssetActivity[] }>({
        query: GET_LARGE_TRANSFERS,
        variables: { min_amount: minAmount, limit },
      });
      return data.fungible_asset_activities;
    } catch (error) {
      console.error('Error fetching large transfers:', error);
      throw error;
    }
  },

  /**
   * Get NFTs owned by an address
   */
  async getUserNFTs(ownerAddress: string): Promise<TokenOwnership[]> {
    try {
      const { data } = await client.query<{ current_token_ownerships_v2: TokenOwnership[] }>({
        query: GET_USER_NFTS,
        variables: { owner_address: ownerAddress },
      });
      return data.current_token_ownerships_v2;
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      throw error;
    }
  },

  /**
   * Get raffle ticket purchase events
   */
  async getRaffleTicketEvents(contractAddress: string, limit = 100, offset = 0): Promise<IndexerEvent[]> {
    try {
      const { data } = await client.query<{ events: IndexerEvent[] }>({
        query: GET_RAFFLE_TICKET_EVENTS,
        variables: { contract_address: contractAddress, limit, offset },
      });
      
      return data.events || [];
    } catch (error) {
      console.error('Error fetching raffle ticket events:', error);
      throw error;
    }
  },

  /**
   * Get ALL events from contract (for debugging)
   */
  async getContractEvents(contractAddress: string, limit = 100): Promise<IndexerEvent[]> {
    try {
      const { data } = await client.query<{ events: IndexerEvent[] }>({
        query: GET_CONTRACT_EVENTS,
        variables: { contract_address: contractAddress, limit },
      });
      
      return data.events || [];
    } catch (error) {
      console.error('Error fetching contract events:', error);
      throw error;
    }
  },

  /**
   * Get all raffle events (tickets, creation, finalization)
   */
  async getAllRaffleEvents(contractAddress: string, limit = 100, offset = 0): Promise<IndexerEvent[]> {
    try {
      const { data } = await client.query<{ events: IndexerEvent[] }>({
        query: GET_ALL_RAFFLE_EVENTS,
        variables: { contract_address: contractAddress, limit, offset },
      });
      
      return data.events || [];
    } catch (error) {
      console.error('Error fetching all raffle events:', error);
      throw error;
    }
  },

  /**
   * Get transaction timestamp
   */
  async getTransactionTimestamp(version: string): Promise<TransactionInfo | null> {
    try {
      const { data } = await client.query<{ user_transactions: TransactionInfo[] }>({
        query: GET_TRANSACTION_TIMESTAMP,
        variables: { version },
      });
      return data.user_transactions?.[0] || null;
    } catch (error) {
      console.error('Error fetching transaction timestamp:', error);
      return null;
    }
  },

  /**
   * Get Apollo Client instance for custom queries
   */
  getClient() {
    return client;
  },
};

export default movementIndexerService;
