import { useState } from 'react';
import { User, Phone, MapPin, Save, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';

export function SettingsScreen() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, address })
      .eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-lg animate-fade-in">
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-2xl">
            {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="font-bold text-charcoal-800 text-lg">{profile?.full_name}</p>
            <p className="text-sm text-charcoal-500 capitalize">{profile?.role} Account</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-600 mb-1.5">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field pl-11" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-600 mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field pl-11" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-600 mb-1.5">Default Address</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your default collection address" className="input-field pl-11" />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? <Spinner size={20} /> : saved ? (<><Check size={18} /> Saved!</>) : (<><Save size={18} /> Save Changes</>)}
          </button>
        </div>
      </div>
    </div>
  );
}
