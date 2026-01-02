import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const EvaluationDetailsScreen = ({ route, navigation }) => {
  const { evaluationId } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    fetchEvaluationDetails();
  }, [evaluationId]);

  const fetchEvaluationDetails = async () => {
    try {
      console.log('🔍 Chargement évaluation:', evaluationId);
      const response = await api.get(`/evaluations/${evaluationId}`);

      console.log('✅ Evaluation response:', response.data);

      if (response.data.success) {
        const evalData = response.data.evaluation;
        setEvaluation(evalData);

        // Vérifier si l'utilisateur peut modifier (client qui a créé + moins de 24h)
        const isOwner = evalData.clientId?._id === user.id || evalData.clientId === user.id;
        const createdAt = new Date(evalData.createdAt);
        const now = new Date();
        const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

        setCanEdit(isOwner && hoursSinceCreation < 24);
      }
    } catch (error) {
      console.error('❌ Erreur chargement évaluation:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'évaluation');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditEvaluation', { evaluationId: evaluation._id });
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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
          <Ionicons key={i} name="star" size={32} color={COLORS.warning} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={32} color={COLORS.warning} />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={32} color={COLORS.textSecondary} />
        );
      }
    }

    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderCriteriaDetail = (label, value, description, icon) => {
    const percentage = (value / 5) * 100;
    let color = COLORS.error;
    if (percentage >= 80) color = COLORS.success;
    else if (percentage >= 60) color = COLORS.warning;

    return (
      <View style={styles.criteriaCard}>
        <View style={styles.criteriaHeader}>
          <View style={styles.criteriaHeaderLeft}>
            <Ionicons name={icon} size={24} color={color} />
            <View style={styles.criteriaHeaderText}>
              <Text style={styles.criteriaTitle}>{label}</Text>
              <Text style={styles.criteriaDescription}>{description}</Text>
            </View>
          </View>
          <View style={styles.criteriaScore}>
            <Text style={[styles.criteriaScoreText, { color }]}>
              {value.toFixed(1)}
            </Text>
            <Text style={styles.criteriaScoreMax}>/5.0</Text>
          </View>
        </View>
        <View style={styles.criteriaBarContainer}>
          <View
            style={[
              styles.criteriaBarFill,
              { width: `${percentage}%`, backgroundColor: color }
            ]}
          />
        </View>
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

  if (!evaluation) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>Évaluation non trouvée</Text>
      </View>
    );
  }

  const clientName = evaluation.clientId?.fullName || 'Client inconnu';
  const workerName = evaluation.workerId?.fullName || 'Prestataire inconnu';
  const requestTitle = evaluation.requestId?.title || 'Demande';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {workerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.workerName}>{workerName}</Text>
            <Text style={styles.requestTitle}>{requestTitle}</Text>
            <Text style={styles.date}>{formatDate(evaluation.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Note globale</Text>
          {renderStars(evaluation.weightedScore || 0)}
          <Text style={styles.scoreValue}>
            {(evaluation.weightedScore || 0).toFixed(1)}/5.0
          </Text>
        </View>

        <View style={styles.clientContainer}>
          <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.clientText}>Évalué par {clientName}</Text>
        </View>
      </View>

      {/* Critères détaillés */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détails de l'évaluation</Text>

        {renderCriteriaDetail(
          'Qualité du travail',
          evaluation.quality || 0,
          'Satisfaction globale du résultat',
          'ribbon-outline'
        )}

        {renderCriteriaDetail(
          'Ponctualité',
          evaluation.timeliness || 0,
          'Respect des délais et horaires',
          'time-outline'
        )}

        {renderCriteriaDetail(
          'Communication',
          evaluation.communication || 0,
          'Clarté et réactivité des échanges',
          'chatbubbles-outline'
        )}

        {renderCriteriaDetail(
          'Professionnalisme',
          evaluation.professionalism || 0,
          'Courtoisie et comportement',
          'briefcase-outline'
        )}

        {renderCriteriaDetail(
          'Propreté',
          evaluation.cleanliness || 0,
          'Propreté du chantier/espace de travail',
          'sparkles-outline'
        )}
      </View>

      {/* Commentaire */}
      {evaluation.comment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commentaire</Text>
          <View style={styles.commentCard}>
            <Text style={styles.commentText}>{evaluation.comment}</Text>
          </View>
        </View>
      )}

      {/* Recommandation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommandation</Text>
        <View style={styles.recommendationCard}>
          <Ionicons
            name={evaluation.wouldRecommend ? 'thumbs-up' : 'thumbs-down'}
            size={32}
            color={evaluation.wouldRecommend ? COLORS.success : COLORS.error}
          />
          <Text style={styles.recommendationText}>
            {evaluation.wouldRecommend
              ? 'Je recommande ce prestataire'
              : 'Je ne recommande pas ce prestataire'}
          </Text>
        </View>
      </View>

      {/* Bouton modification (si autorisé) */}
      {canEdit && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={COLORS.white} />
            <Text style={styles.editButtonText}>Modifier l'évaluation</Text>
          </TouchableOpacity>
          <Text style={styles.editNote}>
            Vous pouvez modifier cette évaluation pendant 24h
          </Text>
        </View>
      )}

      <View style={{ height: 32 }} />
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
    paddingHorizontal: 32,
    backgroundColor: COLORS.background,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    textAlign: 'center',
  },
  headerCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarLargeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  workerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  requestTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  clientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  criteriaCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  criteriaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  criteriaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  criteriaHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  criteriaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  criteriaDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  criteriaScore: {
    alignItems: 'flex-end',
  },
  criteriaScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  criteriaScoreMax: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  criteriaBarContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  criteriaBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  commentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  commentText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  recommendationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 16,
    flex: 1,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default EvaluationDetailsScreen;
