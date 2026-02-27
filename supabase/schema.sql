-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Matches Table
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  proposed_time timestamp with time zone, -- Main proposed time, can be array or separate table later
  club_id text -- Telegram Chat ID of the club, or reference to clubs table
);

-- Participants Table
create table public.participants (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  name text not null,
  is_organizer boolean default false,
  status text default 'invited' check (status in ('invited', 'accepted', 'declined', 'waitlist')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Clubs Directory (Simple for MVP)
create table public.clubs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  telegram_chat_id text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) - MVP: Open for now, logic handled in edge functions / client with UUIDs
alter table public.matches enable row level security;
alter table public.participants enable row level security;
alter table public.clubs enable row level security;

-- Open policies for MVP (No Auth User)
-- Warning: In production, these should be tighter, perhaps using a secret token or specific RPCs.
-- For now, allow public read/insert if they have the UUID (effectively "security through obscurity" + UUIDs are hard to guess).
create policy "Allow public read of matches" on public.matches for select using (true);
create policy "Allow public insert of matches" on public.matches for insert with check (true);
create policy "Allow public update of matches" on public.matches for update using (true);

create policy "Allow public read of participants" on public.participants for select using (true);
create policy "Allow public insert of participants" on public.participants for insert with check (true);
create policy "Allow public update of participants" on public.participants for update using (true);
