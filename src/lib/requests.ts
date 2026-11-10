import { supabase } from '@/lib/supabase';
import type { CollectionStatus } from '@/types';

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedRequestId?: string
) {
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    related_request_id: relatedRequestId ?? null,
  });
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not set';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function estimateArrival(distanceMeters: number, speedMps: number = 5): string {
  if (distanceMeters < 1) return 'Arrived';
  const seconds = distanceMeters / speedMps;
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return `${hours}h ${remainingMin}m`;
}

export async function updateRequestStatus(
  requestId: string,
  status: CollectionStatus,
  collectorId?: string
) {
  const updates: Record<string, unknown> = { status };
  if (status === 'request_confirmed') updates.confirmed_at = new Date().toISOString();
  if (status === 'collection_completed') updates.completed_at = new Date().toISOString();
  if (collectorId) updates.collector_id = collectorId;

  const { data, error } = await supabase
    .from('collection_requests')
    .update(updates)
    .eq('id', requestId)
    .select()
    .single();

  return { data, error };
}

export async function addToHistory(requestId: string) {
  const { data: req } = await supabase
    .from('collection_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (!req) return;

  await supabase.from('collection_history').insert({
    request_id: req.id,
    customer_id: req.customer_id,
    collector_id: req.collector_id,
    waste_categories: req.waste_categories,
    location_address: req.location_address,
  });
}
