import { useEffect, useState, useCallback } from 'react';
import { Users, Truck, Package, CheckCircle2, Clock, Activity, TrendingUp, MapPin, User, Trash2, RotateCw } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/lib/supabase';
import { Card, StatCard, EmptyState, Badge, Spinner } from '@/components/ui';
import { STATUS_LABELS, STATUS_COLORS, WASTE_CATEGORIES } from '@/lib/constants';
import { formatDate, timeAgo, updateRequestStatus } from '@/lib/requests';
import type { CollectionRequest, Profile, CollectionStatus, RequestWithProfile } from '@/types';

const CHART_COLORS = ['#2c6f53', '#10b981', '#34d399', '#f59e0b', '#5aa683'];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'users' | 'collectors'>('overview');
  const [stats, setStats] = useState({
    customers: 0,
    collectors: 0,
    totalRequests: 0,
    completed: 0,
    pending: 0,
    activeCollectors: 0,
  });
  const [requests, setRequests] = useState<RequestWithProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [activityData, setActivityData] = useState<{ name: string; requests: number; completed: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningCollector, setAssigningCollector] = useState<string | null>(null);
  const [collectors, setCollectors] = useState<Profile[]>([]);

  const fetchAll = useCallback(async () => {
    const [{ data: profilesData }, { data: reqData }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('collection_requests').select(`
        *,
        customer:profiles!collection_requests_customer_id_fkey(*),
        collector:profiles!collection_requests_collector_id_fkey(*)
      `).order('created_at', { ascending: false }),
    ]);

    if (profilesData) {
      setAllProfiles(profilesData as Profile[]);
      setCollectors(profilesData.filter((p) => p.role === 'collector') as Profile[]);
    }

    if (reqData) {
      const reqs = reqData as unknown as RequestWithProfile[];
      setRequests(reqs);

      const completed = reqs.filter((r) => r.status === 'collection_completed').length;
      const pending = reqs.filter((r) => ['request_submitted', 'request_confirmed'].includes(r.status)).length;

      setStats({
        customers: profilesData?.filter((p) => p.role === 'customer').length ?? 0,
        collectors: profilesData?.filter((p) => p.role === 'collector').length ?? 0,
        totalRequests: reqs.length,
        completed,
        pending,
        activeCollectors: reqs.filter((r) => ['collector_on_the_way', 'collector_arrived'].includes(r.status)).length,
      });

      // Category breakdown
      const catCounts: Record<string, number> = {};
      reqs.forEach((r) => {
        r.waste_categories.forEach((catId) => {
          catCounts[catId] = (catCounts[catId] ?? 0) + 1;
        });
      });
      setCategoryData(
        WASTE_CATEGORIES.map((c) => ({ name: c.label, value: catCounts[c.id] ?? 0 })).filter((c) => c.value > 0)
      );

      // Activity per day (last 7 days)
      const days: { name: string; requests: number; completed: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en', { weekday: 'short' });
        const dayReqs = reqs.filter((r) => r.created_at.startsWith(dateStr));
        const dayCompleted = reqs.filter((r) => r.completed_at?.startsWith(dateStr));
        days.push({ name: dayName, requests: dayReqs.length, completed: dayCompleted.length });
      }
      setActivityData(days);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAssignCollector = async (requestId: string, collectorId: string) => {
    setAssigningCollector(requestId);
    await updateRequestStatus(requestId, 'collector_assigned', collectorId);
    await fetchAll();
    setAssigningCollector(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} className="text-forest-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'requests', label: 'Collection Requests' },
          { id: 'users', label: 'Customers' },
          { id: 'collectors', label: 'Collectors' },
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

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard label="Customers" value={stats.customers} icon={<Users size={22} />} />
            <StatCard label="Collectors" value={stats.collectors} icon={<Truck size={22} />} color="emerald" />
            <StatCard label="Total Requests" value={stats.totalRequests} icon={<Package size={22} />} color="accent" />
            <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 size={22} />} color="emerald" />
            <StatCard label="Pending" value={stats.pending} icon={<Clock size={22} />} color="warning" />
            <StatCard label="Active Now" value={stats.activeCollectors} icon={<Activity size={22} />} color="accent" />
          </div>

          <Card>
            <h3 className="font-bold text-charcoal-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-forest-600" /> Collection Activity (7 days)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbeee5" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5a665f' }} />
                <YAxis tick={{ fontSize: 12, fill: '#5a665f' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #dbeee5', fontSize: '13px' }} />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                <Bar dataKey="requests" fill="#2c6f53" radius={[6, 6, 0, 0]} name="New Requests" />
                <Bar dataKey="completed" fill="#34d399" radius={[6, 6, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {categoryData.length > 0 && (
            <Card>
              <h3 className="font-bold text-charcoal-800 mb-4 flex items-center gap-2">
                <RotateCw size={20} className="text-forest-600" /> Waste Category Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #dbeee5', fontSize: '13px' }} />
                  <Legend wrapperStyle={{ fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card>
            <h3 className="font-bold text-charcoal-800 mb-4">Recent Requests</h3>
            <div className="space-y-2">
              {requests.slice(0, 5).map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-forest-50/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charcoal-700 truncate">{req.location_address}</p>
                    <p className="text-xs text-charcoal-400">{req.customer?.full_name} • {timeAgo(req.created_at)}</p>
                  </div>
                  <Badge className={STATUS_COLORS[req.status]}>{STATUS_LABELS[req.status]}</Badge>
                </div>
              ))}
              {requests.length === 0 && <p className="text-sm text-charcoal-400 text-center py-4">No requests yet</p>}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <EmptyState icon={<Package size={48} />} title="No collection requests" message="Collection requests from customers will appear here." />
          ) : (
            requests.map((req) => (
              <Card key={req.id}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className={STATUS_COLORS[req.status]}>{STATUS_LABELS[req.status]}</Badge>
                      <span className="text-xs text-charcoal-400">{formatDate(req.created_at)}</span>
                    </div>
                    <p className="text-sm text-charcoal-700 flex items-center gap-1.5">
                      <MapPin size={14} className="text-forest-500 flex-shrink-0" /> {req.location_address}
                    </p>
                    <p className="text-xs text-charcoal-500 mt-1">Customer: {req.customer?.full_name ?? 'Unknown'}</p>
                    {req.collector && <p className="text-xs text-charcoal-500">Collector: {req.collector.full_name}</p>}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {req.waste_categories.map((id) => (
                        <span key={id} className="text-[11px] bg-forest-50 text-forest-600 rounded-md px-2 py-0.5 font-medium">
                          {WASTE_CATEGORIES.find((c) => c.id === id)?.label ?? id}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {!req.collector_id && ['request_submitted', 'request_confirmed'].includes(req.status) && (
                  <div className="pt-3 border-t border-forest-50">
                    <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Assign Collector</label>
                    <div className="flex items-center gap-2">
                      <select
                        value=""
                        onChange={(e) => e.target.value && handleAssignCollector(req.id, e.target.value)}
                        disabled={assigningCollector === req.id}
                        className="input-field py-2 text-sm flex-1"
                        defaultValue=""
                      >
                        <option value="" disabled>Select a collector...</option>
                        {collectors.map((c) => (
                          <option key={c.id} value={c.id}>{c.full_name}</option>
                        ))}
                      </select>
                      {assigningCollector === req.id && <Spinner size={20} className="text-forest-500" />}
                    </div>
                    {collectors.length === 0 && (
                      <p className="text-xs text-error-600 mt-1">No collectors registered. Sign up a collector account first.</p>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-3">
          {allProfiles.filter((p) => p.role === 'customer').length === 0 ? (
            <EmptyState icon={<Users size={48} />} title="No customers registered" message="Customer accounts will appear here." />
          ) : (
            allProfiles.filter((p) => p.role === 'customer').map((p) => (
              <Card key={p.id}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-semibold">
                    {p.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-charcoal-800 truncate">{p.full_name}</p>
                    <p className="text-xs text-charcoal-500">{p.phone ?? 'No phone'}</p>
                  </div>
                  <Badge className="bg-forest-100 text-forest-700">Customer</Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'collectors' && (
        <div className="space-y-3">
          {collectors.length === 0 ? (
            <EmptyState icon={<Truck size={48} />} title="No collectors registered" message="Collector accounts will appear here. Sign up as a collector to get started." />
          ) : (
            collectors.map((c) => {
              const collectorReqs = requests.filter((r) => r.collector_id === c.id);
              const completed = collectorReqs.filter((r) => r.status === 'collection_completed').length;
              return (
                <Card key={c.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                      {c.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-charcoal-800 truncate">{c.full_name}</p>
                      <p className="text-xs text-charcoal-500">{c.phone ?? 'No phone'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-charcoal-800">{completed}</p>
                      <p className="text-xs text-charcoal-400">Completed</p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
