import { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Search } from 'lucide-react';
import { supabase, type Profile, type Contact } from '../lib/supabase';

type ContactsModalProps = {
  currentUser: Profile;
  onClose: () => void;
};

type ContactWithProfile = Contact & {
  contact_profile: Profile;
};

export default function ContactsModal({ currentUser, onClose }: ContactsModalProps) {
  const [contacts, setContacts] = useState<ContactWithProfile[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
    loadAllUsers();
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
    setLoading(false);
  };

  const loadAllUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUser.id);

    if (data) {
      setAllUsers(data);
    }
  };

  const handleAddContact = async (userId: string) => {
    try {
      await supabase.from('contacts').insert({
        user_id: currentUser.id,
        contact_id: userId,
      });

      await supabase.from('contacts').insert({
        user_id: userId,
        contact_id: currentUser.id,
      });

      loadContacts();
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    try {
      await supabase
        .from('contacts')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('contact_id', contactId);

      await supabase
        .from('contacts')
        .delete()
        .eq('user_id', contactId)
        .eq('contact_id', currentUser.id);

      loadContacts();
    } catch (error) {
      console.error('Error removing contact:', error);
    }
  };

  const contactIds = contacts.map((c) => c.contact_id);
  const availableUsers = allUsers.filter(
    (user) =>
      !contactIds.includes(user.id) &&
      (user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Contacts</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setShowAddContact(!showAddContact)}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Contact</span>
          </button>
        </div>

        {showAddContact && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {searchQuery && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No users found
                  </p>
                ) : (
                  availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
                          {user.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{user.display_name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddContact(user.id)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No contacts yet</p>
              <p className="text-sm mt-2">Add contacts to start chatting</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
                      {contact.contact_profile.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{contact.contact_profile.display_name}</div>
                      <div className="text-sm text-gray-500">
                        {contact.contact_profile.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveContact(contact.contact_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
