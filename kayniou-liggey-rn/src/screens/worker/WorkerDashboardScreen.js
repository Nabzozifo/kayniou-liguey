import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { formatCurrency as formatRegionalCurrency } from '../../config/regional';

const { width } = Dimensions.get('window');

const WorkerDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardStats();
    }, [])
  );

  const fetchDashboardStats = async () => {
    try {
      console.log('📊 Chargement statistiques dashboard...');
      const response = await api.get(`/worker-profile/${user.id}/dashboard`);

      console.log('✅ Stats:', response.data);

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
      // Utiliser des stats par défaut en cas d'erreur
      setStats({
        totalEarnings: 0,
        monthEarnings: 0,
        averageRating: 0,
        totalReviews: 0,
        completedJobs: 0,
        totalJobs: 0,
        averageCompletionTime: 0,
        onTimeCompletionRate: 0,
        activeQuotes: 0,
        acceptanceRate: 0,
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

  const formatCurrency = (amount) => {
    return formatRegionalCurrency(amount || 0);
  };

  const formatDuration = (hours) => {
    if (!hours) return '0h';
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}j ${remainingHours}h`;
  };

  const renderStatCard = (icon, label, value, subValue, color, onPress) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
      </View>
    </TouchableOpacity>
  );

  const renderPerformanceBar = (label, value, maxValue, color) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

    return (
      <View style={styles.performanceBarContainer}>
        <View style={styles.performanceBarHeader}>
          <Text style={styles.performanceBarLabel}>{label}</Text>
          <Text style={styles.performanceBarValue}>{value}/{maxValue}</Text>
        </View>
        <View style={styles.performanceBarTrack}>
          <View
            style={[
              styles.performanceBarFill,
              { width: `${percentage}%`, backgroundColor: color }
            ]}
          />
        </View>
        <Text style={styles.performancePercentage}>{percentage.toFixed(0)}%</Text>
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

  const completionRate = stats?.totalJobs > 0
    ? ((stats.completedJobs / stats.totalJobs) * 100).toFixed(0)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header avec résumé */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tableau de Bord</Text>
        <Text style={styles.headerSubtitle}>
          Bienvenue, {user.fullName}
        </Text>
      </View>

      {/* Gains */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Gains</Text>
        <View style={styles.earningsCard}>
          <View style={styles.earningsMain}>
            <Text style={styles.earningsLabel}>Total des gains</Text>
            <Text style={styles.earningsValue}>
              {formatCurrency(stats?.totalEarnings || 0)}
            </Text>
          </View>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsMonth}>
            <Text style={styles.earningsMonthLabel}>Ce mois-ci</Text>
            <Text style={styles.earningsMonthValue}>
              {formatCurrency(stats?.monthEarnings || 0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Statistiques principales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Performance</Text>
        <View style={styles.statsGrid}>
          {renderStatCard(
            'star',
            'Note moyenne',
            stats?.averageRating?.toFixed(1) || '0.0',
            `${stats?.totalReviews || 0} avis`,
            COLORS.warning
          )}
          {renderStatCard(
            'checkmark-done',
            'Travaux terminés',
            stats?.completedJobs || 0,
            `${completionRate}% de réussite`,
            COLORS.success
          )}
          {renderStatCard(
            'time',
            'Temps moyen',
            formatDuration(stats?.averageCompletionTime || 0),
            'par travail',
            COLORS.info
          )}
          {renderStatCard(
            'trending-up',
            'Ponctualité',
            `${stats?.onTimeCompletionRate || 0}%`,
            'à temps',
            COLORS.secondary
          )}
        </View>
      </View>

      {/* Devis actifs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Activité</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyQuotes')}>
            <Text style={styles.sectionLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <Ionicons name="document-text" size={24} color={COLORS.primary} />
            <View style={styles.activityContent}>
              <Text style={styles.activityLabel}>Devis actifs</Text>
              <Text style={styles.activityValue}>{stats?.activeQuotes || 0}</Text>
            </View>
          </View>
          <View style={styles.activityDivider} />
          <View style={styles.activityItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <View style={styles.activityContent}>
              <Text style={styles.activityLabel}>Taux d'acceptation</Text>
              <Text style={styles.activityValue}>{stats?.acceptanceRate || 0}%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Progression des objectifs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Objectifs du mois</Text>
        <View style={styles.goalsCard}>
          {renderPerformanceBar(
            'Travaux complétés',
            stats?.completedJobs || 0,
            20,
            COLORS.success
          )}
          {renderPerformanceBar(
            'Nouveaux clients',
            stats?.newClients || 0,
            10,
            COLORS.primary
          )}
          {renderPerformanceBar(
            'Note moyenne cible',
            Math.round((stats?.averageRating || 0) * 2),
            10,
            COLORS.warning
          )}
        </View>
      </View>

      {/* Actions rapides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Actions rapides</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('AvailableRequests')}
          >
            <Ionicons name="search" size={32} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Demandes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('MyQuotes')}
          >
            <Ionicons name="document-text" size={32} color={COLORS.secondary} />
            <Text style={styles.quickActionText}>Mes devis</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Conversations')}
          >
            <Ionicons name="chatbubbles" size={32} color={COLORS.info} />
            <Text style={styles.quickActionText}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={32} color={COLORS.warning} />
            <Text style={styles.quickActionText}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 40,
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
    backgroundColor: COLORS.primary,
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  earningsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  earningsMain: {
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.success,
  },
  earningsDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  earningsMonth: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsMonthLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  earningsMonthValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: (width - 48) / 2,
    maxWidth: (width - 48) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statIconContainer: {
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statSubValue: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  activityValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  activityDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  goalsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  performanceBarContainer: {
    marginBottom: 20,
  },
  performanceBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  performanceBarLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  performanceBarValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  performanceBarTrack: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  performancePercentage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: (width - 48) / 2,
    maxWidth: (width - 48) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
});

export default WorkerDashboardScreen;
