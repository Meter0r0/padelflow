-- Migration: Flexible Scheduling & Organizer Features

-- 1. Alter Matches table
-- We are changing from a single 'proposed_time' to 'options' (JSONB array)
-- For backward compatibility/data migration, we could do something complex, 
-- but for MVP we will just add the new column and make proposed_time nullable/deprecated.
-- Actually, let's just alter it. If you have existing data, this MIGHT break if not careful.
-- safest for MVP dev: add new columns, ignore old one.

alter table public.matches 
add column options jsonb; -- Array of { "datetime": "...", "votes": 0 } or just simple strings?
-- Let's keep it simple: Array of strings (ISO timestamps).
-- options = ["2024-02-12T19:00:00", "2024-02-12T20:30:00"]

-- 2. Alter Participants table
alter table public.participants
add column selected_options jsonb; -- Array of indices [0, 1] or strings? 
-- Indices is safer for strict voting, Strings is more robust if options change.
-- Let's use indices [0, 2] to map to matches.options array.

-- 3. Add 'cancelled_by' or similar? 
-- We already have status='cancelled'. 
-- Maybe we want to track who cancelled it? Not strictly necessary for MVP.

-- Update existing rows (if any) to have a default structure
-- (Optional cleanup if you had important data)
