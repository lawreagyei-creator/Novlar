import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ArrowLeft, Bell, CheckCheck, BellOff, Truck, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';
import { timeAgo } from '@/lib/requests';

function NotificationsContent({ onBack }: { onBack: () => void }) {
  const { profile } = useAuth();
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead } = useNotifications(profile?.id);
  const demoItems = [
    { id: 'demo-1', title: 'Collection request received', message: 'Your NOVLAR collection request has been received and is awaiting confirmation.', time: 'Just now', icon: CalendarCheck },
    { id: 'demo-2', title: 'Collector update', message: 'A collector status update will appear here when your request is assigned.', time: 'Demo preview', icon: Truck },
    { id: 'demo-3', title: 'Collection completed', message: 'You will receive a confirmation here after your waste has been collected.', time: 'Demo preview', icon: CheckCircle2 },
  ];

  return (
    <div className="animate-fade-in min-h-[60vh]">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-forest-700 hover:text-forest-900 mb-4">
        <ArrowLeft size={18} /> Back to Dashboard
      </button>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-charcoal-800">Notifications</h2>
        <p className="text-sm text-charcoal-500 mt-1">Updates about your collection requests and account activity.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-forest-100 bg-white p-8 text-center">
          <Spinner size={30} className="text-forest-500 mx-auto" />
          <p className="text-sm text-charcoal-500 mt-3">Loading your notifications…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-semibold text-charcoal-800">Notifications are temporarily unavailable</h3>
          <p className="text-sm text-charcoal-600 mt-1">{error}</p>
          <p className="text-xs text-charcoal-500 mt-2">You can return to your dashboard and continue using the rest of NOVLAR.</p>
        </div>
      ) : (
        <>
          {notifications.length > 0 && unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn-ghost mb-4 flex items-center gap-2 text-sm">
              <CheckCheck size={18} /> Mark all as read ({unreadCount})
            </button>
          )}
          {notifications.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-forest-100 bg-white p-5 text-center">
                <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest-600 flex items-center justify-center mx-auto mb-3"><BellOff size={26} /></div>
                <h3 className="font-bold text-charcoal-800">No account notifications yet</h3>
                <p className="text-sm text-charcoal-500 mt-1">Real request updates will appear here when they are generated.</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-charcoal-700">What notifications look like</h3>
                  <span className="text-[10px] font-bold tracking-wide rounded-full bg-accent-100 text-accent-700 px-2.5 py-1">DEMO PREVIEW</span>
                </div>
                <div className="space-y-2">
                  {demoItems.map((item) => { const Icon = item.icon; return (
                    <div key={item.id} className="card flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-600 flex items-center justify-center flex-shrink-0"><Icon size={19} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-charcoal-800">{item.title}</p>
                        <p className="text-sm text-charcoal-500 mt-0.5">{item.message}</p>
                        <p className="text-xs text-charcoal-400 mt-1">{item.time}</p>
                      </div>
                    </div>
                  ); })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <button key={n.id} onClick={() => !n.is_read && markAsRead(n.id)} className={'w-full text-left card flex items-start gap-3 transition-all ' + (n.is_read ? 'bg-white' : 'bg-forest-50/50 border-l-4 border-l-forest-500')}>
                  <div className={'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ' + (n.is_read ? 'bg-charcoal-50 text-charcoal-400' : 'bg-forest-100 text-forest-600')}><Bell size={18} /></div>
                  <div className="min-w-0 flex-1">
                    <p className={'text-sm font-semibold ' + (n.is_read ? 'text-charcoal-600' : 'text-charcoal-800')}>{n.title}</p>
                    <p className="text-sm text-charcoal-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-charcoal-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-forest-500 flex-shrink-0 mt-2" />}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}


interface NotificationsBoundaryProps {
  children: ReactNode;
  onBack: () => void;
}

interface NotificationsBoundaryState {
  error: Error | null;
}

class NotificationsErrorBoundary extends Component<NotificationsBoundaryProps, NotificationsBoundaryState> {
  state: NotificationsBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): NotificationsBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('NOVLAR Notifications screen crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] rounded-2xl border border-amber-200 bg-white p-5">
          <button onClick={this.props.onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-forest-700 mb-5">
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          <h2 className="text-lg font-bold text-charcoal-800">Notifications could not open</h2>
          <p className="text-sm text-charcoal-600 mt-2">The app encountered an error while displaying this screen. Your other NOVLAR sections should remain available.</p>
          <p className="text-xs text-charcoal-500 mt-3 break-words">Technical detail: {this.state.error.message || 'Unknown rendering error'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function NotificationsScreen({ onBack }: { onBack: () => void }) {
  return (
    <NotificationsErrorBoundary onBack={onBack}>
      <NotificationsContent onBack={onBack} />
    </NotificationsErrorBoundary>
  );
}
