/*
  # Add admin role checking function

  1. New Function
    - `get_user_role`: Returns the user's role based on their ID
  
  2. Security
    - Function is accessible to authenticated users
    - Returns 'admin' for admin users, 'user' for regular users
*/

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user exists in auth.users
  IF EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = user_id 
    AND raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RETURN 'admin';
  ELSE
    RETURN 'user';
  END IF;
END;
$$;