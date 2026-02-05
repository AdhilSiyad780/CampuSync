// frontend/src/components/chat/ChatWindow.jsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Paperclip, X, Loader2, CheckCheck, Check } from 'lucide-react';
import { chatApi } from '../../api/chatApi';
import { useChatWebSocket } from '../../hooks/useChatWebsocket';
import { useChat } from '../../context/ChatContext';

export default function ChatWindow({ conversation, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { 
  updateConversationLastMessage, 
  markConversationAsRead, 
  incrementUnreadCount 
  } = useChat(); 
  const other = conversation.other_participant;

  // Get current user safely
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (pageNum = 1) => {
    try {
      const data = await chatApi.getMessages(conversation.id, pageNum);
      if (pageNum === 1) {
        setMessages(data.results);
      } else {
        setMessages(prev => [...data.results, ...prev]);
      }
      setHasMore(!!data.next);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    chatApi.markMessagesRead(conversation.id).then(() => {
      markConversationAsRead(conversation.id);
    });
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket handler for incoming messages
  const handleIncomingMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
    updateConversationLastMessage(conversation.id, message);
    
    if (message.sender.id !== currentUser.id) {
      chatApi.markMessagesRead(conversation.id);
    } else {
      incrementUnreadCount(conversation.id);
    }
  }, [conversation.id, currentUser.id, updateConversationLastMessage, incrementUnreadCount]);

  // WebSocket handler for incoming typing indicators
  const handleIncomingTyping = useCallback((userId, typingStatus) => {
    if (userId !== currentUser.id) {
      setIsTyping(typingStatus);
    }
  }, [currentUser.id]);

  const { isConnected, sendTypingIndicator } = useChatWebSocket(
    conversation.id,
    handleIncomingMessage,
    handleIncomingTyping
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || sending) return;

    setSending(true);
    try {
      await chatApi.sendMessage(conversation.id, newMessage, attachment);
      setNewMessage('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Renamed to avoid collision with the WebSocket handler
  const handleLocalTyping = () => {
    sendTypingIndicator(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 1000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setAttachment(file);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          {other.profile_picture ? (
            <img src={other.profile_picture} alt={other.fullname} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-black uppercase">
              {other.fullname?.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="font-black text-slate-800">{other.fullname}</h2>
            <div className="flex items-center gap-2">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                other.user_type === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {other.user_type}
              </span>
              {isConnected && (
                <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Live
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors md:hidden">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center justify-center my-4">
              <div className="px-3 py-1 bg-slate-200 rounded-full text-xs font-bold text-slate-600">{formatDate(date)}</div>
            </div>

            {msgs.map((message) => {
              const isOwn = message.sender.id === currentUser.id;
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
                  <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div className={`rounded-2xl px-4 py-2 shadow-sm ${isOwn ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                      {message.attachment && (
                        <div className="mb-2">
                          <a 
                            href={message.attachment} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`flex items-center gap-2 p-2 rounded-lg ${isOwn ? 'bg-blue-700' : 'bg-slate-50'}`}
                          >
                            <Paperclip size={16} />
                            <span className="text-sm font-bold">Attachment</span>
                          </a>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 px-1 text-[10px] font-bold text-slate-400 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span>{formatTime(message.created_at)}</span>
                      {isOwn && (message.is_read ? <CheckCheck size={14} className="text-blue-500" /> : <Check size={14} />)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-sm animate-pulse">
            <span className="font-bold">{other.fullname} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        {attachment && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <Paperclip size={16} className="text-blue-600" />
            <span className="text-sm font-bold text-blue-600 flex-1 truncate">{attachment.name}</span>
            <button onClick={() => setAttachment(null)} className="p-1 hover:bg-blue-100 rounded"><X size={16} className="text-blue-600" /></button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-slate-100 rounded-xl"><Paperclip size={20} className="text-slate-400" /></button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); handleLocalTyping(); }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-slate-100 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={sending}
          />
          <button type="submit" disabled={(!newMessage.trim() && !attachment) || sending} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}