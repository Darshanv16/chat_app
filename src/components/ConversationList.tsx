import { Users, User } from 'lucide-react';
import { type ConversationWithDetails } from '../lib/supabase';

type ConversationListProps = {
  conversations: ConversationWithDetails[];
  currentUserId: string;
  selectedConversation: ConversationWithDetails | null;
  onSelectConversation: (conversation: ConversationWithDetails) => void;
  loading: boolean;
};

export default function ConversationList({
  conversations,
  currentUserId,
  selectedConversation,
  onSelectConversation,
  loading,
}: ConversationListProps) {
  const getConversationName = (conversation: ConversationWithDetails) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== currentUserId
    );
    return otherParticipant?.profile.display_name || 'Unknown User';
  };

  const getConversationAvatar = (conversation: ConversationWithDetails) => {
    if (conversation.type === 'group') {
      return (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white">
          <Users className="w-6 h-6" />
        </div>
      );
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== currentUserId
    );
    const name = otherParticipant?.profile.display_name || 'U';

    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No conversations yet</p>
          <p className="text-sm mt-1">Start a new chat to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition border-b border-gray-100 ${
            selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
          }`}
        >
          {getConversationAvatar(conversation)}

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-800 truncate">
                {getConversationName(conversation)}
              </span>
              {conversation.last_message && (
                <span className="text-xs text-gray-500">
                  {formatTime(conversation.last_message.created_at)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 truncate">
                {conversation.last_message?.content || 'No messages yet'}
              </p>
              {conversation.unread_count! > 0 && (
                <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {conversation.unread_count}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function MessageSquare({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}
