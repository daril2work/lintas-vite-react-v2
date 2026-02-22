-- Add Bowie Dick test tracking to machines table
ALTER TABLE public.machines 
ADD COLUMN IF NOT EXISTS last_bowie_dick_date DATE,
ADD COLUMN IF NOT EXISTS bowie_dick_status TEXT DEFAULT 'pending';
