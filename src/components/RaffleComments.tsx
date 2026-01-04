import { useState } from 'react';
import { MessageCircle, Heart, Reply, MoreHorizontal, Send, Loader2 } from 'lucide-react';
import { useComments, useAddComment, useToggleLike, useDeleteComment } from '@/hooks/useSocialFeatures';
import { getAvatarFromAddress } from '@/lib/avatarUtils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { Comment } from '@/services/socialService';

interface RaffleCommentsProps {
  raffleId: number;
  userAddress?: string;
}

const CommentItem = ({
  comment,
  raffleId,
  userAddress,
  onReply,
  depth = 0,
}: {
  comment: Comment;
  raffleId: number;
  userAddress?: string;
  onReply: (parentId: string) => void;
  depth?: number;
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const toggleLike = useToggleLike();
  const deleteComment = useDeleteComment();

  const isOwner = userAddress?.toLowerCase() === comment.user_address.toLowerCase();
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  const handleLike = () => {
    if (!userAddress) {
      toast.error('Please connect your wallet to like comments');
      return;
    }
    toggleLike.mutate({ commentId: comment.id, raffleId });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment.mutate({ commentId: comment.id, raffleId });
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l border-white/10 pl-4' : ''}`}>
      <div className="flex gap-3 py-3">
        {/* Avatar */}
        <div className="flex-shrink-0 text-2xl">
          {getAvatarFromAddress(comment.user_address)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-white">
              {comment.user_address.slice(0, 6)}...{comment.user_address.slice(-4)}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">{timeAgo}</span>
            {comment.is_edited && (
              <span className="text-xs text-gray-500">(edited)</span>
            )}
          </div>

          {/* Comment text */}
          <p className="text-sm text-gray-300 break-words">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              <Heart className={`w-3.5 h-3.5 ${comment.likes_count > 0 ? 'fill-red-400 text-red-400' : ''}`} />
              <span>{comment.likes_count || ''}</span>
            </button>

            {depth === 0 && (
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            )}

            {isOwner && (
              <button
                onClick={handleDelete}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            )}
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {!showReplies && comment.reply_count && comment.reply_count > 0 && (
                <button
                  onClick={() => setShowReplies(true)}
                  className="text-xs text-primary hover:underline"
                >
                  View {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                </button>
              )}
              {showReplies && (
                <div className="space-y-0">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      raffleId={raffleId}
                      userAddress={userAddress}
                      onReply={onReply}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RaffleComments = ({ raffleId, userAddress }: RaffleCommentsProps) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  const { data, isLoading } = useComments(raffleId);
  const addComment = useAddComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userAddress) {
      toast.error('Please connect your wallet to comment');
      return;
    }

    if (!newComment.trim()) return;

    try {
      await addComment.mutateAsync({
        raffleId,
        content: newComment.trim(),
        parentId: replyingTo || undefined,
      });
      setNewComment('');
      setReplyingTo(null);
      toast.success('Comment added!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment');
    }
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    // Focus on input
    document.getElementById('comment-input')?.focus();
  };

  const comments = data?.comments || [];

  return (
    <div className="bg-[#1A1A1E] border border-white/10 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-white">Comments</h3>
        <span className="text-xs text-gray-500">({data?.total || 0})</span>
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="mb-4">
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
            <span>Replying to comment</span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-primary hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            id="comment-input"
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={userAddress ? "Write a comment..." : "Connect wallet to comment"}
            disabled={!userAddress || addComment.isPending}
            maxLength={500}
            className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!userAddress || !newComment.trim() || addComment.isPending}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {addComment.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="text-right mt-1">
          <span className="text-xs text-gray-500">{newComment.length}/500</span>
        </div>
      </form>

      {/* Comments List */}
      <div className="divide-y divide-white/5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              raffleId={raffleId}
              userAddress={userAddress}
              onReply={handleReply}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default RaffleComments;
