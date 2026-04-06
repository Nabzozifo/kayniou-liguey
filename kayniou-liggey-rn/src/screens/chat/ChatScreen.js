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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants';
import { SPACING, RADIUS, SHADOWS } from '../../theme';
import api from '../../services/api';
import io from 'socket.io-client';

const SOCKET_URL = 'http://13.49.230.9:5000';

// Avatar helpers
const AVATAR_COLORS = ['#0F7B6C', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];
const avatarColor = (name = '') => {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

const ChatScreen = ({ route, navigation }) => {
  const {
    conversationId,
    otherUserName,
    otherUserId,
    otherUserPhoto,
    worksiteId,
    worksiteTitle,
  } = route.params || {};

  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef(null);
  const socketRef  = useRef(null);

  // Validate params
  useEffect(() => {
    if (!conversationId) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la conversation.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, []);

  // Fetch + socket
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();

    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('joinConversation', conversationId);
    });

    socketRef.current.on('newMessage', (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
    });

    return () => socketRef.current?.disconnect();
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`);
      if (response.data.success) {
        setMessages(response.data.messages || []);
        scrollToBottom();
        await api.put(`/chat/conversations/${conversationId}/read`).catch(() => {});
      }
    } catch (error) {
      if (error.response?.status === 403) {
        Alert.alert('Accès refusé', 'Un contrat actif est requis pour accéder à cette conversation.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;
    const content = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      const response = await api.post('/chat/messages', {
        conversationId,
        receiverId: otherUserId,
        content,
      });
      if (response.data.success) {
        const msg = response.data.message;
        socketRef.current?.emit('sendMessage', msg);
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    } catch (error) {
      if (error.response?.status === 403) {
        Alert.alert('Impossible d\'envoyer', error.response.data.message || 'Contrat requis.');
      } else {
        Alert.alert('Erreur', 'Message non envoyé. Réessayez.');
      }
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  // Group messages by date
  const formatDateHeader = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / 86400000);
      if (diffDays === 0) return 'Aujourd\'hui';
      if (diffDays === 1) return 'Hier';
      return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch { return ''; }
  };

  // Build flat list items with date separators
  const listData = (() => {
    const items = [];
    let lastDate = null;
    for (const msg of messages) {
      const dateKey = msg.createdAt ? new Date(msg.createdAt).toDateString() : null;
      if (dateKey && dateKey !== lastDate) {
        items.push({ _id: `date-${dateKey}`, type: 'date', label: formatDateHeader(msg.createdAt) });
        lastDate = dateKey;
      }
      items.push({ ...msg, type: 'message' });
    }
    return items;
  })();

  const renderItem = ({ item }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <View style={styles.dateLine} />
          <Text style={styles.dateLabel}>{item.label}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    }

    const isMe = item.senderId?._id === user.id || item.senderId === user.id;

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && (
          <View style={[styles.msgAvatar, { backgroundColor: avatarColor(otherUserName || '') }]}>
            <Text style={styles.msgAvatarText}>
              {(otherUserName || 'U')[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
            {item.content}
          </Text>
          <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther]}>
            {formatTime(item.createdAt)}
            {isMe && (
              <Text>  <Ionicons name="checkmark-done" size={11} color="rgba(255,255,255,0.65)" /></Text>
            )}
          </Text>
        </View>
      </View>
    );
  };

  const initials = (otherUserName || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const bgColor = avatarColor(otherUserName || '');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.headerAvatarWrap}>
          {otherUserPhoto ? (
            <Image source={{ uri: otherUserPhoto }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarFallback, { backgroundColor: bgColor }]}>
              <Text style={styles.headerAvatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.headerOnlineDot} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{otherUserName}</Text>
          <Text style={styles.headerStatus}>En ligne</Text>
        </View>

        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="call-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Worksite badge ───────────────────────────────────── */}
      {worksiteId && worksiteTitle && (
        <TouchableOpacity
          style={styles.worksiteBadge}
          onPress={() => navigation.navigate('WorksiteDetails', { worksiteId })}
        >
          <Ionicons name="construct-outline" size={15} color={COLORS.primary} />
          <Text style={styles.worksiteBadgeText} numberOfLines={1}>{worksiteTitle}</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      )}

      {/* ── Messages ─────────────────────────────────────────── */}
      <FlatList
        ref={flatListRef}
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, i) => item._id || `msg-${i}`}
        contentContainerStyle={listData.length === 0 ? styles.emptyList : styles.msgList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={42} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyText}>Commencez la conversation</Text>
            <Text style={styles.emptySubtext}>Dites bonjour à {otherUserName} !</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      />

      {/* ── Input bar ────────────────────────────────────────── */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.attachBtn}>
          <Ionicons name="attach" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={COLORS.textLight}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, inputText.trim() ? styles.sendBtnActive : styles.sendBtnInactive]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color={inputText.trim() ? '#fff' : COLORS.textLight} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingTop: 52,
    paddingBottom: 12,
    ...SHADOWS.sm,
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerAvatarWrap: {
    position: 'relative',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  headerOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerStatus: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  headerAction: {
    padding: 6,
    backgroundColor: '#E6F4F2',
    borderRadius: RADIUS.full,
  },

  // ── Worksite badge ─────────────────────────────────────────
  worksiteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF9',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    gap: 6,
  },
  worksiteBadgeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // ── Messages list ──────────────────────────────────────────
  msgList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F4F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // ── Date separator ─────────────────────────────────────────
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
    gap: 8,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },

  // ── Message row ────────────────────────────────────────────
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
    gap: 8,
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgRowOther: {
    justifyContent: 'flex-start',
  },

  // Small avatar for other user's messages
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  msgAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Bubbles ────────────────────────────────────────────────
  bubble: {
    maxWidth: '74%',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 7,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
    ...SHADOWS.xs,
  },
  bubbleOther: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    ...SHADOWS.xs,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextMe: {
    color: '#fff',
  },
  bubbleTextOther: {
    color: COLORS.text,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeMe: {
    color: 'rgba(255,255,255,0.65)',
  },
  bubbleTimeOther: {
    color: COLORS.textLight,
  },

  // ── Input bar ──────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  attachBtn: {
    padding: 8,
    marginBottom: 2,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 110,
    lineHeight: 20,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  sendBtnInactive: {
    backgroundColor: '#E2E8F0',
  },
});

export default ChatScreen;
