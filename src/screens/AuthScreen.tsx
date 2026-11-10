import { useState } from 'react';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles, User, Phone } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { DEMO_EMAILS, DEMO_PASSWORD } from '@/lib/constants';
import type { UserRole } from '@/types';

const DEMO_NAMES: Record<UserRole, string> = {
  customer: 'Ama Mensah (Demo)',
  collector: 'Kwame Asante (Demo)',
  admin: 'Admin User (Demo)',
};

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName, phone, role);
      if (error) {
        setError(error);
      } else {
        setMode('login');
        setPassword('');
        setSuccess('Account created successfully. If email confirmation is enabled, check your inbox and confirm your email before signing in.');
      }
    }
    setLoading(false);
  };

  const handleDemoLogin = async (demoRole: UserRole) => {
    setError(null);
    setDemoLoading(true);
    const email = DEMO_EMAILS[demoRole];

    // Try signing in first
    const { error: signInError } = await signIn(email, DEMO_PASSWORD);

    if (signInError) {
      // If the account doesn't exist yet, create it then sign in
      if (signInError.includes('Invalid login') || signInError.includes('not confirmed')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: DEMO_PASSWORD,
          options: {
            data: {
              full_name: DEMO_NAMES[demoRole],
              phone: '+233 50 123 4567',
              role: demoRole,
            },
          },
        });

        if (signUpError) {
          setError(`Could not create demo account: ${signUpError.message}`);
          setDemoLoading(false);
          return;
        }

        // Wait briefly for the profile trigger to fire, then sign in
        await new Promise((r) => setTimeout(r, 800));
        const { error: retryError } = await signIn(email, DEMO_PASSWORD);
        if (retryError) {
          setError(`Demo account created but sign-in failed: ${retryError}`);
        }
      } else {
        setError(signInError);
      }
    }
    setDemoLoading(false);
  };

  return (
    <AuthLayout
      title={mode === 'login' ? 'Welcome back' : 'Create your account'}
      subtitle={mode === 'login' ? 'Sign in to manage your waste collection' : 'Join NOVLAR for smarter waste collection'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ama Mensah"
                  className="input-field pl-11"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233 50 123 4567"
                  className="input-field pl-11"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1.5">Account Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['customer', 'collector', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-xl py-2.5 text-sm font-medium capitalize transition-all ${
                      role === r
                        ? 'bg-forest-600 text-white shadow-card'
                        : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-charcoal-600 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field pl-11"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-600 mb-1.5">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="input-field pl-11 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {success && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800 animate-slide-down">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-error-50 border border-error-100 px-4 py-3 text-sm text-error-700 animate-slide-down">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <Spinner size={20} /> : (
            <>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 text-center">
        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError(null);
            setSuccess(null);
          }}
          className="text-sm text-forest-600 hover:text-forest-700 font-medium"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-forest-100">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-emerald-500" />
          <p className="text-sm font-semibold text-charcoal-600">Demo Mode — Instant Access</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['customer', 'collector', 'admin'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => handleDemoLogin(r)}
              disabled={demoLoading}
              className="btn-secondary text-sm capitalize py-2.5 flex items-center justify-center"
            >
              {demoLoading ? <Spinner size={16} /> : r}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-charcoal-400 leading-relaxed">
          Tap a role to instantly explore NOVLAR. The demo account is created automatically on first use
          (password: {DEMO_PASSWORD}).
        </p>
      </div>
    </AuthLayout>
  );
}
