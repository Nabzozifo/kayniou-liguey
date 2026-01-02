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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants';
import api from '../../services/api';
import io from 'socket.io-client';

// const SOCKET_URL = 'https://pamela-unrestful-thermodynamically.ngrok-free.dev';

// Après
const SOCKET_URL = 'http://16.171.193.183:5000';

const ChatScreen = ({ route, navigation }) => {
  console.log('🔵 ChatScreen mounted avec route.params:', route.params);

  const { conversationId, otherUserName, otherUserId, worksiteId, worksiteTitle } = route.params || {};
  const { user } = useAuth();

  console.log('🔍 Params extraits:', { conversationId, otherUserName, otherUserId, worksiteId, worksiteTitle });

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef(null);
  const socketRef = useRef(null);

  // Validation des params
  useEffect(() => {
    if (!conversationId) {
      console.error('❌ conversationId manquant!');
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir la conversation. Veuillez réessayer.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    if (!otherUserId) {
      console.error('❌ otherUserId manquant!');
    }
  }, [conversationId, otherUserId]);

  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();

    // Connect to Socket.IO
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected:', socketRef.current.id);
      socketRef.current.emit('joinConversation', conversationId);
    });

    socketRef.current.on('newMessage', (message) => {
      console.log('📥 New message received:', message);
      setMessages((prev) => {
        // Éviter les doublons - vérifier si le message existe déjà
        const exists = prev.some(m => m._id === message._id);
        if (exists) {
          console.log('⚠️ Message déjà existant, ignoré');
          return prev;
        }
        return [...prev, message];
      });
      scrollToBottom();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      console.log('🔍 Chargement messages pour conversation:', conversationId);
      const response = await api.get(`/chat/conversations/${conversationId}/messages`);

      console.log('📊 Messages response:', response.data);

      if (response.data.success) {
        setMessages(response.data.messages || []);
        scrollToBottom();

        // Mark as read
        await api.put(`/chat/conversations/${conversationId}/read`).catch(err => {
          console.log('⚠️ Erreur mark as read:', err.message);
        });
      }
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
      if (error.response?.status === 403) {
        Alert.alert(
          'Accès refusé',
          'Vous ne pouvez accéder à cette conversation que lorsqu\'un contrat est actif.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const messageContent = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      console.log('📤 Envoi message:', { conversationId, receiverId: otherUserId, content: messageContent });

      const response = await api.post('/chat/messages', {
        conversationId,
        receiverId: otherUserId,
        content: messageContent,
      });

      console.log('✅ Message envoyé:', response.data);

      if (response.data.success) {
        const newMessage = response.data.message;

        // Emit via socket for real-time
        if (socketRef.current) {
          socketRef.current.emit('sendMessage', newMessage);
        }

        // Add to local state
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
      }
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      console.error('Error details:', error.response?.data);

      if (error.response?.status === 403) {
        Alert.alert(
          'Impossible d\'envoyer',
          error.response.data.message || 'Vous devez avoir un contrat actif pour envoyer des messages.'
        );
      } else {
        Alert.alert('Erreur', 'Impossible d\'envoyer le message. Veuillez réessayer.');
      }

      setInputText(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const renderMessage = ({ item: message }) => {
    const isMyMessage = message.senderId?._id === user.id || message.senderId === user.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          {!isMyMessage && (
            <Text style={styles.senderName}>
              {message.senderName || otherUserName}
            </Text>
          )}
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText,
            ]}
          >
            {message.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
            ]}
          >
            {formatTime(message.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>Aucun message</Text>
      <Text style={styles.emptySubtext}>Envoyez votre premier message!</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {otherUserName}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Worksite Badge */}
      {worksiteId && worksiteTitle && (
        <TouchableOpacity
          style={styles.worksiteBadge}
          onPress={() => navigation.navigate('WorksiteDetails', { worksiteId })}
        >
          <Ionicons name="construct" size={16} color={COLORS.primary} />
          <Text style={styles.worksiteBadgeText} numberOfLines={1}>
            Chantier: {worksiteTitle}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item._id || `msg-${index}`}
        contentContainerStyle={messages.length === 0 ? styles.emptyList : styles.messagesList}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Tapez votre message..."
          placeholderTextColor={COLORS.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="send" size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  messagesList: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '75%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
  },
  myMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: COLORS.white,
  },
  otherMessageText: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  otherMessageTime: {
    color: COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  worksiteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 8,
  },
  worksiteBadgeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default ChatScreen;
