-- Add banking columns to clubs table
ALTER TABLE public.clubs 
ADD COLUMN alias text,
ADD COLUMN cbu text,
ADD COLUMN bank_name text,
ADD COLUMN account_holder text;
