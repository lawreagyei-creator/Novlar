import type { CollectionStatus } from '@/types';

export const WASTE_CATEGORIES = [
  { id: 'general', label: 'General Waste', icon: 'Trash2', description: 'Non-recyclable household waste' },
  { id: 'plastic', label: 'Plastic Waste', icon: 'Recycle', description: 'Bottles, containers, packaging' },
  { id: 'paper', label: 'Paper & Cardboard', icon: 'FileText', description: 'Newspapers, boxes, office paper' },
  { id: 'organic', label: 'Organic Waste', icon: 'Leaf', description: 'Food scraps, garden waste' },
  { id: 'recyclable', label: 'Recyclable Materials', icon: 'RotateCw', description: 'Glass, metal, electronics' },
] as const;

export const STATUS_LABELS: Record<CollectionStatus, string> = {
  request_submitted: 'Request Submitted',
  request_confirmed: 'Request Confirmed',
  collector_assigned: 'Collector Assigned',
  collector_on_the_way: 'On the Way',
  collector_arrived: 'Collector Arrived',
  collection_completed: 'Collection Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS: Record<CollectionStatus, string> = {
  request_submitted: 'bg-charcoal-100 text-charcoal-700',
  request_confirmed: 'bg-accent-100 text-accent-700',
  collector_assigned: 'bg-forest-100 text-forest-700',
  collector_on_the_way: 'bg-warning-100 text-warning-700',
  collector_arrived: 'bg-emerald-100 text-emerald-700',
  collection_completed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-error-100 text-error-700',
  cancelled: 'bg-error-100 text-error-700',
};

export const STATUS_ORDER: CollectionStatus[] = [
  'request_submitted',
  'request_confirmed',
  'collector_assigned',
  'collector_on_the_way',
  'collector_arrived',
  'collection_completed',
];

export const ACCRA_DEMO_LOCATIONS = [
  { name: 'UPSA Main Campus', lat: 5.6118, lng: -0.0698 },
  { name: 'UPSA Graduate Campus', lat: 5.6095, lng: -0.0675 },
  { name: 'Madina Market', lat: 5.6827, lng: -0.1084 },
  { name: 'East Legon', lat: 5.6419, lng: -0.1689 },
  { name: 'Tesano', lat: 5.5689, lng: -0.2218 },
];

export const TIME_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
];

export const DEMO_EMAILS = {
  customer: 'demo.customer@novlar.app',
  collector: 'demo.collector@novlar.app',
  admin: 'demo.admin@novlar.app',
};

export const DEMO_PASSWORD = 'novlar123';
