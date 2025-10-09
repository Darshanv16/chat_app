/*
  # Add Theme Preference to Profiles

  ## Overview
  Adds user theme customization capability to profiles table.

  ## 1. Schema Changes

  ### Profiles Table Updates
  - Add `theme` (text, default 'blue') - User's selected color theme
    - Available themes: blue, purple, green, orange, pink, red, teal, gray

  ## 2. Important Notes
  - Theme preference is stored per user
  - Default theme is 'blue' for all users
  - Theme affects primary colors, gradients, and accent colors throughout the app
*/

-- Add theme preference to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'theme'
  ) THEN
    ALTER TABLE profiles ADD COLUMN theme text DEFAULT 'blue' CHECK (theme IN ('blue', 'purple', 'green', 'orange', 'pink', 'red', 'teal', 'gray'));
  END IF;
END $$;