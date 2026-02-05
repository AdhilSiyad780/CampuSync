  // frontend/src/components/chat/NewChatModal.jsx

  import { useState, useEffect } from 'react';
  import { X, Search, Loader2, MessageCircle } from 'lucide-react';
  import { chatApi } from '../../api/chatApi';
  import { useChat } from '../../context/ChatContext';

  export default function NewChatModal({ onClose, onConversationCreated }) {
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [creating, setCreating] = useState(false);
    const { createConversation } = useChat();

    useEffect(() => {
      fetchAvailableUsers();
    }, []);

    const fetchAvailableUsers = async () => {
      try {
        const users = await chatApi.getAvailableUsers();
        setAvailableUsers(users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleCreateChat = async (userId) => {
      setCreating(true);
      try {
        const conversation = await createConversation(userId);
        onConversationCreated(conversation);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        alert('Failed to start conversation');
      } finally {
        setCreating(false);
      }
    };

    const filteredUsers = availableUsers.filter(user =>
      user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <MessageCircle className="text-blue-600" size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-800">New Chat</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="font-bold">No users found</p>
                <p className="text-sm mt-2">
                  {searchTerm ? 'Try a different search' : 'No users available to chat with'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleCreateChat(user.id)}
                    disabled={creating}
                    className="w-full p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 text-left disabled:opacity-50"
                  >
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user.fullname}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-black text-lg">
                        {user.fullname.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">
                        {user.fullname}
                      </h3>
                      <p className="text-sm text-slate-500 truncate">
                        {user.email}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        user.user_type === 'teacher' ? 'bg-blue-100 text-blue-700' :
                        user.user_type === 'student' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {user.user_type}
                      </span>
                    </div>

                    {creating && (
                      <Loader2 className="animate-spin text-blue-600" size={20} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }