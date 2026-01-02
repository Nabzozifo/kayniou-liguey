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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const ConversationsListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState([]);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const fetchConversations = async () => {
    try {
      console.log('🔍 Fetching conversations...');
      const response = await api.get('/chat/conversations');
      console.log('✅ Conversations response:', response.data);

      if (response.data.success) {
        setConversations(response.data.conversations || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement conversations:', error.response?.status, error.message);
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
      if (diffDays < 7) return `${diffDays}j`;

      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      });
    } catch (error) {
      return '';
    }
  };

  const renderConversation = ({ item: conversation }) => {
    // Vérification conversation valide
    if (!conversation || !conversation._id) {
      console.log('⚠️ Conversation invalide:', conversation);
      return null;
    }

    // Déterminer l'autre participant selon le type d'utilisateur
    const otherParticipant = user.userType === 'client'
      ? conversation.workerId
      : conversation.clientId;

    // Calculer le nombre de messages non lus selon le type d'utilisateur
    const unreadCount = user.userType === 'client'
      ? conversation.clientUnreadCount || 0
      : conversation.workerUnreadCount || 0;
    const hasUnread = unreadCount > 0;

    if (!otherParticipant) {
      console.log('⚠️ Participant manquant dans conversation:', conversation._id);
      return null;
    }

    const handlePress = () => {
      console.log('🔵 Navigation Chat avec params:', {
        conversationId: conversation._id,
        otherUserId: otherParticipant._id,
        otherUserName: otherParticipant.fullName,
      });

      navigation.navigate('Chat', {
        conversationId: conversation._id,
        otherUserId: otherParticipant._id,
        otherUserName: otherParticipant.fullName,
        otherUserPhoto: otherParticipant.photoURL,
      });
    };

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={handlePress}
      >
        <View style={styles.avatarContainer}>
          {otherParticipant.photoURL ? (
            <Image source={{ uri: otherParticipant.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {otherParticipant.fullName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[styles.conversationName, hasUnread && styles.conversationNameBold]}
              numberOfLines={1}
            >
              {otherParticipant.fullName}
            </Text>
            <Text style={[styles.conversationTime, hasUnread && styles.conversationTimeBold]}>
              {formatTime(conversation.lastMessageAt || conversation.createdAt)}
            </Text>
          </View>

          <View style={styles.conversationFooter}>
            <Text
              style={[styles.lastMessage, hasUnread && styles.lastMessageBold]}
              numberOfLines={1}
            >
              {conversation.lastMessage || 'Nouvelle conversation'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={80} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>Aucune conversation</Text>
      <Text style={styles.emptyMessage}>
        Vos conversations apparaîtront ici une fois qu'un contrat sera actif
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item._id}
        contentContainerStyle={conversations.length === 0 ? styles.emptyList : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  listContainer: {
    flexGrow: 1,
  },
  emptyList: {
    flexGrow: 1,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.white,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  conversationName: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  conversationNameBold: {
    fontWeight: '600',
  },
  conversationTime: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  conversationTimeBold: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  lastMessageBold: {
    fontWeight: '500',
    color: COLORS.text,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ConversationsListScreen;
