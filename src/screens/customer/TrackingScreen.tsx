import { useEffect, useState } from 'react';
import { ArrowLeft, Phone, MessageSquare, MapPin, Clock, Navigation, User, Truck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Spinner, Badge, EmptyState } from '@/components/ui';
import { StatusTimeline } from '@/components/StatusTimeline';
import LeafletMap from '@/components/LeafletMap';
import { useCollectorLocation } from '@/hooks/useCollectorLocation';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';
import { calculateDistance, estimateArrival, timeAgo } from '@/lib/requests';
import type { CollectionRequest, Profile } from '@/types';

export function TrackingScreen({ requestId, onBack }: { requestId: string; onBack: () => void }) {
  const { profile } = useAuth();
  const [request, setRequest] = useState<CollectionRequest | null>(null);
  const [collector, setCollector] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestId) return;

    const fetchRequest = async () => {
      const { data } = await supabase
        .from('collection_requests')
        .select('*, collector:profiles!collection_requests_collector_id_fkey(*)')
        .eq('id', requestId)
        .maybeSingle();

      if (data) {
        setRequest(data as unknown as CollectionRequest & { collector: Profile });
        setCollector((data as unknown as { collector: Profile }).collector ?? null);
      }
      setLoading(false);
    };

    fetchRequest();

    const channel = supabase
      .channel(`request-track-${requestId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'collection_requests', filter: `id=eq.${requestId}` },
        async (payload) => {
          const updated = payload.new as CollectionRequest;
          setRequest(updated);
          if (updated.collector_id && (!collector || collector.id !== updated.collector_id)) {
            const { data: collData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', updated.collector_id)
              .maybeSingle();
            if (collData) setCollector(collData as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, collector]);

  const { location: collectorLocation, loading: locLoading } = useCollectorLocation(
    request?.collector_id,
    !!request?.collector_id && ['collector_assigned', 'collector_on_the_way', 'collector_arrived'].includes(request.status)
  );

  const [demoProgress, setDemoProgress] = useState(0);

  useEffect(() => {
    if (request?.location_lat == null || request?.location_lng == null) return;
    if (collectorLocation?.is_online && !collectorLocation.is_simulated) return;
    const timer = window.setInterval(() => {
      setDemoProgress((current) => current >= 1 ? 0 : Math.min(1, current + 0.04));
    }, 1800);
    return () => window.clearInterval(timer);
  }, [request?.location_lat, request?.location_lng, collectorLocation?.is_online, collectorLocation?.is_simulated]);

  const demoCollectorLocation = request?.location_lat != null && request?.location_lng != null
    ? {
        collector_id: request.collector_id ?? 'novlar-demo-collector',
        request_id: request.id,
        latitude: request.location_lat + 0.003 * (1 - demoProgress),
        longitude: request.location_lng - 0.003 * (1 - demoProgress),
        accuracy: null,
        heading: null,
        speed: null,
        is_online: true,
        is_simulated: true,
        last_updated: new Date().toISOString(),
      }
    : null;

  const activeCollectorLocation = collectorLocation?.is_online
    ? collectorLocation
    : demoCollectorLocation;


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} className="text-forest-500" />
      </div>
    );
  }

  if (!request) {
    return (
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-charcoal-600 mb-4 font-medium">
          <ArrowLeft size={20} /> Back
        </button>
        <EmptyState icon={<MapPin size={48} />} title="Request not found" message="This collection request could not be found." />
      </div>
    );
  }

  const markers: { lat: number; lng: number; type: 'customer' | 'collector' | 'pickup'; isLive?: boolean; label?: string }[] = [];

  if (request.location_lat != null && request.location_lng != null) {
    markers.push({ lat: request.location_lat, lng: request.location_lng, type: 'pickup', label: request.location_address });
  }
  if (activeCollectorLocation) {
    markers.push({
      lat: activeCollectorLocation.latitude,
      lng: activeCollectorLocation.longitude,
      type: 'collector',
      isLive: !activeCollectorLocation.is_simulated,
      label: collector ? collector.full_name : 'NOVLAR Demo Collector',
    });
  }

  const distance =
    activeCollectorLocation && request.location_lat != null && request.location_lng != null
      ? calculateDistance(activeCollectorLocation.latitude, activeCollectorLocation.longitude, request.location_lat, request.location_lng)
      : null;

  const eta = distance != null ? estimateArrival(distance) : null;
  const mapCenter = activeCollectorLocation
    ? { lat: activeCollectorLocation.latitude, lng: activeCollectorLocation.longitude }
    : request.location_lat && request.location_lng
    ? { lat: request.location_lat, lng: request.location_lng }
    : undefined;

  return (
    <div className="animate-fade-in pb-4">
      <button onClick={onBack} className="flex items-center gap-2 text-charcoal-600 hover:text-forest-700 mb-4 font-medium">
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Badge className={STATUS_COLORS[request.status]}>
              {STATUS_LABELS[request.status]}
            </Badge>
            <p className="text-xs text-charcoal-400 mt-1">{request.location_address}</p>
          </div>
          {activeCollectorLocation?.is_simulated && (
            <Badge className="bg-warning-100 text-warning-700">Simulated GPS</Badge>
          )}
          {activeCollectorLocation && !activeCollectorLocation.is_simulated && activeCollectorLocation.is_online && (
            <Badge className="bg-emerald-100 text-emerald-700">Live GPS</Badge>
          )}
        </div>
        <StatusTimeline currentStatus={request.status} />
      </div>

      <div className="rounded-2xl overflow-hidden border border-forest-100 mb-4 relative" style={{ height: '340px' }}>
        <LeafletMap
          markers={markers}
          center={mapCenter}
          zoom={15}
          showRoute={markers.length >= 2}
          followCollector={!!activeCollectorLocation}
          className="h-full"
        />
        {markers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-forest-50/80 backdrop-blur-sm pointer-events-none">
            <div className="text-center">
              <Navigation size={32} className="text-forest-400 mx-auto mb-2" />
              <p className="text-sm text-charcoal-600 font-medium">Waiting for collector location...</p>
            </div>
          </div>
        )}
      </div>

      {(collector || activeCollectorLocation) && (
        <div className="card mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-lg">
              {collector?.full_name.charAt(0) ?? 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-charcoal-800">{collector?.full_name ?? 'NOVLAR Demo Collector'}</p>
              <p className="text-sm text-charcoal-500">{collector ? 'Your Waste Collector' : 'Simulated route for presentation — not live GPS'}</p>
            </div>
            {collector && (
              <div className="flex gap-2">
                <a href={`tel:${collector.phone ?? ''}`} className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-forest-700 hover:bg-forest-100 transition-colors"><Phone size={18} /></a>
                <button className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-forest-700 hover:bg-forest-100 transition-colors"><MessageSquare size={18} /></button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-forest-50">
            <div className="text-center">
              <MapPin size={16} className="text-forest-500 mx-auto mb-1" />
              <p className="text-xs text-charcoal-400">Distance</p>
              <p className="text-sm font-bold text-charcoal-800">
                {distance != null ? `${(distance / 1000).toFixed(2)} km` : '—'}
              </p>
            </div>
            <div className="text-center">
              <Clock size={16} className="text-forest-500 mx-auto mb-1" />
              <p className="text-xs text-charcoal-400">ETA</p>
              <p className="text-sm font-bold text-charcoal-800">{eta ?? '—'}</p>
            </div>
            <div className="text-center">
              <Navigation size={16} className="text-forest-500 mx-auto mb-1" />
              <p className="text-xs text-charcoal-400">Last Update</p>
              <p className="text-sm font-bold text-charcoal-800">
                {activeCollectorLocation ? timeAgo(activeCollectorLocation.last_updated) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!collector && !activeCollectorLocation && (
        <div className="card text-center py-8">
          <Truck size={36} className="text-forest-300 mx-auto mb-3" />
          <p className="font-semibold text-charcoal-700">Tracking preview unavailable</p>
          <p className="text-sm text-charcoal-500 mt-1">Add a pickup location to this request to display the demo route.</p>
        </div>
      )}
    </div>
  );
}
