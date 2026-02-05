// frontend/src/api/chatApi.js

import api from './axios';

export const chatApi = {
  // Get all conversations
  getConversations: async () => {
    const response = await api.get('/chat/conversations/');
    return response.data;
  },

  // Create or get conversation with a user
  createConversation: async (otherUserId) => {
    const response = await api.post('/chat/conversations/create/', {
      other_user_id: otherUserId
    });
    console.log(response)
    return response.data;
  },

  // Get conversation details
  getConversation: async (conversationId) => {
    const response = await api.get(`/chat/conversations/${conversationId}/`);
    return response.data;
  },

  // Get messages in a conversation
  getMessages: async (conversationId, page = 1) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages/`, {
      params: { page }
    });
    return response.data;
  },

  // Send a message
  sendMessage: async (conversationId, content, attachment = null) => {
    const formData = new FormData();
    formData.append('content', content);
    if (attachment) {
      formData.append('attachment', attachment);
    }

    const response = await api.post(
      `/chat/conversations/${conversationId}/messages/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Mark messages as read
  markMessagesRead: async (conversationId) => {
    const response = await api.post(`/chat/conversations/${conversationId}/mark-read/`);
    return response.data;
  },

  // Get available users to chat with
  getAvailableUsers: async () => {
    const response = await api.get('/chat/available-users/');
    return response.data;
  },
};