
-- Permitir borrado público de participantes (necesario para el organizador)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'participants' AND policyname = 'Allow public delete of participants') THEN
        CREATE POLICY "Allow public delete of participants" ON public.participants FOR DELETE USING (true);
    END IF;
END $$;

-- También para matches por si acaso el organizador quiere borrar el partido completo en el futuro
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'matches' AND policyname = 'Allow public delete of matches') THEN
        CREATE POLICY "Allow public delete of matches" ON public.matches FOR DELETE USING (true);
    END IF;
END $$;
