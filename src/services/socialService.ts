const API_BASE = import.meta.env.VITE_API_URL || '';

// =====================================================
// TYPES
// =====================================================

export interface Comment {
  id: string;
  raffle_id: number;
  user_address: string;
  content: string;
  parent_id: string | null;
  is_edited: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
  reply_count?: number;
}

export interface RaffleEngagement {
  raffle_id: number;
  view_count: number;
  unique_viewers: number;
  watchlist_count: number;
  comment_count: number;
  updated_at?: string;
}

export interface WatchlistItem {
  id: string;
  raffle_id: number;
  created_at: string;
}

// =====================================================
// COMMENTS API
// =====================================================

export const getComments = async (
  raffleId: number,
  page = 1,
  limit = 20
): Promise<{ comments: Comment[]; total: number; totalPages: number }> => {
  try {
    const response = await fetch(
      `${API_BASE}/api/social/raffles/${raffleId}/comments?page=${page}&limit=${limit}`
    );
    const data = await response.json();
    
    if (!data.success) throw new Error(data.error);
    
    return {
      comments: data.data || [],
      total: data.pagination?.total || 0,
      totalPages: data.pagination?.totalPages || 0,
    };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { comments: [], total: 0, totalPages: 0 };
  }
};

export const addComment = async (
  raffleId: number,
  userAddress: string,
  content: string,
  parentId?: string
): Promise<Comment | null> => {
  try {
    const response = await fetch(`${API_BASE}/api/social/raffles/${raffleId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_address: userAddress,
        content,
        parent_id: parentId,
      }),
    });
    const data = await response.json();
    
    if (!data.success) throw new Error(data.error);
    
    return data.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const editComment = async (
  commentId: string,
  userAddress: string,
  content: string
): Promise<Comment | null> => {
  try {
    const response = await fetch(`${API_BASE}/api/social/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_address: userAddress, content }),
    });
    const data = await response.json();
    
    if (!data.success) throw new Error(data.error);
    
    return data.data;
  } catch (error) {
    console.error('Error editing comment:', error);
    throw error;
  }
};

export const deleteComment = async (
  commentId: string,
  userAddress: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/api/social/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_address: userAddress }),
    });
    const data = await response.json();
    
    return data.success;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
};

export const toggleCommentLike = async (
  commentId: string,
  userAddress: string
): Promise<'liked' | 'unliked' | null> => {
  try {
    const response = await fetch(`${API_BASE}/api/social/comments/${commentId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_address: userAddress }),
    });
    const data = await response.json();
    
    if (!data.success) throw new Error(data.error);
    
    return data.action;
  } catch (error) {
    console.error('Error toggling like:', error);
    return null;
  }
};

// =====================================================
// WATCHLIST API
// =====================================================

export const getWatchlist = async (userAddress: string): Promise<WatchlistItem[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/social/watchlist/${userAddress}`);
    const data = await response.json();
    
    if (!data.success) throw new Error(data.error);
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return [];
  }
};

export const isInWatchlist = async (
  userAddress: string,
  raffleId: number
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${API_BASE}/api/social/watchlist/${userAddress}/${raffleId}`
    );
    const data = await response.json();
    
    return data.isWatching || false;
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
};

export const addToWatchlist = async (
  userAddress: string,
  raffleId: number
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/api/social/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_address: userAddress, raffle_id: raffleId }),
    });
    const data = await response.json();
    
    return data.success;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return false;
  }
};

export const removeFromWatchlist = async (
  userAddress: string,
  raffleId: number
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${API_BASE}/api/social/watchlist/${userAddress}/${raffleId}`,
      { method: 'DELETE' }
    );
    const data = await response.json();
    
    return data.success;
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return false;
  }
};

// =====================================================
// VIEW COUNT API
// =====================================================

export const trackView = async (
  raffleId: number,
  userAddress?: string
): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE}/api/social/raffles/${raffleId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_address: userAddress }),
    });
    const data = await response.json();
    
    return data.view_count || 0;
  } catch (error) {
    console.error('Error tracking view:', error);
    return 0;
  }
};

export const getEngagement = async (raffleId: number): Promise<RaffleEngagement> => {
  try {
    const response = await fetch(`${API_BASE}/api/social/raffles/${raffleId}/engagement`);
    const data = await response.json();
    
    if (!data.success) throw new Error(data.error);
    
    return data.data;
  } catch (error) {
    console.error('Error fetching engagement:', error);
    return {
      raffle_id: raffleId,
      view_count: 0,
      unique_viewers: 0,
      watchlist_count: 0,
      comment_count: 0,
    };
  }
};

export const getPopularRaffles = async (limit = 10): Promise<RaffleEngagement[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/social/popular?limit=${limit}`);
    const data = await response.json();
    
    if (!data.success) throw new Error(data.error);
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching popular raffles:', error);
    return [];
  }
};
