-- ==========================================
-- SQL SETUP FOR APP CONFIGURATION
-- single source of truth for app settings
-- ==========================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.app_config (
    key text PRIMARY KEY,
    value text NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "App config is viewable by everyone" ON public.app_config;
CREATE POLICY "App config is viewable by everyone" ON public.app_config
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update app config" ON public.app_config;
CREATE POLICY "Admins can update app config" ON public.app_config
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- 4. Initial Data
INSERT INTO public.app_config (key, value, description)
VALUES 
    ('HOSPITAL_NAME', 'RS Menur Provinsi Jawa Timur', 'Nama Rumah Sakit yang ditampilkan di UI'),
    ('APP_VERSION', 'v2.3.1', 'Versi aplikasi saat ini'),
    ('SYSTEM_STATUS', 'System Online', 'Status operasional sistem')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, 
    description = EXCLUDED.description,
    updated_at = now();
