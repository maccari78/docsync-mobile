// src/services/actionCableService.js
import { createConsumer } from '@rails/actioncable';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ActionCableService {
  constructor() {
    this.consumer = null;
    this.subscriptions = new Map();
  }

  async connect() {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Construir URL del WebSocket con token JWT como query param
    const CABLE_URL = `ws://192.168.0.10:3000/cable?token=${token}`;
    this.consumer = createConsumer(CABLE_URL);
    console.log('Action Cable: Connected to', CABLE_URL);
    return this.consumer;
  }

  subscribeToChatChannel(conversationId, callbacks) {
    if (!this.consumer) {
      throw new Error('Consumer not connected. Call connect() first.');
    }

    const key = `chat_${conversationId}`;

    // Evitar suscripciones duplicadas
    if (this.subscriptions.has(key)) {
      console.log(`Already subscribed to chat ${conversationId}`);
      return this.subscriptions.get(key);
    }

    const subscription = this.consumer.subscriptions.create(
      { channel: 'ChatChannel', conversation_id: conversationId },
      {
        connected: () => {
          console.log(`ChatChannel ${conversationId}: Connected`);
          callbacks.onConnected?.();
        },
        disconnected: () => {
          console.log(`ChatChannel ${conversationId}: Disconnected`);
          callbacks.onDisconnected?.();
        },
        received: (data) => {
          console.log('Message received:', data);
          callbacks.onReceived?.(data);
        },
        rejected: () => {
          console.log(`ChatChannel ${conversationId}: Rejected`);
          callbacks.onRejected?.();
        }
      }
    );

    this.subscriptions.set(key, subscription);
    return subscription;
  }

  subscribeToTypingChannel(conversationId, callbacks) {
    if (!this.consumer) {
      throw new Error('Consumer not connected. Call connect() first.');
    }

    const key = `typing_${conversationId}`;

    if (this.subscriptions.has(key)) {
      console.log(`Already subscribed to typing ${conversationId}`);
      return this.subscriptions.get(key);
    }

    const subscription = this.consumer.subscriptions.create(
      { channel: 'TypingChannel', conversation_id: conversationId },
      {
        connected: () => {
          console.log(`TypingChannel ${conversationId}: Connected`);
          callbacks.onConnected?.();
        },
        disconnected: () => {
          console.log(`TypingChannel ${conversationId}: Disconnected`);
          callbacks.onDisconnected?.();
        },
        received: (data) => {
          console.log('Typing indicator received:', data);
          callbacks.onTyping?.(data);
        }
      }
    );

    this.subscriptions.set(key, subscription);
    return subscription;
  }

  unsubscribeFromChannel(key) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
      console.log(`Unsubscribed from ${key}`);
    }
  }

  disconnect() {
    if (this.consumer) {
      this.consumer.disconnect();
      this.consumer = null;
      this.subscriptions.clear();
      console.log('Action Cable: Disconnected');
    }
  }
}

// Exportar instancia singleton
export default new ActionCableService();
