-- ==========================================
-- SQL SETUP UNTUK LOG PASCA STERILISASI
-- Jalankan script ini di Supabase SQL Editor
-- ==========================================

-- 1. Create post_sterilization_logs table
CREATE TABLE IF NOT EXISTS public.post_sterilization_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    operator_name TEXT NOT NULL,
    notes TEXT,
    proof_file_url TEXT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.post_sterilization_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for public access
CREATE POLICY "Public access to post_sterilization_logs" ON public.post_sterilization_logs
    FOR ALL USING (true);

-- 4. Comment for documentation
COMMENT ON TABLE public.post_sterilization_logs IS 'Menyimpan riwayat bukti pasca sterilisasi yang diunggah oleh operator.';
