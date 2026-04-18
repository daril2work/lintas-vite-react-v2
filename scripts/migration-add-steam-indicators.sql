-- =============================================
-- MIGRATION: ADD STEAM SPECIFIC INDICATORS
-- =============================================

ALTER TABLE public.sterilization_process_logs 
ADD COLUMN IF NOT EXISTS indicator_chemical_class_4 TEXT,
ADD COLUMN IF NOT EXISTS indicator_chemical_class_5 TEXT,
ADD COLUMN IF NOT EXISTS program_temp TEXT;

-- Update comment
COMMENT ON TABLE public.sterilization_process_logs IS 'Menyimpan log detail proses sterilisasi per siklus/load untuk mesin Plasma dan Steam.';
