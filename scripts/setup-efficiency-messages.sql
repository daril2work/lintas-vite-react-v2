-- ==========================================
-- SQL SETUP FOR EFFICIENCY & MESSAGES
-- ==========================================

-- 1. Create Important Messages Table
CREATE TABLE IF NOT EXISTS public.important_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'alert')),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);

-- 2. Enable RLS
ALTER TABLE public.important_messages ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Messages are viewable by everyone" ON public.important_messages;
CREATE POLICY "Messages are viewable by everyone" ON public.important_messages
    FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

DROP POLICY IF EXISTS "Admins can manage messages" ON public.important_messages;
CREATE POLICY "Admins can manage messages" ON public.important_messages
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Sample Data
INSERT INTO public.important_messages (title, message, type, is_active)
VALUES 
    ('Cek Maintenance', 'Autoclave 01 dijadwalkan kalibrasi rutin minggu ini.', 'warning', true),
    ('Stok Indikator', 'Indikator biologis tersisa 20 unit. Segera lakukan pemesanan.', 'info', true)
ON CONFLICT DO NOTHING;

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_active_expires ON public.important_messages(is_active, expires_at);
