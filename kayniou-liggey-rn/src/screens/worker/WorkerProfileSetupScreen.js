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
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { getCurrentRegion } from '../../config/regional';

const WorkerProfileSetupScreen = ({ navigation }) => {
  const { user, setUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    categories: [],
    skills: [],
    bio: '',
    hourlyRate: '',
    serviceRadius: '10',
    experience: '',
  });

  const [skillInput, setSkillInput] = useState({ name: '', level: 'intermediate' });

  const availableCategories = [
    { id: 'Plomberie', label: 'Plomberie', icon: 'water', color: COLORS.primary },
    { id: 'Électricité', label: 'Électricité', icon: 'flash', color: COLORS.warning },
    { id: 'Menuiserie', label: 'Menuiserie', icon: 'hammer', color: COLORS.secondary },
    { id: 'Maçonnerie', label: 'Maçonnerie', icon: 'cube', color: COLORS.error },
    { id: 'Peinture', label: 'Peinture', icon: 'color-palette', color: COLORS.accent },
    { id: 'Jardinage', label: 'Jardinage', icon: 'leaf', color: COLORS.success },
    { id: 'Nettoyage', label: 'Nettoyage', icon: 'sparkles', color: COLORS.info },
  ];

  const skillLevels = [
    { value: 'beginner', label: 'Débutant' },
    { value: 'intermediate', label: 'Intermédiaire' },
    { value: 'expert', label: 'Expert' },
  ];

  const toggleCategory = (categoryId) => {
    if (formData.categories.includes(categoryId)) {
      setFormData({
        ...formData,
        categories: formData.categories.filter((c) => c !== categoryId),
      });
    } else {
      setFormData({
        ...formData,
        categories: [...formData.categories, categoryId],
      });
    }
  };

  const addSkill = () => {
    if (!skillInput.name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom de la compétence');
      return;
    }

    setFormData({
      ...formData,
      skills: [...formData.skills, { ...skillInput }],
    });
    setSkillInput({ name: '', level: 'intermediate' });
  };

  const removeSkill = (index) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    });
  };

  const validateStep1 = () => {
    if (formData.categories.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une catégorie de service');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.skills.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une compétence');
      return false;
    }
    if (!formData.bio.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une description de votre profil');
      return false;
    }
    if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un tarif horaire valide');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.post('/worker-profile', {
        userId: user.id,
        categories: formData.categories,
        skills: formData.skills,
        bio: formData.bio,
        hourlyRate: parseFloat(formData.hourlyRate),
        serviceRadius: parseInt(formData.serviceRadius),
        experience: formData.experience,
      });

      if (response.data.success) {
        Alert.alert(
          'Succès',
          'Votre profil a été créé avec succès!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Update user context to trigger navigation to worker home
                setUser({ ...user, profileCompleted: true });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Erreur création profil:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de créer le profil');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="briefcase" size={48} color={COLORS.primary} />
        <Text style={styles.stepTitle}>Choisissez vos métiers</Text>
        <Text style={styles.stepSubtitle}>
          Sélectionnez les catégories de services que vous proposez
        </Text>
      </View>

      <View style={styles.categoriesGrid}>
        {availableCategories.map((category) => {
          const isSelected = formData.categories.includes(category.id);
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                isSelected && styles.categoryCardSelected,
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <View
                style={[
                  styles.categoryIconContainer,
                  { backgroundColor: isSelected ? category.color : COLORS.backgroundDark },
                ]}
              >
                <Ionicons
                  name={category.icon}
                  size={32}
                  color={isSelected ? COLORS.white : category.color}
                />
              </View>
              <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                {category.label}
              </Text>
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.selectedCount}>
        <Text style={styles.selectedCountText}>
          {formData.categories.length} catégorie{formData.categories.length > 1 ? 's' : ''} sélectionnée{formData.categories.length > 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Ionicons name="document-text" size={48} color={COLORS.primary} />
        <Text style={styles.stepTitle}>Complétez votre profil</Text>
        <Text style={styles.stepSubtitle}>
          Ajoutez des détails pour attirer plus de clients
        </Text>
      </View>

      {/* Bio */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          <Ionicons name="create" size={16} color={COLORS.textSecondary} /> Description de votre profil *
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.bio}
          onChangeText={(text) => setFormData({ ...formData, bio: text })}
          placeholder="Décrivez votre expérience et vos services..."
          placeholderTextColor={COLORS.textLight}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Skills */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          <Ionicons name="star" size={16} color={COLORS.textSecondary} /> Compétences *
        </Text>

        {/* Add skill form */}
        <View style={styles.skillInputContainer}>
          <TextInput
            style={[styles.input, styles.skillNameInput]}
            value={skillInput.name}
            onChangeText={(text) => setSkillInput({ ...skillInput, name: text })}
            placeholder="Ex: Installation électrique"
            placeholderTextColor={COLORS.textLight}
          />
          <View style={styles.skillLevelContainer}>
            {skillLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.levelChip,
                  skillInput.level === level.value && styles.levelChipActive,
                ]}
                onPress={() => setSkillInput({ ...skillInput, level: level.value })}
              >
                <Text
                  style={[
                    styles.levelChipText,
                    skillInput.level === level.value && styles.levelChipTextActive,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.addSkillButton} onPress={addSkill}>
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
            <Text style={styles.addSkillButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {/* Skills list */}
        <View style={styles.skillsList}>
          {formData.skills.map((skill, index) => (
            <View key={index} style={styles.skillChip}>
              <View style={styles.skillChipContent}>
                <Text style={styles.skillChipName}>{skill.name}</Text>
                <Text style={styles.skillChipLevel}>
                  {skillLevels.find((l) => l.value === skill.level)?.label}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeSkill(index)}>
                <Ionicons name="close-circle" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Hourly Rate */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          <Ionicons name="cash" size={16} color={COLORS.textSecondary} /> Tarif horaire ({getCurrentRegion().currency.code}) *
        </Text>
        <TextInput
          style={styles.input}
          value={formData.hourlyRate}
          onChangeText={(text) => setFormData({ ...formData, hourlyRate: text })}
          placeholder="Ex: 5000"
          placeholderTextColor={COLORS.textLight}
          keyboardType="numeric"
        />
      </View>

      {/* Service Radius */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          <Ionicons name="location" size={16} color={COLORS.textSecondary} /> Rayon d'intervention (km)
        </Text>
        <View style={styles.radiusSlider}>
          <Text style={styles.radiusValue}>{formData.serviceRadius} km</Text>
          <View style={styles.radiusButtons}>
            <TouchableOpacity
              style={styles.radiusButton}
              onPress={() =>
                setFormData({
                  ...formData,
                  serviceRadius: Math.max(5, parseInt(formData.serviceRadius) - 5).toString(),
                })
              }
            >
              <Ionicons name="remove" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radiusButton}
              onPress={() =>
                setFormData({
                  ...formData,
                  serviceRadius: Math.min(50, parseInt(formData.serviceRadius) + 5).toString(),
                })
              }
            >
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Experience (optional) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          <Ionicons name="time" size={16} color={COLORS.textSecondary} /> Années d'expérience (optionnel)
        </Text>
        <TextInput
          style={styles.input}
          value={formData.experience}
          onChangeText={(text) => setFormData({ ...formData, experience: text })}
          placeholder="Ex: 5 ans"
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: currentStep === 1 ? '50%' : '100%' },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Étape {currentStep} sur 2
        </Text>
      </View>

      {/* Content */}
      {currentStep === 1 ? renderStep1() : renderStep2()}

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep === 2 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep(1)}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, currentStep === 2 && styles.nextButtonFull]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === 1 ? 'Suivant' : 'Terminer'}
              </Text>
              <Ionicons
                name={currentStep === 1 ? 'arrow-forward' : 'checkmark'}
                size={20}
                color={COLORS.white}
              />
            </>
          )}
        </TouchableOpacity>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  categoryCardSelected: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.primaryLight,
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: COLORS.primary,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  selectedCount: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  skillInputContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  skillNameInput: {
    marginBottom: 12,
  },
  skillLevelContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  levelChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center',
  },
  levelChipActive: {
    backgroundColor: COLORS.primary,
  },
  levelChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  levelChipTextActive: {
    color: COLORS.white,
  },
  addSkillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addSkillButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  skillsList: {
    gap: 8,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skillChipContent: {
    flex: 1,
  },
  skillChipName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  skillChipLevel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  radiusSlider: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  radiusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  radiusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundDark,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
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
  nextButtonFull: {
    flex: 2,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default WorkerProfileSetupScreen;
