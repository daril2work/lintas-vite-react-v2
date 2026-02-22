-- Add default_sterilization_method to inventory table
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS default_sterilization_method TEXT;
