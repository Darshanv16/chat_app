/*
  # Add Phone Number and Invite Features

  ## Overview
  Adds phone number support and invite system to enable users to connect with contacts.

  ## 1. Schema Changes

  ### Profiles Table Updates
  - Add `phone_number` (text, unique, nullable) - User's phone number for contact matching
  - Add `invite_code` (text, unique, not null) - Unique invite code for sharing

  ### New Table: `invites`
  - `id` (uuid, primary key) - Unique invite record ID
  - `inviter_id` (uuid, not null) - References profiles(id) - User who sent invite
  - `phone_number` (text, nullable) - Phone number of invited person
  - `email` (text, nullable) - Email of invited person
  - `invite_code` (text, unique, not null) - Unique code for this invite
  - `status` (text, default 'pending') - Status: pending, accepted, expired
  - `created_at` (timestamptz, default now()) - When invite was sent
  - `accepted_at` (timestamptz, nullable) - When invite was accepted
  - `accepted_by` (uuid, nullable) - References profiles(id) - Who accepted

  ## 2. Security

  ### Invites Policies
  - Users can view invites they sent
  - Users can create invites
  - Users can update invites they sent
  - Users can view invites sent to their phone/email

  ## 3. Important Notes

  - Phone numbers are stored in E.164 format (e.g., +1234567890)
  - Invite codes are generated as random unique strings
  - When user signs up with phone/email matching an invite, auto-connect
  - Users can search and add contacts by phone number
*/

-- Add phone number and invite code to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'invite_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN invite_code text UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 10);
  END IF;
END $$;

-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone_number text,
  email text,
  invite_code text UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 10),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  CHECK (phone_number IS NOT NULL OR email IS NOT NULL)
);

-- Create index for invite lookups
CREATE INDEX IF NOT EXISTS idx_invites_phone_number ON invites(phone_number);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_invite_code ON invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_invite_code ON profiles(invite_code);

-- Enable RLS on invites
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Invites policies
CREATE POLICY "Users can view invites they sent"
  ON invites FOR SELECT
  TO authenticated
  USING (auth.uid() = inviter_id);

CREATE POLICY "Users can view invites sent to them"
  ON invites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.phone_number = invites.phone_number OR profiles.email = invites.email)
    )
  );

CREATE POLICY "Users can create invites"
  ON invites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update their own invites"
  ON invites FOR UPDATE
  TO authenticated
  USING (auth.uid() = inviter_id)
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users who received invite can update it"
  ON invites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.phone_number = invites.phone_number OR profiles.email = invites.email)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.phone_number = invites.phone_number OR profiles.email = invites.email)
    )
  );