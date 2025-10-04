import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  user_id: string;
  contact_id: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  type: 'private' | 'group';
  name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ConversationParticipant = {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at?: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type ConversationWithDetails = Conversation & {
  participants: (ConversationParticipant & { profile: Profile })[];
  last_message?: Message;
  unread_count?: number;
};
