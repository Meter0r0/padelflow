-- Create courts table
CREATE TABLE IF NOT EXISTS public.courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Cristal',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies for dev
CREATE POLICY "Allow all on courts" ON public.courts FOR ALL USING (true) WITH CHECK (true);

-- Add some test courts for the Test Club
-- Assuming Test Club ID is '00000000-0000-0000-0000-000000000000' from previous context
INSERT INTO public.courts (club_id, name, type)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'Cancha 1 - Cristal Central', 'Cristal'),
    ('00000000-0000-0000-0000-000000000000', 'Cancha 2 - Cristal Lateral', 'Cristal'),
    ('00000000-0000-0000-0000-000000000000', 'Cancha 3 - Muro Clásica', 'Muro');
