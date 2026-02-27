-- Add deposit_percentage to clubs
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC DEFAULT 30;
