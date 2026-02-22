-- Add expire_date and sterilization_method to inventory table
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS expire_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sterilization_method TEXT;
