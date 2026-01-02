import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const WorkerEvaluationsScreen = ({ route, navigation }) => {
  const { workerId } = route.params || {};
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [stats, setStats] = useState(null);

  const actualWorkerId = workerId || user?.id;

  useEffect(() => {
    fetchEvaluations();
  }, [actualWorkerId]);

  const fetchEvaluations = async () => {
    try {
      console.log('🔍 Chargement évaluations pour worker:', actualWorkerId);
      const response = await api.get(`/evaluations/worker/${actualWorkerId}`);

      console.log('📊 Evaluations response:', response.data);

      if (response.data.success) {
        setEvaluations(response.data.evaluations || []);
        setStats(response.data.stats || null);
      }
    } catch (error) {
      console.error('❌ Erreur chargement évaluations:', error);
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvaluations();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={16} color={COLORS.warning} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={16} color={COLORS.warning} />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={16} color={COLORS.textSecondary} />
        );
      }
    }

    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderCriteriaBar = (label, value) => {
    const percentage = (value / 5) * 100;
    let color = COLORS.error;
    if (percentage >= 80) color = COLORS.success;
    else if (percentage >= 60) color = COLORS.warning;

    return (
      <View style={styles.criteriaRow}>
        <Text style={styles.criteriaLabel}>{label}</Text>
        <View style={styles.criteriaBarContainer}>
          <View
            style={[
              styles.criteriaBarFill,
              { width: `${percentage}%`, backgroundColor: color }
            ]}
          />
        </View>
        <Text style={styles.criteriaValue}>{value.toFixed(1)}</Text>
      </View>
    );
  };

  const renderEvaluation = ({ item: evaluation }) => {
    if (!evaluation) return null;

    const clientName = evaluation.clientId?.fullName || 'Client inconnu';
    const requestTitle = evaluation.requestId?.title || 'Demande';

    return (
      <TouchableOpacity
        style={styles.evaluationCard}
        onPress={() => navigation.navigate('EvaluationDetails', { evaluationId: evaluation._id })}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {clientName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.clientName}>{clientName}</Text>
              <Text style={styles.requestTitle} numberOfLines={1}>
                {requestTitle}
              </Text>
            </View>
          </View>
          <Text style={styles.date}>{formatDate(evaluation.createdAt)}</Text>
        </View>

        {/* Note globale */}
        <View style={styles.ratingContainer}>
          {renderStars(evaluation.weightedScore || 0)}
          <Text style={styles.ratingText}>
            {(evaluation.weightedScore || 0).toFixed(1)}/5.0
          </Text>
        </View>

        {/* Critères */}
        <View style={styles.criteriaContainer}>
          {renderCriteriaBar('Qualité', evaluation.quality || 0)}
          {renderCriteriaBar('Ponctualité', evaluation.timeliness || 0)}
          {renderCriteriaBar('Communication', evaluation.communication || 0)}
          {renderCriteriaBar('Courtoisie', evaluation.professionalism || 0)}
          {renderCriteriaBar('Propreté', evaluation.cleanliness || 0)}
        </View>

        {/* Commentaire */}
        {evaluation.comment && (
          <View style={styles.commentContainer}>
            <Text style={styles.commentLabel}>Commentaire:</Text>
            <Text style={styles.commentText} numberOfLines={3}>
              {evaluation.comment}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Statistiques</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalEvaluations || 0}</Text>
            <Text style={styles.statLabel}>Évaluations</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {(stats.averageScore || 0).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Note moyenne</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {((stats.recommendationRate || 0) * 100).toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>Recommandations</Text>
          </View>
        </View>

        {stats.averageByCriteria && (
          <View style={styles.criteriaStatsContainer}>
            <Text style={styles.criteriaStatsTitle}>Moyennes par critère</Text>
            {renderCriteriaBar('Qualité', stats.averageByCriteria.quality || 0)}
            {renderCriteriaBar('Ponctualité', stats.averageByCriteria.timeliness || 0)}
            {renderCriteriaBar('Communication', stats.averageByCriteria.communication || 0)}
            {renderCriteriaBar('Courtoisie', stats.averageByCriteria.professionalism || 0)}
            {renderCriteriaBar('Propreté', stats.averageByCriteria.cleanliness || 0)}
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="star-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>Aucune évaluation</Text>
      <Text style={styles.emptySubtext}>
        Les évaluations apparaîtront ici après vos premières missions
      </Text>
    </View>
  );

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
      <FlatList
        data={evaluations}
        renderItem={renderEvaluation}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderStats}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          evaluations.length === 0 ? styles.emptyList : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
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
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  list: {
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
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  criteriaStatsContainer: {
    marginTop: 8,
  },
  criteriaStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  evaluationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  requestTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  criteriaContainer: {
    marginBottom: 12,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  criteriaLabel: {
    width: 100,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  criteriaBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  criteriaBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  criteriaValue: {
    width: 30,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  commentContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});

export default WorkerEvaluationsScreen;
