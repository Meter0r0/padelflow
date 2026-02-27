-- Fix RLS for clubs table to allow updates
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clubs' AND policyname = 'Allow public update of clubs') THEN
        CREATE POLICY "Allow public update of clubs" ON public.clubs FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
END $$;
