// src/screens/ChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard
} from 'react-native';
import { conversationsService } from '../services/conversationsService';
import actionCableService from '../services/actionCableService';
import { notificationsService } from '../services/notificationsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatScreen({ route, navigation }) {
  const { conversation } = route.params;
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    init();

    // Listeners para el teclado en Android
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      // Cleanup al desmontar
      actionCableService.unsubscribeFromChannel(`chat_${conversation.id}`);
      actionCableService.unsubscribeFromChannel(`typing_${conversation.id}`);
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const init = async () => {
    try {
      // Obtener ID del usuario actual
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setCurrentUserId(userData.id);
      }

      // Cargar mensajes
      await loadMessages();

      // Conectar WebSocket
      await actionCableService.connect();

      // Suscribirse a ChatChannel
      actionCableService.subscribeToChatChannel(conversation.id, {
        onConnected: () => console.log('Chat: Connected'),
        onReceived: handleMessageReceived,
      });

      // Suscribirse a TypingChannel
      actionCableService.subscribeToTypingChannel(conversation.id, {
        onTyping: handleTypingReceived,
      });

    } catch (error) {
      // Solo mostrar error si es un error crítico (no de notificaciones)
      if (error.message && !error.message.includes('addEventListener')) {
        console.error('Error initializing chat:', error);
        Alert.alert('Error', 'No se pudo inicializar el chat');
      } else {
        console.log('Chat initialized (notifications not available)');
      }
    }

    // Intentar solicitar permisos de notificaciones (opcional - no afecta funcionalidad)
    try {
      await notificationsService.requestPermissions();
    } catch (notifError) {
      console.log('Notifications not available, continuing without them');
    }
  };

  const loadMessages = async () => {
    try {
      const data = await conversationsService.getById(conversation.id);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'No se pudieron cargar los mensajes');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageReceived = (data) => {
    const newMessage = {
      id: data.id,
      content: data.content,
      user_id: data.user_id,
      user_name: data.user_name,
      time: data.created_at,
    };

    setMessages((prev) => {
      // Evitar duplicados
      if (prev.find(m => m.id === newMessage.id)) {
        return prev;
      }
      return [...prev, newMessage];
    });

    // Auto-scroll
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Mostrar notificación si el mensaje es del otro usuario
    if (data.user_id !== currentUserId) {
      notificationsService.showLocalNotification(
        data.user_name,
        data.content,
        { conversationId: conversation.id }
      );
    }
  };

  const handleTypingReceived = (data) => {
    // Solo mostrar si es el otro usuario
    if (data.user_id !== currentUserId) {
      setOtherUserTyping(true);

      // Ocultar después de 3 segundos
      setTimeout(() => {
        setOtherUserTyping(false);
      }, 3000);
    }
  };

  const sendMessage = async () => {
    const content = messageText.trim();
    if (!content || sending) return;

    try {
      setSending(true);
      setMessageText('');
      await conversationsService.sendMessage(conversation.id, content);
      // El mensaje se agregará via WebSocket broadcast
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
      setMessageText(content); // Restaurar texto
    } finally {
      setSending(false);
    }
  };

  const handleTextChange = (text) => {
    setMessageText(text);

    // Enviar indicador de escritura
    if (!isTyping) {
      setIsTyping(true);
      conversationsService.sendTypingIndicator(conversation.id).catch(console.error);
    }

    // Reset timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.user_id === currentUserId;

    return (
      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
        ]}
      >
        {!isCurrentUser && (
          <Text style={styles.senderName}>{item.user_name}</Text>
        )}
        <Text style={[
          styles.messageText,
          isCurrentUser ? styles.currentUserText : styles.otherUserText
        ]}>
          {item.content}
        </Text>
        <Text style={[
          styles.messageTime,
          isCurrentUser ? styles.currentUserTime : styles.otherUserTime
        ]}>
          {item.time}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando mensajes...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
    >
      {/* Header con info de turno */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{conversation.other_user.name}</Text>
        <Text style={styles.headerSubtitle}>
          📅 {conversation.appointment.date} - {conversation.appointment.time}
        </Text>
      </View>

      {/* Lista de mensajes */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messagesList,
          keyboardVisible && Platform.OS === 'android' && { paddingBottom: 20 }
        ]}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyText}>No hay mensajes aún</Text>
            <Text style={styles.emptySubtext}>Envía el primer mensaje</Text>
          </View>
        }
      />

      {/* Indicador de escritura */}
      {otherUserTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>
            {conversation.other_user.name} está escribiendo...
          </Text>
        </View>
      )}

      {/* Input de mensaje */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={handleTextChange}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageText.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Enviar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  currentUserBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherUserBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  currentUserTime: {
    color: '#fff',
    opacity: 0.7,
  },
  otherUserTime: {
    color: '#666',
  },
  typingIndicator: {
    padding: 8,
    paddingLeft: 16,
    backgroundColor: '#f0f0f0',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'android' ? 32 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
