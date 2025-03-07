/*
  # Add role column to profiles table

  1. Changes
    - Add role column to profiles table with type text
    - Set default role to 'user'
    - Add check constraint to ensure valid roles
  
  2. Security
    - Only allow valid role values ('admin', 'user')
    - Maintain existing RLS policies
*/

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- Add check constraint to ensure valid roles
ALTER TABLE public.profiles
ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'user'));