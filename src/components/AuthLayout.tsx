import { Leaf } from 'lucide-react';
import Logo from '@/components/Logo';
import type { ReactNode } from 'react';

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-forest-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-20 -right-20 w-80 h-80 rounded-full bg-forest-600 opacity-20 blur-3xl" />
        <div className="absolute bottom-10 -left-10 w-60 h-60 rounded-full bg-emerald-500 opacity-10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Logo size={48} textClassName="text-white" />
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-2 mb-6">
              <Leaf size={16} className="text-emerald-300" />
              <span className="text-sm font-medium">Sustainable Campus Living</span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight mb-4">
              Waste Collection,<br />Without the Stress.
            </h1>
            <p className="text-forest-100 text-lg max-w-md">
              Smart, reliable waste management for university campuses and surrounding communities in Accra.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-forest-200">
            <div>
              <p className="text-2xl font-bold text-white">5</p>
              <p>Waste Categories</p>
            </div>
            <div className="h-10 w-px bg-forest-600" />
            <div>
              <p className="text-2xl font-bold text-white">24/7</p>
              <p>Request Access</p>
            </div>
            <div className="h-10 w-px bg-forest-600" />
            <div>
              <p className="text-2xl font-bold text-white">Live</p>
              <p>GPS Tracking</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-forest-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size={44} />
          </div>
          <h2 className="text-2xl font-bold text-charcoal-800">{title}</h2>
          <p className="text-charcoal-500 mt-1 mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
