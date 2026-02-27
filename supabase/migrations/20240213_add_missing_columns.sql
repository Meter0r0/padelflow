
-- 1. Añadir columnas faltantes a 'matches'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='confirmed_option') THEN
        ALTER TABLE public.matches ADD COLUMN confirmed_option timestamp with time zone;
        RAISE NOTICE 'Columna confirmed_option añadida.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='duration_minutes') THEN
        ALTER TABLE public.matches ADD COLUMN duration_minutes integer DEFAULT 90;
        RAISE NOTICE 'Columna duration_minutes añadida.';
    END IF;
END $$;

-- 2. Asegurar que Realtime incluya estas columnas (re-creando publicación)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.matches, public.participants;
COMMIT;
