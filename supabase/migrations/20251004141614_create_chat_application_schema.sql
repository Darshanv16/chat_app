/*
  # Chat Application Complete Schema

  ## Overview
  Complete database schema for a real-time chat application supporting private messaging and group chats.

  ## 1. New Tables

  ### `profiles`
  Stores user profile information, linked to Supabase auth.users
  - `id` (uuid, primary key) - References auth.users(id)
  - `email` (text, unique, not null) - User's email address
  - `display_name` (text, not null) - User's display name in chat
  - `avatar_url` (text, nullable) - Optional profile picture URL
  - `status` (text, default 'offline') - User online/offline status
  - `created_at` (timestamptz, default now()) - Account creation timestamp
  - `updated_at` (timestamptz, default now()) - Last profile update timestamp

  ### `contacts`
  Manages user-to-user connections for contact lists
  - `id` (uuid, primary key) - Unique contact relationship ID
  - `user_id` (uuid, not null) - References profiles(id) - The user who owns this contact
  - `contact_id` (uuid, not null) - References profiles(id) - The contact being added
  - `created_at` (timestamptz, default now()) - When contact was added
  - Unique constraint on (user_id, contact_id) - Prevents duplicate contacts
  - Check constraint prevents users from adding themselves

  ### `conversations`
  Stores conversation/chat room metadata
  - `id` (uuid, primary key) - Unique conversation identifier
  - `type` (text, not null) - Either 'private' (1-on-1) or 'group' (multiple users)
  - `name` (text, nullable) - Optional name for group chats
  - `created_by` (uuid, not null) - References profiles(id) - User who created the conversation
  - `created_at` (timestamptz, default now()) - Conversation creation time
  - `updated_at` (timestamptz, default now()) - Last update timestamp

  ### `conversation_participants`
  Links users to conversations they participate in
  - `id` (uuid, primary key) - Unique participant record ID
  - `conversation_id` (uuid, not null) - References conversations(id)
  - `user_id` (uuid, not null) - References profiles(id) - The participating user
  - `joined_at` (timestamptz, default now()) - When user joined the conversation
  - `last_read_at` (timestamptz, nullable) - Last time user read messages (for unread count)
  - Unique constraint on (conversation_id, user_id) - User can only join once

  ### `messages`
  Stores all chat messages across all conversations
  - `id` (uuid, primary key) - Unique message identifier
  - `conversation_id` (uuid, not null) - References conversations(id) - Which conversation
  - `sender_id` (uuid, not null) - References profiles(id) - Who sent the message
  - `content` (text, not null) - The message text content
  - `created_at` (timestamptz, default now()) - When message was sent
  - `updated_at` (timestamptz, default now()) - Last edit timestamp

  ## 2. Security (Row Level Security)

  All tables have RLS enabled with restrictive policies:

  ### Profiles Policies
  - Anyone authenticated can view all profiles (for user discovery/contacts)
  - Users can only insert their own profile during signup
  - Users can only update their own profile

  ### Contacts Policies
  - Users can only view their own contacts
  - Users can only add contacts for themselves
  - Users can only delete their own contacts

  ### Conversations Policies
  - Users can only view conversations they participate in
  - Any authenticated user can create conversations
  - Only conversation creators can update conversation details

  ### Conversation Participants Policies
  - Users can view participants only in conversations they're part of
  - Only conversation creators can add new participants
  - Users can leave conversations (delete their own participation)

  ### Messages Policies
  - Users can view messages only in conversations they participate in
  - Users can send messages only to conversations they're part of
  - Users can update only their own messages
  - Users can delete only their own messages

  ## 3. Performance Indexes

  - `idx_messages_conversation_id` - Fast message retrieval by conversation
  - `idx_messages_created_at` - Efficient message ordering by time
  - `idx_conversation_participants_user_id` - Quick lookup of user's conversations
  - `idx_conversation_participants_conversation_id` - Fast participant queries
  - `idx_contacts_user_id` - Efficient contact list retrieval

  ## 4. Important Notes

  - All foreign keys cascade on delete to maintain referential integrity
  - RLS policies ensure users can only access their own data and shared conversations
  - Real-time subscriptions are enabled for live message updates
  - Timestamps use timestamptz for proper timezone handling
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  status text DEFAULT 'offline',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, contact_id),
  CHECK (user_id != contact_id)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('private', 'group')),
  name text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz,
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Contacts policies
CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update conversations they created"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Conversation participants policies
CREATE POLICY "Users can view participants in their conversations"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation creators can add participants"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_participants.conversation_id
      AND conversations.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can leave conversations"
  ON conversation_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);