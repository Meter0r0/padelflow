-- Add user_name to whatsapp_sessions table
ALTER TABLE public.whatsapp_sessions 
ADD COLUMN user_name text;
