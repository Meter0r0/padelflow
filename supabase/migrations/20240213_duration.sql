-- Migration: Match Duration & Collaborative Scheduling

-- 1. Alter Matches table
-- Add 'duration_minutes' column with default 90.
alter table public.matches 
add column duration_minutes integer default 90;

-- 2. (Optional) Existing matches? 
-- They will get the default 90.
