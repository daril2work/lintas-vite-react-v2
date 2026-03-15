-- ===============================================
-- SQL FIX UNTUK CONSTRAINT TIPE MESIN
-- Jalankan script ini di Supabase SQL Editor
-- ===============================================

-- 1. Hapus constraint lama jika ada (berdasarkan error message 'machines_type_check')
ALTER TABLE public.machines DROP CONSTRAINT IF EXISTS machines_type_check;

-- 2. Tambahkan kembali constraint dengan nilai yang sesuai dengan Aplikasi (frontend)
-- Mencakup: 'washer' (Mesin Cuci), 'sterilizer' (Autoclave/Steam), 'plasma' (H2O2)
ALTER TABLE public.machines ADD CONSTRAINT machines_type_check 
CHECK (type IN ('washer', 'sterilizer', 'plasma'));

-- 3. Pastikan kolom is_active juga tersedia (untuk fitur Arsip sebelumnya)
ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
