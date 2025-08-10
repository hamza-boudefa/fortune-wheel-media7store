-- Add quantity column to prizes table
ALTER TABLE prizes ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Update existing prizes with default quantities
UPDATE prizes SET quantity = 10 WHERE quantity IS NULL OR quantity = 0;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_prizes_quantity ON prizes(quantity);
CREATE INDEX IF NOT EXISTS idx_prizes_is_active ON prizes(is_active);
