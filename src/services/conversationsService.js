// src/services/conversationsService.js
import api from './api';

export const conversationsService = {
  /**
   * GET /api/v1/conversations
   * Obtiene todas las conversaciones del usuario actual
   */
  getAll: async () => {
    const response = await api.get('/conversations');
    return response.data;
  },

  /**
   * GET /api/v1/conversations/:id
   * Obtiene una conversación con todos sus mensajes
   */
  getById: async (id) => {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  /**
   * GET /api/v1/conversations/:id/messages?page=X
   * Obtiene mensajes paginados de una conversación
   */
  getMessages: async (conversationId, page = 1) => {
    const response = await api.get(`/conversations/${conversationId}/messages`, {
      params: { page }
    });
    return response.data;
  },

  /**
   * POST /api/v1/conversations/:id/messages
   * Envía un nuevo mensaje
   */
  sendMessage: async (conversationId, content) => {
    const response = await api.post(`/conversations/${conversationId}/messages`, {
      message: { content }
    });
    return response.data;
  },

  /**
   * POST /api/v1/conversations/:id/messages/typing
   * Envía indicador de que el usuario está escribiendo
   */
  sendTypingIndicator: async (conversationId) => {
    await api.post(`/conversations/${conversationId}/messages/typing`);
  },

  /**
   * GET /api/v1/conversations/unread_count
   * Obtiene el total de mensajes no leídos
   */
  getUnreadCount: async () => {
    const response = await api.get('/conversations/unread_count');
    return response.data.unread_count;
  }
};
