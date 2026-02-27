
-- Consolidated Fix for PadelFlow Schema
-- Ejecuta este script en el SQL EDITOR de Supabase

-- 1. Asegurar columnas en la tabla 'matches'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='court_status') THEN
        ALTER TABLE public.matches ADD COLUMN court_status varchar(20) DEFAULT 'none';
        RAISE NOTICE 'Columna court_status añadida.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='court_details') THEN
        ALTER TABLE public.matches ADD COLUMN court_details text;
        RAISE NOTICE 'Columna court_details añadida.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='options') THEN
        ALTER TABLE public.matches ADD COLUMN options jsonb;
        RAISE NOTICE 'Columna options añadida.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='confirmed_option') THEN
        ALTER TABLE public.matches ADD COLUMN confirmed_option timestamp with time zone;
        RAISE NOTICE 'Columna confirmed_option añadida.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='duration_minutes') THEN
        ALTER TABLE public.matches ADD COLUMN duration_minutes integer DEFAULT 90;
        RAISE NOTICE 'Columna duration_minutes añadida.';
    END IF;
END $$;

-- 2. Asegurar columnas en la tabla 'participants'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='participants' AND column_name='selected_options') THEN
        ALTER TABLE public.participants ADD COLUMN selected_options jsonb;
        RAISE NOTICE 'Columna selected_options añadida.';
    END IF;
END $$;

-- 3. Habilitar Realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.matches, public.participants;
COMMIT;

-- 4. Asegurar RLS para Clubs
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clubs' AND policyname = 'Allow public insert of clubs') THEN
        CREATE POLICY "Allow public insert of clubs" ON public.clubs FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clubs' AND policyname = 'Allow public read of clubs') THEN
        CREATE POLICY "Allow public read of clubs" ON public.clubs FOR SELECT USING (true);
    END IF;
END $$;
