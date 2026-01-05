import React, { useState, useEffect, useCallback } from 'react';
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
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { getCurrentRegion } from '../../config/regional';

const CATEGORIES = [
  'plomberie',
  'electricite',
  'menuiserie',
  'maconnerie',
  'peinture',
  'carrelage',
  'jardinage',
  'nettoyage',
  'demenagement',
  'reparation',
  'installation',
  'climatisation',
];

// Map pour afficher les noms avec accents
const CATEGORY_LABELS = {
  'plomberie': 'Plomberie',
  'electricite': 'Électricité',
  'menuiserie': 'Menuiserie',
  'maconnerie': 'Maçonnerie',
  'peinture': 'Peinture',
  'carrelage': 'Carrelage',
  'jardinage': 'Jardinage',
  'nettoyage': 'Nettoyage',
  'demenagement': 'Déménagement',
  'reparation': 'Réparation',
  'installation': 'Installation',
  'climatisation': 'Climatisation',
};

const EditWorkerProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    categories: [],
    experience: '',
    description: '',
    motivation: '',
    skills: '',
    availability: 'full_time',
    hourlyRate: '',
    serviceRadius: 10,
  });

  const fetchProfile = useCallback(async () => {
    try {
      console.log('🔍 Chargement profil worker:', user.id);
      const response = await api.get(`/worker-profile/${user.id}`);

      if (response.data.success && response.data.profile) {
        const fetchedProfile = response.data.profile;
        console.log('📊 Profil chargé:', fetchedProfile);

        setProfile({
          categories: fetchedProfile.categories || [],
          experience: fetchedProfile.yearsOfExperience?.toString() || fetchedProfile.experience || '',
          description: fetchedProfile.professionalSummary || fetchedProfile.description || fetchedProfile.bio || '',
          motivation: fetchedProfile.motivation || '',
          skills: fetchedProfile.skills || '',
          availability: fetchedProfile.availability || 'full_time',
          hourlyRate: fetchedProfile.hourlyRate?.toString() || '',
          serviceRadius: fetchedProfile.serviceRadius || 10,
        });

        console.log('✅ État profil mis à jour');
      }
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
      // If 404, profile doesn't exist yet - that's ok
      if (error.response?.status !== 404) {
        Alert.alert('Erreur', 'Impossible de charger le profil');
      }
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const toggleCategory = (category) => {
    setProfile((prev) => {
      const categories = [...prev.categories];
      const index = categories.indexOf(category);

      if (index > -1) {
        categories.splice(index, 1);
      } else {
        if (categories.length >= 2) {
          Alert.alert('Limite atteinte', 'Vous pouvez sélectionner jusqu\'à 3 métiers');
          return prev;
        }
        categories.push(category);
      }

      return { ...prev, categories };
    });
  };

  const handleSave = async () => {
    // Validation
    if (profile.categories.length < 1) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un métier');
      return;
    }

    // Description is optional, but if provided, must be at least 20 characters
    if (profile.description && profile.description.trim().length > 0 && profile.description.trim().length < 20) {
      Alert.alert('Erreur', 'La description doit contenir au moins 20 caractères (ou laissez vide)');
      return;
    }

    if (!profile.experience) {
      Alert.alert('Erreur', 'Veuillez indiquer votre expérience');
      return;
    }

    setSaving(true);
    try {
      // 1. Update profile
      const response = await api.put(`/worker-profile/${user.id}`, {
        categories: profile.categories,
        experience: profile.experience,
        description: profile.description,
        motivation: profile.motivation,
        skills: profile.skills,
        availability: profile.availability,
        hourlyRate: parseFloat(profile.hourlyRate) || null,
        serviceRadius: profile.serviceRadius,
      });

      if (response.data.success) {
        // 2. Update location if permission granted
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });

            await api.put(`/worker-profile/${user.id}/location`, {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            });
            console.log('✅ Localisation mise à jour');
          } else {
            console.log('⚠️ Permission localisation refusée');
          }
        } catch (locationError) {
          console.error('⚠️ Erreur mise à jour localisation:', locationError);
          // Don't block profile update if location fails
        }

        Alert.alert('Succès', 'Profil mis à jour avec succès', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Categories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="briefcase" size={20} color={COLORS.primary} /> Métiers *
        </Text>
        <Text style={styles.sectionSubtitle}>
          Sélectionnez 2 à 3 métiers que vous maîtrisez
        </Text>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((category) => {
            const isSelected = profile.categories.includes(category);
            return (
              <TouchableOpacity
                key={category}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                onPress={() => toggleCategory(category)}
              >
                <Text
                  style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}
                  numberOfLines={1}
                >
                  {CATEGORY_LABELS[category] || category}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.hint}>
          {profile.categories.length}/2 métiers sélectionnés
        </Text>
      </View>

      {/* Experience */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="time" size={20} color={COLORS.primary} /> Expérience *
        </Text>
        <View style={styles.experienceOptions}>
          {['< 1 an', '1-3 ans', '3-5 ans', '5+ ans'].map((exp) => (
            <TouchableOpacity
              key={exp}
              style={[
                styles.experienceOption,
                profile.experience === exp && styles.experienceOptionSelected,
              ]}
              onPress={() => setProfile({ ...profile, experience: exp })}
            >
              <Text
                style={[
                  styles.experienceOptionText,
                  profile.experience === exp && styles.experienceOptionTextSelected,
                ]}
              >
                {exp}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="document-text" size={20} color={COLORS.primary} /> Description
        </Text>
        <Text style={styles.sectionSubtitle}>
          Décrivez vos compétences et services (optionnel)
        </Text>
        <TextInput
          style={[styles.textArea, profile.description.length >= 20 && styles.textAreaValid]}
          value={profile.description}
          onChangeText={(text) => setProfile({ ...profile, description: text })}
          placeholder="Ex: Je suis plombier professionnel avec 5 ans d'expérience. Je réalise tous types de travaux de plomberie..."
          placeholderTextColor={COLORS.textLight}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>
          {profile.description.length} caractères
        </Text>
      </View>

      {/* Motivation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="flame" size={20} color={COLORS.primary} /> Motivation
        </Text>
        <Text style={styles.sectionSubtitle}>
          Pourquoi les clients devraient-ils vous choisir ?
        </Text>
        <TextInput
          style={styles.textArea}
          value={profile.motivation}
          onChangeText={(text) => setProfile({ ...profile, motivation: text })}
          placeholder="Ex: Je suis ponctuel, professionnel et j'accorde une grande importance à la satisfaction client..."
          placeholderTextColor={COLORS.textLight}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Skills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="construct" size={20} color={COLORS.primary} /> Compétences Spécifiques
        </Text>
        <Text style={styles.sectionSubtitle}>
          Certifications, outils maîtrisés, etc.
        </Text>
        <TextInput
          style={styles.textArea}
          value={profile.skills}
          onChangeText={(text) => setProfile({ ...profile, skills: text })}
          placeholder="Ex: Certification professionnelle, soudure, installation sanitaire..."
          placeholderTextColor={COLORS.textLight}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Availability */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="calendar" size={20} color={COLORS.primary} /> Disponibilité
        </Text>
        <View style={styles.availabilityOptions}>
          {[
            { value: 'full_time', label: 'Temps plein' },
            { value: 'part_time', label: 'Temps partiel' },
            { value: 'weekends', label: 'Week-ends' },
            { value: 'flexible', label: 'Flexible' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.availabilityOption,
                profile.availability === option.value && styles.availabilityOptionSelected,
              ]}
              onPress={() => setProfile({ ...profile, availability: option.value })}
            >
              <Text
                style={[
                  styles.availabilityOptionText,
                  profile.availability === option.value && styles.availabilityOptionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Hourly Rate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="cash" size={20} color={COLORS.primary} /> Tarif Horaire (optionnel)
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={profile.hourlyRate}
            onChangeText={(text) => setProfile({ ...profile, hourlyRate: text })}
            placeholder="Ex: 5000"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
          />
          <Text style={styles.inputSuffix}>{getCurrentRegion().currency.code}/h</Text>
        </View>
      </View>

      {/* Service Radius */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="location" size={20} color={COLORS.primary} /> Rayon d'Intervention
        </Text>
        <Text style={styles.sectionSubtitle}>
          Distance maximale: {profile.serviceRadius} km
        </Text>
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => setProfile({ ...profile, serviceRadius: Math.max(5, profile.serviceRadius - 5) })}
          >
            <Ionicons name="remove" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.sliderValue}>
            <Text style={styles.sliderValueText}>{profile.serviceRadius} km</Text>
          </View>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => setProfile({ ...profile, serviceRadius: Math.min(50, profile.serviceRadius + 5) })}
          >
            <Ionicons name="add" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
            <Text style={styles.saveButtonText}>Enregistrer le Profil</Text>
          </>
        )}
      </TouchableOpacity>

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
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    minWidth: 100,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  categoryChipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  experienceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  experienceOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  experienceOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  experienceOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  experienceOptionTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    minHeight: 100,
  },
  textAreaValid: {
    borderColor: COLORS.success,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  availabilityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availabilityOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  availabilityOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  availabilityOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  availabilityOptionTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  inputSuffix: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderValue: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  sliderValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  bottomSpace: {
    height: 40,
  },
});

export default EditWorkerProfileScreen;
