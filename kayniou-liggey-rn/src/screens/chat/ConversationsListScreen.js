import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { SPACING, RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// Palette of avatar background colors for users without photos
const AVATAR_COLORS = ['#0F7B6C', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];
const avatarColor = (name = '') => {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

const ConversationsListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      if (response.data.success) {
        setConversations(response.data.conversations || []);
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error.message);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `${diffMins} min`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `${diffDays}j`;
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const other = user.userType === 'client' ? c.workerId : c.clientId;
    return other?.fullName?.toLowerCase().includes(search.toLowerCase());
  });

  const renderConversation = ({ item: conversation }) => {
    if (!conversation?._id) return null;

    const other = user.userType === 'client'
      ? conversation.workerId
      : conversation.clientId;

    if (!other) return null;

    const unread = user.userType === 'client'
      ? conversation.clientUnreadCount || 0
      : conversation.workerUnreadCount || 0;
    const hasUnread = unread > 0;
    const initials = (other.fullName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const bgColor = avatarColor(other.fullName || '');

    return (
      <TouchableOpacity
        style={[styles.card, hasUnread && styles.cardUnread]}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: conversation._id,
            otherUserId: other._id,
            otherUserName: other.fullName,
            otherUserPhoto: other.photoURL,
          })
        }
        activeOpacity={0.75}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {other.photoURL ? (
            <Image source={{ uri: other.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: bgColor }]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          {/* Online dot — placeholder; set to true if API exposes it */}
          <View style={styles.onlineDot} />
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardRow}>
            <Text style={[styles.name, hasUnread && styles.nameBold]} numberOfLines={1}>
              {other.fullName}
            </Text>
            <Text style={[styles.time, hasUnread && styles.timePrimary]}>
              {formatTime(conversation.lastMessageAt || conversation.createdAt)}
            </Text>
          </View>

          <View style={styles.cardRow}>
            <Text
              style={[styles.preview, hasUnread && styles.previewBold]}
              numberOfLines={1}
            >
              {conversation.lastMessage || 'Nouvelle conversation'}
            </Text>
            {hasUnread ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            ) : (
              <Ionicons name="checkmark-done" size={16} color={COLORS.textLight} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSeparator = () => <View style={styles.separator} />;

  const renderEmptyState = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="chatbubbles-outline" size={48} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>Aucune conversation</Text>
      <Text style={styles.emptyText}>
        Vos échanges avec les clients ou travailleurs apparaîtront ici dès qu'un contrat sera actif.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une conversation..."
          placeholderTextColor={COLORS.textLight}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderConversation}
        keyExtractor={(item) => item._id}
        ItemSeparatorComponent={renderSeparator}
        contentContainerStyle={filtered.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  // ── Search ────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface || COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    ...SHADOWS.xs,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },

  // ── Conversation card ─────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white || COLORS.surface,
  },
  cardUnread: {
    backgroundColor: '#F0FDF9',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 76,
  },

  // ── Avatar ────────────────────────────────────────────────
  avatarWrap: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: COLORS.white || '#fff',
  },

  // ── Text rows ─────────────────────────────────────────────
  cardContent: {
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.xs,
  },
  nameBold: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  timePrimary: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  preview: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: SPACING.xs,
  },
  previewBold: {
    fontWeight: '600',
    color: COLORS.text,
  },

  // ── Unread badge ──────────────────────────────────────────
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Empty state ───────────────────────────────────────────
  emptyList: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E6F4F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
});

export default ConversationsListScreen;
