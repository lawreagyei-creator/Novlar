import { useState } from 'react';
import { Leaf, Recycle, Trash2, FileText, Apple, Lightbulb, TrendingUp, ChevronDown, Info, Phone, Mail, MapPin, Shield, Truck, Heart } from 'lucide-react';
import { Card } from '@/components/ui';
import { WASTE_CATEGORIES } from '@/lib/constants';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Logo from '@/components/Logo';

type ContentTab = 'sorting' | 'tips' | 'impact' | 'faq' | 'about' | 'support' | 'privacy';

export function EducationalContent() {
  const [tab, setTab] = useState<ContentTab>('sorting');

  const tabs: { id: ContentTab; label: string }[] = [
    { id: 'sorting', label: 'Waste Sorting' },
    { id: 'tips', label: 'Sustainability Tips' },
    { id: 'impact', label: 'Environmental Impact' },
    { id: 'faq', label: 'FAQ' },
    { id: 'about', label: 'About NOVLAR' },
    { id: 'support', label: 'Contact & Support' },
    { id: 'privacy', label: 'Privacy & GPS' },
  ];

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.id ? 'bg-forest-600 text-white' : 'bg-white text-charcoal-600 hover:bg-forest-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sorting' && <WasteSorting />}
      {tab === 'tips' && <SustainabilityTips />}
      {tab === 'impact' && <EnvironmentalImpact />}
      {tab === 'faq' && <FAQ />}
      {tab === 'about' && <AboutSection />}
      {tab === 'support' && <SupportSection />}
      {tab === 'privacy' && <PrivacySection />}
    </div>
  );
}

function WasteSorting() {
  const sortingGuide = [
    { category: 'general', items: ['Food-contaminated packaging', 'Used tissues & napkins', 'Broken ceramics', 'Diapers & sanitary products'], bin: 'Black bin', color: 'bg-charcoal-100 text-charcoal-700' },
    { category: 'plastic', items: ['PET bottles & water sachets', 'Plastic containers & jugs', 'Shopping bags', 'Shampoo bottles'], bin: 'Blue bin', color: 'bg-accent-100 text-accent-700' },
    { category: 'paper', items: ['Newspapers & magazines', 'Cardboard boxes', 'Office paper & notebooks', 'Paper bags (clean)'], bin: 'Green/White bin', color: 'bg-forest-100 text-forest-700' },
    { category: 'organic', items: ['Fruit & vegetable peels', 'Food scraps & leftovers', 'Tea bags & coffee grounds', 'Garden trimmings & leaves'], bin: 'Brown bin', color: 'bg-warning-100 text-warning-700' },
    { category: 'recyclable', items: ['Glass bottles & jars', 'Aluminum cans & foil', 'Metal scrap & wire', 'E-waste (phones, batteries)'], bin: 'Yellow/orange bin', color: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div className="space-y-4">
      <div className="card bg-forest-50 border-forest-100">
        <div className="flex items-center gap-2 mb-2">
          <Recycle size={20} className="text-forest-600" />
          <h2 className="font-bold text-charcoal-800">How to Sort Your Waste</h2>
        </div>
        <p className="text-sm text-charcoal-600">
          Proper waste sorting helps recyclers recover valuable materials, reduces landfill waste, and protects the environment.
          Sort your waste into the right categories before collection day.
        </p>
      </div>

      {sortingGuide.map((guide) => {
        const cat = WASTE_CATEGORIES.find((c) => c.id === guide.category);
        if (!cat) return null;
        const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[cat.icon] ?? Trash2;
        return (
          <Card key={guide.category}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-forest-600">
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-charcoal-800">{cat.label}</h3>
                <span className={`badge ${guide.color} mt-1`}>{guide.bin}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {guide.items.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-charcoal-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-forest-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function SustainabilityTips() {
  const tips = [
    { icon: 'Leaf', title: 'Reduce Food Waste', text: 'Plan meals ahead, store food properly, and compost organic waste. Food waste in landfills produces methane, a potent greenhouse gas.' },
    { icon: 'Recycle', title: 'Rinse Before Recycling', text: 'Quickly rinse plastic containers and cans before recycling. Food residue can contaminate an entire batch of recyclables.' },
    { icon: 'Trash2', title: 'Say No to Single-Use', text: 'Carry a reusable water bottle, shopping bag, and food container. Single-use plastics take hundreds of years to decompose.' },
    { icon: 'FileText', title: 'Flatten Cardboard', text: 'Flatten boxes and cardboard before collection. This saves space in collection vehicles and reduces the number of trips needed.' },
    { icon: 'Apple', title: 'Start Composting', text: 'Composting organic waste at home creates nutrient-rich soil for plants and reduces the amount of waste sent to landfills.' },
    { icon: 'Lightbulb', title: 'Choose Rechargeable', text: 'Use rechargeable batteries instead of disposables. Batteries contain toxic chemicals that can leach into soil and water.' },
  ];

  return (
    <div className="space-y-3">
      <div className="card bg-forest-50 border-forest-100">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={20} className="text-forest-600" />
          <h2 className="font-bold text-charcoal-800">Sustainability Tips</h2>
        </div>
        <p className="text-sm text-charcoal-600">Small changes in how we handle waste make a big difference for our environment and community.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tips.map((tip) => {
          const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[tip.icon] ?? Lightbulb;
          return (
            <Card key={tip.title}>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
                <Icon size={20} />
              </div>
              <h3 className="font-bold text-charcoal-800 text-sm mb-1">{tip.title}</h3>
              <p className="text-xs text-charcoal-500 leading-relaxed">{tip.text}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function EnvironmentalImpact() {
  const stats = [
    { label: 'CO₂ Saved Per Ton Recycled', value: '2.1', unit: 'tons', icon: 'Leaf' },
    { label: 'Plastic Bottles Per Kg', value: '45', unit: 'bottles', icon: 'Recycle' },
    { label: 'Trees Saved Per Ton Paper', value: '17', unit: 'trees', icon: 'FileText' },
    { label: 'Water Saved Per Ton Recycled', value: '4,000', unit: 'liters', icon: 'Apple' },
  ];

  return (
    <div className="space-y-4">
      <div className="card bg-forest-50 border-forest-100">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={20} className="text-forest-600" />
          <h2 className="font-bold text-charcoal-800">Environmental Impact</h2>
        </div>
        <p className="text-sm text-charcoal-600">
          These are illustrative figures based on environmental research averages. Actual impact depends on the volume and type
          of waste collected through NOVLAR.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[stat.icon] ?? Leaf;
          return (
            <Card key={stat.label}>
              <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-forest-600 mb-3">
                <Icon size={20} />
              </div>
              <p className="text-3xl font-extrabold text-forest-700">{stat.value}</p>
              <p className="text-xs text-charcoal-400 font-medium">{stat.unit}</p>
              <p className="text-xs text-charcoal-600 mt-2">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-br from-forest-600 to-forest-800 text-white border-0">
        <Heart size={28} className="text-emerald-300 mb-3" />
        <h3 className="text-lg font-bold mb-2">Why It Matters</h3>
        <p className="text-sm text-forest-100 leading-relaxed">
          Ghana generates over 8,000 tonnes of waste daily, much of it ending up in drains, streets, and dumpsites.
          By sorting and collecting waste properly, NOVLAR helps reduce pollution, prevent flooding from blocked drains,
          and create a cleaner, healthier environment for university campuses and surrounding communities.
        </p>
      </Card>
    </div>
  );
}

function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = [
    { q: 'How do I request a waste collection?', a: 'Sign in as a customer, tap "Request Collection" on your dashboard, select the waste categories, set your location on the map, choose a date and time slot, add any special instructions, and submit. You\'ll receive a confirmation notification immediately.' },
    { q: 'How do I track my collector?', a: 'Once a collector is assigned to your request, a "Track" button appears on your request card. Tap it to see the collector\'s live location on a map, estimated arrival time, and real-time status updates.' },
    { q: 'What is the two-phone demonstration?', a: 'Open NOVLAR on two phones: one as a customer (submit a request), and one as a collector (accept the request and go online with GPS enabled). As the collector moves, the customer phone shows the collector\'s live position on the map in real time.' },
    { q: 'How does GPS tracking work?', a: 'The collector\'s phone uses the browser Geolocation API (watchPosition) to continuously read GPS coordinates and sends them to our database. The customer\'s phone subscribes to these updates via Supabase Realtime and displays the changing position on the map.' },
    { q: 'What if GPS is not available during a demo?', a: 'The collector app has a "Simulation Mode" that generates a moving location between two points in Accra. This is clearly labelled as simulated GPS so you always know whether you\'re seeing real or simulated tracking.' },
    { q: 'Is my location data private?', a: 'Your location is only shared when you actively enable GPS tracking for a collection. It\'s only visible to the customer whose request you\'re fulfilling and to administrators. When you go offline, tracking stops immediately.' },
    { q: 'Can I use NOVLAR without creating an account?', a: 'You can explore all three roles using the Demo Mode buttons on the login screen. For the full experience including creating real collection requests, you\'ll need to sign up.' },
    { q: 'Is NOVLAR available outside UPSA?', a: 'NOVLAR is a university startup concept designed for UPSA campus and surrounding communities. The vision is to expand to other universities and communities across Ghana.' },
  ];

  return (
    <div className="space-y-3">
      <div className="card bg-forest-50 border-forest-100">
        <h2 className="font-bold text-charcoal-800 mb-1">Frequently Asked Questions</h2>
        <p className="text-sm text-charcoal-600">Everything you need to know about using NOVLAR.</p>
      </div>

      {faqs.map((faq, idx) => (
        <Card key={idx}>
          <button
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            className="w-full flex items-center justify-between gap-3 text-left"
          >
            <span className="font-semibold text-charcoal-800 text-sm">{faq.q}</span>
            <ChevronDown
              size={20}
              className={`text-forest-600 flex-shrink-0 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`}
            />
          </button>
          {openIdx === idx && (
            <p className="text-sm text-charcoal-600 mt-3 leading-relaxed animate-slide-down">{faq.a}</p>
          )}
        </Card>
      ))}
    </div>
  );
}

function AboutSection() {
  return (
    <div className="space-y-4">
      <Card className="text-center py-8">
        <div className="flex justify-center mb-4">
          <Logo size={56} />
        </div>
        <h2 className="text-2xl font-extrabold text-charcoal-800">NOVLAR</h2>
        <p className="text-forest-600 font-medium mt-1">Waste Collection, Without the Stress.</p>
        <p className="text-sm text-charcoal-500 mt-4 max-w-md mx-auto">
          NOVLAR is a smart waste management platform designed to make waste collection easier, more convenient,
          transparent, and reliable for university campuses and surrounding communities in Accra, Ghana.
        </p>
      </Card>

      <Card>
        <h3 className="font-bold text-charcoal-800 mb-3">Our Mission</h3>
        <p className="text-sm text-charcoal-600 leading-relaxed">
          To transform waste management in Ghana through technology — connecting residents with reliable waste collectors,
          providing real-time tracking for transparency, and promoting proper waste sorting for a sustainable environment.
        </p>
      </Card>

      <Card>
        <h3 className="font-bold text-charcoal-800 mb-3">The Problem We Solve</h3>
        <p className="text-sm text-charcoal-600 leading-relaxed">
          Waste collection in many Ghanaian communities is irregular, unreliable, and opaque. Residents never know when
          collectors will arrive, and collectors lack efficient routing tools. NOVLAR brings Uber-style tracking to waste
          collection — you request, we assign, you track, we collect.
        </p>
      </Card>

      <Card>
        <h3 className="font-bold text-charcoal-800 mb-3">Our Story</h3>
        <p className="text-sm text-charcoal-600 leading-relaxed">
          NOVLAR was developed as a university startup concept for the Elements of Marketing group project at the
          University of Professional Studies, Accra (UPSA). It demonstrates how technology can solve everyday problems
          in waste management while creating entrepreneurial opportunities for waste collectors.
        </p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Leaf, label: 'Environmental', value: 'Eco-friendly waste sorting and recycling' },
          { icon: Truck, label: 'Convenient', value: 'On-demand collection with live tracking' },
          { icon: Shield, label: 'Transparent', value: 'Real-time status and GPS visibility' },
        ].map((item) => (
          <Card key={item.label}>
            <item.icon size={24} className="text-forest-600 mb-2" />
            <h4 className="font-bold text-charcoal-800 text-sm">{item.label}</h4>
            <p className="text-xs text-charcoal-500 mt-1">{item.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SupportSection() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Phone size={20} className="text-forest-600" />
          <h2 className="font-bold text-charcoal-800">Contact & Support</h2>
        </div>
        <p className="text-sm text-charcoal-600 mb-4">We're here to help. Reach out through any of these channels.</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-forest-50">
            <Mail size={18} className="text-forest-600" />
            <div>
              <p className="text-sm font-semibold text-charcoal-700">Email</p>
              <p className="text-xs text-charcoal-500">support@novlar.app</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-forest-50">
            <Phone size={18} className="text-forest-600" />
            <div>
              <p className="text-sm font-semibold text-charcoal-700">Phone</p>
              <p className="text-xs text-charcoal-500">+233 50 123 4567</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-forest-50">
            <MapPin size={18} className="text-forest-600" />
            <div>
              <p className="text-sm font-semibold text-charcoal-700">Address</p>
              <p className="text-xs text-charcoal-500">University of Professional Studies, Accra (UPSA)</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-charcoal-800 mb-3">Hours of Operation</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-charcoal-600">Monday - Friday</span><span className="font-medium text-charcoal-800">7:00 AM - 7:00 PM</span></div>
          <div className="flex justify-between"><span className="text-charcoal-600">Saturday</span><span className="font-medium text-charcoal-800">8:00 AM - 5:00 PM</span></div>
          <div className="flex justify-between"><span className="text-charcoal-600">Sunday</span><span className="font-medium text-charcoal-800">Closed</span></div>
        </div>
      </Card>
    </div>
  );
}

function PrivacySection() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={20} className="text-forest-600" />
          <h2 className="font-bold text-charcoal-800">Privacy & Location Permissions</h2>
        </div>
        <p className="text-sm text-charcoal-600 leading-relaxed">
          NOVLAR takes your privacy seriously. Here's how we handle your data and location information.
        </p>
      </Card>

      <Card>
        <h3 className="font-bold text-charcoal-800 mb-2 flex items-center gap-2"><MapPin size={18} className="text-forest-600" /> Location Data</h3>
        <ul className="space-y-2 text-sm text-charcoal-600">
          <li className="flex items-start gap-2"><span className="text-forest-500 mt-1">•</span> Location tracking is only active when a collector explicitly goes online and enables GPS sharing.</li>
          <li className="flex items-start gap-2"><span className="text-forest-500 mt-1">•</span> Your live location is only visible to the customer whose collection you're assigned to, and to administrators.</li>
          <li className="flex items-start gap-2"><span className="text-forest-500 mt-1">•</span> Location updates stop immediately when you go offline or close the app.</li>
          <li className="flex items-start gap-2"><span className="text-forest-500 mt-1">•</span> We use your device's built-in GPS (Geolocation API). No third-party tracking SDKs are used.</li>
        </ul>
      </Card>

      <Card>
        <h3 className="font-bold text-charcoal-800 mb-2 flex items-center gap-2"><Info size={18} className="text-forest-600" /> Browser Permissions</h3>
        <p className="text-sm text-charcoal-600 leading-relaxed">
          When you enable GPS tracking, your browser will ask for location permission. You can revoke this at any time
          through your browser settings. On Android Chrome: Settings &rarr; Site Settings &rarr; Location.
        </p>
      </Card>

      <Card>
        <h3 className="font-bold text-charcoal-800 mb-2">Data Storage</h3>
        <p className="text-sm text-charcoal-600 leading-relaxed">
          Your profile information, collection requests, and notifications are stored securely in our database with
          row-level security. Each user can only access their own data. Collector location data is only stored while
          a collection is active and the collector is online.
        </p>
      </Card>
    </div>
  );
}
