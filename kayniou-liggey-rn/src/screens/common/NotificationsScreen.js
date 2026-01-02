import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const NotificationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      console.log('🔔 Chargement notifications...');
      const response = await api.get('/notifications');

      console.log('✅ Notifications:', response.data);

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('❌ Erreur mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      await fetchNotifications();
    } catch (error) {
      console.error('❌ Erreur mark all as read:', error);
      Alert.alert('Erreur', 'Impossible de marquer toutes les notifications comme lues');
    }
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate to related screen
    if (notification.actionData?.screen) {
      navigation.navigate(notification.actionData.screen, notification.actionData.params || {});
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      new_job_request: 'briefcase',
      outbid_in_auction: 'alert-circle',
      quote_accepted: 'checkmark-circle',
      quote_rejected: 'close-circle',
      job_invitation: 'mail',
      job_started_confirmation: 'play-circle',
      job_completed_confirmation: 'checkmark-done',
      new_message_worksite: 'chatbubble',
      payment_received: 'cash',
      review_received: 'star',
      worker_accepted_invitation: 'person-add',
      new_quote_submitted: 'document-text',
      job_started: 'play',
      job_completed: 'checkmark-done',
      new_message_from_worker: 'chatbubbles',
      action_required: 'warning',
      worker_assigned: 'person-add',
      system_notification: 'information-circle',
    };
    return icons[type] || 'notifications';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return COLORS.danger;
      case 'high':
        return COLORS.warning;
      case 'normal':
        return COLORS.info;
      case 'low':
        return COLORS.textSecondary;
      default:
        return COLORS.primary;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const renderNotification = ({ item: notification }) => {
    const icon = getNotificationIcon(notification.type);
    const priorityColor = getPriorityColor(notification.priority);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !notification.isRead && styles.notificationCardUnread,
        ]}
        onPress={() => handleNotificationPress(notification)}
      >
        {/* Priority Indicator */}
        {notification.priority === 'urgent' && (
          <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
        )}

        <View style={styles.notificationContent}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: priorityColor + '20' }]}>
            <Ionicons name={icon} size={24} color={priorityColor} />
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.notificationTitle} numberOfLines={2}>
              {notification.title}
            </Text>
            <Text style={styles.notificationMessage} numberOfLines={3}>
              {notification.message}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTime(notification.createdAt)}
            </Text>
          </View>

          {/* Unread Dot */}
          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={80} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>Aucune notification</Text>
      <Text style={styles.emptyMessage}>
        Vous serez notifié des nouvelles activités ici
      </Text>
    </View>
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {notifications.length > 0 && unreadCount > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyList : styles.listContainer
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listContainer: {
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
  notificationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  notificationCardUnread: {
    backgroundColor: COLORS.primary + '05',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  priorityBar: {
    height: 3,
    width: '100%',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
});

export default NotificationsScreen;
