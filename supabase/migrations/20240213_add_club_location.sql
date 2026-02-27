
-- Migración: Atributos de Ubicación para Clubes

-- 1. Añadir columnas address y google_maps_url a la tabla clubs
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- 2. Actualizar el club de prueba si existe
UPDATE public.clubs 
SET 
  address = 'Av. del Libertador 1234, CABA',
  google_maps_url = 'https://maps.app.goo.gl/dummy-link'
WHERE name = 'Club de Test PadelFlow';
