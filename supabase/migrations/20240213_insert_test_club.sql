
-- Insertar un club de prueba si no existe alguno
INSERT INTO public.clubs (name, telegram_chat_id)
SELECT 'Club de Test PadelFlow', 'test_chat_id'
WHERE NOT EXISTS (SELECT 1 FROM public.clubs LIMIT 1);

-- Mostrar el ID del club para referencia (opcional en SQL editor)
-- SELECT id, name FROM public.clubs;
