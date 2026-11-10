import { useEffect, useState, useCallback } from 'react';
import { Package, Clock, CheckCircle2, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, EmptyState, Badge, Spinner } from '@/components/ui';
import { STATUS_LABELS, STATUS_COLORS, WASTE_CATEGORIES } from '@/lib/constants';
import { formatDate } from '@/lib/requests';
import type { RequestWithProfile } from '@/types';

export function CustomerHistory({ onTrack }: { onTrack: (id: string) => void }) {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<RequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const fetchRequests = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('collection_requests')
      .select(`
        *,
        customer:profiles!collection_requests_customer_id_fkey(*),
        collector:profiles!collection_requests_collector_id_fkey(*)
      `)
      .eq('customer_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) {
      setRequests(data as unknown as RequestWithProfile[]);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filtered = requests.filter((r) => {
    if (filter === 'active') return ['request_submitted', 'request_confirmed', 'collector_assigned', 'collector_on_the_way', 'collector_arrived'].includes(r.status);
    if (filter === 'completed') return r.status === 'collection_completed';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} className="text-forest-500" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all whitespace-nowrap ${
              filter === f ? 'bg-forest-600 text-white' : 'bg-white text-charcoal-600 hover:bg-forest-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={48} />}
          title="No collection requests"
          message="Your collection history will appear here once you make requests."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const categories = req.waste_categories.map(
              (id) => WASTE_CATEGORIES.find((c) => c.id === id)?.label ?? id
            );
            const isTrackable = ['collector_assigned', 'collector_on_the_way', 'collector_arrived'].includes(req.status);
            return (
              <Card key={req.id} className="hover:shadow-card-hover transition-all" onClick={isTrackable ? () => onTrack(req.id) : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className={STATUS_COLORS[req.status]}>{STATUS_LABELS[req.status]}</Badge>
                      <span className="text-xs text-charcoal-400">{formatDate(req.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-charcoal-600 mb-1">
                      <MapPin size={14} className="text-forest-500 flex-shrink-0" />
                      <span className="truncate">{req.location_address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-charcoal-500">
                      <Calendar size={12} />
                      <span>{formatDate(req.preferred_date)}</span>
                      {req.preferred_time && <span>• {req.preferred_time}</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {categories.map((cat) => (
                        <span key={cat} className="text-[11px] bg-forest-50 text-forest-600 rounded-md px-2 py-0.5 font-medium">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  {req.status === 'collection_completed' && (
                    <CheckCircle2 size={24} className="text-emerald-500 flex-shrink-0" />
                  )}
                  {isTrackable && <Clock size={20} className="text-forest-500 flex-shrink-0" />}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
