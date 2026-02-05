// frontend/src/components/chat/ConversationList.jsx

import { useChat } from '../../context/ChatContext';
import { Clock, CheckCheck } from 'lucide-react';

export default function ConversationList({ selectedConversation, onSelectConversation }) {
  const { conversations } = useChat();

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          <p className="font-bold">No conversations yet</p>
          <p className="text-sm mt-2">Start a new chat to get started</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {conversations.map((conversation) => {
            const other = conversation.other_participant;
            const lastMsg = conversation.last_message;
            const isSelected = selectedConversation?.id === conversation.id;
            const unreadCount = conversation.unread_count || 0;

            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`p-4 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border-l-4 border-blue-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {other.profile_picture ? (
                      <img
                        src={other.profile_picture}
                        alt={other.fullname}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-black text-lg">
                        {other.fullname.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-bold truncate ${
                        unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'
                      }`}>
                        {other.fullname}
                      </h3>
                      {lastMsg && (
                        <span className="text-xs text-slate-400 font-medium ml-2 flex-shrink-0">
                          {formatTime(lastMsg.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${
                        unreadCount > 0 ? 'font-bold text-slate-900' : 'text-slate-500'
                      }`}>
                        {lastMsg ? (
                          <>
                            {lastMsg.sender.id === other.id ? '' : 'You: '}
                            {lastMsg.content}
                          </>
                        ) : (
                          'No messages yet'
                        )}
                      </p>
                      
                      {unreadCount > 0 && (
                        <div className="ml-2 flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black">
                          {unreadCount}
                        </div>
                      )}
                    </div>

                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      other.user_type === 'teacher' ? 'bg-blue-100 text-blue-700' :
                      other.user_type === 'student' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {other.user_type}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}