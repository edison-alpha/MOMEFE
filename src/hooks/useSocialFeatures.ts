import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';
import {
  getComments,
  addComment,
  editComment,
  deleteComment,
  toggleCommentLike,
  getWatchlist,
  isInWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  trackView,
  getEngagement,
  Comment,
  RaffleEngagement,
  WatchlistItem,
} from '@/services/socialService';

// =====================================================
// COMMENTS HOOKS
// =====================================================

export const useComments = (raffleId: number | undefined, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['comments', raffleId, page, limit],
    queryFn: () => getComments(raffleId!, page, limit),
    enabled: !!raffleId,
    staleTime: 30 * 1000,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { user } = usePrivy();
  
  const userAddress = user?.linkedAccounts?.find(
    (account: any) => account.chainType === 'aptos'
  )?.address as string | undefined;

  return useMutation({
    mutationFn: async ({
      raffleId,
      content,
      parentId,
    }: {
      raffleId: number;
      content: string;
      parentId?: string;
    }) => {
      if (!userAddress) throw new Error('Wallet not connected');
      return addComment(raffleId, userAddress, content, parentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.raffleId] });
      queryClient.invalidateQueries({ queryKey: ['engagement', variables.raffleId] });
    },
  });
};

export const useEditComment = () => {
  const queryClient = useQueryClient();
  const { user } = usePrivy();
  
  const userAddress = user?.linkedAccounts?.find(
    (account: any) => account.chainType === 'aptos'
  )?.address as string | undefined;

  return useMutation({
    mutationFn: async ({
      commentId,
      content,
      raffleId,
    }: {
      commentId: string;
      content: string;
      raffleId: number;
    }) => {
      if (!userAddress) throw new Error('Wallet not connected');
      return editComment(commentId, userAddress, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.raffleId] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { user } = usePrivy();
  
  const userAddress = user?.linkedAccounts?.find(
    (account: any) => account.chainType === 'aptos'
  )?.address as string | undefined;

  return useMutation({
    mutationFn: async ({
      commentId,
      raffleId,
    }: {
      commentId: string;
      raffleId: number;
    }) => {
      if (!userAddress) throw new Error('Wallet not connected');
      return deleteComment(commentId, userAddress);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.raffleId] });
      queryClient.invalidateQueries({ queryKey: ['engagement', variables.raffleId] });
    },
  });
};

export const useToggleLike = () => {
  const queryClient = useQueryClient();
  const { user } = usePrivy();
  
  const userAddress = user?.linkedAccounts?.find(
    (account: any) => account.chainType === 'aptos'
  )?.address as string | undefined;

  return useMutation({
    mutationFn: async ({
      commentId,
      raffleId,
    }: {
      commentId: string;
      raffleId: number;
    }) => {
      if (!userAddress) throw new Error('Wallet not connected');
      return toggleCommentLike(commentId, userAddress);
    },
    // Optimistic update
    onMutate: async ({ commentId, raffleId }) => {
      await queryClient.cancelQueries({ queryKey: ['comments', raffleId] });
      
      const previousData = queryClient.getQueryData(['comments', raffleId]);
      
      // Optimistically update likes count
      queryClient.setQueryData(['comments', raffleId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          comments: old.comments.map((comment: Comment) => {
            if (comment.id === commentId) {
              return { ...comment, likes_count: comment.likes_count + 1 };
            }
            return comment;
          }),
        };
      });
      
      return { previousData };
    },
    onError: (_, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['comments', variables.raffleId], context.previousData);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.raffleId] });
    },
  });
};

// =====================================================
// WATCHLIST HOOKS
// =====================================================

export const useWatchlist = () => {
  const { user } = usePrivy();
  
  const userAddress = user?.linkedAccounts?.find(
    (account: any) => account.chainType === 'aptos'
  )?.address as string | undefined;

  return useQuery({
    queryKey: ['watchlist', userAddress],
    queryFn: () => getWatchlist(userAddress!),
    enabled: !!userAddress,
    staleTime: 60 * 1000,
  });
};

export const useIsWatching = (raffleId: number | undefined) => {
  const { user } = usePrivy();
  
  const userAddress = user?.linkedAccounts?.find(
    (account: any) => account.chainType === 'aptos'
  )?.address as string | undefined;

  return useQuery({
    queryKey: ['isWatching', userAddress, raffleId],
    queryFn: () => isInWatchlist(userAddress!, raffleId!),
    enabled: !!userAddress && !!raffleId,
    staleTime: 60 * 1000,
  });
};

export const useToggleWatchlist = () => {
  const queryClient = useQueryClient();
  const { user } = usePrivy();
  
  const userAddress = user?.linkedAccounts?.find(
    (account: any) => account.chainType === 'aptos'
  )?.address as string | undefined;

  return useMutation({
    mutationFn: async ({
      raffleId,
      isCurrentlyWatching,
    }: {
      raffleId: number;
      isCurrentlyWatching: boolean;
    }) => {
      if (!userAddress) throw new Error('Wallet not connected');
      
      if (isCurrentlyWatching) {
        return removeFromWatchlist(userAddress, raffleId);
      } else {
        return addToWatchlist(userAddress, raffleId);
      }
    },
    // Optimistic update
    onMutate: async ({ raffleId, isCurrentlyWatching }) => {
      await queryClient.cancelQueries({ queryKey: ['isWatching', userAddress, raffleId] });
      await queryClient.cancelQueries({ queryKey: ['watchlist', userAddress] });
      await queryClient.cancelQueries({ queryKey: ['engagement', raffleId] });
      
      const previousIsWatching = queryClient.getQueryData(['isWatching', userAddress, raffleId]);
      const previousWatchlist = queryClient.getQueryData(['watchlist', userAddress]);
      const previousEngagement = queryClient.getQueryData(['engagement', raffleId]);
      
      // Optimistically update
      queryClient.setQueryData(['isWatching', userAddress, raffleId], !isCurrentlyWatching);
      
      queryClient.setQueryData(['engagement', raffleId], (old: RaffleEngagement | undefined) => {
        if (!old) return old;
        return {
          ...old,
          watchlist_count: isCurrentlyWatching 
            ? Math.max(0, old.watchlist_count - 1) 
            : old.watchlist_count + 1,
        };
      });
      
      return { previousIsWatching, previousWatchlist, previousEngagement };
    },
    onError: (_, variables, context) => {
      if (context) {
        queryClient.setQueryData(
          ['isWatching', userAddress, variables.raffleId],
          context.previousIsWatching
        );
        queryClient.setQueryData(['watchlist', userAddress], context.previousWatchlist);
        queryClient.setQueryData(['engagement', variables.raffleId], context.previousEngagement);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['isWatching', userAddress, variables.raffleId] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', userAddress] });
      queryClient.invalidateQueries({ queryKey: ['engagement', variables.raffleId] });
    },
  });
};

// =====================================================
// ENGAGEMENT HOOKS
// =====================================================

export const useEngagement = (raffleId: number | undefined) => {
  return useQuery({
    queryKey: ['engagement', raffleId],
    queryFn: () => getEngagement(raffleId!),
    enabled: !!raffleId,
    staleTime: 30 * 1000,
  });
};

export const useTrackView = (raffleId: number | undefined) => {
  const { user } = usePrivy();
  
  const userAddress = user?.linkedAccounts?.find(
    (account: any) => account.chainType === 'aptos'
  )?.address as string | undefined;

  useEffect(() => {
    if (raffleId) {
      // Track view when component mounts
      trackView(raffleId, userAddress);
    }
  }, [raffleId, userAddress]);
};

// Combined hook for raffle detail page
export const useRaffleSocial = (raffleId: number | undefined) => {
  const { user } = usePrivy();
  
  const userAddress = user?.linkedAccounts?.find(
    (account: any) => account.chainType === 'aptos'
  )?.address as string | undefined;

  // Track view on mount
  useTrackView(raffleId);

  const engagement = useEngagement(raffleId);
  const isWatching = useIsWatching(raffleId);
  const comments = useComments(raffleId);
  const toggleWatchlist = useToggleWatchlist();
  const addCommentMutation = useAddComment();
  const toggleLike = useToggleLike();

  return {
    userAddress,
    engagement: engagement.data,
    isEngagementLoading: engagement.isLoading,
    isWatching: isWatching.data || false,
    isWatchingLoading: isWatching.isLoading,
    comments: comments.data?.comments || [],
    commentsTotal: comments.data?.total || 0,
    isCommentsLoading: comments.isLoading,
    toggleWatchlist: (isCurrentlyWatching: boolean) => {
      if (raffleId) {
        toggleWatchlist.mutate({ raffleId, isCurrentlyWatching });
      }
    },
    addComment: (content: string, parentId?: string) => {
      if (raffleId) {
        return addCommentMutation.mutateAsync({ raffleId, content, parentId });
      }
    },
    toggleLike: (commentId: string) => {
      if (raffleId) {
        toggleLike.mutate({ commentId, raffleId });
      }
    },
    isAddingComment: addCommentMutation.isPending,
  };
};
