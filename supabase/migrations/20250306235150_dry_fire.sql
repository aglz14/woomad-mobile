/*
  # Enhance store categories functionality

  1. Changes
    - Add function to manage store categories
    - Add indexes for better query performance
    - Add helper functions for category operations

  2. Benefits
    - Simplified category management
    - Better query performance
    - Maintainable category operations
*/

-- Create index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_store_categories_store_id ON store_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_store_categories_category_id ON store_categories(category_id);

-- Function to add a category to a store
CREATE OR REPLACE FUNCTION add_store_category(
  p_store_id uuid,
  p_category_id uuid
) RETURNS void AS $$
BEGIN
  -- Insert if not exists
  INSERT INTO store_categories (store_id, category_id)
  VALUES (p_store_id, p_category_id)
  ON CONFLICT (store_id, category_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to remove a category from a store
CREATE OR REPLACE FUNCTION remove_store_category(
  p_store_id uuid,
  p_category_id uuid
) RETURNS void AS $$
BEGIN
  DELETE FROM store_categories
  WHERE store_id = p_store_id AND category_id = p_category_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get all categories for a store
CREATE OR REPLACE FUNCTION get_store_categories(p_store_id uuid)
RETURNS TABLE (
  category_id uuid,
  category_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name
  FROM categories c
  JOIN store_categories sc ON c.id = sc.category_id
  WHERE sc.store_id = p_store_id;
END;
$$ LANGUAGE plpgsql;