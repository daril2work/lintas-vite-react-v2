-- Update inventory table to support room tracking and in_use status
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.rooms(id);

-- Update status check constraint to include 'in_use'
-- First, find the constraint name if it exists (usually inventory_status_check or similar)
-- In Supabase, it might be anonymous or differently named. 
-- We'll try to drop and recreate it if we know the name, 
-- or use a more robust approach if possible.

-- Check if we can just update the type if it's an enum, 
-- but in our previous setups it was likely a TEXT with a CHECK constraint.
ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_status_check;
ALTER TABLE public.inventory ADD CONSTRAINT inventory_status_check 
CHECK (status IN ('dirty', 'washing', 'packing', 'sterilizing', 'sterile', 'distributed', 'in_use'));

-- Update RLS if needed (usually inventory is viewable by all, but let's be safe)
-- Assuming existing RLS allows authenticated users to update their room's items
COMMENT ON COLUMN public.inventory.room_id IS 'ID of the room currently holding the tool set (for in_use status)';
