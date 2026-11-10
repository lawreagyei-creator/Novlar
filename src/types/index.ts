export type UserRole = 'customer' | 'collector' | 'admin';

export type CollectionStatus =
  | 'request_submitted'
  | 'request_confirmed'
  | 'collector_assigned'
  | 'collector_on_the_way'
  | 'collector_arrived'
  | 'collection_completed'
  | 'rejected'
  | 'cancelled';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  address: string | null;
  created_at: string;
}

export interface CollectionRequest {
  id: string;
  customer_id: string;
  collector_id: string | null;
  status: CollectionStatus;
  waste_categories: string[];
  location_address: string;
  location_lat: number | null;
  location_lng: number | null;
  preferred_date: string | null;
  preferred_time: string | null;
  instructions: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollectorLocation {
  collector_id: string;
  request_id: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  is_online: boolean;
  is_simulated: boolean;
  last_updated: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_request_id: string | null;
  created_at: string;
}

export interface CollectionHistory {
  id: string;
  request_id: string;
  customer_id: string;
  collector_id: string | null;
  waste_categories: string[];
  location_address: string;
  completed_at: string;
  created_at: string;
}

export interface RequestWithProfile extends CollectionRequest {
  customer?: Profile;
  collector?: Profile;
}
