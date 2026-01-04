import { movementIndexerService } from './movementIndexerService';
import { RAFFLE_CONTRACT_ADDRESS } from '@/lib/raffle-contract';

// Backend API URL (optional - fallback to direct indexer)
const API_BASE = import.meta.env.VITE_API_URL;

// Raffle metadata included in activity response from backend
export interface RaffleMetadata {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  ticketPrice: number;
  totalTickets: number;
  ticketsSold: number;
  prizeAmount: number;
  creator: string;
  status: number;
}

export interface RaffleActivity {
  type: 'ticket_purchase' | 'raffle_created' | 'raffle_finalized';
  buyer?: string;
  creator?: string;
  winner?: string;
  raffleId: number;
  ticketCount?: number;
  totalPaid?: number;
  prizeAmount?: number;
  timestamp: string | number; // Can be ISO string from indexer or number (microseconds)
  transactionVersion: string;
  blockHeight: number;
  // Enriched raffle data from backend (optional)
  raffle?: RaffleMetadata;
}

export interface LeaderboardEntry {
  address: string;
  totalTickets: number;
  totalSpent: number;
  raffleCount: number;
  rank: number;
}

export interface RaffleStats {
  totalTicketsSold: number;
  totalVolume: number;
  uniqueParticipants: number;
  averageTicketsPerUser: number;
}

/**
 * Parse event data dari indexer
 */
function parseEventData(event: any): RaffleActivity | null {
  try {
    let eventData = event.data;
    if (typeof eventData === 'string') {
      try {
        eventData = JSON.parse(eventData);
      } catch (e) {
        console.error('[parseEventData] Failed to parse JSON:', e);
        return null;
      }
    }

    // Use both type and indexed_type for compatibility
    const eventType = event.type || event.indexed_type;

    // BuyTicketEvent
    if (eventType && eventType.includes('BuyTicketEvent')) {
      const activity = {
        type: 'ticket_purchase' as const,
        buyer: String(eventData.buyer || eventData.user || ''),
        raffleId: Number(eventData.raffle_id || eventData.raffleId || 0),
        ticketCount: Number(eventData.ticket_count || eventData.ticketCount || 0),
        totalPaid: Number(eventData.total_paid || eventData.totalPaid || 0) / 100000000, // Convert octas to MOVE
        timestamp: 0, // Will be enriched
        transactionVersion: String(event.transaction_version),
        blockHeight: Number(event.transaction_block_height),
      };
      return activity;
    }

    // CreateRaffleEvent (not RaffleCreatedEvent)
    // Note: CreateRaffleEvent doesn't have prize_amount field
    // Available fields: raffle_id, creator, title, ticket_price, total_tickets, target_amount, end_time
    if (eventType && (eventType.includes('CreateRaffleEvent') || eventType.includes('RaffleCreatedEvent'))) {
      // Calculate prize amount from ticket_price * total_tickets or use target_amount
      const ticketPrice = Number(eventData.ticket_price || eventData.ticketPrice || 0);
      const totalTickets = Number(eventData.total_tickets || eventData.totalTickets || 0);
      const targetAmount = Number(eventData.target_amount || eventData.targetAmount || 0);
      
      // Use target_amount if available, otherwise calculate from ticket_price * total_tickets
      const prizeAmountOctas = targetAmount > 0 ? targetAmount : (ticketPrice * totalTickets);
      
      return {
        type: 'raffle_created',
        creator: String(eventData.creator || ''),
        raffleId: Number(eventData.raffle_id || eventData.raffleId || 0),
        prizeAmount: prizeAmountOctas / 100000000, // Convert octas to MOVE
        timestamp: 0, // Will be enriched
        transactionVersion: String(event.transaction_version),
        blockHeight: Number(event.transaction_block_height),
      };
    }

    // FinalizeRaffleEvent (not RaffleFinalizedEvent) - try multiple field name variations
    if (eventType && (eventType.includes('FinalizeRaffleEvent') || eventType.includes('RaffleFinalizedEvent'))) {
      const activity = {
        type: 'raffle_finalized' as const,
        winner: String(eventData.winner || eventData.winner_address || ''),
        raffleId: Number(eventData.raffle_id || eventData.raffleId || 0),
        prizeAmount: Number(eventData.prize_amount || eventData.prizeAmount || eventData.amount || 0) / 100000000,
        timestamp: 0, // Will be enriched
        transactionVersion: String(event.transaction_version),
        blockHeight: Number(event.transaction_block_height),
      };
      return activity;
    }

    return null;
  } catch (error) {
    console.error('[parseEventData] Error parsing event data:', error, event);
    return null;
  }
}

/**
 * Enrich activities dengan timestamp (batch processing)
 */
async function enrichWithTimestamps(activities: RaffleActivity[]): Promise<RaffleActivity[]> {
  // Group by transaction version untuk batch query
  const uniqueVersions = [...new Set(activities.map(a => a.transactionVersion))];
  
  // Fetch timestamps in parallel
  const timestampPromises = uniqueVersions.map(version => 
    movementIndexerService.getTransactionTimestamp(version)
  );
  
  const timestamps = await Promise.all(timestampPromises);
  
  const timestampMap = new Map(
    timestamps
      .filter((t): t is { version: string; timestamp: string } => t !== null)
      .map(t => [String(t.version), t.timestamp])
  );

  // Enrich activities
  const enriched = activities.map(activity => ({
    ...activity,
    timestamp: timestampMap.get(activity.transactionVersion) || new Date().toISOString(),
  })) as RaffleActivity[];
  
  return enriched;
}

/**
 * Get activity feed untuk raffle tertentu
 * Uses backend API with Redis caching
 */
export async function getRaffleActivity(
  raffleId: number,
  limit = 50
): Promise<RaffleActivity[]> {
  try {
    // Try backend API first
    if (API_BASE) {
      try {
        const response = await fetch(`${API_BASE}/api/activity/raffle/${raffleId}?limit=${limit}`);
        if (response.ok) {
          const json = await response.json();
          if (json.success) {
            return json.data;
          }
        }
      } catch (apiError) {
        console.warn('[getRaffleActivity] Backend API failed, falling back to direct indexer');
      }
    }
    
    // Fallback to direct indexer
    let events = await movementIndexerService.getAllRaffleEvents(
      RAFFLE_CONTRACT_ADDRESS,
      500,
      0
    );

    if (events.length === 0) {
      events = await movementIndexerService.getContractEvents(
        RAFFLE_CONTRACT_ADDRESS,
        500
      );
    }

    if (events.length === 0) {
      return [];
    }

    const allParsedActivities = events
      .map(parseEventData)
      .filter((activity): activity is RaffleActivity => activity !== null);

    const activities = allParsedActivities
      .filter(activity => activity.raffleId === raffleId)
      .slice(0, limit);

    return await enrichWithTimestamps(activities);
  } catch (error) {
    console.error('Error fetching raffle activity:', error);
    return [];
  }
}

/**
 * Get global activity feed (semua raffle)
 * Uses backend API with Redis caching for better performance
 */
export async function getGlobalActivity(limit = 50): Promise<RaffleActivity[]> {
  try {
    // Try backend API first (if configured)
    if (API_BASE) {
      try {
        const response = await fetch(`${API_BASE}/api/activity/global?limit=${limit}`);
        if (response.ok) {
          const json = await response.json();
          if (json.success) {
            return json.data;
          }
        }
      } catch (apiError) {
        console.warn('[getGlobalActivity] Backend API failed, falling back to direct indexer:', apiError);
      }
    }
    
    // Fallback to direct indexer
    const events = await movementIndexerService.getAllRaffleEvents(
      RAFFLE_CONTRACT_ADDRESS,
      limit * 2,
      0
    );

    const activities = events
      .map(parseEventData)
      .filter((activity): activity is RaffleActivity => activity !== null);

    const enriched = await enrichWithTimestamps(activities);
    return enriched.slice(0, limit);
  } catch (error) {
    console.error('Error fetching global activity:', error);
    return [];
  }
}

/**
 * Get leaderboard untuk raffle tertentu
 * Uses backend API with Redis caching
 */
export async function getRaffleLeaderboard(
  raffleId: number,
  limit = 100
): Promise<LeaderboardEntry[]> {
  try {
    // Try backend API first
    if (API_BASE) {
      try {
        const response = await fetch(`${API_BASE}/api/leaderboard/raffle/${raffleId}?limit=${limit}`);
        if (response.ok) {
          const json = await response.json();
          if (json.success) {
            return json.data;
          }
        }
      } catch (apiError) {
        console.warn('[getRaffleLeaderboard] Backend API failed, falling back to direct indexer');
      }
    }
    
    // Fallback to direct indexer
    const events = await movementIndexerService.getRaffleTicketEvents(
      RAFFLE_CONTRACT_ADDRESS,
      5000,
      0
    );

    const userStats = new Map<string, { tickets: number; spent: number }>();

    events.forEach((event: any) => {
      const activity = parseEventData(event);
      if (!activity || activity.type !== 'ticket_purchase' || activity.raffleId !== raffleId) {
        return;
      }

      const buyer = activity.buyer!;
      const existing = userStats.get(buyer) || { tickets: 0, spent: 0 };
      userStats.set(buyer, {
        tickets: existing.tickets + (activity.ticketCount || 0),
        spent: existing.spent + (activity.totalPaid || 0),
      });
    });

    return Array.from(userStats.entries())
      .map(([address, stats]) => ({
        address,
        totalTickets: stats.tickets,
        totalSpent: stats.spent,
        raffleCount: 1,
        rank: 0,
      }))
      .sort((a, b) => b.totalTickets - a.totalTickets)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  } catch (error) {
    console.error('Error fetching raffle leaderboard:', error);
    return [];
  }
}

/**
 * Get global leaderboard (semua raffle)
 * Uses backend API with Redis caching
 */
export async function getGlobalLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  try {
    // Try backend API first
    if (API_BASE) {
      try {
        const response = await fetch(`${API_BASE}/api/leaderboard/global?limit=${limit}`);
        if (response.ok) {
          const json = await response.json();
          if (json.success) {
            return json.data;
          }
        }
      } catch (apiError) {
        console.warn('[getGlobalLeaderboard] Backend API failed, falling back to direct indexer');
      }
    }
    
    // Fallback to direct indexer
    const events = await movementIndexerService.getRaffleTicketEvents(
      RAFFLE_CONTRACT_ADDRESS,
      10000,
      0
    );

    const userStats = new Map<string, { 
      tickets: number; 
      spent: number; 
      raffles: Set<number> 
    }>();

    events.forEach((event: any) => {
      const activity = parseEventData(event);
      if (!activity || activity.type !== 'ticket_purchase') {
        return;
      }

      const buyer = activity.buyer!;
      const existing = userStats.get(buyer) || { 
        tickets: 0, 
        spent: 0, 
        raffles: new Set() 
      };
      
      userStats.set(buyer, {
        tickets: existing.tickets + (activity.ticketCount || 0),
        spent: existing.spent + (activity.totalPaid || 0),
        raffles: existing.raffles.add(activity.raffleId),
      });
    });

    return Array.from(userStats.entries())
      .map(([address, stats]) => ({
        address,
        totalTickets: stats.tickets,
        totalSpent: stats.spent,
        raffleCount: stats.raffles.size,
        rank: 0,
      }))
      .sort((a, b) => b.totalTickets - a.totalTickets)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    return [];
  }
}

/**
 * Get raffle statistics
 * Uses backend API with Redis caching
 */
export async function getRaffleStats(raffleId?: number): Promise<RaffleStats> {
  try {
    // Try backend API first
    if (API_BASE) {
      try {
        const endpoint = raffleId !== undefined 
          ? `${API_BASE}/api/stats/raffle/${raffleId}`
          : `${API_BASE}/api/stats/platform`;
        const response = await fetch(endpoint);
        if (response.ok) {
          const json = await response.json();
          if (json.success) {
            return json.data;
          }
        }
      } catch (apiError) {
        console.warn('[getRaffleStats] Backend API failed, falling back to direct indexer');
      }
    }
    
    // Fallback to direct indexer
    const events = await movementIndexerService.getRaffleTicketEvents(
      RAFFLE_CONTRACT_ADDRESS,
      10000,
      0
    );

    const activities = events
      .map(parseEventData)
      .filter((activity): activity is RaffleActivity => 
        activity !== null && 
        activity.type === 'ticket_purchase' &&
        (raffleId === undefined || activity.raffleId === raffleId)
      );

    const uniqueParticipants = new Set(activities.map(a => a.buyer)).size;
    const totalTickets = activities.reduce((sum, a) => sum + (a.ticketCount || 0), 0);
    const totalVolume = activities.reduce((sum, a) => sum + (a.totalPaid || 0), 0);

    return {
      totalTicketsSold: totalTickets,
      totalVolume,
      uniqueParticipants,
      averageTicketsPerUser: uniqueParticipants > 0 ? totalTickets / uniqueParticipants : 0,
    };
  } catch (error) {
    console.error('Error fetching raffle stats:', error);
    return {
      totalTicketsSold: 0,
      totalVolume: 0,
      uniqueParticipants: 0,
      averageTicketsPerUser: 0,
    };
  }
}

/**
 * Get user activity (for Profile page)
 * Uses backend API with Redis caching
 */
export async function getUserActivity(
  userAddress: string,
  limit = 50
): Promise<RaffleActivity[]> {
  try {
    // Try backend API first
    if (API_BASE) {
      try {
        const response = await fetch(`${API_BASE}/api/activity/user/${userAddress}?limit=${limit}`);
        if (response.ok) {
          const json = await response.json();
          if (json.success) {
            return json.data;
          }
        }
      } catch (apiError) {
        console.warn('[getUserActivity] Backend API failed, falling back to direct indexer');
      }
    }
    
    // Fallback to direct indexer
    const events = await movementIndexerService.getAllRaffleEvents(
      RAFFLE_CONTRACT_ADDRESS,
      1000,
      0
    );

    const activities = events
      .map(parseEventData)
      .filter((activity): activity is RaffleActivity => 
        activity !== null && 
        (activity.buyer === userAddress || 
         activity.creator === userAddress || 
         activity.winner === userAddress)
      )
      .slice(0, limit);

    return await enrichWithTimestamps(activities);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return [];
  }
}
