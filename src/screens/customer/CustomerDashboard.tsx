import { useEffect, useState, useCallback } from 'react';
import { Plus, Clock, CheckCircle2, Package, MapPin, ArrowRight, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, StatCard, EmptyState, Badge, Spinner } from '@/components/ui';
import { STATUS_LABELS, STATUS_COLORS, WASTE_CATEGORIES } from '@/lib/constants';
import { formatDate, timeAgo } from '@/lib/requests';
import type { CollectionRequest, RequestWithProfile, Profile } from '@/types';

export function CustomerDashboard({
  onNewRequest,
  onTrackRequest,
  onViewAll,
}: {
  onNewRequest: () => void;
  onTrackRequest: (id: string) => void;
  onViewAll: () => void;
}) {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, pending: 0 });
  const [recentRequests, setRecentRequests] = useState<RequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('collection_requests')
      .select(`
        *,
        customer:profiles!collection_requests_customer_id_fkey(*),
        collector:profiles!collection_requests_collector_id_fkey(*)
      `)
      .eq('customer_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      const requests = data as unknown as RequestWithProfile[];
      setRecentRequests(requests);
      const completed = requests.filter((r) => r.status === 'collection_completed').length;
      const active = requests.filter((r) =>
        ['request_submitted', 'request_confirmed', 'collector_assigned', 'collector_on_the_way', 'collector_arrived'].includes(r.status)
      ).length;
      const pending = requests.filter((r) => r.status === 'request_submitted' || r.status === 'request_confirmed').length;
      setStats({ total: requests.length, active, completed, pending });
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} className="text-forest-500" />
      </div>
    );
  }

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-forest-500 opacity-20 blur-2xl -mr-10 -mt-10" />
        <div className="relative">
          <p className="text-forest-100 text-sm">{greeting},</p>
          <h2 className="text-2xl font-bold mt-1">{profile?.full_name?.split(' ')[0] ?? 'there'}</h2>
          <p className="text-forest-200 text-sm mt-2">Need waste collected today? Schedule a pickup in minutes.</p>
          <button
            onClick={onNewRequest}
            className="mt-4 inline-flex items-center gap-2 bg-white text-forest-700 font-semibold rounded-xl px-5 py-2.5 hover:bg-forest-50 transition-all active:scale-[0.98]"
          >
            <Plus size={20} />
            Request Collection
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Requests" value={stats.total} icon={<Package size={22} />} />
        <StatCard label="Active" value={stats.active} icon={<Clock size={22} />} color="warning" />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 size={22} />} color="emerald" />
        <StatCard label="Pending" value={stats.pending} icon={<Clock size={22} />} color="accent" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-charcoal-800">Recent Requests</h3>
          <button onClick={onViewAll} className="text-sm text-forest-600 font-medium hover:text-forest-700">
            View All
          </button>
        </div>

        {recentRequests.length === 0 ? (
          <EmptyState
            icon={<Package size={48} />}
            title="No collection requests yet"
            message="Start by scheduling your first waste collection pickup."
            action={
              <button onClick={onNewRequest} className="btn-primary inline-flex items-center gap-2">
                <Plus size={18} /> New Collection
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {recentRequests.slice(0, 5).map((req) => (
              <RequestCard key={req.id} request={req} onTrack={() => onTrackRequest(req.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function RequestCard({ request, onTrack }: { request: RequestWithProfile; onTrack?: () => void }) {
  const categories = request.waste_categories.map(
    (id) => WASTE_CATEGORIES.find((c) => c.id === id)?.label ?? id
  );

  const isTrackable = ['collector_assigned', 'collector_on_the_way', 'collector_arrived'].includes(request.status);

  return (
    <Card className="hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge className={STATUS_COLORS[request.status]}>{STATUS_LABELS[request.status]}</Badge>
            <span className="text-xs text-charcoal-400">{timeAgo(request.created_at)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-charcoal-600 mb-1">
            <MapPin size={14} className="text-forest-500 flex-shrink-0" />
            <span className="truncate">{request.location_address}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-charcoal-500">
            <span>{formatDate(request.preferred_date)}</span>
            {request.preferred_time && <span>• {request.preferred_time}</span>}
          </div>
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {categories.map((cat) => (
                <span key={cat} className="text-[11px] bg-forest-50 text-forest-600 rounded-md px-2 py-0.5 font-medium">
                  {cat}
                </span>
              ))}
            </div>
          )}
          {request.collector && (
            <p className="text-xs text-charcoal-500 mt-2">
              Collector: <span className="font-medium text-charcoal-700">{request.collector.full_name}</span>
            </p>
          )}
        </div>
        {isTrackable && onTrack && (
          <button
            onClick={onTrack}
            className="flex-shrink-0 bg-forest-50 text-forest-700 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-forest-100 transition-all flex items-center gap-1"
          >
            Track <ArrowRight size={16} />
          </button>
        )}
      </div>
    </Card>
  );
}
