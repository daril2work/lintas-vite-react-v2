-- ===============================================
-- SQL SETUP UNTUK ALAT NON-REGISTER (OPSI 2)
-- Jalankan script ini di Supabase SQL Editor
-- ===============================================

-- 1. Tambahkan kolom is_validated ke tabel inventory
-- true  = Alat terdaftar resmi (Master Data)
-- false = Alat sementara/baru kiriman ruangan (perlu divalidasi)
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS is_validated boolean DEFAULT true;

-- 2. Update data lama menjadi true (karena data lama dianggap valid)
UPDATE public.inventory SET is_validated = true WHERE is_validated IS NULL;

-- 3. Tambahkan Index untuk filter cepat alat yang perlu divalidasi
CREATE INDEX IF NOT EXISTS idx_inventory_is_validated ON public.inventory(is_validated) WHERE is_validated = false;
