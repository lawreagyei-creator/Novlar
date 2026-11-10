import { useState } from 'react';
import { Home, Package, Bell, Settings, Info, MapPin, LayoutDashboard, Users, Truck, Leaf, Compass } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { FullScreenLoader } from '@/components/ui';
import AuthScreen from '@/screens/AuthScreen';
import { CustomerDashboard, RequestCard } from '@/screens/customer/CustomerDashboard';
import { NewRequestScreen, RequestConfirmation } from '@/screens/customer/NewRequestScreen';
import { TrackingScreen } from '@/screens/customer/TrackingScreen';
import { CustomerHistory } from '@/screens/customer/CustomerHistory';
import { CollectorDashboard } from '@/screens/collector/CollectorDashboard';
import { AdminDashboard } from '@/screens/admin/AdminDashboard';
import { NotificationsScreen } from '@/screens/shared/NotificationsScreen';
import { SettingsScreen } from '@/screens/shared/SettingsScreen';
import { EducationalContent } from '@/screens/shared/EducationalContent';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types';

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 bg-error-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
      {count > 9 ? '9+' : count}
    </span>
  );
}

function CustomerApp() {
  const { profile } = useAuth();
  const { unreadCount } = useNotifications(profile?.id);
  const [section, setSection] = useState('dashboard');
  const [newRequestMode, setNewRequestMode] = useState(false);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'history', label: 'My Collections', icon: <Package size={20} /> },
    { id: 'learn', label: 'Learn', icon: <Leaf size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  if (confirmationId) {
    return (
      <AppShell navItems={navItems} activeSection="dashboard" onSectionChange={() => { setConfirmationId(null); setSection('dashboard'); }}>
        <RequestConfirmation
          requestId={confirmationId}
          onTrack={() => { setTrackingId(confirmationId); setConfirmationId(null); setSection('tracking'); }}
          onDone={() => { setConfirmationId(null); setSection('dashboard'); }}
        />
      </AppShell>
    );
  }

  if (trackingId) {
    return (
      <AppShell navItems={navItems} activeSection="dashboard" onSectionChange={(id) => { setTrackingId(null); setSection(id); }}>
        <TrackingScreen requestId={trackingId} onBack={() => { setTrackingId(null); setSection('history'); }} />
      </AppShell>
    );
  }

  if (newRequestMode) {
    return (
      <AppShell navItems={navItems} activeSection="dashboard" onSectionChange={(id) => { setNewRequestMode(false); setSection(id); }}>
        <NewRequestScreen
          onBack={() => setNewRequestMode(false)}
          onSuccess={(id) => { setNewRequestMode(false); setConfirmationId(id); }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      navItems={navItems}
      activeSection={section}
      onSectionChange={setSection}
      notificationsBadge={<NotificationBadge count={unreadCount} />}
    >
      {section === 'dashboard' && (
        <CustomerDashboard
          onNewRequest={() => setNewRequestMode(true)}
          onTrackRequest={(id) => setTrackingId(id)}
          onViewAll={() => setSection('history')}
        />
      )}
      {section === 'history' && <CustomerHistory onTrack={(id) => setTrackingId(id)} />}
      {section === 'learn' && <EducationalContent />}
      {section === 'notifications' && <NotificationsScreen />}
      {section === 'settings' && <SettingsScreen />}
    </AppShell>
  );
}

function CollectorApp() {
  const { profile } = useAuth();
  const { unreadCount } = useNotifications(profile?.id);
  const [section, setSection] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'learn', label: 'Learn', icon: <Leaf size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <AppShell
      navItems={navItems}
      activeSection={section}
      onSectionChange={setSection}
      notificationsBadge={<NotificationBadge count={unreadCount} />}
    >
      {section === 'dashboard' && <CollectorDashboard />}
      {section === 'learn' && <EducationalContent />}
      {section === 'notifications' && <NotificationsScreen />}
      {section === 'settings' && <SettingsScreen />}
    </AppShell>
  );
}

function AdminApp() {
  const { profile } = useAuth();
  const { unreadCount } = useNotifications(profile?.id);
  const [section, setSection] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'learn', label: 'Learn', icon: <Info size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <AppShell
      navItems={navItems}
      activeSection={section}
      onSectionChange={setSection}
      notificationsBadge={<NotificationBadge count={unreadCount} />}
    >
      {section === 'dashboard' && <AdminDashboard />}
      {section === 'learn' && <EducationalContent />}
      {section === 'notifications' && <NotificationsScreen />}
      {section === 'settings' && <SettingsScreen />}
    </AppShell>
  );
}

function AppContent() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader message="Loading NOVLAR..." />;
  }

  if (!session || !profile) {
    return <AuthScreen />;
  }

  const role = profile.role as UserRole;

  if (role === 'customer') return <CustomerApp />;
  if (role === 'collector') return <CollectorApp />;
  if (role === 'admin') return <AdminApp />;

  return <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
