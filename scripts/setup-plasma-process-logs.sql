-- ==========================================
-- SQL SETUP UNTUK LOG PROSES STERILISASI PLASMA
-- Jalankan script ini di Supabase SQL Editor
-- ==========================================

-- 1. Create sterilization_process_logs table
CREATE TABLE IF NOT EXISTS public.sterilization_process_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
    operator_name TEXT NOT NULL,
    shift TEXT, -- 'Pagi', 'Siang', 'Malam'
    packaging_type TEXT, -- 'Kontainer', 'Pouches', 'Wrapping'
    process_status TEXT, -- 'Cito', 'Implant'
    load_number TEXT,
    temperature NUMERIC,
    cycles INTEGER,
    jam_start TIME,
    waktu_steril TIME,
    waktu_end_steril TIME,
    lama_steril INTEGER, -- in minutes
    lama_proses INTEGER, -- in minutes
    indicator_internal TEXT, -- 'Lolos', 'Tidak'
    indicator_external TEXT, -- 'Lolos', 'Tidak'
    indicator_biological_control TEXT, -- 'Positif', 'Negatif'
    indicator_biological_test TEXT, -- 'Positif', 'Negatif'
    instrument_list JSONB NOT NULL, -- Array of {name, origin, qty, weight}
    notes TEXT, -- Kendala
    result TEXT DEFAULT 'pending', -- 'passed', 'failed', 'pending'
    proof_file_url TEXT, -- Dokumen Bukti (Max 500KB)
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.sterilization_process_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for public access
CREATE POLICY "Public access to sterilization_process_logs" ON public.sterilization_process_logs
    FOR ALL USING (true);

-- 4. Comment for documentation
COMMENT ON TABLE public.sterilization_process_logs IS 'Menyimpan log detail proses sterilisasi per siklus/load, khususnya untuk mesin Plasma.';
