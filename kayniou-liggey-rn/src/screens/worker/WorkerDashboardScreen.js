import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { SPACING, RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { formatCurrency as formatRegionalCurrency } from '../../config/regional';

const { width } = Dimensions.get('window');
const CARD_W = (width - SPACING.md * 2 - SPACING.sm) / 2;

// ─── Mock bar chart data ─────────────────────────────────────────
// In production these come from the API (stats.earningsChart)
const CHART_PERIODS = ['Jour', 'Mois', 'Année'];

const MOCK_DATA = {
  Jour: [
    { label: 'Lun', value: 15000 },
    { label: 'Mar', value: 32000 },
    { label: 'Mer', value: 8000 },
    { label: 'Jeu', value: 45000 },
    { label: 'Ven', value: 28000 },
    { label: 'Sam', value: 52000 },
    { label: 'Dim', value: 19000 },
  ],
  Mois: [
    { label: 'Jan', value: 120000 },
    { label: 'Fév', value: 85000 },
    { label: 'Mar', value: 200000 },
    { label: 'Avr', value: 160000 },
    { label: 'Mai', value: 230000 },
    { label: 'Jun', value: 175000 },
  ],
  Année: [
    { label: '2022', value: 800000 },
    { label: '2023', value: 1200000 },
    { label: '2024', value: 950000 },
    { label: '2025', value: 1450000 },
  ],
};

// ─── Animated bar component ──────────────────────────────────────
const Bar = ({ value, maxValue, label, isHighest, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const BAR_MAX_H = 100;
  const pct = maxValue > 0 ? (value / maxValue) : 0;

  return (
    <View style={barStyles.wrap}>
      <View style={barStyles.track}>
        <Animated.View
          style={[
            barStyles.fill,
            {
              backgroundColor: isHighest ? COLORS.primary : '#A8D5CE',
              height: anim.interpolate({ inputRange: [0, 1], outputRange: [0, BAR_MAX_H * pct] }),
            },
          ]}
        />
      </View>
      <Text style={[barStyles.label, isHighest && barStyles.labelHighest]}>{label}</Text>
    </View>
  );
};

const barStyles = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 },
  track: {
    width: 22,
    height: 100,
    borderRadius: 11,
    backgroundColor: '#E6F4F2',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    borderRadius: 11,
  },
  label: { marginTop: 6, fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  labelHighest: { color: COLORS.primary, fontWeight: '700' },
});

// ─── Animated number counter ─────────────────────────────────────
const AnimatedNumber = ({ value, format }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(format ? format(0) : '0');

  useEffect(() => {
    anim.setValue(0);
    const listener = anim.addListener(({ value: v }) => {
      setDisplay(format ? format(Math.round(v)) : String(Math.round(v)));
    });
    Animated.timing(anim, {
      toValue: value,
      duration: 900,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listener);
  }, [value]);

  return <Text>{display}</Text>;
};

// ─── Stat mini-card ──────────────────────────────────────────────
const StatCard = ({ icon, iconBg, label, value, sub, onPress }) => (
  <TouchableOpacity
    style={[scStyles.card, { width: CARD_W }]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.75 : 1}
  >
    <View style={[scStyles.iconBg, { backgroundColor: iconBg + '22' }]}>
      <Ionicons name={icon} size={22} color={iconBg} />
    </View>
    <Text style={scStyles.label}>{label}</Text>
    <Text style={scStyles.value}>{value}</Text>
    {sub && <Text style={scStyles.sub}>{sub}</Text>}
  </TouchableOpacity>
);

const scStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    ...SHADOWS.sm,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  value: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
});

// ─── Quick action button ──────────────────────────────────────────
const QuickBtn = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={[qaStyles.btn, { width: CARD_W }]} onPress={onPress} activeOpacity={0.75}>
    <View style={[qaStyles.iconCircle, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <Text style={qaStyles.label}>{label}</Text>
  </TouchableOpacity>
);

const qaStyles = StyleSheet.create({
  btn: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text },
});

// ════════════════════════════════════════════════════════════════
//  Main screen
// ════════════════════════════════════════════════════════════════
const WorkerDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('Mois');

  useFocusEffect(
    useCallback(() => {
      fetchDashboardStats();
    }, [])
  );

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get(`/worker-profile/${user.id}/dashboard`);
      if (response.data.success) setStats(response.data.stats);
    } catch {
      setStats({
        totalEarnings: 0, monthEarnings: 0,
        averageRating: 0, totalReviews: 0,
        completedJobs: 0, totalJobs: 0,
        averageCompletionTime: 0, onTimeCompletionRate: 0,
        activeQuotes: 0, acceptanceRate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
  };

  const formatCurrency = (v) => formatRegionalCurrency(v || 0);
  const formatDuration = (h) => {
    if (!h) return '0h';
    if (h < 24) return `${h.toFixed(1)}h`;
    return `${Math.floor(h / 24)}j ${Math.round(h % 24)}h`;
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const completionRate = stats?.totalJobs > 0
    ? ((stats.completedJobs / stats.totalJobs) * 100).toFixed(0)
    : 0;

  const chartData = MOCK_DATA[chartPeriod];
  const maxVal = Math.max(...chartData.map((d) => d.value));
  const highIdx = chartData.findIndex((d) => d.value === maxVal);

  const firstName = (user.fullName || '').split(' ')[0];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero header ──────────────────────────────────────── */}
      <View style={styles.hero}>
        <View>
          <Text style={styles.heroGreeting}>Bonjour, {firstName} 👋</Text>
          <Text style={styles.heroSub}>Voici votre activité du jour</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* ── Earnings summary card ─────────────────────────────── */}
      <View style={styles.earningsCard}>
        <View style={styles.earningsTop}>
          <View>
            <Text style={styles.earningsLabel}>Gains totaux</Text>
            <Text style={styles.earningsValue}>
              <AnimatedNumber
                value={stats?.totalEarnings || 0}
                format={(v) => formatCurrency(v)}
              />
            </Text>
          </View>
          <View style={styles.earningsMonthBox}>
            <Text style={styles.earningsMonthLabel}>Ce mois</Text>
            <Text style={styles.earningsMonthValue}>{formatCurrency(stats?.monthEarnings || 0)}</Text>
          </View>
        </View>

        {/* ── Bar chart ────────────────────────────────────── */}
        <View style={styles.chartWrap}>
          {/* Period tabs */}
          <View style={styles.chartTabs}>
            {CHART_PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chartTab, chartPeriod === p && styles.chartTabActive]}
                onPress={() => setChartPeriod(p)}
              >
                <Text style={[styles.chartTabText, chartPeriod === p && styles.chartTabTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bars */}
          <View style={styles.bars}>
            {chartData.map((d, i) => (
              <Bar
                key={`${chartPeriod}-${i}`}
                value={d.value}
                maxValue={maxVal}
                label={d.label}
                isHighest={i === highIdx}
                delay={i * 60}
              />
            ))}
          </View>
        </View>
      </View>

      {/* ── Stat mini-cards ───────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Performance</Text>
      <View style={styles.grid}>
        <StatCard
          icon="star"
          iconBg={COLORS.warning || '#F59E0B'}
          label="Note moyenne"
          value={stats?.averageRating?.toFixed(1) || '0.0'}
          sub={`${stats?.totalReviews || 0} avis`}
        />
        <StatCard
          icon="checkmark-done-circle"
          iconBg={COLORS.success || '#10B981'}
          label="Travaux terminés"
          value={stats?.completedJobs || 0}
          sub={`${completionRate}% de réussite`}
        />
        <StatCard
          icon="time-outline"
          iconBg="#3B82F6"
          label="Temps moyen"
          value={formatDuration(stats?.averageCompletionTime || 0)}
          sub="par travail"
        />
        <StatCard
          icon="trending-up"
          iconBg={COLORS.primary}
          label="Ponctualité"
          value={`${stats?.onTimeCompletionRate || 0}%`}
          sub="à temps"
        />
      </View>

      {/* ── Activity row ─────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Activité</Text>
      <View style={styles.activityCard}>
        <View style={styles.activityItem}>
          <View style={[styles.activityIcon, { backgroundColor: '#E6F4F2' }]}>
            <Ionicons name="document-text-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.activityText}>
            <Text style={styles.activityLabel}>Devis actifs</Text>
            <Text style={styles.activityValue}>{stats?.activeQuotes || 0}</Text>
          </View>
        </View>
        <View style={styles.activityDivider} />
        <View style={styles.activityItem}>
          <View style={[styles.activityIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#F59E0B" />
          </View>
          <View style={styles.activityText}>
            <Text style={styles.activityLabel}>Taux d'acceptation</Text>
            <Text style={styles.activityValue}>{stats?.acceptanceRate || 0}%</Text>
          </View>
        </View>
      </View>

      {/* ── Quick actions ─────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Actions rapides</Text>
      <View style={styles.grid}>
        <QuickBtn
          icon="search-outline"
          label="Demandes"
          color={COLORS.primary}
          onPress={() => navigation.navigate('AvailableRequests')}
        />
        <QuickBtn
          icon="document-text-outline"
          label="Mes devis"
          color={COLORS.secondary || '#F2C94C'}
          onPress={() => navigation.navigate('MyQuotes')}
        />
        <QuickBtn
          icon="chatbubbles-outline"
          label="Messages"
          color="#3B82F6"
          onPress={() => navigation.navigate('Conversations')}
        />
        <QuickBtn
          icon="person-outline"
          label="Profil"
          color="#8B5CF6"
          onPress={() => navigation.navigate('Profile')}
        />
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 24,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  // ── Hero ──────────────────────────────────────────────────
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingTop: 60,
    paddingBottom: SPACING.lg,
  },
  heroGreeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Earnings card ─────────────────────────────────────────
  earningsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: -16,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  earningsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  earningsLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.primary,
  },
  earningsMonthBox: {
    alignItems: 'flex-end',
    backgroundColor: '#F0FDF9',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  earningsMonthLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  earningsMonthValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ── Chart ─────────────────────────────────────────────────
  chartWrap: {
    marginTop: SPACING.xs,
  },
  chartTabs: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
  },
  chartTab: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  chartTabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.xs,
  },
  chartTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  chartTabTextActive: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: SPACING.xs,
  },

  // ── Section title ──────────────────────────────────────────
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },

  // ── Stat grid ─────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },

  // ── Activity card ──────────────────────────────────────────
  activityCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    ...SHADOWS.sm,
  },
  activityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  activityIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityText: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  activityValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  activityDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
    marginHorizontal: 8,
  },
});

export default WorkerDashboardScreen;
