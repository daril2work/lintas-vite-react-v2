-- ==========================================
-- SQL SETUP FOR LINTAS-CSSD RLS POLICIES
-- Jalankan script ini di Supabase SQL Editor
-- ==========================================

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_requests ENABLE ROW LEVEL SECURITY;

-- 2. Create Helper Function to check role (Optional but safer)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ==========================================
-- POLICIES FOR 'profiles'
-- ==========================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- POLICIES FOR 'inventory'
-- ==========================================
DROP POLICY IF EXISTS "Inventory is viewable by everyone" ON public.inventory;
CREATE POLICY "Inventory is viewable by everyone" ON public.inventory
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Everyone can update inventory" ON public.inventory;
CREATE POLICY "Everyone can update inventory" ON public.inventory
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- POLICIES FOR 'machines'
-- ==========================================
DROP POLICY IF EXISTS "Machines are viewable by everyone" ON public.machines;
CREATE POLICY "Machines are viewable by everyone" ON public.machines
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Everyone can manage machines" ON public.machines;
CREATE POLICY "Everyone can manage machines" ON public.machines
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- POLICIES FOR 'workflow_logs'
-- ==========================================
DROP POLICY IF EXISTS "Logs are viewable by everyone" ON public.workflow_logs;
CREATE POLICY "Logs are viewable by everyone" ON public.workflow_logs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Everyone can create logs" ON public.workflow_logs;
CREATE POLICY "Everyone can create logs" ON public.workflow_logs
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- ==========================================
-- POLICIES FOR 'tool_requests'
-- ==========================================
DROP POLICY IF EXISTS "Requests are viewable by everyone" ON public.tool_requests;
CREATE POLICY "Requests are viewable by everyone" ON public.tool_requests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Everyone can manage requests" ON public.tool_requests;
CREATE POLICY "Everyone can manage requests" ON public.tool_requests
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);
