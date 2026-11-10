import { useState } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Calendar, Clock, Check, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';
import LeafletMap from '@/components/LeafletMap';
import { WASTE_CATEGORIES, TIME_SLOTS, ACCRA_DEMO_LOCATIONS } from '@/lib/constants';
import { createNotification } from '@/lib/requests';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function NewRequestScreen({ onBack, onSuccess }: { onBack: () => void; onSuccess: (id: string) => void }) {
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [locationAddress, setLocationAddress] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoTotal = WASTE_CATEGORIES.filter((cat) => categories.includes(cat.id)).reduce((sum, cat) => sum + cat.demoPrice, 0);

  const formatDemoPrice = (amount: number) => `GH¢${amount.toFixed(2)}`;

  const toggleCategory = (id: string) => {
    setCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleMapClick = (lat: number, lng: number) => {
    setLocationLat(lat);
    setLocationLng(lng);
    setLocationAddress(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const selectDemoLocation = (name: string, lat: number, lng: number) => {
    setLocationLat(lat);
    setLocationLng(lng);
    setLocationAddress(name);
  };

  const canProceed = () => {
    if (step === 1) return categories.length > 0;
    if (step === 2) return locationAddress.length > 0;
    if (step === 3) return preferredDate && preferredTime;
    return true;
  };

  const handleSubmit = async () => {
    if (!profile) return;
    setSubmitting(true);
    setError(null);

    const { data, error } = await supabase
      .from('collection_requests')
      .insert({
        customer_id: profile.id,
        waste_categories: categories,
        location_address: locationAddress,
        location_lat: locationLat,
        location_lng: locationLng,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        instructions: instructions || null,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    await createNotification(
      profile.id,
      'request_submitted',
      'Request Submitted',
      'Your waste collection request has been submitted. We are matching you with a collector.',
      data.id
    );

    setSubmitting(false);
    onSuccess(data.id);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-charcoal-600 hover:text-forest-700 mb-6 font-medium">
        <ArrowLeft size={20} /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? 'bg-forest-600 text-white' : 'bg-forest-100 text-charcoal-400'
              }`}
            >
              {step > s ? <Check size={16} /> : s}
            </div>
            {s < 4 && <div className={`h-0.5 flex-1 mx-1 ${step > s ? 'bg-forest-500' : 'bg-forest-100'}`} />}
          </div>
        ))}
      </div>

      <div className="card">
        {step === 1 && (
          <div className="animate-slide-up">
            <h3 className="text-lg font-bold text-charcoal-800 mb-1">Select Waste Categories</h3>
            <p className="text-sm text-charcoal-500 mb-5">Choose all types of waste you need collected.</p>
            <div className="space-y-3">
              {WASTE_CATEGORIES.map((cat) => {
                const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[cat.icon] ?? LucideIcons.Trash2;
                const selected = categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      selected ? 'border-forest-500 bg-forest-50' : 'border-forest-100 bg-white hover:border-forest-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? 'bg-forest-500 text-white' : 'bg-forest-50 text-forest-600'}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-charcoal-800">{cat.label}</p>
                      <p className="text-xs text-charcoal-500">{cat.description}</p>
                      <p className="text-sm font-semibold text-forest-700 mt-1">{formatDemoPrice(cat.demoPrice)} <span className="text-xs font-normal text-charcoal-400">demo estimate</span></p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'border-forest-500 bg-forest-500' : 'border-charcoal-200'}`}>
                      {selected && <Check size={14} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-xl border border-accent-200 bg-accent-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-charcoal-800">Estimated total</p>
                  <p className="text-xs text-charcoal-500">Based on the categories selected</p>
                </div>
                <p className="text-xl font-bold text-forest-700">{formatDemoPrice(demoTotal)}</p>
              </div>
              <p className="text-xs text-charcoal-500 mt-2">Demo Estimates — Not Final Charges. Actual prices may differ.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up">
            <h3 className="text-lg font-bold text-charcoal-800 mb-1">Pickup Location</h3>
            <p className="text-sm text-charcoal-500 mb-5">Tap on the map to set your collection point.</p>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
              {ACCRA_DEMO_LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => selectDemoLocation(loc.name, loc.lat, loc.lng)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    locationAddress === loc.name
                      ? 'bg-forest-600 text-white'
                      : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                  }`}
                >
                  <MapPin size={14} />
                  <span className="truncate">{loc.name}</span>
                </button>
              ))}
            </div>

            <div className="rounded-xl overflow-hidden border border-forest-100 mb-4" style={{ height: '300px' }}>
              <LeafletMap
                markers={locationLat && locationLng ? [{ lat: locationLat, lng: locationLng, type: 'pickup' as const }] : []}
                onMapClick={handleMapClick}
                zoom={14}
                className="h-full"
              />
            </div>

            <div className="relative">
              <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Enter your address"
                className="input-field pl-11"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up">
            <h3 className="text-lg font-bold text-charcoal-800 mb-1">Date & Time</h3>
            <p className="text-sm text-charcoal-500 mb-5">When would you prefer the collection?</p>

            <div className="mb-5">
              <label className="block text-sm font-medium text-charcoal-600 mb-2">Preferred Date</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-2">Preferred Time Slot</label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setPreferredTime(slot)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      preferredTime === slot
                        ? 'bg-forest-600 text-white'
                        : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                    }`}
                  >
                    <Clock size={16} />
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-slide-up">
            <h3 className="text-lg font-bold text-charcoal-800 mb-1">Special Instructions</h3>
            <p className="text-sm text-charcoal-500 mb-5">Add any details the collector should know (optional).</p>

            <div className="relative mb-5">
              <MessageSquare size={18} className="absolute left-3.5 top-4 text-charcoal-400" />
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={5}
                placeholder="e.g. Waste is in blue bins near the gate. Call on arrival."
                className="input-field pl-11 pt-3 resize-none"
              />
            </div>

            <div className="bg-forest-50 rounded-xl p-4 space-y-2">
              <h4 className="font-semibold text-charcoal-700 text-sm">Review Your Request</h4>
              <div className="text-sm text-charcoal-600 space-y-1">
                <p><span className="text-charcoal-400">Categories:</span> {categories.map((c) => WASTE_CATEGORIES.find((w) => w.id === c)?.label).join(', ')}</p>
                <p><span className="text-charcoal-400">Demo estimate:</span> <strong>{formatDemoPrice(demoTotal)}</strong></p>
                <p className="text-xs text-charcoal-500">Demo Estimates — Not Final Charges.</p>
                <p><span className="text-charcoal-400">Location:</span> {locationAddress}</p>
                <p><span className="text-charcoal-400">Date:</span> {preferredDate}</p>
                <p><span className="text-charcoal-400">Time:</span> {preferredTime}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-error-50 border border-error-100 px-4 py-3 text-sm text-error-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-forest-50">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onBack())}
            className="btn-ghost flex items-center gap-2"
          >
            <ArrowLeft size={18} /> {step > 1 ? 'Back' : 'Cancel'}
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="btn-primary flex items-center gap-2"
            >
              Continue <ArrowRight size={18} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-2">
              {submitting ? <Spinner size={20} /> : (<><Check size={18} /> Submit Request</>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function RequestConfirmation({ requestId, onTrack, onDone }: { requestId: string; onTrack: () => void; onDone: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-12 animate-scale-in">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
        <Check size={40} className="text-emerald-600" />
      </div>
      <h2 className="text-2xl font-bold text-charcoal-800">Request Submitted!</h2>
      <p className="text-charcoal-500 mt-2 mb-1">Your waste collection request has been received.</p>
      <p className="text-xs text-charcoal-400 mb-8">Reference: {requestId.slice(0, 8).toUpperCase()}</p>
      <div className="space-y-3">
        <button onClick={onTrack} className="btn-primary w-full flex items-center justify-center gap-2">
          Track Collection <ArrowRight size={18} />
        </button>
        <button onClick={onDone} className="btn-secondary w-full">Back to Dashboard</button>
      </div>
    </div>
  );
}
