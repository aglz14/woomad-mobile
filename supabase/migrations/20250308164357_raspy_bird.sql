/*
  # Add store categories array column

  1. Changes
    - Add array_categories column to stores table to store category IDs
    - Create trigger function to maintain array_categories based on store_categories entries
    - Add trigger to automatically update array_categories when store_categories changes

  2. Security
    - Maintain existing RLS policies
*/

-- Add array_categories column to stores table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'array_categories'
  ) THEN
    ALTER TABLE stores ADD COLUMN array_categories uuid[];
  END IF;
END $$;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_store_categories_array()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update the array_categories for the store when a new category is added
    UPDATE stores
    SET array_categories = array_append(
      COALESCE(array_categories, ARRAY[]::uuid[]),
      NEW.category_id
    )
    WHERE id = NEW.store_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove the category from array_categories when a store_category is deleted
    UPDATE stores
    SET array_categories = array_remove(
      COALESCE(array_categories, ARRAY[]::uuid[]),
      OLD.category_id
    )
    WHERE id = OLD.store_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
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

-- Initialize array_categories for existing stores
UPDATE stores s
SET array_categories = ARRAY(
  SELECT sc.category_id
  FROM store_categories sc
  WHERE sc.store_id = s.id
  ORDER BY sc.category_id
);