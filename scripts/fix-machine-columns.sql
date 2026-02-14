-- ===============================================
-- SQL UPDATE FOR MACHINE TIMERS
-- Menambahkan kolom start_time dan duration
-- ===============================================

-- 1. Add columns to machines table
ALTER TABLE public.machines 
ADD COLUMN IF NOT EXISTS start_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS duration integer;

-- 2. Update existing status update logic if any triggers exist (not applicable here based on scripts)

-- 3. Notify that columns are ready
COMMENT ON COLUMN public.machines.start_time IS 'Waktu mulai siklus mesin';
COMMENT ON COLUMN public.machines.duration IS 'Durasi siklus dalam menit';
