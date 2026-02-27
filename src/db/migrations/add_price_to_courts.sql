-- Migration: Add price column to courts table
ALTER TABLE courts ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;

-- Update existing courts with a default value if needed
UPDATE courts SET price = 0 WHERE price IS NULL;
