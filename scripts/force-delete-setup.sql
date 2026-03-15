-- ==========================================
-- SQL SETUP UNTUK ENABLE FORCE DELETE
-- Jalankan script ini di Supabase SQL Editor
-- ==========================================

-- 1. Fix RLS untuk workflow_logs (Agar bisa dihapus manual)
DROP POLICY IF EXISTS "Everyone can delete logs" ON public.workflow_logs;
CREATE POLICY "Everyone can delete logs" ON public.workflow_logs
  FOR DELETE TO authenticated, anon
  USING (true);

-- 2. Update Foreign Key Constraints agar ON DELETE CASCADE/SET NULL
-- Ini membuat "Force Delete" jadi otomatis di sisi Database

-- Alat (Inventory) -> Workflow Logs
ALTER TABLE public.workflow_logs 
DROP CONSTRAINT IF EXISTS workflow_logs_tool_set_id_fkey;

ALTER TABLE public.workflow_logs 
ADD CONSTRAINT workflow_logs_tool_set_id_fkey 
FOREIGN KEY (tool_set_id) REFERENCES public.inventory(id) ON DELETE CASCADE;

-- Mesin -> Workflow Logs
ALTER TABLE public.workflow_logs 
DROP CONSTRAINT IF EXISTS workflow_logs_machine_id_fkey;

ALTER TABLE public.workflow_logs 
ADD CONSTRAINT workflow_logs_machine_id_fkey 
FOREIGN KEY (machine_id) REFERENCES public.machines(id) ON DELETE CASCADE;

-- Ruangan -> Workflow Logs
ALTER TABLE public.workflow_logs 
DROP CONSTRAINT IF EXISTS workflow_logs_room_id_fkey;

ALTER TABLE public.workflow_logs 
ADD CONSTRAINT workflow_logs_room_id_fkey 
FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Mesin -> Inventory Reference (SET NULL agar alat tidak ikut terhapus jika mesin diganti)
ALTER TABLE public.inventory 
DROP CONSTRAINT IF EXISTS inventory_machine_id_fkey;

ALTER TABLE public.inventory 
ADD CONSTRAINT inventory_machine_id_fkey 
FOREIGN KEY (machine_id) REFERENCES public.machines(id) ON DELETE SET NULL;

-- Ruangan -> Inventory Reference (SET NULL)
ALTER TABLE public.inventory 
DROP CONSTRAINT IF EXISTS inventory_room_id_fkey;

ALTER TABLE public.inventory 
ADD CONSTRAINT inventory_room_id_fkey 
FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE SET NULL;

-- Mesin -> Bowie Dick Logs
ALTER TABLE public.bowie_dick_logs 
DROP CONSTRAINT IF EXISTS bowie_dick_logs_machine_id_fkey;

ALTER TABLE public.bowie_dick_logs 
ADD CONSTRAINT bowie_dick_logs_machine_id_fkey 
FOREIGN KEY (machine_id) REFERENCES public.machines(id) ON DELETE CASCADE;
