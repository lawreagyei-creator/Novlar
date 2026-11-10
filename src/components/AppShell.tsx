import { useState, type ReactNode } from 'react';
import { Home, MapPin, Bell, Settings, Menu, X, LogOut, Leaf, Info, HelpCircle, Phone } from 'lucide-react';
import Logo, { LogoMark } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';

export type NavSection = string;

interface AppShellProps {
  children: ReactNode;
  navItems: { id: string; label: string; icon: ReactNode }[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  notificationsBadge?: ReactNode;
  headerExtra?: ReactNode;
}

export function AppShell({
  children,
  navItems,
  activeSection,
  onSectionChange,
  notificationsBadge,
  headerExtra,
}: AppShellProps) {
  const { profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = profile?.role ?? 'customer';

  const roleColors: Record<UserRole, string> = {
    customer: 'bg-forest-100 text-forest-700',
    collector: 'bg-emerald-100 text-emerald-700',
    admin: 'bg-charcoal-100 text-charcoal-700',
  };

  const bottomNavItems = navItems.slice(0, 5);

  return (
    <div className="min-h-screen bg-forest-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-forest-100 fixed h-screen z-30">
        <div className="p-5 border-b border-forest-50">
          <Logo size={36} />
        </div>
        <div className="px-5 py-3">
          <span className={`badge capitalize ${roleColors[role]}`}>
            {role} Account
          </span>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeSection === item.id
                  ? 'bg-forest-600 text-white shadow-card'
                  : 'text-charcoal-600 hover:bg-forest-50'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'notifications' && notificationsBadge}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-forest-50">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-semibold text-sm">
              {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-charcoal-800 truncate">{profile?.full_name}</p>
              <p className="text-xs text-charcoal-400 truncate">{profile?.phone ?? profile?.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-error-600 hover:bg-error-50 transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-forest-100 z-30 px-4 h-16 flex items-center justify-between">
        <LogoMark size={32} />
        <div className="flex items-center gap-2">
          {headerExtra}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-forest-700"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-charcoal-900/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col animate-slide-down">
            <div className="flex items-center justify-between p-5 border-b border-forest-50">
              <Logo size={32} />
              <button onClick={() => setMobileMenuOpen(false)} className="w-9 h-9 rounded-lg bg-forest-50 flex items-center justify-center">
                <X size={18} className="text-forest-700" />
              </button>
            </div>
            <div className="px-5 py-3">
              <span className={`badge capitalize ${roleColors[role]}`}>{role} Account</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 border-b border-forest-50">
              <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-semibold">
                {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-charcoal-800 truncate">{profile?.full_name}</p>
                <p className="text-xs text-charcoal-400 truncate">{profile?.phone}</p>
              </div>
            </div>
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeSection === item.id
                      ? 'bg-forest-600 text-white'
                      : 'text-charcoal-600 hover:bg-forest-50'
                  }`}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.id === 'notifications' && notificationsBadge}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-forest-50">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-error-600 hover:bg-error-50"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-forest-100 sticky top-0 z-20">
          <h1 className="text-lg font-bold text-charcoal-800 capitalize">
            {navItems.find((n) => n.id === activeSection)?.label ?? 'Dashboard'}
          </h1>
          <div className="flex items-center gap-3">
            {headerExtra}
            {notificationsBadge && (
              <button onClick={() => onSectionChange('notifications')} className="relative w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-forest-700 hover:bg-forest-100 transition-colors">
                <Bell size={20} />
                {notificationsBadge}
              </button>
            )}
          </div>
        </div>
        <main className="px-4 lg:px-8 py-4 lg:py-6 max-w-6xl mx-auto">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-forest-100 z-30 flex items-center justify-around px-1 py-1.5">
        {bottomNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all min-w-[56px] ${
              activeSection === item.id ? 'text-forest-600' : 'text-charcoal-400'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.id === 'notifications' && notificationsBadge}
            </div>
            <span className="text-[10px] font-medium leading-none">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
