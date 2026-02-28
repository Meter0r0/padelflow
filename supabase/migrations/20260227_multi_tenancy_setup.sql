-- Migration for Multi-Tenancy: Add Clients table and link to Clubs/Sessions

-- 1. Create Clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    telegram_bot_token text,
    whatsapp_phone_number_id text,
    whatsapp_access_token text,
    whatsapp_verify_token text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for clients (Assuming public read for matching, or restricted if admin panel)
-- For now, just enable RLS and allow read access
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to clients" 
ON public.clients FOR SELECT TO public USING (true);

-- 2. Update Clubs table
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS client_id uuid references public.clients(id);

-- Migration strategy: If there is an existing club but no client, create a default client and link it.
DO $$
DECLARE
    default_client_id uuid;
    club_record record;
BEGIN
    -- Only proceed if there is at least one club without a client
    IF EXISTS (SELECT 1 FROM public.clubs WHERE client_id IS NULL) THEN
        -- Create a default client
        INSERT INTO public.clients (name) VALUES ('Default Client') RETURNING id INTO default_client_id;
        
        -- Update all orphaned clubs to belong to this default client
        UPDATE public.clubs SET client_id = default_client_id WHERE client_id IS NULL;
    END IF;
END $$;

-- 3. Update WhatsApp Sessions table
ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS client_id uuid references public.clients(id);
ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS club_id uuid references public.clubs(id);

-- Optional: If there's already a default client, link orphaned sessions to it (only if necessary)
DO $$
DECLARE
    default_client_id uuid;
BEGIN
    -- Select any existing client (use the first one found)
    SELECT id INTO default_client_id FROM public.clients LIMIT 1;
    
    IF default_client_id IS NOT NULL THEN
        UPDATE public.whatsapp_sessions SET client_id = default_client_id WHERE client_id IS NULL;
    END IF;
END $$;
