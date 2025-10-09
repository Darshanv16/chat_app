import { useState, useEffect } from 'react';
import { MessageSquare, Users, UserPlus, LogOut, Share2, Palette } from 'lucide-react';
import { supabase, type Profile, type ConversationWithDetails, type Theme } from '../lib/supabase';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import ContactsModal from './ContactsModal';
import NewChatModal from './NewChatModal';
import InviteModal from './InviteModal';
import ThemeModal from './ThemeModal';
import { useTheme } from '../contexts/ThemeContext';

type ChatInterfaceProps = {
  user: Profile;
  onSignOut: () => void;
};

export default function ChatInterface({ user, onSignOut }: ChatInterfaceProps) {
  const { themeConfig, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<Profile>(user);
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [showContacts, setShowContacts] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.theme) {
      setTheme(user.theme);
    }
  }, [user.theme, setTheme]);

  useEffect(() => {
    loadConversations();

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_participants' },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadConversations = async () => {
    try {
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          last_read_at,
          conversations (
            id,
            type,
            name,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (!participantData) return;

      const conversationIds = participantData.map((p) => p.conversation_id);

      const { data: allParticipants } = await supabase
        .from('conversation_participants')
        .select(`
          id,
          conversation_id,
          user_id,
          joined_at,
          last_read_at,
          profiles (
            id,
            email,
            display_name,
            avatar_url,
            status
          )
        `)
        .in('conversation_id', conversationIds);

      const { data: lastMessages } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      const conversationsWithDetails: ConversationWithDetails[] = participantData.map((p) => {
        const conv = p.conversations as unknown as ConversationWithDetails;
        const participants = allParticipants?.filter(
          (ap) => ap.conversation_id === conv.id
        ) || [];
        const lastMessage = lastMessages?.find((m) => m.conversation_id === conv.id);

        const unreadMessages = lastMessages?.filter(
          (m) => m.conversation_id === conv.id &&
          (!p.last_read_at || new Date(m.created_at) > new Date(p.last_read_at))
        ) || [];

        return {
          ...conv,
          participants: participants.map((ap) => ({
            id: ap.id,
            conversation_id: ap.conversation_id,
            user_id: ap.user_id,
            joined_at: ap.joined_at,
            last_read_at: ap.last_read_at,
            profile: ap.profiles as unknown as Profile,
          })),
          last_message: lastMessage,
          unread_count: unreadMessages.length,
        };
      });

      conversationsWithDetails.sort((a, b) => {
        const aTime = a.last_message?.created_at || a.created_at;
        const bTime = b.last_message?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase
      .from('profiles')
      .update({ status: 'offline' })
      .eq('id', user.id);

    await supabase.auth.signOut();
    onSignOut();
  };

  const handleConversationCreated = (conversationId: string) => {
    loadConversations();
    const newConv = conversations.find((c) => c.id === conversationId);
    if (newConv) {
      setSelectedConversation(newConv);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setCurrentUser({ ...currentUser, theme: newTheme });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className={`p-4 border-b border-gray-200 bg-gradient-to-r ${themeConfig.primary} ${themeConfig.primaryHover}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full bg-white ${themeConfig.text} flex items-center justify-center font-semibold`}>
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="text-white">
                <div className="font-semibold">{user.display_name}</div>
                <div className="text-xs opacity-90">Online</div>
              </div>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setShowTheme(true)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition text-white"
                title="Change Theme"
              >
                <Palette className="w-5 h-5" />
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition text-white"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowNewChat(true)}
              className={`flex-1 bg-white ${themeConfig.text} px-3 py-2 rounded-lg font-medium hover:bg-opacity-90 transition flex items-center justify-center space-x-2`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>New</span>
            </button>
            <button
              onClick={() => setShowContacts(true)}
              className={`bg-white ${themeConfig.text} p-2 rounded-lg hover:bg-opacity-90 transition`}
              title="Contacts"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowInvite(true)}
              className={`bg-white ${themeConfig.text} p-2 rounded-lg hover:bg-opacity-90 transition`}
              title="Invite"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <ConversationList
          conversations={conversations}
          currentUserId={user.id}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          loading={loading}
        />
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            currentUser={user}
            onConversationUpdate={loadConversations}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="text-center">
              <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a conversation to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {showContacts && (
        <ContactsModal
          currentUser={user}
          onClose={() => setShowContacts(false)}
        />
      )}

      {showNewChat && (
        <NewChatModal
          currentUser={user}
          onClose={() => setShowNewChat(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}

      {showInvite && (
        <InviteModal
          currentUser={user}
          onClose={() => setShowInvite(false)}
        />
      )}

      {showTheme && (
        <ThemeModal
          currentUser={currentUser}
          onClose={() => setShowTheme(false)}
          onThemeChange={handleThemeChange}
        />
      )}
    </div>
  );
}
