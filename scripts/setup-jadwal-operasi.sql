-- ==========================================
-- SQL SETUP UNTUK JADWAL OPERASI
-- Jalankan script ini di Supabase SQL Editor
-- ==========================================

-- 1. Create operating_schedules table
CREATE TABLE IF NOT EXISTS public.operating_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_rm TEXT NOT NULL,
    surgeon_name TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    operation_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_operating_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_operating_schedules_timestamp ON public.operating_schedules;
CREATE TRIGGER update_operating_schedules_timestamp
    BEFORE UPDATE ON public.operating_schedules
    FOR EACH ROW
    EXECUTE PROCEDURE update_operating_schedules_updated_at();

-- 3. Enable RLS
ALTER TABLE public.operating_schedules ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
-- Everyone can view schedules
DROP POLICY IF EXISTS "Public access to view operating_schedules" ON public.operating_schedules;
CREATE POLICY "Public access to view operating_schedules" ON public.operating_schedules
    FOR SELECT USING (true);

-- Authenticated users (admin, operator_ruangan) can insert/update
DROP POLICY IF EXISTS "Authenticated access to insert operating_schedules" ON public.operating_schedules;
CREATE POLICY "Authenticated access to insert operating_schedules" ON public.operating_schedules
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated access to update operating_schedules" ON public.operating_schedules;
CREATE POLICY "Authenticated access to update operating_schedules" ON public.operating_schedules
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated access to delete operating_schedules" ON public.operating_schedules;
CREATE POLICY "Authenticated access to delete operating_schedules" ON public.operating_schedules
    FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Comment for documentation
COMMENT ON TABLE public.operating_schedules IS 'Menyimpan data jadwal operasi dari ruangan/unit.';
