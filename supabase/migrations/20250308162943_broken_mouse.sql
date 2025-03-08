/*
  # Update store categories relationship

  1. Changes
    - Add foreign key constraints to store_categories table
    - Update store filtering query to use store_categories junction table

  2. Security
    - Maintain existing RLS policies
*/

-- Ensure store_categories has proper foreign key constraints
ALTER TABLE store_categories
DROP CONSTRAINT IF EXISTS store_categories_store_id_fkey,
DROP CONSTRAINT IF EXISTS store_categories_category_id_fkey;

ALTER TABLE store_categories
ADD CONSTRAINT store_categories_store_id_fkey
  FOREIGN KEY (store_id)
  REFERENCES stores(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE,
ADD CONSTRAINT store_categories_category_id_fkey
  FOREIGN KEY (category_id)
  REFERENCES categories(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;