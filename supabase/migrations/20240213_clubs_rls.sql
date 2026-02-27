
-- Migration: Add RLS policy for clubs table to allow public insert
-- Since clubs don't have auth yet, we allow public insert for the MVP/Testing.

create policy "Allow public insert of clubs" on public.clubs for insert with check (true);
create policy "Allow public read of clubs" on public.clubs for select using (true);
