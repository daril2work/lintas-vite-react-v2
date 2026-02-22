-- Create bowie_dick_logs table
CREATE TABLE IF NOT EXISTS public.bowie_dick_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
    temperature NUMERIC,
    pressure NUMERIC,
    holding_time INTEGER, -- in minutes
    result TEXT NOT NULL, -- e.g., 'passed', 'failed'
    operator_name TEXT NOT NULL,
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bowie_dick_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (adjust as needed for production)
CREATE POLICY "Public access to bowie_dick_logs" ON public.bowie_dick_logs
    FOR ALL USING (true);
