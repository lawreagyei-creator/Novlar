/*
# NOVLAR Waste Management Schema

## Overview
Creates the complete database schema for the NOVLAR waste collection application.
This includes user profiles with role-based access, collection requests, real-time
collector GPS locations, notifications, and collection history.

## New Tables
1. `profiles` — Extends auth.users with full name, phone, role (customer/collector/admin), and avatar.
2. `collection_requests` — Main request entity linking customers to collectors with status tracking.
3. `collector_locations` — Real-time GPS coordinates for collectors, updated via watchPosition().
4. `notifications` — In-app notifications scoped to each user.
5. `collection_history` — Log of completed collections for reporting and stats.

## Relationships
- profiles.id → auth.users.id (1:1)
- collection_requests.customer_id → auth.users.id (N:1)
- collection_requests.collector_id → auth.users.id (N:1, nullable until assigned)
- collector_locations.collector_id → auth.users.id (1:1)
- collector_locations.request_id → collection_requests.id (N:1)
- notifications.user_id → auth.users.id (N:1)
- notifications.related_request_id → collection_requests.id (N:1)
- collection_history.request_id → collection_requests.id (1:1)

## Security (RLS)
- All tables have RLS enabled.
- profiles: users read all profiles (needed for collector/customer info display), update only own.
- collection_requests: customers see own requests, collectors see assigned requests, admins see all.
- collector_locations: collectors update own location, customers/admins read locations for assigned requests.
- notifications: users see only their own notifications.
- collection_history: customers see own history, collectors see their completed jobs, admins see all.
- All policies use auth.uid() for ownership checks.
- Grants are scoped to authenticated role only (app requires sign-in).

## Indexes
- collection_requests(customer_id) — customer dashboard queries
- collection_requests(collector_id) — collector dashboard queries
- collection_requests(status) — admin filtering
- notifications(user_id) — notification lookup
- collection_history(customer_id, collector_id) — history queries
*/

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'collector', 'admin')),
  avatar_url text,
  address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON profiles TO authenticated;

DROP POLICY IF EXISTS "select_all_profiles" ON profiles;
CREATE POLICY "select_all_profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- COLLECTION_REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS collection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  collector_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'request_submitted'
    CHECK (status IN ('request_submitted', 'request_confirmed', 'collector_assigned',
                      'collector_on_the_way', 'collector_arrived', 'collection_completed',
                      'rejected', 'cancelled')),
  waste_categories text[] NOT NULL DEFAULT '{}',
  location_address text NOT NULL,
  location_lat double precision,
  location_lng double precision,
  preferred_date date,
  preferred_time text,
  instructions text,
  confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE collection_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON collection_requests TO authenticated;

-- Customers can see their own requests
DROP POLICY IF EXISTS "select_own_requests_customer" ON collection_requests;
CREATE POLICY "select_own_requests_customer"
  ON collection_requests FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

-- Collectors can see requests assigned to them
DROP POLICY IF EXISTS "select_assigned_requests_collector" ON collection_requests;
CREATE POLICY "select_assigned_requests_collector"
  ON collection_requests FOR SELECT TO authenticated
  USING (auth.uid() = collector_id);

-- Admins can see all requests (admin check via profiles table)
DROP POLICY IF EXISTS "select_all_requests_admin" ON collection_requests;
CREATE POLICY "select_all_requests_admin"
  ON collection_requests FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Customers can insert their own requests
DROP POLICY IF EXISTS "insert_own_requests" ON collection_requests;
CREATE POLICY "insert_own_requests"
  ON collection_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own requests
DROP POLICY IF EXISTS "update_own_requests_customer" ON collection_requests;
CREATE POLICY "update_own_requests_customer"
  ON collection_requests FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

-- Collectors can update requests assigned to them (for status updates)
DROP POLICY IF EXISTS "update_assigned_requests_collector" ON collection_requests;
CREATE POLICY "update_assigned_requests_collector"
  ON collection_requests FOR UPDATE TO authenticated
  USING (auth.uid() = collector_id) WITH CHECK (auth.uid() = collector_id);

-- Admins can update all requests
DROP POLICY IF EXISTS "update_all_requests_admin" ON collection_requests;
CREATE POLICY "update_all_requests_admin"
  ON collection_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_requests_customer_id ON collection_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_requests_collector_id ON collection_requests(collector_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON collection_requests(status);

-- ============================================================
-- COLLECTOR_LOCATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS collector_locations (
  collector_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id uuid REFERENCES collection_requests(id) ON DELETE SET NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  heading double precision,
  speed double precision,
  is_online boolean NOT NULL DEFAULT false,
  is_simulated boolean NOT NULL DEFAULT false,
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE collector_locations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON collector_locations TO authenticated;

-- Collectors can read their own location
DROP POLICY IF EXISTS "select_own_location_collector" ON collector_locations;
CREATE POLICY "select_own_location_collector"
  ON collector_locations FOR SELECT TO authenticated
  USING (auth.uid() = collector_id);

-- Customers can read location of collector assigned to their request
DROP POLICY IF EXISTS "select_assigned_location_customer" ON collector_locations;
CREATE POLICY "select_assigned_location_customer"
  ON collector_locations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collection_requests
      WHERE collection_requests.collector_id = collector_locations.collector_id
        AND collection_requests.customer_id = auth.uid()
    )
  );

-- Admins can read all locations
DROP POLICY IF EXISTS "select_all_locations_admin" ON collector_locations;
CREATE POLICY "select_all_locations_admin"
  ON collector_locations FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Collectors can insert their own location
DROP POLICY IF EXISTS "insert_own_location" ON collector_locations;
CREATE POLICY "insert_own_location"
  ON collector_locations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = collector_id);

-- Collectors can update their own location
DROP POLICY IF EXISTS "update_own_location" ON collector_locations;
CREATE POLICY "update_own_location"
  ON collector_locations FOR UPDATE TO authenticated
  USING (auth.uid() = collector_id) WITH CHECK (auth.uid() = collector_id);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  related_request_id uuid REFERENCES collection_requests(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications"
  ON notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ============================================================
-- COLLECTION_HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS collection_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES collection_requests(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collector_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  waste_categories text[] NOT NULL DEFAULT '{}',
  location_address text NOT NULL,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collection_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON collection_history TO authenticated;

-- Customers can see their own history
DROP POLICY IF EXISTS "select_own_history_customer" ON collection_history;
CREATE POLICY "select_own_history_customer"
  ON collection_history FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

-- Collectors can see history of their completed jobs
DROP POLICY IF EXISTS "select_own_history_collector" ON collection_history;
CREATE POLICY "select_own_history_collector"
  ON collection_history FOR SELECT TO authenticated
  USING (auth.uid() = collector_id);

-- Admins can see all history
DROP POLICY IF EXISTS "select_all_history_admin" ON collection_history;
CREATE POLICY "select_all_history_admin"
  ON collection_history FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Customers, collectors, and admins can insert history
DROP POLICY IF EXISTS "insert_history" ON collection_history;
CREATE POLICY "insert_history"
  ON collection_history FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = customer_id OR auth.uid() = collector_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_history_customer_id ON collection_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_history_collector_id ON collection_history(collector_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_collection_requests_updated_at ON collection_requests;
CREATE TRIGGER trigger_collection_requests_updated_at
  BEFORE UPDATE ON collection_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
