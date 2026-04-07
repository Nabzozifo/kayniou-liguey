import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { SPACING, RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { formatCurrency } from '../../config/regional';

// ─── Status config ───────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: 'En attente',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    accentColor: '#F59E0B',
    icon: 'time',
  },
  in_progress: {
    label: 'En cours',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    accentColor: '#3B82F6',
    icon: 'hammer',
  },
  completed: {
    label: 'Terminé',
    color: '#10B981',
    bgColor: '#F0FDF4',
    accentColor: '#10B981',
    icon: 'checkmark-circle',
  },
  cancelled: {
    label: 'Annulé',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    accentColor: '#EF4444',
    icon: 'close-circle',
  },
};

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || {
    label: status,
    color: COLORS.textSecondary,
    bgColor: COLORS.backgroundDark,
    accentColor: COLORS.border,
    icon: 'help-circle',
  };

// ─── Helpers ────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDuration = (hours) => {
  if (!hours) return '';
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = Math.floor(hours / 24);
  const remaining = Math.round(hours % 24);
  return remaining > 0 ? `${days}j ${remaining}h` : `${days}j`;
};

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

// Deterministic color from name
const AVATAR_COLORS = ['#0F7B6C', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#10B981'];
const getAvatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ─── Worksite card ───────────────────────────────────────────────
const WorksiteCard = ({ worksite, isWorker, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const statusCfg = getStatusConfig(worksite.status);
  const otherPerson = isWorker ? worksite.clientInfo : worksite.workerInfo;
  const personName = otherPerson?.name || 'N/A';
  const personRole = isWorker ? 'Client' : 'Artisan';
  const avatarColor = getAvatarColor(personName);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      {/* Left accent bar */}
      <View style={[styles.cardAccent, { backgroundColor: statusCfg.accentColor }]} />

      <TouchableOpacity
        style={styles.cardInner}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Top row: title + badge */}
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {worksite.title || 'Chantier sans titre'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bgColor }]}>
            <Ionicons name={statusCfg.icon} size={12} color={statusCfg.color} />
            <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* Person row */}
        <View style={styles.personRow}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{getInitials(personName)}</Text>
          </View>
          <View style={styles.personInfo}>
            <Text style={styles.personName} numberOfLines={1}>
              {personName}
            </Text>
            <Text style={styles.personRole}>{personRole}</Text>
          </View>
        </View>

        {/* Info row: price + duration */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={15} color={COLORS.primary} />
            <Text style={styles.priceText}>{formatCurrency(worksite.agreedPrice)}</Text>
          </View>
          {worksite.actualDuration ? (
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={15} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{formatDuration(worksite.actualDuration)}</Text>
            </View>
          ) : null}
        </View>

        {/* Progress bar for in_progress */}
        {worksite.status === 'in_progress' && (
          <View style={styles.progressWrapper}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '50%' }]} />
            </View>
            <Text style={styles.progressLabel}>En cours</Text>
          </View>
        )}

        {/* Date */}
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.textLight} />
          <Text style={styles.dateText}>
            {worksite.startTime
              ? `Démarré le ${formatDate(worksite.startTime)}`
              : `Créé le ${formatDate(worksite.createdAt)}`}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────
const WorksitesListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [worksites, setWorksites] = useState([]);
  const [filter, setFilter] = useState('all');

  useFocusEffect(
    useCallback(() => {
      fetchWorksites();
    }, [filter])
  );

  const fetchWorksites = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/worksites', { params });
      if (response.data.success) {
        setWorksites(response.data.worksites || []);
      }
    } catch (error) {
      console.error('Erreur chargement chantiers:', error);
      setWorksites([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorksites();
    setRefreshing(false);
  };

  const FILTERS = [
    { value: 'all',         label: 'Tous',         icon: 'grid-outline' },
    { value: 'pending',     label: 'En attente',   icon: 'time-outline' },
    { value: 'in_progress', label: 'En cours',     icon: 'hammer-outline' },
    { value: 'completed',   label: 'Terminés',     icon: 'checkmark-circle-outline' },
  ];

  const renderEmpty = () => {
    const cfg = getStatusConfig(filter === 'all' ? 'completed' : filter);
    const msg =
      filter === 'all'
        ? 'Vos chantiers apparaîtront ici'
        : `Aucun chantier ${cfg.label.toLowerCase()}`;

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="briefcase-outline" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>Aucun chantier</Text>
        <Text style={styles.emptySubtitle}>{msg}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mes chantiers</Text>
        </View>
        {worksites.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{worksites.length}</Text>
          </View>
        )}
      </View>

      {/* ── Filter pills ── */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {FILTERS.map(({ value, label, icon }) => {
            const isActive = filter === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => {
                  setFilter(value);
                  setLoading(true);
                }}
              >
                <Ionicons
                  name={icon}
                  size={14}
                  color={isActive ? COLORS.white : COLORS.textSecondary}
                />
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── List ── */}
      <FlatList
        data={worksites}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <WorksiteCard
            worksite={item}
            isWorker={
              user?.id === item.workerId?._id || user?._id === item.workerId?._id
            }
            onPress={() =>
              navigation.navigate('WorksiteDetails', { worksiteId: item._id })
            }
          />
        )}
        contentContainerStyle={worksites.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
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
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.xs,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Filters
  filtersWrapper: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filtersScroll: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    flexDirection: 'row',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterPillTextActive: {
    color: COLORS.white,
  },

  // List
  listContent: {
    padding: SPACING.md,
    paddingBottom: 32,
  },
  emptyList: {
    flexGrow: 1,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  cardAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  cardInner: {
    flex: 1,
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Person
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  personRole: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
  },

  // Info row
  infoRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },

  // Progress
  progressWrapper: {
    gap: 4,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: RADIUS.full,
  },
  progressLabel: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
    textAlign: 'right',
  },

  // Date
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textLight,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
});

export default WorksitesListScreen;
