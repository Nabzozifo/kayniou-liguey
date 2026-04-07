import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { formatCurrency } from '../../config/regional';

// ─── Status config ───────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: 'En attente',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    accentColor: '#F59E0B',
    icon: 'time',
  },
  accepted: {
    label: 'Accepté',
    color: '#10B981',
    bgColor: '#D1FAE5',
    accentColor: '#10B981',
    icon: 'checkmark-circle',
  },
  rejected: {
    label: 'Rejeté',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    accentColor: '#EF4444',
    icon: 'close-circle',
  },
  expired: {
    label: 'Expiré',
    color: '#9CA3AF',
    bgColor: '#F3F4F6',
    accentColor: '#D1D5DB',
    icon: 'time-outline',
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
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// ─── Quote card ──────────────────────────────────────────────────
const QuoteCard = ({ quote, onViewRequest, onEdit, onDelete }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const statusCfg = getStatusConfig(quote.status);
  const isPending = quote.status === 'pending';

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.975,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      {/* Left accent bar */}
      <View style={[styles.cardAccent, { backgroundColor: statusCfg.accentColor }]} />

      <View style={styles.cardContent}>
        {/* Badge */}
        <View style={styles.cardTopRow}>
          <Text style={styles.cardDate}>{formatDate(quote.createdAt)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bgColor }]}>
            <Ionicons name={statusCfg.icon} size={13} color={statusCfg.color} />
            <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* Title */}
        <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onViewRequest} activeOpacity={1}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {quote.requestTitle || 'Demande de service'}
          </Text>

          {/* Price + Duration */}
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{formatCurrency(quote.price)}</Text>
            {quote.estimatedDuration ? (
              <View style={styles.durationPill}>
                <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.durationText}>{quote.estimatedDuration}h</Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          {quote.description ? (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {quote.description}
            </Text>
          ) : null}

          {/* Services count */}
          {quote.servicesIncluded && quote.servicesIncluded.length > 0 && (
            <View style={styles.servicesRow}>
              <Ionicons name="checkmark-circle" size={15} color={COLORS.success} />
              <Text style={styles.servicesText}>
                {quote.servicesIncluded.length} service
                {quote.servicesIncluded.length > 1 ? 's' : ''} inclus
              </Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.viewRequestLink}>
              <Text style={styles.viewRequestText}>Voir la demande</Text>
              <Ionicons name="arrow-forward" size={15} color={COLORS.primary} />
            </View>
            {quote.score > 0 && (
              <View style={styles.scoreRow}>
                <Ionicons name="trophy" size={14} color={COLORS.warning} />
                <Text style={styles.scoreText}>{quote.score} pts</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Actions for pending */}
        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
              <Ionicons name="create-outline" size={16} color={COLORS.primary} />
              <Text style={styles.editBtnText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
              <Text style={styles.deleteBtnText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────
const MyQuotesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allQuotes, setAllQuotes] = useState([]);
  const [filter, setFilter] = useState('all');

  useFocusEffect(
    useCallback(() => {
      fetchQuotes();
    }, [])
  );

  const fetchQuotes = async () => {
    try {
      const response = await api.get(`/quotes/worker/${user.id}`);
      if (response.data.success) {
        setAllQuotes(response.data.quotes || []);
      }
    } catch (error) {
      console.error('Erreur chargement devis:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQuotes();
    setRefreshing(false);
  };

  const filteredQuotes =
    filter === 'all' ? allQuotes : allQuotes.filter((q) => q.status === filter);

  const stats = {
    total: allQuotes.length,
    pending: allQuotes.filter((q) => q.status === 'pending').length,
    accepted: allQuotes.filter((q) => q.status === 'accepted').length,
  };

  const handleEditQuote = (quote) => {
    navigation.navigate('CreateQuote', {
      requestId: quote.requestId,
      quoteId: quote._id,
      editMode: true,
      quoteData: quote,
    });
  };

  const handleDeleteQuote = (quoteId) => {
    Alert.alert(
      'Supprimer le devis',
      'Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/quotes/${quoteId}`);
              if (response.data.success) {
                Alert.alert('Succès', 'Devis supprimé avec succès');
                fetchQuotes();
              }
            } catch (error) {
              const message =
                error.response?.data?.message || 'Impossible de supprimer le devis';
              Alert.alert('Erreur', message);
            }
          },
        },
      ]
    );
  };

  const FILTERS = [
    { value: 'all', label: 'Tous' },
    { value: 'pending', label: 'En attente' },
    { value: 'accepted', label: 'Acceptés' },
    { value: 'rejected', label: 'Rejetés' },
  ];

  const EMPTY_CONFIG = {
    all:      { icon: 'document-text-outline', title: 'Aucun devis', sub: "Vous n'avez soumis aucun devis pour le moment" },
    pending:  { icon: 'time-outline',           title: 'Aucun devis en attente', sub: 'Tous vos devis ont été traités' },
    accepted: { icon: 'checkmark-circle-outline', title: 'Aucun devis accepté', sub: 'Continuez à proposer vos services' },
    rejected: { icon: 'close-circle-outline',   title: 'Aucun devis rejeté', sub: 'Vos devis sont appréciés' },
  };

  const renderEmpty = () => {
    const cfg = EMPTY_CONFIG[filter] || EMPTY_CONFIG.all;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name={cfg.icon} size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>{cfg.title}</Text>
        <Text style={styles.emptySubtitle}>{cfg.sub}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* ── Stats card ── */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.accepted}</Text>
          <Text style={styles.statLabel}>Acceptés</Text>
        </View>
      </View>

      {/* ── Filter pills ── */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {FILTERS.map(({ value, label }) => {
            const isActive = filter === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setFilter(value)}
              >
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
        data={filteredQuotes}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <QuoteCard
            quote={item}
            onViewRequest={() =>
              navigation.navigate('RequestDetails', { requestId: item.requestId })
            }
            onEdit={() => handleEditQuote(item)}
            onDelete={() => handleDeleteQuote(item._id)}
          />
        )}
        contentContainerStyle={styles.listContent}
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

  // Stats
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    ...SHADOWS.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
  },

  // Filters
  filtersWrapper: {
    marginTop: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  filtersScroll: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: SPACING.md,
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
  cardContent: {
    flex: 1,
    padding: SPACING.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  durationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: SPACING.xs,
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: SPACING.xs,
  },
  servicesText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: SPACING.xxs,
  },
  viewRequestLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewRequestText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    backgroundColor: '#FFF5F5',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.error,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
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
    fontSize: 17,
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

export default MyQuotesScreen;
