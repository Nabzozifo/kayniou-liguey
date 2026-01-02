import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const COLORS = {
  primary: '#4A90E2',
  secondary: '#50C878',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E0E0E0',
  warning: '#F39C12',
  danger: '#E74C3C',
  gold: '#FFD700',
};

const EvaluationScreen = ({ route, navigation }) => {
  const { missionId, workerId, workerName, workerPhoto } = route.params;

  // Critères d'évaluation avec poids
  const [ratings, setRatings] = useState({
    punctuality: 0, // 25%
    courtesy: 0, // 15%
    quality: 0, // 35%
    cleanliness: 0, // 15%
    professionalism: 0, // 10%
  });

  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const criteria = [
    {
      key: 'punctuality',
      label: 'Ponctualité',
      icon: 'time-outline',
      weight: 25,
      description: 'Arrivé à l\'heure convenue',
    },
    {
      key: 'courtesy',
      label: 'Courtoisie',
      icon: 'happy-outline',
      weight: 15,
      description: 'Poli et agréable',
    },
    {
      key: 'quality',
      label: 'Qualité du travail',
      icon: 'star-outline',
      weight: 35,
      description: 'Travail bien fait',
    },
    {
      key: 'cleanliness',
      label: 'Propreté',
      icon: 'brush-outline',
      weight: 15,
      description: 'A laissé le lieu propre',
    },
    {
      key: 'professionalism',
      label: 'Professionnalisme',
      icon: 'briefcase-outline',
      weight: 10,
      description: 'Comportement professionnel',
    },
  ];

  const setRating = (criteriaKey, value) => {
    setRatings((prev) => ({
      ...prev,
      [criteriaKey]: value,
    }));
  };

  const calculateWeightedScore = () => {
    let totalScore = 0;
    criteria.forEach((criterion) => {
      const rating = ratings[criterion.key];
      const weight = criterion.weight / 100;
      totalScore += rating * weight;
    });
    return totalScore.toFixed(1);
  };

  const handleSubmit = async () => {
    // Vérifier que tous les critères sont notés
    const allRated = criteria.every((criterion) => ratings[criterion.key] > 0);

    if (!allRated) {
      Alert.alert(
        'Évaluation incomplète',
        'Veuillez noter tous les critères avant de soumettre.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const weightedScore = calculateWeightedScore();

      const response = await api.post('/evaluations', {
        missionId,
        workerId,
        ratings,
        comment: comment.trim(),
        weightedScore: parseFloat(weightedScore),
      });

      if (response.data.success) {
        Alert.alert(
          'Merci!',
          'Votre évaluation a été enregistrée avec succès.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Erreur soumission évaluation:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'enregistrer l\'évaluation. Veuillez réessayer.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (criteriaKey, currentRating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(criteriaKey, star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={32}
              color={star <= currentRating ? COLORS.gold : COLORS.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const weightedScore = calculateWeightedScore();
  const allRated = criteria.every((criterion) => ratings[criterion.key] > 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Évaluer le Prestataire</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Worker Info */}
        <View style={styles.workerCard}>
          <View style={styles.workerInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.workerDetails}>
              <Text style={styles.workerName}>{workerName}</Text>
              <Text style={styles.missionLabel}>Mission terminée</Text>
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Votre évaluation aide à maintenir la qualité du service
          </Text>
        </View>

        {/* Criteria Ratings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notez chaque critère</Text>

          {criteria.map((criterion, index) => (
            <View key={criterion.key} style={styles.criterionCard}>
              <View style={styles.criterionHeader}>
                <View style={styles.criterionTitleRow}>
                  <Ionicons
                    name={criterion.icon}
                    size={24}
                    color={COLORS.primary}
                  />
                  <View style={styles.criterionTitleContainer}>
                    <Text style={styles.criterionLabel}>{criterion.label}</Text>
                    <Text style={styles.criterionDescription}>
                      {criterion.description}
                    </Text>
                  </View>
                  <View style={styles.weightBadge}>
                    <Text style={styles.weightText}>{criterion.weight}%</Text>
                  </View>
                </View>
              </View>

              {renderStars(criterion.key, ratings[criterion.key])}

              {/* Visual Weight Indicator */}
              <View style={styles.weightIndicatorContainer}>
                <View style={styles.weightIndicatorBar}>
                  <View
                    style={[
                      styles.weightIndicatorFill,
                      { width: `${criterion.weight}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Weighted Score Preview */}
        {allRated && (
          <View style={styles.scorePreviewCard}>
            <View style={styles.scorePreviewContent}>
              <Text style={styles.scorePreviewLabel}>Note globale calculée</Text>
              <View style={styles.scorePreviewValue}>
                <Text style={styles.scorePreviewNumber}>{weightedScore}</Text>
                <Text style={styles.scorePreviewMax}>/5.0</Text>
              </View>
              <Text style={styles.scorePreviewExplanation}>
                Basée sur les poids de chaque critère
              </Text>
            </View>
            <View style={styles.scorePreviewIcon}>
              <Ionicons name="calculator-outline" size={40} color={COLORS.secondary} />
            </View>
          </View>
        )}

        {/* Comment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commentaire (optionnel)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Partagez votre expérience avec ce prestataire..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />
        </View>

        {/* Score Breakdown */}
        {allRated && (
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Détail du calcul</Text>
            {criteria.map((criterion) => {
              const rating = ratings[criterion.key];
              const contribution = (rating * criterion.weight) / 100;
              return (
                <View key={criterion.key} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>
                    {criterion.label} ({criterion.weight}%)
                  </Text>
                  <View style={styles.breakdownValues}>
                    <Text style={styles.breakdownRating}>{rating}/5</Text>
                    <Text style={styles.breakdownMultiplier}>×</Text>
                    <Text style={styles.breakdownWeight}>{criterion.weight}%</Text>
                    <Text style={styles.breakdownEquals}>=</Text>
                    <Text style={styles.breakdownContribution}>
                      {contribution.toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })}
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownTotalRow}>
              <Text style={styles.breakdownTotalLabel}>Note finale</Text>
              <Text style={styles.breakdownTotalValue}>{weightedScore}/5.0</Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!allRated || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!allRated || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Soumettre l'évaluation</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  workerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  missionLabel: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  criterionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  criterionHeader: {
    marginBottom: 12,
  },
  criterionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criterionTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  criterionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  criterionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  weightBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  weightText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
  },
  starButton: {
    padding: 4,
  },
  weightIndicatorContainer: {
    marginTop: 8,
  },
  weightIndicatorBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  weightIndicatorFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  scorePreviewCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scorePreviewContent: {
    flex: 1,
  },
  scorePreviewLabel: {
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 8,
    opacity: 0.9,
  },
  scorePreviewValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  scorePreviewNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
  },
  scorePreviewMax: {
    fontSize: 18,
    color: COLORS.white,
    marginLeft: 4,
    opacity: 0.8,
  },
  scorePreviewExplanation: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
  },
  scorePreviewIcon: {
    marginLeft: 16,
  },
  commentInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  breakdownCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  breakdownTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  breakdownValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownRating: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    width: 30,
    textAlign: 'right',
  },
  breakdownMultiplier: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginHorizontal: 4,
  },
  breakdownWeight: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    width: 35,
    textAlign: 'right',
  },
  breakdownEquals: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginHorizontal: 4,
  },
  breakdownContribution: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  breakdownTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  breakdownTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  breakdownTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
});

export default EvaluationScreen;
