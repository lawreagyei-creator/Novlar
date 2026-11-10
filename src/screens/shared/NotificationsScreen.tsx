import { Bell, CheckCheck, BellOff } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';
import { EmptyState, Spinner } from '@/components/ui';
import { timeAgo } from '@/lib/requests';

export function NotificationsScreen() {
  const { profile } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(profile?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} className="text-forest-500" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {notifications.length > 0 && unreadCount > 0 && (
        <button
          onClick={markAllAsRead}
          className="btn-ghost mb-4 flex items-center gap-2 text-sm"
        >
          <CheckCheck size={18} /> Mark all as read ({unreadCount})
        </button>
      )}

      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellOff size={48} />}
          title="No notifications yet"
          message="You'll be notified about your collection requests here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markAsRead(n.id)}
              className={`w-full text-left card flex items-start gap-3 transition-all ${
                n.is_read ? 'bg-white' : 'bg-forest-50/50 border-l-4 border-l-forest-500'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                n.is_read ? 'bg-charcoal-50 text-charcoal-400' : 'bg-forest-100 text-forest-600'
              }`}>
                <Bell size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${n.is_read ? 'text-charcoal-600' : 'text-charcoal-800'}`}>
                  {n.title}
                </p>
                <p className="text-sm text-charcoal-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-charcoal-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-forest-500 flex-shrink-0 mt-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
