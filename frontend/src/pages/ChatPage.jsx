// frontend/src/pages/ChatPage.jsx

import { useState, useEffect } from 'react';
import { MessageCircle, Users, Loader2 } from 'lucide-react';
import ConversationList from '../componets/chat/ConversationList';
import ChatWindow from '../componets/chat/ChatWindow';
import NewChatModal from '../componets/chat/NewChatModal';
import { useChat } from '../context/ChatContext';

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const { loading } = useChat();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar - Conversations */}
      <div className="w-96 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <MessageCircle className="text-blue-600" size={24} />
              </div>
              <h1 className="text-2xl font-black text-slate-800">Messages</h1>
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              title="New Chat"
            >
              <Users size={20} />
            </button>
          </div>
        </div>

        <ConversationList
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
        />
      </div>

      {/* Right Side - Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onClose={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="p-8 bg-slate-100 rounded-[2.5rem] mb-4">
              <MessageCircle size={64} />
            </div>
            <p className="text-lg font-bold">Select a conversation to start chatting</p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onConversationCreated={(conversation) => {
            setSelectedConversation(conversation);
            setShowNewChatModal(false);
          }}
        />
      )}
    </div>
  );
}