
-- Enable Realtime for matches and participants
-- This is required for Supabase to broadcast changes via the realtime publication.

begin;
  -- Remove the tables if they were already there (to avoid errors)
  -- and then add them back to the publication.
  alter publication supabase_realtime add table public.matches;
  alter publication supabase_realtime add table public.participants;
commit;
