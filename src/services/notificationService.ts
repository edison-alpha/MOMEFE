// Backend API URL
const API_BASE = import.meta.env.VITE_API_URL;

export interface Notification {
  id: string;
  user_address: string;
  type: 'ticket_purchased' | 'raffle_won' | 'raffle_ended' | 'raffle_sold_out' | 
        'prize_claimed' | 'new_participant' | 'raffle_created' | 'raffle_finalized' | 'system';
  title: string;
  message: string;
  raffle_id?: number;
  related_address?: string;
  amount?: number;
  transaction_hash?: string;
  is_read: boolean;
  created_at: string;
}

export interface UserTicket {
  id: string;
  user_address: string;
  raffle_id: number;
  ticket_count: number;
  total_spent: number;
  first_purchase_at: string;
  last_purchase_at: string;
}

export interface CreateNotificationParams {
  user_address: string;
  type: Notification['type'];
  title: string;
  message: string;
  raffle_id?: number;
  related_address?: string;
  amount?: number;
  transaction_hash?: string;
}

/**
 * Create a notification (call after successful transaction)
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  if (!API_BASE) {
    console.warn('[notificationService] API_BASE not configured');
    return false;
  }

  try {
    const response = await fetch(`${API_BASE}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    if (response.ok) {
      const json = await response.json();
      return json.success;
    }
    return false;
  } catch (error) {
    console.error('[createNotification] Error:', error);
    return false;
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userAddress: string,
  limit = 50,
  unreadOnly = false
): Promise<Notification[]> {
  if (!API_BASE) {
    console.warn('[notificationService] API_BASE not configured');
    return [];
  }

  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (unreadOnly) params.append('unreadOnly', 'true');
    
    const response = await fetch(`${API_BASE}/api/notifications/${userAddress}?${params}`);
    if (response.ok) {
      const json = await response.json();
      if (json.success) {
        return json.data;
      }
    }
    return [];
  } catch (error) {
    console.error('[getUserNotifications] Error:', error);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userAddress: string): Promise<number> {
  if (!API_BASE) return 0;

  try {
    const response = await fetch(`${API_BASE}/api/notifications/${userAddress}/unread-count`);
    if (response.ok) {
      const json = await response.json();
      if (json.success) {
        return json.data.count;
      }
    }
    return 0;
  } catch (error) {
    console.error('[getUnreadCount] Error:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  if (!API_BASE) return false;

  try {
    const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
    if (response.ok) {
      const json = await response.json();
      return json.success;
    }
    return false;
  } catch (error) {
    console.error('[markAsRead] Error:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userAddress: string): Promise<boolean> {
  if (!API_BASE) return false;

  try {
    const response = await fetch(`${API_BASE}/api/notifications/${userAddress}/read-all`, {
      method: 'PUT',
    });
    if (response.ok) {
      const json = await response.json();
      return json.success;
    }
    return false;
  } catch (error) {
    console.error('[markAllAsRead] Error:', error);
    return false;
  }
}

/**
 * Get user's tickets across all raffles
 */
export async function getUserTickets(userAddress: string): Promise<UserTicket[]> {
  if (!API_BASE) {
    console.warn('[notificationService] API_BASE not configured');
    return [];
  }

  try {
    const response = await fetch(`${API_BASE}/api/notifications/${userAddress}/tickets`);
    if (response.ok) {
      const json = await response.json();
      if (json.success) {
        return json.data;
      }
    }
    return [];
  } catch (error) {
    console.error('[getUserTickets] Error:', error);
    return [];
  }
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: Notification['type']): string {
  switch (type) {
    case 'ticket_purchased':
      return '🎫';
    case 'raffle_won':
      return '🏆';
    case 'raffle_ended':
      return '⏰';
    case 'raffle_sold_out':
      return '🎉';
    case 'prize_claimed':
      return '💰';
    case 'new_participant':
      return '👤';
    case 'raffle_created':
      return '✨';
    case 'raffle_finalized':
      return '🎲';
    case 'system':
      return '📢';
    default:
      return '🔔';
  }
}

/**
 * Format notification time
 */
export function formatNotificationTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
