import type { ReactNode } from 'react';

export function Spinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function FullScreenLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-forest-50 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-forest-600 animate-pulse-soft" />
        <div className="absolute inset-0 w-16 h-16 rounded-2xl border-4 border-forest-200 border-t-forest-500 animate-spin" />
      </div>
      <p className="text-forest-700 font-medium text-sm">{message}</p>
    </div>
  );
}

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`badge ${className}`}>{children}</span>;
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      {icon && <div className="mb-4 text-forest-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-charcoal-700">{title}</h3>
      {message && <p className="mt-1 text-sm text-charcoal-500 max-w-xs">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`card ${onClick ? 'cursor-pointer hover:shadow-card-hover transition-shadow' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  color = 'forest',
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color?: 'forest' | 'emerald' | 'accent' | 'warning' | 'error' | 'charcoal';
}) {
  const colorMap = {
    forest: 'bg-forest-50 text-forest-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    accent: 'bg-accent-50 text-accent-600',
    warning: 'bg-warning-50 text-warning-600',
    error: 'bg-error-50 text-error-600',
    charcoal: 'bg-charcoal-50 text-charcoal-600',
  };
  return (
    <div className="card flex items-center gap-4 animate-slide-up">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-charcoal-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-charcoal-800">{value}</p>
        {trend && <p className="text-xs text-forest-500 font-medium">{trend}</p>}
      </div>
    </div>
  );
}
