import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Loader2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getNotificationIcon,
  formatNotificationTime,
  type Notification,
} from '@/services/notificationService';
import { getAvatarFromAddress } from '@/lib/avatarUtils';

interface NotificationDropdownProps {
  userAddress: string;
}

const NotificationDropdown = ({ userAddress }: NotificationDropdownProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && userAddress) {
      fetchNotifications();
    }
  }, [isOpen, userAddress]);

  // Fetch unread count periodically
  useEffect(() => {
    if (!userAddress) return;

    const fetchUnread = async () => {
      const count = await getUnreadCount(userAddress);
      setUnreadCount(count);
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [userAddress]);

  const fetchNotifications = async () => {
    if (!userAddress) return;
    
    setIsLoading(true);
    try {
      const data = await getUserNotifications(userAddress, 20);
      setNotifications(data);
      
      // Update unread count
      const count = data.filter(n => !n.is_read).length;
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markAsRead(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead(userAddress);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative text-gray-400 hover:text-[#A04545] transition-colors p-2">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#A04545] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className="w-96 max-h-[500px] overflow-hidden bg-[#1A1A1E] border-white/10 text-white p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0f0f13]">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No notifications yet</p>
              <p className="text-gray-500 text-xs mt-1">
                You'll be notified about raffle activities here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-white/10 bg-[#0f0f13]">
            <Link
              to="/profile?tab=Activity"
              className="text-xs text-primary hover:text-primary/80 flex items-center justify-center gap-1"
              onClick={() => setIsOpen(false)}
            >
              View all activity
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const NotificationItem = ({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) => {
  const icon = getNotificationIcon(notification.type);
  const timeAgo = formatNotificationTime(notification.created_at);

  return (
    <div
      className={`px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer ${
        !notification.is_read ? 'bg-primary/5' : ''
      }`}
      onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2A2A2E] flex items-center justify-center text-xl">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
            )}
          </div>
          
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-gray-500">{timeAgo}</span>
            
            {notification.raffle_id && (
              <Link
                to={`/raffle/${notification.raffle_id}`}
                className="text-[10px] text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                View Raffle →
              </Link>
            )}

            {notification.related_address && (
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                {getAvatarFromAddress(notification.related_address)}
                {notification.related_address.slice(0, 6)}...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDropdown;
