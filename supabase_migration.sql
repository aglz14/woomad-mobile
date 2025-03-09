-- Add user_id column to promotions table
ALTER TABLE promotions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add user_id column to shopping_malls table
ALTER TABLE shopping_malls
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add user_id column to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_malls_user_id ON shopping_malls(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);

-- Create RLS (Row Level Security) policies for each table
-- This ensures that users can only see their own data at the database level

-- Promotions table policies
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY promotions_select_policy ON promotions
FOR SELECT USING (
  -- Admin users can see all promotions
  (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) OR
  -- Regular users can only see their own promotions
  (auth.uid() = user_id)
);

CREATE POLICY promotions_insert_policy ON promotions
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY promotions_update_policy ON promotions
FOR UPDATE USING (
  auth.uid() = user_id
);

CREATE POLICY promotions_delete_policy ON promotions
FOR DELETE USING (
  auth.uid() = user_id
);

-- Shopping Malls table policies
ALTER TABLE shopping_malls ENABLE ROW LEVEL SECURITY;

CREATE POLICY shopping_malls_select_policy ON shopping_malls
FOR SELECT USING (
  -- Admin users can see all malls
  (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) OR
  -- Regular users can only see their own malls
  (auth.uid() = user_id)
);

CREATE POLICY shopping_malls_insert_policy ON shopping_malls
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY shopping_malls_update_policy ON shopping_malls
FOR UPDATE USING (
  auth.uid() = user_id
);

CREATE POLICY shopping_malls_delete_policy ON shopping_malls
FOR DELETE USING (
  auth.uid() = user_id
);

-- Stores table policies
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY stores_select_policy ON stores
FOR SELECT USING (
  -- Admin users can see all stores
  (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) OR
  -- Regular users can only see their own stores
  (auth.uid() = user_id)
);

CREATE POLICY stores_insert_policy ON stores
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY stores_update_policy ON stores
FOR UPDATE USING (
  auth.uid() = user_id
);

CREATE POLICY stores_delete_policy ON stores
FOR DELETE USING (
  auth.uid() = user_id
);

-- Update existing records to assign them to a default admin user
-- Replace 'YOUR_ADMIN_USER_ID' with an actual admin user ID
-- This is needed to avoid orphaned records
UPDATE promotions SET user_id = 'YOUR_ADMIN_USER_ID' WHERE user_id IS NULL;
UPDATE shopping_malls SET user_id = 'YOUR_ADMIN_USER_ID' WHERE user_id IS NULL;
UPDATE stores SET user_id = 'YOUR_ADMIN_USER_ID' WHERE user_id IS NULL; 