
-- Add 'price' column to 'courts' table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courts' AND column_name='price') THEN
        ALTER TABLE public.courts ADD COLUMN price NUMERIC DEFAULT 0;
        RAISE NOTICE 'Added price column to courts table.';
    END IF;
END $$;
