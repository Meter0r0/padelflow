-- Add phone_number to participants table
ALTER TABLE public.participants 
ADD COLUMN phone_number text;

-- Optional: Create an index for faster lookups by phone
CREATE INDEX idx_participants_phone_number ON public.participants(phone_number);
