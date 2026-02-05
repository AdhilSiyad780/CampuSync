// frontend/src/context/ChatContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { chatApi } from "../api/chatApi";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
      const total = data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setUnreadCount(total);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // --- ADDED THE MISSING LOGIC FUNCTIONS ---
  
  const updateConversationLastMessage = useCallback((conversationId, message) => {
    setConversations(prev => 
      prev.map(conv => conv.id === conversationId 
        ? { ...conv, last_message: message, updated_at: message.created_at } 
        : conv
      )
    );
  }, []);

  const incrementUnreadCount = useCallback((conversationId) => {
    setConversations(prev =>
      prev.map(conv => conv.id === conversationId 
        ? { ...conv, unread_count: (conv.unread_count || 0) + 1 } 
        : conv
      )
    );
    setUnreadCount(prev => prev + 1);
  }, []);

  const markConversationAsRead = useCallback((conversationId) => {
    setConversations(prev => {
      const currentConv = prev.find(c => c.id === conversationId);
      if (currentConv) {
        setUnreadCount(total => Math.max(0, total - (currentConv.unread_count || 0)));
      }
      return prev.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c);
    });
  }, []);

  const createConversation = async (userId) => {
    const data = await chatApi.createConversation(userId);
    await fetchConversations();
    return data;
  };

  useEffect(() => {
    if (authLoading) return;
    fetchConversations();
    if (!isAuthenticated) return;
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [fetchConversations, isAuthenticated, authLoading]);

  const value = {
    conversations,
    loading,
    unreadCount,
    fetchConversations,
    createConversation, // Added this too for the NewChatModal
    updateConversationLastMessage, 
    markConversationAsRead,
    incrementUnreadCount,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside ChatProvider");
  return context;
};