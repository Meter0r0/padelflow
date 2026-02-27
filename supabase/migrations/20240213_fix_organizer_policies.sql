
-- 1. Re-asegurar políticas de Matches (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Allow public read of matches" ON public.matches;
CREATE POLICY "Allow public read of matches" ON public.matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert of matches" ON public.matches;
CREATE POLICY "Allow public insert of matches" ON public.matches FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update of matches" ON public.matches;
CREATE POLICY "Allow public update of matches" ON public.matches FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete of matches" ON public.matches;
CREATE POLICY "Allow public delete of matches" ON public.matches FOR DELETE USING (true);

-- 2. Re-asegurar políticas de Participants (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Allow public read of participants" ON public.participants;
CREATE POLICY "Allow public read of participants" ON public.participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert of participants" ON public.participants;
CREATE POLICY "Allow public insert of participants" ON public.participants FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update of participants" ON public.participants;
CREATE POLICY "Allow public update of participants" ON public.participants FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete of participants" ON public.participants;
CREATE POLICY "Allow public delete of participants" ON public.participants FOR DELETE USING (true);

-- 3. Asegurar Realtime completo
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.participants REPLICA IDENTITY FULL;
