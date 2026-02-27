-- Migration: Club Management & Court Reservation

-- 1. Alter Matches table
alter table public.matches 
add column court_status varchar(20) default 'none'; -- none, requested, reserved

alter table public.matches
add column court_details text; -- Court number, instructions, etc.

-- 2. Ensure club_id is usable (it was in initial schema but let's check)
-- Table 'clubs' already exists from initial schema.
