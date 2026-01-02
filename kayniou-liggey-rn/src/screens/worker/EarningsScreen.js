import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { formatCurrency as formatRegionalCurrency } from '../../config/regional';

const { width } = Dimensions.get('window');

const EarningsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('month'); // week, month, year

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    try {
      console.log('🔍 Chargement statistiques gains...');
      const response = await api.get(`/worker-profile/${user.id}/earnings`, {
        params: { period }
      });

      console.log('📊 Stats:', response.data);

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return formatRegionalCurrency(Math.round(amount));
  };

  const formatTime = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    return `${hours.toFixed(1)}h`;
  };

  const renderPeriodButton = (value, label) => (
    <TouchableOpacity
      style={[styles.periodButton, period === value && styles.periodButtonActive]}
      onPress={() => setPeriod(value)}
    >
      <Text style={[styles.periodButtonText, period === value && styles.periodButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bar-chart-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.emptyText}>Aucune donnée disponible</Text>
      </View>
    );
  }

  const earningsData = {
    labels: stats.earningsTrend.labels,
    datasets: [{
      data: stats.earningsTrend.values,
      color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
      strokeWidth: 3
    }]
  };

  const missionsData = {
    labels: stats.missionsByCategory.map(c => c.name.substring(0, 8)),
    datasets: [{
      data: stats.missionsByCategory.map(c => c.count)
    }]
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {renderPeriodButton('week', 'Semaine')}
        {renderPeriodButton('month', 'Mois')}
        {renderPeriodButton('year', 'Année')}
      </View>

      {/* Main Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Ionicons name="cash" size={32} color={COLORS.white} />
          <Text style={styles.statValue}>{formatCurrency(stats.totalEarnings)}</Text>
          <Text style={styles.statLabel}>Gains Totaux</Text>
          {stats.earningsTrendPercent !== 0 && (
            <View style={styles.trendBadge}>
              <Ionicons
                name={stats.earningsTrendPercent > 0 ? 'trending-up' : 'trending-down'}
                size={16}
                color={COLORS.white}
              />
              <Text style={styles.trendText}>
                {Math.abs(stats.earningsTrendPercent)}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statCard}>
          <Ionicons name="briefcase" size={24} color={COLORS.primary} />
          <Text style={styles.statValueSecondary}>{stats.totalMissions}</Text>
          <Text style={styles.statLabelSecondary}>Missions</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-done" size={24} color={COLORS.success} />
          <Text style={styles.statValueSecondary}>{stats.completedMissions}</Text>
          <Text style={styles.statLabelSecondary}>Complétées</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color={COLORS.warning} />
          <Text style={styles.statValueSecondary}>{stats.averageRating.toFixed(1)}</Text>
          <Text style={styles.statLabelSecondary}>Note Moyenne</Text>
        </View>
      </View>

      {/* Earnings Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Évolution des Gains</Text>
          <Text style={styles.chartSubtitle}>Derniers 7 jours</Text>
        </View>
        <LineChart
          data={earningsData}
          width={width - 48}
          height={220}
          chartConfig={{
            backgroundColor: COLORS.white,
            backgroundGradientFrom: COLORS.white,
            backgroundGradientTo: COLORS.white,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: COLORS.primary,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Missions by Category */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Missions par Catégorie</Text>
          <Text style={styles.chartSubtitle}>Cette période</Text>
        </View>
        <BarChart
          data={missionsData}
          width={width - 48}
          height={220}
          chartConfig={{
            backgroundColor: COLORS.white,
            backgroundGradientFrom: COLORS.white,
            backgroundGradientTo: COLORS.white,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
          }}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </View>

      {/* Detailed Stats */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Statistiques Détaillées</Text>

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Gains ce mois</Text>
          </View>
          <Text style={styles.detailValue}>{formatCurrency(stats.thisMonthEarnings)}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.accent} />
            <Text style={styles.detailLabel}>Gains mois dernier</Text>
          </View>
          <Text style={styles.detailValue}>{formatCurrency(stats.lastMonthEarnings)}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons name="trending-up-outline" size={20} color={COLORS.success} />
            <Text style={styles.detailLabel}>Moyenne par mission</Text>
          </View>
          <Text style={styles.detailValue}>{formatCurrency(stats.averagePerMission)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons name="time-outline" size={20} color={COLORS.info} />
            <Text style={styles.detailLabel}>Temps moyen</Text>
          </View>
          <Text style={styles.detailValue}>{formatTime(stats.averageCompletionTime)}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons name="hourglass-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.detailLabel}>Heures travaillées</Text>
          </View>
          <Text style={styles.detailValue}>{stats.totalWorkingHours.toFixed(1)}h</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons name="flash-outline" size={20} color={COLORS.warning} />
            <Text style={styles.detailLabel}>Temps de réponse</Text>
          </View>
          <Text style={styles.detailValue}>{formatTime(stats.averageResponseTime)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.success} />
            <Text style={styles.detailLabel}>Taux de complétion</Text>
          </View>
          <Text style={styles.detailValue}>{stats.completionRate}%</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons name="people-outline" size={20} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Clients répétés</Text>
          </View>
          <Text style={styles.detailValue}>{stats.repeatClientRate}%</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons name="alarm-outline" size={20} color={COLORS.accent} />
            <Text style={styles.detailLabel}>Ponctualité</Text>
          </View>
          <Text style={styles.detailValue}>{stats.onTimeRate}%</Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsCard}>
        <Text style={styles.transactionsTitle}>Transactions Récentes</Text>

        {stats.recentTransactions.map((transaction, index) => (
          <View key={index} style={styles.transactionRow}>
            <View style={styles.transactionLeft}>
              <View style={[styles.transactionIcon, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="briefcase" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>{transaction.title}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.date).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            </View>
            <Text style={styles.transactionAmount}>
              +{formatCurrency(transaction.amount)}
            </Text>
          </View>
        ))}

        {stats.recentTransactions.length === 0 && (
          <Text style={styles.emptyTransactions}>Aucune transaction récente</Text>
        )}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    width: (width - 44) / 2,
    alignItems: 'center',
  },
  statCardPrimary: {
    backgroundColor: COLORS.primary,
    width: width - 32,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  statValueSecondary: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabelSecondary: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  chartSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: COLORS.text,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  transactionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  transactionDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  emptyTransactions: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomSpace: {
    height: 40,
  },
});

export default EarningsScreen;
