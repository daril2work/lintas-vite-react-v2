-- ===============================================
-- SQL SETUP FOR MASTER DATA RLS POLICIES ONLY
-- (profiles, machines, inventory)
-- Jalankan script ini di Supabase SQL Editor
-- ===============================================

-- 1. Ensure RLS is enabled for Master Data tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts (Optional, adjust if names differ)
DROP POLICY IF EXISTS "Admins can manage machines" ON public.machines;
DROP POLICY IF EXISTS "Machines are viewable by everyone" ON public.machines;
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;
DROP POLICY IF EXISTS "Inventory is viewable by everyone" ON public.inventory;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 3. Define Master Data Policies (Restricted to 'admin' role)

-- MACHINES
CREATE POLICY "Machines are viewable by everyone" ON public.machines
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage machines" ON public.machines
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- INVENTORY
CREATE POLICY "Inventory is viewable by everyone" ON public.inventory
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage inventory" ON public.inventory
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
