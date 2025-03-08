/*
  # Add notification preferences to user preferences table

  1. New Columns
    - notifications_enabled (boolean): Toggle for notification functionality
    - notification_radius (integer): Distance in meters to trigger notifications
      Default is 1000 meters (1km)

  2. Changes
    - Add notification preference columns with default values
    - notifications_enabled defaults to false for opt-in approach
    - notification_radius defaults to 1000 meters
  
  3. Security
    - Maintains existing RLS policies
    - Users can only view/modify their own preferences
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' 
    AND column_name = 'notifications_enabled'
  ) THEN
    ALTER TABLE user_preferences 
    ADD COLUMN notifications_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' 
    AND column_name = 'notification_radius'
  ) THEN
    ALTER TABLE user_preferences 
    ADD COLUMN notification_radius integer DEFAULT 1000;
  END IF;
END $$;