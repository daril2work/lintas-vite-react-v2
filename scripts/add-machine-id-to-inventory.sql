-- Add machine_id column to inventory table
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS machine_id uuid REFERENCES public.machines(id);

-- Update status constraint to include 'ready_to_sterilize'
-- Note: Depending on how your constraint is set up, you might need to drop and recreate it.
-- This assumes a check constraint exists. If not, this is safe to run.
ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_status_check;
ALTER TABLE public.inventory ADD CONSTRAINT inventory_status_check 
CHECK (status IN ('dirty', 'washing', 'packing', 'ready_to_sterilize', 'sterilizing', 'stored', 'sterile', 'distributed', 'in_use'));

-- Create index for machine_id for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_machine_id ON public.inventory(machine_id);

COMMENT ON COLUMN public.inventory.machine_id IS 'Tracks which machine is currently processing this tool set during sterilization.';
