import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api from '../../services/api';
import { formatCurrency, getCurrentRegion } from '../../config/regional';

const COLORS = {
  primary: '#4A90E2',
  secondary: '#50C878',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E0E0E0',
  warning: '#F39C12',
  success: '#50C878',
  gold: '#FFD700',
};

const NLPSearchScreen = ({ navigation }) => {
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchUserLocation();
  }, []);

  const fetchUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch (_) {
      // Localisation non disponible — recherche sans filtre géo
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/nlp/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('❌ Erreur chargement catégories:', error);
    }
  };

  const handleAnalyze = async () => {
    if (description.trim().length < 10) {
      Alert.alert(
        'Description trop courte',
        'Veuillez décrire votre problème en quelques phrases.'
      );
      return;
    }

    setAnalyzing(true);

    try {
      console.log('🤖 Analyse NLP:', description);

      const response = await api.post('/nlp/analyze', {
        description: description.trim(),
        location: userLocation, // { latitude, longitude } ou null si refusé
      });

      console.log('✅ Réponse NLP:', response.data);

      if (response.data.success) {
        setAnalysis(response.data.analysis);
        setSuggestions(response.data.suggestions);

        if (response.data.suggestions.length === 0) {
          Alert.alert(
            'Aucun résultat',
            'Aucun prestataire ne correspond à votre demande pour le moment.'
          );
        }
      }
    } catch (error) {
      console.error('❌ Erreur analyse:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Impossible d\'analyser votre demande'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectWorker = (worker) => {
    // Naviguer vers le profil du worker ou créer une demande directement
    navigation.navigate('WorkerProfile', {
      workerId: worker.workerId,
      prefilledDescription: description,
    });
  };

  const handleCreateRequest = () => {
    if (!analysis) {
      Alert.alert('Erreur', 'Veuillez d\'abord analyser votre demande');
      return;
    }

    // Naviguer vers création de demande avec données pré-remplies
    navigation.navigate('CreateRequest', {
      prefilled: {
        description,
        category: analysis.detectedCategories[0]?.category,
        urgency: analysis.urgency,
      },
    });
  };

  const handleUseExample = (example) => {
    setDescription(example);
  };

  const getUrgencyConfig = (urgency) => {
    switch (urgency) {
      case 'urgent':
        return {
          label: 'Urgent',
          color: COLORS.warning,
          icon: 'alert-circle',
        };
      case 'medium':
        return {
          label: 'Modéré',
          color: COLORS.primary,
          icon: 'time',
        };
      default:
        return {
          label: 'Flexible',
          color: COLORS.success,
          icon: 'checkmark-circle',
        };
    }
  };

  const renderCategoryExamples = () => {
    if (categories.length === 0) return null;

    return (
      <View style={styles.examplesSection}>
        <Text style={styles.examplesTitle}>Exemples par catégorie</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.examplesScrollContent}
        >
          {categories.map((category) => (
            <View key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Ionicons name={category.icon} size={24} color={COLORS.primary} />
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </View>
              {category.examples.map((example, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.exampleButton}
                  onPress={() => handleUseExample(example)}
                >
                  <Ionicons
                    name="bulb-outline"
                    size={14}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.exampleText}>{example}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderAnalysis = () => {
    if (!analysis) return null;

    const urgencyConfig = getUrgencyConfig(analysis.urgency);

    return (
      <View style={styles.analysisSection}>
        <Text style={styles.analysisSectionTitle}>Analyse de votre demande</Text>

        {/* Catégories détectées */}
        <View style={styles.analysisCard}>
          <Text style={styles.analysisCardTitle}>Catégories détectées</Text>
          {analysis.detectedCategories.map((cat, index) => (
            <View key={index} style={styles.detectedCategoryRow}>
              <View style={styles.detectedCategoryInfo}>
                <Text style={styles.detectedCategoryLabel}>
                  {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                </Text>
                <Text style={styles.detectedCategoryKeywords}>
                  Mots-clés: {cat.matchedKeywords.join(', ')}
                </Text>
              </View>
              <View style={styles.relevanceBar}>
                <View
                  style={[
                    styles.relevanceBarFill,
                    { width: `${Math.min(cat.relevance * 2, 100)}%` },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Urgence détectée */}
        <View style={[styles.urgencyCard, { borderColor: urgencyConfig.color }]}>
          <Ionicons name={urgencyConfig.icon} size={24} color={urgencyConfig.color} />
          <View style={styles.urgencyInfo}>
            <Text style={styles.urgencyLabel}>Urgence détectée</Text>
            <Text style={[styles.urgencyValue, { color: urgencyConfig.color }]}>
              {urgencyConfig.label}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSuggestions = () => {
    if (suggestions.length === 0) return null;

    return (
      <View style={styles.suggestionsSection}>
        <Text style={styles.suggestionsSectionTitle}>
          Prestataires recommandés ({suggestions.length})
        </Text>

        {suggestions.map((worker, index) => (
          <TouchableOpacity
            key={worker.workerId}
            style={styles.workerCard}
            onPress={() => handleSelectWorker(worker)}
          >
            {/* Badge rang */}
            {index === 0 && (
              <View style={styles.topMatchBadge}>
                <Ionicons name="trophy" size={14} color={COLORS.gold} />
                <Text style={styles.topMatchText}>TOP MATCH</Text>
              </View>
            )}

            {/* Header */}
            <View style={styles.workerHeader}>
              <View style={styles.workerAvatar}>
                <Text style={styles.workerAvatarText}>
                  {worker.workerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{worker.workerName}</Text>
                <View style={styles.workerMetaRow}>
                  {worker.workerRating > 0 && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={14} color={COLORS.warning} />
                      <Text style={styles.ratingText}>
                        {worker.workerRating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.missionsText}>
                    {worker.completedMissions} missions
                  </Text>
                </View>
              </View>
              <View style={styles.matchScoreBadge}>
                <Text style={styles.matchScoreValue}>{worker.matchScore}</Text>
                <Text style={styles.matchScoreLabel}>Score</Text>
              </View>
            </View>

            {/* Raisons du match */}
            <View style={styles.reasonsContainer}>
              <Text style={styles.reasonsTitle}>Pourquoi ce prestataire?</Text>
              {worker.reasons.map((reason, idx) => (
                <View key={idx} style={styles.reasonRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={COLORS.secondary}
                  />
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>

            {/* Services et tarif */}
            <View style={styles.workerFooter}>
              <View style={styles.servicesRow}>
                {worker.services.slice(0, 2).map((service, idx) => (
                  <View key={idx} style={styles.serviceTag}>
                    <Text style={styles.serviceTagText}>{service.category}</Text>
                  </View>
                ))}
                {worker.services.length > 2 && (
                  <Text style={styles.moreServicesText}>
                    +{worker.services.length - 2}
                  </Text>
                )}
              </View>
              {worker.hourlyRate > 0 && (
                <Text style={styles.hourlyRate}>
                  {formatCurrency(worker.hourlyRate)}/h
                </Text>
              )}
            </View>

            {/* Disponibilité */}
            {worker.isAvailable && (
              <View style={styles.availableBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.secondary} />
                <Text style={styles.availableText}>Disponible</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Bouton créer demande */}
        <TouchableOpacity
          style={styles.createRequestButton}
          onPress={handleCreateRequest}
        >
          <Ionicons name="add-circle" size={24} color={COLORS.white} />
          <Text style={styles.createRequestText}>
            Créer une demande avec cette description
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recherche Intelligente</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="bulb" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Décrivez votre problème en langage naturel, notre système trouvera les meilleurs prestataires
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Décrivez votre besoin</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Ex: Ma chaudière fait du bruit et l'eau ne chauffe plus..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={6}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              analyzing && styles.analyzeButtonDisabled,
            ]}
            onPress={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <ActivityIndicator color={COLORS.white} size="small" />
                <Text style={styles.analyzeButtonText}>Analyse en cours...</Text>
              </>
            ) : (
              <>
                <Ionicons name="search" size={20} color={COLORS.white} />
                <Text style={styles.analyzeButtonText}>Analyser et trouver</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Exemples */}
        {!analysis && renderCategoryExamples()}

        {/* Analyse */}
        {renderAnalysis()}

        {/* Suggestions */}
        {renderSuggestions()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  descriptionInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 150,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  analyzeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  examplesSection: {
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  examplesScrollContent: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    width: 280,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  exampleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  analysisSection: {
    marginBottom: 24,
  },
  analysisSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  analysisCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  analysisCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  detectedCategoryRow: {
    marginBottom: 12,
  },
  detectedCategoryInfo: {
    marginBottom: 6,
  },
  detectedCategoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  detectedCategoryKeywords: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  relevanceBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  relevanceBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  urgencyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  urgencyInfo: {
    flex: 1,
  },
  urgencyLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  urgencyValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsSection: {
    marginBottom: 24,
  },
  suggestionsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    position: 'relative',
  },
  topMatchBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
    elevation: 3,
  },
  topMatchText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B4513',
  },
  workerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workerAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  workerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  missionsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  matchScoreBadge: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  matchScoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  matchScoreLabel: {
    fontSize: 10,
    color: COLORS.white,
    marginTop: 2,
  },
  reasonsContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reasonsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
  },
  workerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  serviceTag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceTagText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  moreServicesText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  hourlyRate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  availableText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  createRequestButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createRequestText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default NLPSearchScreen;
