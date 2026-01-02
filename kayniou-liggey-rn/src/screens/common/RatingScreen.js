import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import api from '../../services/api';

const RatingScreen = ({ route, navigation }) => {
  const { worksiteId, worksiteTitle, reviewedId, reviewedName, reviewerType } = route.params;

  const [overallRating, setOverallRating] = useState(0);
  const [comment, setComment] = useState('');
  const [detailedRatings, setDetailedRatings] = useState({
    quality: 0,
    punctuality: 0,
    communication: 0,
    professionalism: 0,
  });
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (overallRating === 0) {
      Alert.alert('Erreur', 'Veuillez donner une note globale');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Erreur', 'Le commentaire doit contenir au moins 10 caractères');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/ratings', {
        worksiteId,
        reviewedId,
        overallRating,
        comment: comment.trim(),
        detailedRatings,
        wouldRecommend,
      });

      if (response.data.success) {
        Alert.alert(
          'Succès',
          'Votre évaluation a été enregistrée avec succès',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Erreur création rating:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Impossible de créer l\'évaluation'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, onPress) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onPress(star)}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? COLORS.warning : COLORS.textSecondary}
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDetailedRating = (label, key) => {
    return (
      <View style={styles.detailedRatingContainer}>
        <Text style={styles.detailedRatingLabel}>{label}</Text>
        <View style={styles.smallStarsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() =>
                setDetailedRatings((prev) => ({ ...prev, [key]: star }))
              }
            >
              <Ionicons
                name={star <= detailedRatings[key] ? 'star' : 'star-outline'}
                size={24}
                color={
                  star <= detailedRatings[key]
                    ? COLORS.warning
                    : COLORS.textSecondary
                }
                style={styles.smallStar}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="star" size={48} color={COLORS.warning} />
        <Text style={styles.title}>Évaluer {reviewedName}</Text>
        <Text style={styles.subtitle}>Chantier: {worksiteTitle}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Note globale *</Text>
        {renderStars(overallRating, setOverallRating)}
        {overallRating > 0 && (
          <Text style={styles.ratingText}>
            {overallRating === 1 && 'Très insatisfait'}
            {overallRating === 2 && 'Insatisfait'}
            {overallRating === 3 && 'Moyen'}
            {overallRating === 4 && 'Satisfait'}
            {overallRating === 5 && 'Très satisfait'}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Évaluation détaillée (optionnel)</Text>
        {renderDetailedRating('Qualité du travail', 'quality')}
        {renderDetailedRating('Ponctualité', 'punctuality')}
        {renderDetailedRating('Communication', 'communication')}
        {renderDetailedRating('Professionnalisme', 'professionalism')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Votre commentaire *</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Partagez votre expérience... (minimum 10 caractères)"
          placeholderTextColor={COLORS.textSecondary}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={5}
          maxLength={500}
        />
        <Text style={styles.characterCount}>{comment.length}/500</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommandation</Text>
        <View style={styles.recommendContainer}>
          <TouchableOpacity
            style={[
              styles.recommendButton,
              wouldRecommend && styles.recommendButtonActive,
            ]}
            onPress={() => setWouldRecommend(true)}
          >
            <Ionicons
              name="thumbs-up"
              size={24}
              color={wouldRecommend ? COLORS.white : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.recommendText,
                wouldRecommend && styles.recommendTextActive,
              ]}
            >
              Je recommande
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.recommendButton,
              !wouldRecommend && styles.recommendButtonActive,
            ]}
            onPress={() => setWouldRecommend(false)}
          >
            <Ionicons
              name="thumbs-down"
              size={24}
              color={!wouldRecommend ? COLORS.white : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.recommendText,
                !wouldRecommend && styles.recommendTextActive,
              ]}
            >
              Je ne recommande pas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
            <Text style={styles.submitButtonText}>Publier l'évaluation</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
  },
  star: {
    marginHorizontal: 4,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  detailedRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailedRatingLabel: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  smallStarsContainer: {
    flexDirection: 'row',
  },
  smallStar: {
    marginHorizontal: 2,
  },
  commentInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  recommendContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  recommendButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  recommendText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  recommendTextActive: {
    color: COLORS.white,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
});

export default RatingScreen;
