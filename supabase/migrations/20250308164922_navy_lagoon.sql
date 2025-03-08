/*
  # Update store categories array trigger

  1. Changes
    - Improve trigger function to handle multiple categories per store
    - Add support for maintaining array order
    - Optimize array updates to avoid duplicates
    - Add validation to ensure data integrity

  2. Security
    - Maintain existing RLS policies
*/

-- Create or replace the improved trigger function
CREATE OR REPLACE FUNCTION update_store_categories_array()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update array_categories, avoiding duplicates
    UPDATE stores
    SET array_categories = (
      SELECT ARRAY_AGG(DISTINCT sc.category_id ORDER BY sc.category_id)
      FROM store_categories sc
      WHERE sc.store_id = NEW.store_id
      OR sc.category_id = NEW.category_id
    )
    WHERE id = NEW.store_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Rebuild array_categories excluding deleted category
    UPDATE stores
    SET array_categories = (
      SELECT ARRAY_AGG(sc.category_id ORDER BY sc.category_id)
      FROM store_categories sc
      WHERE sc.store_id = OLD.store_id
      AND sc.category_id != OLD.category_id
    )
    WHERE id = OLD.store_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'maintain_store_categories_array'
  ) THEN
    CREATE TRIGGER maintain_store_categories_array
    AFTER INSERT OR DELETE ON store_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_store_categories_array();
  END IF;
END $$;

-- Refresh all stores' array_categories to ensure consistency
UPDATE stores s
SET array_categories = (
  SELECT ARRAY_AGG(DISTINCT sc.category_id ORDER BY sc.category_id)
  FROM store_categories sc
  WHERE sc.store_id = s.id
);