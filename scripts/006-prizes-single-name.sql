-- Migration: switch prizes to single "name" field and drop color
-- 1) Add new column if not exists
ALTER TABLE prizes ADD COLUMN IF NOT EXISTS name VARCHAR(200);

-- 2) Backfill name from existing bilingual columns where present
DO $$
BEGIN
  -- Copy from name_en if available, otherwise name_ar, only when name is NULL or empty
  BEGIN
    EXECUTE '
      UPDATE prizes
      SET name = COALESCE(NULLIF(name, ''''), NULLIF(name_en, ''''), NULLIF(name_ar, ''''))
      WHERE name IS NULL OR name = ''''
    ';
  EXCEPTION
    WHEN undefined_column THEN
      -- Old columns may not exist, ignore
      NULL;
  END;
END$$;

-- 3) Make sure name is NOT NULL
UPDATE prizes SET name = 'Unnamed Prize' WHERE name IS NULL OR name = '';
ALTER TABLE prizes ALTER COLUMN name SET NOT NULL;

-- 4) Drop old columns if they exist
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER TABLE prizes DROP COLUMN IF EXISTS name_ar';
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
  BEGIN
    EXECUTE 'ALTER TABLE prizes DROP COLUMN IF EXISTS name_en';
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
  BEGIN
    EXECUTE 'ALTER TABLE prizes DROP COLUMN IF EXISTS color';
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
END$$;
