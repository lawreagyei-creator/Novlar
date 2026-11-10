import { useEffect, useState, useCallback } from 'react';
import { Power, MapPin, Clock, CheckCircle2, Package, TrendingUp, Navigation, Radio } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, StatCard, EmptyState, Badge, Spinner } from '@/components/ui';
import { StatusTimeline } from '@/components/StatusTimeline';
import LeafletMap from '@/components/LeafletMap';
import { useGpsTracking } from '@/hooks/useGpsTracking';
import { STATUS_LABELS, STATUS_COLORS, WASTE_CATEGORIES, ACCRA_DEMO_LOCATIONS } from '@/lib/constants';
import { updateRequestStatus, createNotification, addToHistory, formatDate, timeAgo } from '@/lib/requests';
import type { CollectionRequest, Profile, CollectionStatus } from '@/types';

export function CollectorDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'history' | 'gps'>('dashboard');
  const [isOnline, setIsOnline] = useState(false);
  const [assignedRequests, setAssignedRequests] = useState<CollectionRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<CollectionRequest | null>(null);
  const [customers, setCustomers] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);

  const [useSimulation, setUseSimulation] = useState(false);
  const [simStart, setSimStart] = useState(ACCRA_DEMO_LOCATIONS[0]);
  const [simEnd, setSimEnd] = useState(ACCRA_DEMO_LOCATIONS[1]);

  const { location, error, status, stopTracking } = useGpsTracking({
    collectorId: profile?.id ?? '',
    requestId: activeRequest?.id ?? null,
    enabled: isOnline && activeTab === 'gps' && !!activeRequest,
    isSimulated: useSimulation,
    simulateStart: useSimulation ? simStart : undefined,
    simulateEnd: useSimulation ? simEnd : undefined,
  });

  const fetchAssigned = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('collection_requests')
      .select('*')
      .eq('collector_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) {
      setAssignedRequests(data as CollectionRequest[]);
      const active = data.find((r) =>
        ['collector_assigned', 'collector_on_the_way', 'collector_arrived'].includes(r.status)
      ) as CollectionRequest | undefined;
      setActiveRequest(active ?? null);

      const customerIds = [...new Set(data.map((r) => r.customer_id))];
      if (customerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', customerIds);
        if (profilesData) {
          const map: Record<string, Profile> = {};
          profilesData.forEach((p) => { map[p.id] = p as Profile; });
          setCustomers(map);
        }
      }

      const completed = data.filter((r) => r.status === 'collection_completed').length;
      setCompletedCount(completed);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchAssigned();
  }, [fetchAssigned]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel(`collector-requests-${profile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'collection_requests', filter: `collector_id=eq.${profile.id}` },
        () => fetchAssigned()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'collection_requests', filter: `status=eq.collector_assigned` },
        () => fetchAssigned()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, fetchAssigned]);

  const handleStatusUpdate = async (newStatus: CollectionStatus) => {
    if (!activeRequest || !profile) return;
    await updateRequestStatus(activeRequest.id, newStatus);

    const notifMap: Record<string, { title: string; message: string }> = {
      collector_on_the_way: { title: 'Collector On the Way', message: 'Your waste collector is on the way to your location.' },
      collector_arrived: { title: 'Collector Arrived', message: 'Your waste collector has arrived at your location.' },
      collection_completed: { title: 'Collection Completed', message: 'Your waste collection has been completed successfully.' },
    };

    if (notifMap[newStatus]) {
      await createNotification(activeRequest.customer_id, newStatus, notifMap[newStatus].title, notifMap[newStatus].message, activeRequest.id);
    }

    if (newStatus === 'collection_completed') {
      await addToHistory(activeRequest.id);
    }

    await fetchAssigned();
  };

  const handleGoOffline = async () => {
    await stopTracking();
    setIsOnline(false);
  };

  const pendingRequests = assignedRequests.filter((r) => r.status === 'collector_assigned' || r.status === 'request_confirmed');
  const activeRequests = assignedRequests.filter((r) => ['collector_on_the_way', 'collector_arrived'].includes(r.status));
  const completedRequests = assignedRequests.filter((r) => r.status === 'collection_completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} className="text-forest-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Online/Offline Toggle */}
      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-charcoal-50 text-charcoal-400'
          }`}>
            <Power size={24} />
          </div>
          <div>
            <p className="font-bold text-charcoal-800">{isOnline ? 'Online' : 'Offline'}</p>
            <p className="text-sm text-charcoal-500">{isOnline ? 'Available for assignments' : 'Not accepting requests'}</p>
          </div>
        </div>
        <button
          onClick={() => (isOnline ? handleGoOffline() : setIsOnline(true))}
          className={`relative w-14 h-8 rounded-full transition-all ${
            isOnline ? 'bg-emerald-500' : 'bg-charcoal-200'
          }`}
        >
          <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${isOnline ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      {/* Status badge for GPS */}
      {isOnline && activeTab === 'gps' && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${
          status === 'tracking' ? 'bg-emerald-50 text-emerald-700' :
          status === 'simulating' ? 'bg-warning-50 text-warning-700' :
          status === 'error' || status === 'denied' ? 'bg-error-50 text-error-700' :
          'bg-charcoal-50 text-charcoal-500'
        }`}>
          <Radio size={16} className={status === 'tracking' || status === 'simulating' ? 'animate-pulse' : ''} />
          {status === 'tracking' && 'Real GPS tracking active'}
          {status === 'simulating' && 'Simulated GPS movement active'}
          {status === 'denied' && 'Location permission denied — enable in browser settings or use simulation'}
          {status === 'error' && (error ?? 'GPS error')}
          {status === 'idle' && 'GPS idle'}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {([
          { id: 'dashboard', label: 'Overview' },
          { id: 'requests', label: 'Requests' },
          { id: 'gps', label: 'GPS Tracking' },
          { id: 'history', label: 'History' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-forest-600 text-white' : 'bg-white text-charcoal-600 hover:bg-forest-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Pending" value={pendingRequests.length} icon={<Clock size={22} />} color="warning" />
            <StatCard label="Active" value={activeRequests.length} icon={<Navigation size={22} />} color="accent" />
            <StatCard label="Completed" value={completedCount} icon={<CheckCircle2 size={22} />} color="emerald" />
            <StatCard label="Total Assigned" value={assignedRequests.length} icon={<Package size={22} />} />
          </div>

          {activeRequest && (
            <div className="card">
              <h3 className="font-bold text-charcoal-800 mb-3">Active Collection</h3>
              <ActiveRequestCard
                request={activeRequest}
                customer={customers[activeRequest.customer_id]}
                onUpdateStatus={handleStatusUpdate}
              />
            </div>
          )}

          {pendingRequests.length > 0 && (
            <div>
              <h3 className="font-bold text-charcoal-800 mb-3">Pending Assignments</h3>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <CollectorRequestCard
                    key={req.id}
                    request={req}
                    customer={customers[req.customer_id]}
                    onUpdateStatus={handleStatusUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {!activeRequest && pendingRequests.length === 0 && (
            <EmptyState
              icon={<Package size={48} />}
              title="No active assignments"
              message="When customers request collections, they'll appear here."
            />
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-3">
          {assignedRequests.length === 0 ? (
            <EmptyState icon={<Package size={48} />} title="No assigned requests" message="Assigned collection requests will appear here." />
          ) : (
            assignedRequests.map((req) => (
              <CollectorRequestCard
                key={req.id}
                request={req}
                customer={customers[req.customer_id]}
                onUpdateStatus={handleStatusUpdate}
                onGoToGps={() => { setActiveRequest(req); setActiveTab('gps'); }}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'gps' && (
        <GpsTrackingTab
          activeRequest={activeRequest}
          isOnline={isOnline}
          useSimulation={useSimulation}
          setUseSimulation={setUseSimulation}
          simStart={simStart}
          setSimStart={setSimStart}
          simEnd={simEnd}
          setSimEnd={setSimEnd}
          location={location}
          error={error}
          status={status}
          customer={activeRequest ? customers[activeRequest.customer_id] : null}
        />
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          {completedRequests.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={48} />} title="No completed collections yet" message="Your completed collections will be listed here." />
          ) : (
            completedRequests.map((req) => (
              <Card key={req.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Badge className={STATUS_COLORS[req.status]}>{STATUS_LABELS[req.status]}</Badge>
                    <p className="text-sm text-charcoal-600 mt-2 flex items-center gap-1.5">
                      <MapPin size={14} className="text-forest-500" /> {req.location_address}
                    </p>
                    <p className="text-xs text-charcoal-400 mt-1">{formatDate(req.created_at)}</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {req.waste_categories.map((id) => (
                        <span key={id} className="text-[11px] bg-forest-50 text-forest-600 rounded-md px-2 py-0.5 font-medium">
                          {WASTE_CATEGORIES.find((c) => c.id === id)?.label ?? id}
                        </span>
                      ))}
                    </div>
                  </div>
                  <CheckCircle2 size={24} className="text-emerald-500 flex-shrink-0" />
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CollectorRequestCard({
  request,
  customer,
  onUpdateStatus,
  onGoToGps,
}: {
  request: CollectionRequest;
  customer?: Profile;
  onUpdateStatus: (status: CollectionStatus) => void;
  onGoToGps?: () => void;
}) {
  const categories = request.waste_categories.map((id) => WASTE_CATEGORIES.find((c) => c.id === id)?.label ?? id);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge className={STATUS_COLORS[request.status]}>{STATUS_LABELS[request.status]}</Badge>
            <span className="text-xs text-charcoal-400">{timeAgo(request.created_at)}</span>
          </div>
          <p className="text-sm text-charcoal-600 flex items-center gap-1.5">
            <MapPin size={14} className="text-forest-500 flex-shrink-0" />
            <span className="truncate">{request.location_address}</span>
          </p>
          {customer && <p className="text-xs text-charcoal-500 mt-1">Customer: {customer.full_name}{customer.phone ? ` • ${customer.phone}` : ''}</p>}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {categories.map((cat) => (
              <span key={cat} className="text-[11px] bg-forest-50 text-forest-600 rounded-md px-2 py-0.5 font-medium">{cat}</span>
            ))}
          </div>
          {request.instructions && (
            <p className="text-xs text-charcoal-500 mt-2 bg-charcoal-50 rounded-lg px-3 py-2">{request.instructions}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-forest-50 flex-wrap">
        {request.status === 'collector_assigned' && (
          <button onClick={() => onUpdateStatus('collector_on_the_way')} className="btn-primary text-sm py-2 px-4">
            Start Collection
          </button>
        )}
        {request.status === 'collector_on_the_way' && (
          <button onClick={() => onUpdateStatus('collector_arrived')} className="btn-primary text-sm py-2 px-4">
            Mark Arrived
          </button>
        )}
        {request.status === 'collector_arrived' && (
          <button onClick={() => onUpdateStatus('collection_completed')} className="btn-primary text-sm py-2 px-4">
            Complete Collection
          </button>
        )}
        {onGoToGps && ['collector_assigned', 'collector_on_the_way', 'collector_arrived'].includes(request.status) && (
          <button onClick={onGoToGps} className="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5">
            <Navigation size={16} /> GPS
          </button>
        )}
      </div>
    </Card>
  );
}

function ActiveRequestCard({
  request,
  customer,
  onUpdateStatus,
}: {
  request: CollectionRequest;
  customer?: Profile;
  onUpdateStatus: (status: CollectionStatus) => void;
}) {
  return (
    <div>
      <StatusTimeline currentStatus={request.status} />
      <div className="mt-4 pt-3 border-t border-forest-50 flex items-center gap-2 flex-wrap">
        {request.status === 'collector_assigned' && (
          <button onClick={() => onUpdateStatus('collector_on_the_way')} className="btn-primary text-sm py-2.5 px-5">
            Start Collection
          </button>
        )}
        {request.status === 'collector_on_the_way' && (
          <button onClick={() => onUpdateStatus('collector_arrived')} className="btn-primary text-sm py-2.5 px-5">
            Mark Arrived
          </button>
        )}
        {request.status === 'collector_arrived' && (
          <button onClick={() => onUpdateStatus('collection_completed')} className="btn-primary text-sm py-2.5 px-5">
            Complete Collection
          </button>
        )}
      </div>
    </div>
  );
}

function GpsTrackingTab({
  activeRequest,
  isOnline,
  useSimulation,
  setUseSimulation,
  simStart,
  setSimStart,
  simEnd,
  setSimEnd,
  location,
  error,
  status,
  customer,
}: {
  activeRequest: CollectionRequest | null;
  isOnline: boolean;
  useSimulation: boolean;
  setUseSimulation: (v: boolean) => void;
  simStart: { name: string; lat: number; lng: number };
  setSimStart: (v: { name: string; lat: number; lng: number }) => void;
  simEnd: { name: string; lat: number; lng: number };
  setSimEnd: (v: { name: string; lat: number; lng: number }) => void;
  location: { latitude: number; longitude: number; is_simulated: boolean; last_updated: string; accuracy: number | null } | null;
  error: string | null;
  status: string;
  customer: Profile | null;
}) {
  if (!activeRequest) {
    return (
      <EmptyState
        icon={<Navigation size={48} />}
        title="No active collection"
        message="Accept a collection request to start GPS tracking."
      />
    );
  }

  if (!isOnline) {
    return (
      <EmptyState
        icon={<Power size={48} />}
        title="You are offline"
        message="Go online to start sharing your GPS location with the customer."
      />
    );
  }

  const markers: { lat: number; lng: number; type: 'customer' | 'collector' | 'pickup'; isLive?: boolean; label?: string }[] = [];

  if (location) {
    markers.push({ lat: location.latitude, lng: location.longitude, type: 'collector', isLive: !location.is_simulated });
  }
  if (activeRequest.location_lat && activeRequest.location_lng) {
    markers.push({ lat: activeRequest.location_lat, lng: activeRequest.location_lng, type: 'pickup', label: activeRequest.location_address });
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card">
        <h3 className="font-bold text-charcoal-800 mb-3">GPS Tracking Settings</h3>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-forest-50 mb-4">
          <div className={`w-3 h-3 rounded-full ${useSimulation ? 'bg-warning-500' : 'bg-emerald-500'} ${status === 'tracking' || status === 'simulating' ? 'animate-pulse' : ''}`} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-charcoal-700">{useSimulation ? 'Simulated GPS Mode' : 'Real GPS Mode'}</p>
            <p className="text-xs text-charcoal-500">
              {useSimulation ? 'Collector location is simulated for demonstration' : 'Using device GPS via browser Geolocation API'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-forest-100">
          <div>
            <p className="text-sm font-semibold text-charcoal-700">Use Simulation Mode</p>
            <p className="text-xs text-charcoal-500">For demos when real GPS is unavailable</p>
          </div>
          <button
            onClick={() => setUseSimulation(!useSimulation)}
            className={`relative w-12 h-7 rounded-full transition-all ${useSimulation ? 'bg-warning-500' : 'bg-charcoal-200'}`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${useSimulation ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        {useSimulation && (
          <div className="mt-4 space-y-3 animate-slide-down">
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1.5">Start Location</label>
              <select
                value={simStart.name}
                onChange={(e) => {
                  const loc = ACCRA_DEMO_LOCATIONS.find((l) => l.name === e.target.value);
                  if (loc) setSimStart(loc);
                }}
                className="input-field"
              >
                {ACCRA_DEMO_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1.5">Destination</label>
              <select
                value={simEnd.name}
                onChange={(e) => {
                  const loc = ACCRA_DEMO_LOCATIONS.find((l) => l.name === e.target.value);
                  if (loc) setSimEnd(loc);
                }}
                className="input-field"
              >
                {ACCRA_DEMO_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden border border-forest-100 relative" style={{ height: '340px' }}>
        <LeafletMap
          markers={markers}
          center={location ? { lat: location.latitude, lng: location.longitude } : undefined}
          zoom={15}
          showRoute={markers.length >= 2}
          followCollector
          className="h-full"
        />
        {!location && (
          <div className="absolute inset-0 flex items-center justify-center bg-forest-50/80 backdrop-blur-sm pointer-events-none">
            <div className="text-center">
              <Navigation size={32} className="text-forest-400 mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-charcoal-600 font-medium">Acquiring GPS signal...</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-error-50 border border-error-100 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}

      {location && (
        <div className="card grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-charcoal-400">Latitude</p>
            <p className="text-sm font-bold text-charcoal-800">{location.latitude.toFixed(5)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-charcoal-400">Longitude</p>
            <p className="text-sm font-bold text-charcoal-800">{location.longitude.toFixed(5)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-charcoal-400">Last Update</p>
            <p className="text-sm font-bold text-charcoal-800">{timeAgo(location.last_updated)}</p>
          </div>
        </div>
      )}

      {customer && (
        <div className="card">
          <h4 className="text-sm font-bold text-charcoal-700 mb-2">Customer Details</h4>
          <p className="text-sm text-charcoal-600">{customer.full_name}</p>
          {customer.phone && <p className="text-sm text-charcoal-500">{customer.phone}</p>}
          <p className="text-sm text-charcoal-500 mt-1">{activeRequest.location_address}</p>
        </div>
      )}
    </div>
  );
}
