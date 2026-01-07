import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import api from '../../services/api';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';

const SmartSearchScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [location, setLocation] = useState(null);

  const handleSearch = async () => {
    if (description.trim().length < 10) {
      alert('Veuillez décrire votre besoin en au moins 10 caractères');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Obtenir la localisation actuelle
      let coords = location;
      if (!coords) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const currentLocation = await Location.getCurrentPositionAsync({});
          coords = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          };
          setLocation(coords);
        }
      }

      const response = await api.post('/worker-recommendations/semantic-search', {
        description: description.trim(),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        maxDistance: (user?.searchRadius || 50) * 1000, // Convertir km en mètres
        limit: 5,
      });

      if (response.data.success) {
        setResult(response.data);
      } else {
        // Cas où aucune catégorie n'a été détectée
        setResult(response.data);
      }
    } catch (error) {
      console.error('❌ Erreur recherche sémantique:', error);
      alert('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const renderWorkerCard = (worker, index) => (
    <TouchableOpacity
      key={worker._id}
      style={styles.workerCard}
      onPress={() => navigation.navigate('WorkerDetails', { workerId: worker._id })}
    >
      <View style={styles.workerHeader}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>

        {worker.photoURL ? (
          <Image source={{ uri: worker.photoURL }} style={styles.workerPhoto} />
        ) : (
          <View style={[styles.workerPhoto, styles.photoPlaceholder]}>
            <Text style={styles.photoText}>
              {worker.fullName?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{worker.fullName}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={COLORS.warning} />
            <Text style={styles.ratingText}>
              {worker.rating?.toFixed(1) || 'N/A'} ({worker.reviewCount || 0} avis)
            </Text>
          </View>
          {worker.matchedCategories && worker.matchedCategories.length > 0 && (
            <Text style={styles.categories} numberOfLines={1}>
              {worker.matchedCategories.join(', ')}
            </Text>
          )}
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreValue}>
            {worker.semanticScore?.toFixed(0)}
          </Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>
      </View>

      {worker.scoreBreakdown && (
        <View style={styles.scoreBreakdown}>
          <Text style={styles.breakdownTitle}>Détails du score :</Text>
          <View style={styles.breakdownGrid}>
            {worker.scoreBreakdown.category > 0 && (
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Catégorie</Text>
                <Text style={styles.breakdownValue}>
                  {worker.scoreBreakdown.category.toFixed(0)}
                </Text>
              </View>
            )}
            {worker.scoreBreakdown.rating > 0 && (
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Notation</Text>
                <Text style={styles.breakdownValue}>
                  {worker.scoreBreakdown.rating.toFixed(0)}
                </Text>
              </View>
            )}
            {worker.scoreBreakdown.experience > 0 && (
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Expérience</Text>
                <Text style={styles.breakdownValue}>
                  {worker.scoreBreakdown.experience.toFixed(0)}
                </Text>
              </View>
            )}
            {worker.scoreBreakdown.proximity > 0 && (
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Proximité</Text>
                <Text style={styles.breakdownValue}>
                  {worker.scoreBreakdown.proximity.toFixed(0)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => {
          // TODO: Naviguer vers la création de demande avec ce worker présélectionné
          navigation.navigate('CreateRequest', {
            preSelectedWorkerId: worker._id,
            preSelectedWorkerName: worker.fullName,
            mode: 'direct_hire',
          });
        }}
      >
        <Text style={styles.selectButtonText}>Sélectionner ce professionnel</Text>
        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderExamplePrompts = () => (
    <View style={styles.examplesContainer}>
      <Text style={styles.examplesTitle}>💡 Exemples de recherches :</Text>
      {[
        'J\'ai une fuite d\'eau au robinet de la cuisine',
        'Mon tableau électrique disjoncte souvent',
        'Je veux repeindre mon salon en blanc',
        'Besoin d\'un plombier urgent pour déboucher mes toilettes',
        'Installer une climatisation dans ma chambre',
      ].map((example, index) => (
        <TouchableOpacity
          key={index}
          style={styles.exampleChip}
          onPress={() => setDescription(example)}
        >
          <Text style={styles.exampleText}>{example}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={32} color={COLORS.primary} />
        <Text style={styles.title}>Recherche Intelligente</Text>
        <Text style={styles.subtitle}>
          Décrivez votre besoin en langage naturel et nous trouverons le meilleur professionnel pour vous
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ex: J'ai une fuite d'eau au robinet de la cuisine..."
          placeholderTextColor={COLORS.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.charCount}>{description.length}/500</Text>
      </View>

      <TouchableOpacity
        style={[styles.searchButton, loading && styles.searchButtonDisabled]}
        onPress={handleSearch}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="search" size={20} color={COLORS.white} />
            <Text style={styles.searchButtonText}>Trouver un professionnel</Text>
          </>
        )}
      </TouchableOpacity>

      {!result && renderExamplePrompts()}

      {result && !result.success && result.suggestions && (
        <View style={styles.errorContainer}>
          <Ionicons name="help-circle" size={48} color={COLORS.warning} />
          <Text style={styles.errorTitle}>{result.message}</Text>
          <Text style={styles.errorSubtitle}>Suggestions :</Text>
          {result.suggestions.map((suggestion, index) => (
            <Text key={index} style={styles.suggestionText}>
              • {suggestion}
            </Text>
          ))}
        </View>
      )}

      {result && result.success && (
        <View style={styles.resultContainer}>
          {result.analysis && (
            <View style={styles.analysisCard}>
              <Text style={styles.analysisTitle}>🔍 Analyse de votre demande</Text>
              <Text style={styles.analysisText}>
                <Text style={styles.analysisBold}>Catégories détectées: </Text>
                {result.analysis.detectedCategories.join(', ')}
              </Text>
              {result.analysis.urgency && (
                <Text style={styles.analysisText}>
                  <Text style={styles.analysisBold}>Urgence: </Text>
                  {result.analysis.urgency === 'high' ? 'Élevée' :
                   result.analysis.urgency === 'medium' ? 'Moyenne' : 'Faible'}
                </Text>
              )}
            </View>
          )}

          {result.recommendation && (
            <View style={styles.recommendationCard}>
              <Ionicons name="bulb" size={24} color={COLORS.primary} />
              <Text style={styles.recommendationText}>{result.recommendation}</Text>
            </View>
          )}

          <Text style={styles.resultsTitle}>
            {result.count} professionnel{result.count > 1 ? 's' : ''} trouvé{result.count > 1 ? 's' : ''}
          </Text>

          {result.workers?.map((worker, index) => renderWorkerCard(worker, index))}

          {result.count === 0 && (
            <View style={styles.noResultsContainer}>
              <Ionicons name="sad-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.noResultsText}>
                Aucun professionnel disponible pour le moment
              </Text>
              <Text style={styles.noResultsSubtext}>
                Essayez d'élargir votre zone de recherche ou de reformuler votre demande
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    textAlignVertical: 'top',
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  examplesContainer: {
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  exampleChip: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exampleText: {
    fontSize: 14,
    color: COLORS.text,
  },
  errorContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  resultContainer: {
    marginTop: 8,
  },
  analysisCard: {
    backgroundColor: COLORS.primaryLight || COLORS.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
  },
  analysisBold: {
    fontWeight: '600',
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    gap: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
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
  workerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  workerPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  photoPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.white,
  },
  workerInfo: {
    flex: 1,
    marginRight: 8,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    flexShrink: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  ratingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  categories: {
    fontSize: 12,
    color: COLORS.primary,
    flexShrink: 1,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  scoreBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  breakdownItem: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  selectButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});

export default SmartSearchScreen;
