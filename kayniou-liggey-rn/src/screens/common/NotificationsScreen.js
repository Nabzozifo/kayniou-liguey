import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { SPACING, RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// ── Icon + color mapping ─────────────────────────────────────────
const NOTIF_CONFIG = {
  new_job_request:          { icon: 'briefcase',           bg: '#DBEAFE', color: '#3B82F6' },
  outbid_in_auction:        { icon: 'trending-down',        bg: '#FEE2E2', color: '#EF4444' },
  quote_accepted:           { icon: 'checkmark-circle',     bg: '#D1FAE5', color: '#10B981' },
  quote_rejected:           { icon: 'close-circle',         bg: '#FEE2E2', color: '#EF4444' },
  job_invitation:           { icon: 'mail',                 bg: '#E0E7FF', color: '#6366F1' },
  job_started_confirmation: { icon: 'play-circle',          bg: '#D1FAE5', color: '#10B981' },
  job_completed_confirmation:{ icon: 'checkmark-done',      bg: '#D1FAE5', color: '#059669' },
  new_message_worksite:     { icon: 'chatbubble',           bg: '#DBEAFE', color: '#3B82F6' },
  payment_received:         { icon: 'cash',                 bg: '#FEF3C7', color: '#F59E0B' },
  review_received:          { icon: 'star',                 bg: '#FEF3C7', color: '#F59E0B' },
  worker_accepted_invitation:{ icon: 'person-add',          bg: '#D1FAE5', color: '#10B981' },
  new_quote_submitted:      { icon: 'document-text',        bg: '#E0E7FF', color: '#6366F1' },
  job_started:              { icon: 'play',                  bg: '#D1FAE5', color: '#10B981' },
  job_completed:            { icon: 'checkmark-done',       bg: '#D1FAE5', color: '#059669' },
  new_message_from_worker:  { icon: 'chatbubbles',          bg: '#DBEAFE', color: '#3B82F6' },
  action_required:          { icon: 'warning',              bg: '#FEE2E2', color: '#EF4444' },
  worker_assigned:          { icon: 'person-add',           bg: '#D1FAE5', color: '#10B981' },
  system_notification:      { icon: 'information-circle',   bg: '#E0E7FF', color: '#6366F1' },
};
const DEFAULT_CONFIG = { icon: 'notifications', bg: '#F0FDF9', color: COLORS.primary };

// ── Group helper ──────────────────────────────────────────────────
const groupByDate = (notifications) => {
  const groups = {};
  notifications.forEach(n => {
    const d = new Date(n.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    let key;
    if (diffDays === 0) key = "Aujourd'hui";
    else if (diffDays === 1) key = 'Hier';
    else if (diffDays < 7) key = 'Cette semaine';
    else key = 'Plus ancien';
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  const order = ["Aujourd'hui", 'Hier', 'Cette semaine', 'Plus ancien'];
  return order.filter(k => groups[k]).flatMap(k => [
    { _id: `header-${k}`, type: 'header', label: k },
    ...groups[k].map(n => ({ ...n, type: 'notif' })),
  ]);
};

// ── Animated notification card ────────────────────────────────────
const NotifCard = ({ item, onPress }) => {
  const cfg = NOTIF_CONFIG[item.type] || DEFAULT_CONFIG;
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const formatTime = (d) => {
    try {
      const date = new Date(d);
      const now = new Date();
      const mins = Math.floor((now - date) / 60000);
      const hrs = Math.floor(mins / 60);
      const days = Math.floor(hrs / 24);
      if (mins < 1) return 'À l\'instant';
      if (mins < 60) return `${mins} min`;
      if (hrs < 24) return `${hrs}h`;
      if (days < 7) return `${days}j`;
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => onPress(item)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Unread accent */}
        {!item.isRead && <View style={styles.unreadAccent} />}

        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleBold]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardTime}>{formatTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.cardMessage} numberOfLines={2}>
            {item.message}
          </Text>

          {/* Priority chip if urgent */}
          {item.priority === 'urgent' && (
            <View style={styles.urgentChip}>
              <View style={styles.urgentDot} />
              <Text style={styles.urgentText}>Urgent</Text>
            </View>
          )}
        </View>

        {/* Unread dot */}
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ════════════════════════════════════════════════════════════════
const NotificationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useFocusEffect(
    useCallback(() => { fetchNotifications(); }, [])
  );

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) setNotifications(res.data.notifications || []);
    } catch { setNotifications([]); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      Alert.alert('Erreur', 'Impossible de marquer toutes les notifications comme lues');
    }
  };

  const handlePress = async (notif) => {
    if (!notif.isRead) await markAsRead(notif._id);
    if (notif.actionData?.screen) {
      navigation.navigate(notif.actionData.screen, notif.actionData.params || {});
    }
  };

  const unread = notifications.filter(n => !n.isRead).length;
  const listData = groupByDate(notifications);

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.groupHeader}>
          <Text style={styles.groupLabel}>{item.label}</Text>
          <View style={styles.groupLine} />
        </View>
      );
    }
    return <NotifCard item={item} onPress={handlePress} />;
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Header bar ────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unread > 0 && (
            <Text style={styles.headerSub}>{unread} non lue{unread > 1 ? 's' : ''}</Text>
          )}
        </View>
        {unread > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={16} color={COLORS.primary} />
            <Text style={styles.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Unread count pill ─────────────────────────────── */}
      {unread > 0 && (
        <View style={styles.unreadBanner}>
          <View style={styles.unreadBannerDot} />
          <Text style={styles.unreadBannerText}>
            {unread} notification{unread > 1 ? 's' : ''} non lue{unread > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={listData.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Tout est calme ici</Text>
            <Text style={styles.emptyText}>
              Vous recevrez des alertes pour vos devis, messages et activités.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 58,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F0FDF9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  markAllText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // ── Unread banner ─────────────────────────────────────────
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B30',
  },
  unreadBannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' },
  unreadBannerText: { fontSize: 13, fontWeight: '600', color: '#92400E' },

  // ── List ──────────────────────────────────────────────────
  list: { padding: SPACING.md },
  emptyList: { flexGrow: 1 },

  // ── Group header ──────────────────────────────────────────
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  groupLabel: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 0.6, textTransform: 'uppercase' },
  groupLine: { flex: 1, height: 1, backgroundColor: COLORS.border },

  // ── Card ──────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  cardUnread: {
    backgroundColor: '#FAFFFE',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  unreadAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    flexShrink: 0,
  },
  cardContent: { flex: 1 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '500', color: COLORS.text, flex: 1, marginRight: 8, lineHeight: 20 },
  cardTitleBold: { fontWeight: '700' },
  cardTime: { fontSize: 11, color: COLORS.textLight, flexShrink: 0 },
  cardMessage: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  urgentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  urgentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  urgentText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
    marginTop: 4,
    flexShrink: 0,
  },

  // ── Empty state ───────────────────────────────────────────
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingTop: 80 },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F0FDF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
});

export default NotificationsScreen;
