-- Create whatsapp_sessions table
create table public.whatsapp_sessions (
  id uuid default uuid_generate_v4() primary key,
  phone_number text not null unique,
  current_state text default 'IDLE',
  active_booking_id uuid references public.matches(id),
  last_interaction timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.whatsapp_sessions enable row level security;

-- Policies (Open for service role/internal use, adjust as needed for client interaction if any)
create policy "Enable read access for all users" on public.whatsapp_sessions for select using (true);
create policy "Enable insert access for all users" on public.whatsapp_sessions for insert with check (true);
create policy "Enable update access for all users" on public.whatsapp_sessions for update using (true);
