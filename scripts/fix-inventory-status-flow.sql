-- ===============================================
-- SQL FIX FOR INVENTORY STATUS FLOW
-- Jalankan script ini di Supabase SQL Editor
-- ===============================================

-- 1. Perbarui constraint status untuk menyertakan status 'sent'
-- Status 'sent' digunakan saat ruangan mengirim alat kotor ke CSSD.
-- Petugas CSSD harus menerima alat tersebut di menu Intake agar status berubah menjadi 'dirty'.
ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_status_check;
ALTER TABLE public.inventory ADD CONSTRAINT inventory_status_check 
CHECK (status IN (
    'sent',                -- Dikirim dari ruangan (menunggu intake)
    'dirty',               -- Diterima di CSSD (antrian cuci)
    'washing',             -- Sedang dicuci
    'packing',             -- Sedang dikemas
    'ready_to_sterilize',  -- Siap sterilisasi
    'sterilizing',         -- Sedang sterilisasi
    'stored',              -- Disimpan di gudang steril
    'sterile',             -- Status steril (siap distribusi)
    'distributed',         -- Sudah didistribusikan ke ruangan
    'in_use'               -- Sedang digunakan di ruangan
));

-- 2. Tambahkan komentar untuk dokumentasi
COMMENT ON COLUMN public.inventory.status IS 'Status siklus alat: sent, dirty, washing, packing, ready_to_sterilize, sterilizing, stored, sterile, distributed, in_use';
