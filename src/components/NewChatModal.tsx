import { useState, useEffect } from 'react';
import { X, Users as UsersIcon, User, Plus, Trash2 } from 'lucide-react';
import { supabase, type Profile, type Contact } from '../lib/supabase';

type NewChatModalProps = {
  currentUser: Profile;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
};

type ContactWithProfile = Contact & {
  contact_profile: Profile;
};

export default function NewChatModal({
  currentUser,
  onClose,
  onConversationCreated,
}: NewChatModalProps) {
  const [chatType, setChatType] = useState<'private' | 'group'>('private');
  const [contacts, setContacts] = useState<ContactWithProfile[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const { data } = await supabase
      .from('contacts')
      .select(`
        *,
        contact_profile:contact_id (
          id,
          email,
          display_name,
          avatar_url,
          status
        )
      `)
      .eq('user_id', currentUser.id);

    if (data) {
      setContacts(
        data.map((c) => ({
          ...c,
          contact_profile: c.contact_profile as unknown as Profile,
        }))
      );
    }
  };

  const handleCreatePrivateChat = async (contactId: string) => {
    setLoading(true);
    try {
      const { data: existingConv } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner(type)
        `)
        .eq('user_id', currentUser.id);

      if (existingConv) {
        for (const conv of existingConv) {
          if ((conv.conversations as { type: string }).type === 'private') {
            const { data: participants } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', conv.conversation_id);

            if (
              participants &&
              participants.length === 2 &&
              participants.some((p) => p.user_id === contactId)
            ) {
              onConversationCreated(conv.conversation_id);
              onClose();
              return;
            }
          }
        }
      }

      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'private',
          created_by: currentUser.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      await supabase.from('conversation_participants').insert([
        {
          conversation_id: newConv.id,
          user_id: currentUser.id,
        },
        {
          conversation_id: newConv.id,
          user_id: contactId,
        },
      ]);

      onConversationCreated(newConv.id);
      onClose();
    } catch (error) {
      console.error('Error creating private chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroupChat = async () => {
    if (selectedContacts.length === 0 || !groupName.trim()) return;

    setLoading(true);
    try {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'group',
          name: groupName.trim(),
          created_by: currentUser.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      const participants = [
        {
          conversation_id: newConv.id,
          user_id: currentUser.id,
        },
        ...selectedContacts.map((contactId) => ({
          conversation_id: newConv.id,
          user_id: contactId,
        })),
      ];

      await supabase.from('conversation_participants').insert(participants);

      onConversationCreated(newConv.id);
      onClose();
    } catch (error) {
      console.error('Error creating group chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">New Chat</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => setChatType('private')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition flex items-center justify-center space-x-2 ${
                chatType === 'private'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Private Chat</span>
            </button>
            <button
              onClick={() => setChatType('group')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition flex items-center justify-center space-x-2 ${
                chatType === 'group'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              <span>Group Chat</span>
            </button>
          </div>
        </div>

        {chatType === 'group' && (
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            {selectedContacts.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">
                  Selected: {selectedContacts.length} contact(s)
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {contacts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No contacts available</p>
              <p className="text-sm mt-2">Add contacts first to start chatting</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    if (chatType === 'private') {
                      handleCreatePrivateChat(contact.contact_id);
                    } else {
                      toggleContactSelection(contact.contact_id);
                    }
                  }}
                  disabled={loading}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition ${
                    chatType === 'group' && selectedContacts.includes(contact.contact_id)
                      ? 'bg-blue-50 border-2 border-blue-600'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
                      {contact.contact_profile.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{contact.contact_profile.display_name}</div>
                      <div className="text-sm text-gray-500">
                        {contact.contact_profile.email}
                      </div>
                    </div>
                  </div>
                  {chatType === 'group' &&
                    selectedContacts.includes(contact.contact_id) && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                </button>
              ))}
            </div>
          )}
        </div>

        {chatType === 'group' && selectedContacts.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleCreateGroupChat}
              disabled={loading || !groupName.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Group Chat'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
