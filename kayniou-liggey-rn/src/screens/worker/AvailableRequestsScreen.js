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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { SPACING, RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { formatCurrency } from '../../config/regional';

const URGENCY = {
  high:   { label: 'Urgent',  color: '#EF4444', bg: '#FEF2F2', icon: 'alert-circle',    dotColor: '#EF4444' },
  medium: { label: 'Normal',  color: '#F59E0B', bg: '#FFFBEB', icon: 'time',             dotColor: '#F59E0B' },
  low:    { label: 'Flexible',color: '#10B981', bg: '#F0FDF4', icon: 'checkmark-circle', dotColor: '#10B981' },
};

const CAT_ICONS = {
  plomberie: 'water', electricite: 'flash', menuiserie: 'hammer',
  maconnerie: 'construct', peinture: 'color-palette', jardinage: 'leaf',
  nettoyage: 'sparkles',
};

const FILTERS = ['Tous', 'Urgent', 'Normal', 'Flexible'];

const formatAge = (d) => {
  const ms = Date.now() - new Date(d).getTime();
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  if (mins < 60) return `${mins} min`;
  if (hrs < 24) return `${hrs}h`;
  if (days < 7) return `${days}j`;
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// ── Request card ─────────────────────────────────────────────────
const RequestCard = ({ item, onPress, userCountry }) => {
  const urg = URGENCY[item.urgency] || URGENCY.medium;
  const distance = item.distance ? `${(item.distance / 1000).toFixed(1)} km` : null;
  const scale = useRef(new Animated.Value(1)).current;

  const onIn = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(item)}
        onPressIn={onIn}
        onPressOut={onOut}
        activeOpacity={1}
      >
        {/* Urgency accent bar */}
        <View style={[styles.cardAccent, { backgroundColor: urg.dotColor }]} />

        {/* Header row */}
        <View style={styles.cardHead}>
          <View style={styles.cardHeadLeft}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardAge}>{formatAge(item.createdAt)}</Text>
          </View>
          <View style={[styles.urgencyPill, { backgroundColor: urg.bg }]}>
            <Ionicons name={urg.icon} size={13} color={urg.color} />
            <Text style={[styles.urgencyText, { color: urg.color }]}>{urg.label}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

        {/* Info chips row */}
        <View style={styles.chipRow}>
          {distance && (
            <View style={styles.chip}>
              <Ionicons name="location" size={13} color={COLORS.primary} />
              <Text style={styles.chipText}>{distance}</Text>
            </View>
          )}
          {item.estimatedBudget && (
            <View style={[styles.chip, styles.chipBudget]}>
              <Ionicons name="cash" size={13} color="#059669" />
              <Text style={[styles.chipText, { color: '#059669', fontWeight: '700' }]}>
                {formatCurrency(item.estimatedBudget, userCountry || 'SN')}
              </Text>
            </View>
          )}
          <View style={styles.chip}>
            <Ionicons name="document-text" size={13} color={COLORS.textSecondary} />
            <Text style={styles.chipText}>{item.quoteCount || 0} devis</Text>
          </View>
        </View>

        {/* Category tags */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
          {item.categories?.slice(0, 4).map((cat, i) => (
            <View key={i} style={styles.tag}>
              <Ionicons name={CAT_ICONS[cat.toLowerCase()] || 'briefcase'} size={11} color={COLORS.primary} />
              <Text style={styles.tagText}>{cat}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.cardFooter}>
          {item.hasSubmittedQuote ? (
            <View style={styles.sentBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.sentText}>Devis envoyé</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => onPress(item)}
            >
              <Text style={styles.applyText}>Postuler</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ════════════════════════════════════════════════════════════════
const AvailableRequestsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [filterInfo, setFilterInfo] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Tous');

  useFocusEffect(useCallback(() => { fetchRequests(); }, []));

  const fetchRequests = async () => {
    try {
      const res = await api.get(`/service-requests/available-for-worker/${user.id}`);
      if (res.data.success) {
        setRequests(res.data.requests || []);
        setFilterInfo(res.data.filters);
        if (res.data.requests.length === 0 && !res.data.filters) {
          Alert.alert('Profil incomplet', 'Sélectionnez vos métiers pour voir les demandes.', [
            { text: 'Compléter', onPress: () => navigation.navigate('EditWorkerProfile') },
            { text: 'Plus tard', style: 'cancel' },
          ]);
        }
      }
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 400) {
        Alert.alert('Profil incomplet', 'Complétez votre profil pour voir les demandes.', [
          { text: 'Compléter', onPress: () => navigation.navigate('EditWorkerProfile') },
          { text: 'Plus tard', style: 'cancel' },
        ]);
        setRequests([]);
      }
    } finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const filtered = requests.filter(r => {
    if (activeFilter === 'Tous') return true;
    const map = { Urgent: 'high', Normal: 'medium', Flexible: 'low' };
    return r.urgency === map[activeFilter];
  });

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Bannière vérification ──────────────────────────── */}
      {!user?.isVerified && (
        <TouchableOpacity
          style={styles.verifyBanner}
          onPress={() => navigation.navigate('IdentityVerification')}
          activeOpacity={0.85}
        >
          <View style={styles.verifyBannerLeft}>
            <View style={styles.verifyIconWrap}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.verifyBannerTitle}>Vérifiez votre identité</Text>
              <Text style={styles.verifyBannerSub}>Requis pour postuler aux offres</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#1D9BF0" />
        </TouchableOpacity>
      )}

      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Demandes disponibles</Text>
          {filterInfo && (
            <Text style={styles.headerSub}>
              {filterInfo.categories?.join(' · ')}
              {filterInfo.radius ? ` · ${filterInfo.radius} km` : ''}
            </Text>
          )}
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filtered.length}</Text>
        </View>
      </View>

      {/* ── Filter pills ──────────────────────────────────── */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── List ─────────────────────────────────────────── */}
      <FlatList
        data={filtered}
        renderItem={({ item }) => (
          <RequestCard
            item={item}
            userCountry={user?.country}
            onPress={r => navigation.navigate('RequestDetails', { requestId: r._id })}
          />
        )}
        keyExtractor={item => item._id}
        contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={44} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Aucune demande</Text>
            <Text style={styles.emptyText}>
              Pas encore de demandes pour vos métiers dans votre zone. Revenez plus tard.
            </Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.refreshText}>Actualiser</Text>
            </TouchableOpacity>
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

  // ── Verify banner ─────────────────────────────────────────
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  verifyBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  verifyIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1D9BF0',
    alignItems: 'center', justifyContent: 'center',
  },
  verifyBannerTitle: { fontSize: 13, fontWeight: '700', color: '#1E40AF' },
  verifyBannerSub: { fontSize: 11, color: '#3B82F6', marginTop: 1 },

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
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  countBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // ── Filter bar ────────────────────────────────────────────
  filterBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: '#fff' },

  // ── List ──────────────────────────────────────────────────
  list: { padding: SPACING.md },
  emptyList: { flexGrow: 1 },

  // ── Card ──────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    paddingLeft: SPACING.md + 4,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  cardHeadLeft: { flex: 1, marginRight: SPACING.xs },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, lineHeight: 21, marginBottom: 2 },
  cardAge: { fontSize: 11, color: COLORS.textLight },
  urgencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  urgencyText: { fontSize: 12, fontWeight: '700' },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: SPACING.xs },

  // ── Chips ─────────────────────────────────────────────────
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  chipBudget: { backgroundColor: '#F0FDF4' },
  chipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },

  // ── Tags ──────────────────────────────────────────────────
  tagScroll: { marginBottom: SPACING.sm },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F0FDF9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    marginRight: 6,
  },
  tagText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },

  // ── Footer ────────────────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
  },
  sentText: { fontSize: 13, fontWeight: '700', color: '#059669' },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    ...SHADOWS.xs,
  },
  applyText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // ── Empty ─────────────────────────────────────────────────
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingTop: 80 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F0FDF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: SPACING.md },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  refreshText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default AvailableRequestsScreen;
