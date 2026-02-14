-- ===============================================
-- SQL SETUP FOR 'machines' TABLE RLS POLICIES ONLY
-- Jalankan script ini di Supabase SQL Editor
-- ===============================================

-- 1. Ensure RLS is enabled for machines table
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage machines" ON public.machines;
DROP POLICY IF EXISTS "Machines are viewable by everyone" ON public.machines;

-- 3. Define Machine Policies

-- Izinkan semua user (guest/operator/admin) untuk melihat daftar mesin
CREATE POLICY "Machines are viewable by everyone" ON public.machines
  FOR SELECT USING (true);

-- Izinkan hanya 'admin' untuk Tambah, Ubah, dan Hapus (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage machines" ON public.machines
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
