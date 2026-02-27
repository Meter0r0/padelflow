
-- Migración: Soporte para Partidos Regulares (Semanales)

-- 1. Añadir columna is_regular a la tabla matches
ALTER TABLE public.matches 
ADD COLUMN is_regular BOOLEAN DEFAULT FALSE;

-- 2. (Opcional) Si queremos que sea retroactivo para los existentes
UPDATE public.matches SET is_regular = FALSE WHERE is_regular IS NULL;
