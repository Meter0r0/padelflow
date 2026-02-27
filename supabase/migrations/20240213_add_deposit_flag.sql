-- Migración: Estado de Seña (Depósito) para Partidos

-- 1. Añadir columna is_deposit_paid a la tabla matches
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS is_deposit_paid BOOLEAN DEFAULT FALSE;

-- 2. Asegurar que los existentes sean falsos
UPDATE public.matches SET is_deposit_paid = FALSE WHERE is_deposit_paid IS NULL;
