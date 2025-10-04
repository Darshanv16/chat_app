import { useState, useEffect, useRef } from 'react';
import { Send, Users, Info } from 'lucide-react';
import { supabase, type ConversationWithDetails, type Profile, type Message } from '../lib/supabase';

type ChatWindowProps = {
  conversation: ConversationWithDetails;
  currentUser: Profile;
  onConversationUpdate: () => void;
};

export default function ChatWindow({
  conversation,
  currentUser,
  onConversationUpdate,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<(Message & { sender: Profile })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    markAsRead();

    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          loadMessages();
          markAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        profiles:sender_id (
          id,
          email,
          display_name,
          avatar_url,
          status
        )
      `)
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(
        data.map((m) => ({
          ...m,
          sender: m.profiles as unknown as Profile,
        }))
      );
    }
  };

  const markAsRead = async () => {
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversation.id)
      .eq('user_id', currentUser.id);

    onConversationUpdate();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: currentUser.id,
        content: newMessage.trim(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const getConversationTitle = () => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== currentUser.id
    );
    return otherParticipant?.profile.display_name || 'Unknown User';
  };

  const getParticipantNames = () => {
    if (conversation.type === 'private') return null;

    return conversation.participants
      .map((p) => p.profile.display_name)
      .join(', ');
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              {conversation.type === 'group' && <Users className="w-5 h-5 text-gray-600" />}
              <span>{getConversationTitle()}</span>
            </h2>
            {conversation.type === 'group' && (
              <p className="text-sm text-gray-500 mt-1">
                {conversation.participants.length} members: {getParticipantNames()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUser.id;

          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex space-x-2 max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {!isOwn && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {message.sender.display_name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  {!isOwn && (
                    <div className="text-xs text-gray-600 mb-1 ml-1">
                      {message.sender.display_name}
                    </div>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatMessageTime(message.created_at)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
