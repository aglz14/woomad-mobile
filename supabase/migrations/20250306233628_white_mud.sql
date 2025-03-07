/*
  # Add categories array to stores table

  1. Changes
    - Add `array_categories` column to `stores` table to store an array of category IDs
    - This column will work alongside the existing `store_categories` junction table
    - Add trigger to automatically maintain the array based on store_categories changes

  2. Benefits
    - Enables efficient querying of store categories
    - Maintains data consistency through triggers
    - Preserves existing relationships
*/

-- Function to update the array_categories column
CREATE OR REPLACE FUNCTION update_store_categories_array()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE stores 
    SET array_categories = array_append(COALESCE(array_categories, ARRAY[]::uuid[]), NEW.category_id)
    WHERE id = NEW.store_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE stores 
    SET array_categories = array_remove(COALESCE(array_categories, ARRAY[]::uuid[]), OLD.category_id)
    WHERE id = OLD.store_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain the array_categories
CREATE TRIGGER maintain_store_categories_array
AFTER INSERT OR DELETE ON store_categories
FOR EACH ROW
EXECUTE FUNCTION update_store_categories_array();

-- Initialize the array_categories for existing relationships
UPDATE stores s
SET array_categories = ARRAY(
  SELECT category_id 
  FROM store_categories sc 
  WHERE sc.store_id = s.id
);