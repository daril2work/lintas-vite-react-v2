-- ==========================================
-- SQL SETUP UNTUK SOFT DELETE (ARSIP)
-- Jalankan script ini di Supabase SQL Editor
-- ==========================================

-- 1. Tambahkan kolom is_active ke tabel Master Data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. Update data lama jika ada yang null (opsional tapi aman)
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;
UPDATE public.inventory SET is_active = true WHERE is_active IS NULL;
UPDATE public.machines SET is_active = true WHERE is_active IS NULL;
UPDATE public.rooms SET is_active = true WHERE is_active IS NULL;

-- 3. Tambahkan Index untuk performa query filter is_active
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_inventory_is_active ON public.inventory(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_machines_is_active ON public.machines(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON public.rooms(is_active) WHERE is_active = true;
