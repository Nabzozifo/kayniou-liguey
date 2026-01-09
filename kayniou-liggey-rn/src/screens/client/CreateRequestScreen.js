import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SERVICE_CATEGORIES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { getCurrentRegion } from '../../config/regional';

const CreateRequestScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categories: [],
    urgency: 'medium',
    estimatedBudget: '',
    mode: 'auction',
    location: null,
    address: '',
    preferredDate: null,
    invitedWorkerIds: [], // Pour enchère privée
  });

  const urgencyLevels = [
    { value: 'low', label: 'Faible', icon: 'time-outline', color: COLORS.info },
    { value: 'medium', label: 'Moyenne', icon: 'alert-circle-outline', color: COLORS.warning },
    { value: 'high', label: 'Urgente', icon: 'alert-outline', color: COLORS.error },
  ];

  const requestModes = [
    {
      value: 'direct_hire',
      label: 'Direct',
      description: 'Assignez directement à un travailleur',
      icon: 'person-outline'
    },
    {
      value: 'auction',
      label: 'Enchères Publiques',
      description: 'Recevez plusieurs devis et choisissez',
      icon: 'people-outline'
    },
    {
      value: 'private_auction',
      label: 'Enchère Privée',
      description: 'Workers ne voient que leur propre devis',
      icon: 'eye-off-outline'
    },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre localisation pour créer la demande');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const formattedAddress = [
        address.street,
        address.city,
        address.region,
      ].filter(Boolean).join(', ');

      setFormData(prev => ({
        ...prev,
        location: {
          type: 'Point',
          coordinates: [location.coords.longitude, location.coords.latitude],
        },
        address: formattedAddress || 'Benguerir',
      }));
    } catch (error) {
      console.error('Erreur localisation:', error);
      Alert.alert('Erreur', 'Impossible de récupérer votre localisation');
    } finally {
      setLocationLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const validateStep1 = () => {
    if (!formData.title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'La description est requise');
      return false;
    }
    if (formData.categories.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une catégorie');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.estimatedBudget) {
      Alert.alert('Erreur', 'Le budget estimé est requis');
      return false;
    }
    if (!formData.location) {
      Alert.alert('Erreur', 'La localisation est requise');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    // Validation pour entente directe
    if (formData.mode === 'direct_hire' && formData.invitedWorkerIds.length !== 1) {
      Alert.alert('Erreur', 'Veuillez sélectionner exactement 1 worker pour l\'entente directe');
      return;
    }

    // Note: L'enchère privée ne nécessite pas de sélection de workers
    // Tous les workers peuvent voir la demande et soumettre des devis
    // Mais chaque worker ne voit que son propre devis

    setLoading(true);
    try {
      const requestData = {
        clientId: user.id,
        clientName: user.fullName,
        title: formData.title,
        description: formData.description,
        categories: formData.categories,
        urgency: formData.urgency,
        estimatedBudget: parseFloat(formData.estimatedBudget),
        mode: formData.mode,
        location: formData.location,
        address: formData.address,
        status: 'pending',
      };

      // Ajouter targetWorkerId si entente directe
      if (formData.mode === 'direct_hire') {
        requestData.targetWorkerId = formData.invitedWorkerIds[0];
      }

      // Ajouter invitedWorkerIds si enchère privée
      if (formData.mode === 'private_auction') {
        requestData.invitedWorkerIds = formData.invitedWorkerIds;
      }

      const response = await api.post('/service-requests', requestData);

      if (response.data.success) {
        Alert.alert(
          'Succès',
          'Votre demande a été créée avec succès',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Erreur création demande:', error);
      Alert.alert('Erreur', 'Impossible de créer la demande');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Informations de base</Text>

      {/* Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="document-text-outline" size={16} /> Titre de la demande
        </Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
          placeholder="Ex: Réparation de fuite d'eau"
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="reader-outline" size={16} /> Description détaillée
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Décrivez en détail le travail à effectuer..."
          placeholderTextColor={COLORS.textLight}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      {/* Categories */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="apps-outline" size={16} /> Catégories (sélectionnez au moins une)
        </Text>
        <View style={styles.categoriesGrid}>
          {SERVICE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                formData.categories.includes(category.id) && styles.categoryChipSelected,
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <Text style={styles.categoryEmoji}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  formData.categories.includes(category.id) && styles.categoryLabelSelected,
                ]}
              >
                {category.label}
              </Text>
              {formData.categories.includes(category.id) && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Urgency */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="speedometer-outline" size={16} /> Niveau d'urgence
        </Text>
        <View style={styles.urgencyContainer}>
          {urgencyLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.urgencyChip,
                formData.urgency === level.value && {
                  backgroundColor: level.color + '20',
                  borderColor: level.color,
                },
              ]}
              onPress={() => setFormData({ ...formData, urgency: level.value })}
            >
              <Ionicons
                name={level.icon}
                size={20}
                color={formData.urgency === level.value ? level.color : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.urgencyLabel,
                  formData.urgency === level.value && { color: level.color },
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Détails et budget</Text>

      {/* Budget */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="cash-outline" size={16} /> Budget estimé ({getCurrentRegion(user?.phoneNumber).currency.code})
        </Text>
        <TextInput
          style={styles.input}
          value={formData.estimatedBudget}
          onChangeText={(text) => setFormData({ ...formData, estimatedBudget: text })}
          placeholder="Ex: 50000"
          placeholderTextColor={COLORS.textLight}
          keyboardType="numeric"
        />
      </View>

      {/* Request Mode */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="swap-horizontal-outline" size={16} /> Mode de demande
        </Text>
        <View style={styles.modeContainer}>
          {requestModes.map((mode) => (
            <TouchableOpacity
              key={mode.value}
              style={[
                styles.modeCard,
                formData.mode === mode.value && styles.modeCardSelected,
              ]}
              onPress={() => setFormData({ ...formData, mode: mode.value })}
            >
              <View style={styles.modeHeader}>
                <Ionicons
                  name={mode.icon}
                  size={24}
                  color={formData.mode === mode.value ? COLORS.primary : COLORS.textSecondary}
                />
                {formData.mode === mode.value && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </View>
              <Text
                style={[
                  styles.modeLabel,
                  formData.mode === mode.value && styles.modeLabelSelected,
                ]}
              >
                {mode.label}
              </Text>
              <Text style={styles.modeDescription}>{mode.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Select Workers for Direct Hire */}
      {formData.mode === 'direct_hire' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="person-outline" size={16} /> Worker sélectionné
          </Text>
          <TouchableOpacity
            style={styles.selectWorkersButton}
            onPress={() => {
              if (formData.categories.length === 0) {
                Alert.alert('Attention', 'Veuillez d\'abord sélectionner au moins une catégorie de service');
                return;
              }
              navigation.navigate('SelectWorkers', {
                category: formData.categories[0],
                onSelect: (workerIds) => {
                  setFormData({ ...formData, invitedWorkerIds: workerIds });
                },
                maxSelection: 1, // UN SEUL worker pour entente directe
              });
            }}
          >
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={formData.invitedWorkerIds.length > 0 ? COLORS.primary : COLORS.textSecondary}
            />
            <View style={styles.selectWorkersText}>
              <Text style={styles.selectWorkersLabel}>
                {formData.invitedWorkerIds.length > 0
                  ? '1 worker sélectionné'
                  : 'Sélectionner un worker'}
              </Text>
              <Text style={styles.selectWorkersSubtext}>
                Contrat direct avec ce worker (classé par score)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {formData.invitedWorkerIds.length === 0 && (
            <Text style={styles.warningText}>
              ⚠️ Vous devez sélectionner 1 worker
            </Text>
          )}
        </View>
      )}

      {/* Info pour enchère privée */}
      {formData.mode === 'private_auction' && (
        <View style={styles.inputGroup}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              En mode enchère privée, tous les workers peuvent voir votre demande et soumettre des devis, mais chaque worker ne voit que son propre devis. Vous seul voyez tous les devis.
            </Text>
          </View>
        </View>
      )}

      {/* Location */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="location-outline" size={16} /> Localisation
        </Text>
        <View style={styles.locationCard}>
          {locationLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : formData.location ? (
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={24} color={COLORS.primary} />
              <View style={styles.locationText}>
                <Text style={styles.locationAddress}>{formData.address}</Text>
                {formData.location.coordinates && formData.location.coordinates.length === 2 && (
                  <Text style={styles.locationCoords}>
                    {formData.location.coordinates[1]?.toFixed(4)}, {formData.location.coordinates[0]?.toFixed(4)}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.noLocation}>Aucune localisation</Text>
          )}
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
            disabled={locationLoading}
          >
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
            <Text style={styles.locationButtonText}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Address override */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="home-outline" size={16} /> Adresse (optionnel)
        </Text>
        <TextInput
          style={styles.input}
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          placeholder="Précisez l'adresse si nécessaire"
          placeholderTextColor={COLORS.textLight}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / 2) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Étape {currentStep} sur 2</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentStep === 1 ? renderStep1() : renderStep2()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        )}

        {currentStep === 1 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Suivant</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Créer la demande</Text>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  categoryLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 8,
  },
  urgencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modeCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  modeCardSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  modeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  modeLabelSelected: {
    color: COLORS.primary,
  },
  modeDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  locationCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  locationText: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  noLocation: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginVertical: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  selectWorkersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  selectWorkersText: {
    flex: 1,
  },
  selectWorkersLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectWorkersSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.warning,
    marginTop: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 8,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
});

export default CreateRequestScreen;
