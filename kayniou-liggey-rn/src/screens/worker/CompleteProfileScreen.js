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
import { COLORS, SERVICE_CATEGORIES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { getCurrentRegion } from '../../config/regional';

const CompleteProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Étape 1: Métiers (max 2)
    categories: [],
    professionalSummary: '',
    yearsOfExperience: '',

    // Étape 2: Compétences
    skills: [],
    newSkill: '',
    skillLevel: 'intermediate',

    // Étape 3: Diplômes
    diplomas: [],
    newDiploma: {
      title: '',
      institution: '',
      year: '',
      field: '',
      level: 'licence',
    },

    // Étape 4: Certifications
    certifications: [],
    newCertification: {
      name: '',
      issuingOrganization: '',
      issueDate: '',
    },

    // Étape 5: Expérience professionnelle
    experiences: [],
    newExperience: {
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
    },

    // Étape 6: Tarifs
    hourlyRate: '',
    serviceRadius: '10',
  });

  const skillLevels = [
    { value: 'beginner', label: 'Débutant', icon: 'star-outline' },
    { value: 'intermediate', label: 'Intermédiaire', icon: 'star-half' },
    { value: 'expert', label: 'Expert', icon: 'star' },
  ];

  const diplomaLevels = [
    { value: 'bac', label: 'Baccalauréat' },
    { value: 'licence', label: 'Licence' },
    { value: 'master', label: 'Master' },
    { value: 'doctorat', label: 'Doctorat' },
    { value: 'autre', label: 'Autre' },
  ];

  const toggleCategory = (categoryId) => {
    const categories = [...formData.categories];
    const index = categories.indexOf(categoryId);

    if (index > -1) {
      categories.splice(index, 1);
    } else {
      if (categories.length >= 2) {
        Alert.alert(
          'Limite atteinte',
          'Vous ne pouvez sélectionner que 2 métiers maximum.\n\nCeci permet de vous concentrer sur vos domaines d\'expertise et de recevoir uniquement les demandes pertinentes.'
        );
        return;
      }
      categories.push(categoryId);
    }

    setFormData({ ...formData, categories });
  };

  const addSkill = () => {
    if (!formData.newSkill.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une compétence');
      return;
    }

    const skill = {
      name: formData.newSkill.trim(),
      level: formData.skillLevel,
    };

    setFormData({
      ...formData,
      skills: [...formData.skills, skill],
      newSkill: '',
      skillLevel: 'intermediate',
    });
  };

  const removeSkill = (index) => {
    const skills = [...formData.skills];
    skills.splice(index, 1);
    setFormData({ ...formData, skills });
  };

  const addDiploma = () => {
    const { title, institution, year } = formData.newDiploma;

    if (!title || !institution || !year) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const diploma = {
      ...formData.newDiploma,
      year: parseInt(formData.newDiploma.year),
    };

    setFormData({
      ...formData,
      diplomas: [...formData.diplomas, diploma],
      newDiploma: {
        title: '',
        institution: '',
        year: '',
        field: '',
        level: 'licence',
      },
    });
  };

  const removeDiploma = (index) => {
    const diplomas = [...formData.diplomas];
    diplomas.splice(index, 1);
    setFormData({ ...formData, diplomas });
  };

  const addCertification = () => {
    const { name, issuingOrganization } = formData.newCertification;

    if (!name || !issuingOrganization) {
      Alert.alert('Erreur', 'Veuillez remplir le nom et l\'organisme');
      return;
    }

    setFormData({
      ...formData,
      certifications: [...formData.certifications, formData.newCertification],
      newCertification: {
        name: '',
        issuingOrganization: '',
        issueDate: '',
      },
    });
  };

  const removeCertification = (index) => {
    const certifications = [...formData.certifications];
    certifications.splice(index, 1);
    setFormData({ ...formData, certifications });
  };

  const addExperience = () => {
    const { company, position, startDate } = formData.newExperience;

    if (!company || !position || !startDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setFormData({
      ...formData,
      experiences: [...formData.experiences, formData.newExperience],
      newExperience: {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
      },
    });
  };

  const removeExperience = (index) => {
    const experiences = [...formData.experiences];
    experiences.splice(index, 1);
    setFormData({ ...formData, experiences });
  };

  const handleNext = () => {
    // Validation par étape
    if (currentStep === 1) {
      if (formData.categories.length === 0) {
        Alert.alert('Erreur', 'Veuillez sélectionner au moins 1 métier');
        return;
      }
      if (!formData.professionalSummary.trim()) {
        Alert.alert('Erreur', 'Veuillez écrire un résumé professionnel');
        return;
      }
    }

    if (currentStep === 2) {
      if (formData.skills.length === 0) {
        Alert.alert('Erreur', 'Veuillez ajouter au moins 1 compétence');
        return;
      }
    }

    if (currentStep === 6) {
      if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
        Alert.alert('Erreur', 'Veuillez entrer un tarif horaire valide');
        return;
      }
    }

    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log('📤 Envoi profil complet...');

      const profileData = {
        categories: formData.categories,
        professionalSummary: formData.professionalSummary,
        yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
        skills: formData.skills,
        diplomas: formData.diplomas,
        certifications: formData.certifications,
        experiences: formData.experiences,
        hourlyRate: parseFloat(formData.hourlyRate),
        serviceRadius: parseFloat(formData.serviceRadius) || 10,
        isAvailable: true,
      };

      console.log('📊 Données profil:', profileData);

      const response = await api.post('/worker-profile', profileData);

      console.log('✅ Profil créé:', response.data);

      if (response.data.success) {
        Alert.alert(
          'Profil complété!',
          'Votre profil professionnel a été créé avec succès. Vous pouvez maintenant commencer à recevoir des demandes.',
          [
            {
              text: 'Commencer',
              onPress: () => navigation.replace('WorkerTabs'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Erreur création profil:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Impossible de créer le profil. Réessayez.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5, 6].map((step) => (
        <View
          key={step}
          style={[
            styles.stepDot,
            currentStep >= step && styles.stepDotActive,
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Vos métiers (max 2)</Text>
      <Text style={styles.stepSubtitle}>
        Choisissez jusqu'à 2 métiers. Vous ne verrez que les demandes correspondant à ces métiers.
      </Text>

      <View style={styles.categoriesGrid}>
        {SERVICE_CATEGORIES.map((category) => {
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
              <Ionicons
                name={category.icon}
                size={32}
                color={isSelected ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.categoryName,
                  isSelected && styles.categoryNameSelected,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.inputLabel}>Résumé professionnel *</Text>
      <TextInput
        style={[styles.textArea, { height: 100 }]}
        placeholder="Décrivez votre expertise, vos points forts..."
        value={formData.professionalSummary}
        onChangeText={(text) =>
          setFormData({ ...formData, professionalSummary: text })
        }
        multiline
        maxLength={500}
      />
      <Text style={styles.charCount}>
        {formData.professionalSummary.length}/500
      </Text>

      <Text style={styles.inputLabel}>Années d'expérience</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 5"
        value={formData.yearsOfExperience}
        onChangeText={(text) =>
          setFormData({ ...formData, yearsOfExperience: text })
        }
        keyboardType="numeric"
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Vos compétences</Text>
      <Text style={styles.stepSubtitle}>
        Ajoutez vos compétences principales avec leur niveau
      </Text>

      <View style={styles.addItemContainer}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Nom de la compétence"
          value={formData.newSkill}
          onChangeText={(text) => setFormData({ ...formData, newSkill: text })}
        />

        <View style={styles.levelSelector}>
          {skillLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.levelButton,
                formData.skillLevel === level.value && styles.levelButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, skillLevel: level.value })}
            >
              <Ionicons
                name={level.icon}
                size={20}
                color={
                  formData.skillLevel === level.value
                    ? COLORS.white
                    : COLORS.textSecondary
                }
              />
              <Text
                style={[
                  styles.levelButtonText,
                  formData.skillLevel === level.value &&
                    styles.levelButtonTextActive,
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.addButton} onPress={addSkill}>
          <Ionicons name="add" size={24} color={COLORS.white} />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.itemsList}>
        {formData.skills.map((skill, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemCardContent}>
              <Text style={styles.itemTitle}>{skill.name}</Text>
              <View style={styles.skillLevelBadge}>
                <Ionicons
                  name={
                    skillLevels.find((l) => l.value === skill.level)?.icon ||
                    'star'
                  }
                  size={14}
                  color={COLORS.warning}
                />
                <Text style={styles.skillLevelText}>
                  {skillLevels.find((l) => l.value === skill.level)?.label}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeSkill(index)}>
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Diplômes</Text>
      <Text style={styles.stepSubtitle}>
        Ajoutez vos diplômes (optionnel mais recommandé)
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Titre du diplôme *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Licence en Génie Civil"
          value={formData.newDiploma.title}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              newDiploma: { ...formData.newDiploma, title: text },
            })
          }
        />

        <Text style={styles.inputLabel}>Institution *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Université Mohammed VI"
          value={formData.newDiploma.institution}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              newDiploma: { ...formData.newDiploma, institution: text },
            })
          }
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.inputLabel}>Année *</Text>
            <TextInput
              style={styles.input}
              placeholder="2020"
              value={formData.newDiploma.year}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  newDiploma: { ...formData.newDiploma, year: text },
                })
              }
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.inputLabel}>Niveau</Text>
            <View style={styles.pickerContainer}>
              {diplomaLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.pickerOption,
                    formData.newDiploma.level === level.value &&
                      styles.pickerOptionActive,
                  ]}
                  onPress={() =>
                    setFormData({
                      ...formData,
                      newDiploma: { ...formData.newDiploma, level: level.value },
                    })
                  }
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      formData.newDiploma.level === level.value &&
                        styles.pickerOptionTextActive,
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.inputLabel}>Domaine d'étude</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Génie Civil, Architecture..."
          value={formData.newDiploma.field}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              newDiploma: { ...formData.newDiploma, field: text },
            })
          }
        />

        <TouchableOpacity style={styles.addButton} onPress={addDiploma}>
          <Ionicons name="add" size={24} color={COLORS.white} />
          <Text style={styles.addButtonText}>Ajouter diplôme</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.itemsList}>
        {formData.diplomas.map((diploma, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemCardContent}>
              <Text style={styles.itemTitle}>{diploma.title}</Text>
              <Text style={styles.itemSubtitle}>
                {diploma.institution} • {diploma.year}
              </Text>
              {diploma.field && (
                <Text style={styles.itemDetail}>{diploma.field}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => removeDiploma(index)}>
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Certifications</Text>
      <Text style={styles.stepSubtitle}>
        Ajoutez vos certifications professionnelles (optionnel)
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Nom de la certification *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Certification Électricien Agréé"
          value={formData.newCertification.name}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              newCertification: { ...formData.newCertification, name: text },
            })
          }
        />

        <Text style={styles.inputLabel}>Organisme émetteur *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Ordre National des Électriciens"
          value={formData.newCertification.issuingOrganization}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              newCertification: {
                ...formData.newCertification,
                issuingOrganization: text,
              },
            })
          }
        />

        <Text style={styles.inputLabel}>Date d'obtention</Text>
        <TextInput
          style={styles.input}
          placeholder="MM/AAAA"
          value={formData.newCertification.issueDate}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              newCertification: {
                ...formData.newCertification,
                issueDate: text,
              },
            })
          }
        />

        <TouchableOpacity style={styles.addButton} onPress={addCertification}>
          <Ionicons name="add" size={24} color={COLORS.white} />
          <Text style={styles.addButtonText}>Ajouter certification</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.itemsList}>
        {formData.certifications.map((cert, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemCardContent}>
              <Text style={styles.itemTitle}>{cert.name}</Text>
              <Text style={styles.itemSubtitle}>{cert.issuingOrganization}</Text>
              {cert.issueDate && (
                <Text style={styles.itemDetail}>{cert.issueDate}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => removeCertification(index)}>
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Expérience professionnelle</Text>
      <Text style={styles.stepSubtitle}>
        Ajoutez vos expériences professionnelles (optionnel)
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Entreprise *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Construction Khouribga"
          value={formData.newExperience.company}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              newExperience: { ...formData.newExperience, company: text },
            })
          }
        />

        <Text style={styles.inputLabel}>Poste *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Chef de chantier"
          value={formData.newExperience.position}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              newExperience: { ...formData.newExperience, position: text },
            })
          }
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.inputLabel}>Début *</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/AAAA"
              value={formData.newExperience.startDate}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  newExperience: { ...formData.newExperience, startDate: text },
                })
              }
            />
          </View>

          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.inputLabel}>Fin</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/AAAA"
              value={formData.newExperience.endDate}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  newExperience: { ...formData.newExperience, endDate: text },
                })
              }
              editable={!formData.newExperience.isCurrent}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() =>
            setFormData({
              ...formData,
              newExperience: {
                ...formData.newExperience,
                isCurrent: !formData.newExperience.isCurrent,
              },
            })
          }
        >
          <Ionicons
            name={
              formData.newExperience.isCurrent
                ? 'checkbox'
                : 'square-outline'
            }
            size={24}
            color={COLORS.primary}
          />
          <Text style={styles.checkboxLabel}>Poste actuel</Text>
        </TouchableOpacity>

        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.textArea, { height: 80 }]}
          placeholder="Décrivez vos responsabilités..."
          value={formData.newExperience.description}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              newExperience: { ...formData.newExperience, description: text },
            })
          }
          multiline
        />

        <TouchableOpacity style={styles.addButton} onPress={addExperience}>
          <Ionicons name="add" size={24} color={COLORS.white} />
          <Text style={styles.addButtonText}>Ajouter expérience</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.itemsList}>
        {formData.experiences.map((exp, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemCardContent}>
              <Text style={styles.itemTitle}>{exp.position}</Text>
              <Text style={styles.itemSubtitle}>{exp.company}</Text>
              <Text style={styles.itemDetail}>
                {exp.startDate} - {exp.isCurrent ? 'Présent' : exp.endDate}
              </Text>
              {exp.description && (
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {exp.description}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => removeExperience(index)}>
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tarifs et disponibilité</Text>
      <Text style={styles.stepSubtitle}>
        Configurez vos tarifs et votre zone d'intervention
      </Text>

      <Text style={styles.inputLabel}>Tarif horaire ({getCurrentRegion().currency}) *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 5000"
        value={formData.hourlyRate}
        onChangeText={(text) => setFormData({ ...formData, hourlyRate: text })}
        keyboardType="numeric"
      />

      <Text style={styles.inputLabel}>Rayon d'intervention (km)</Text>
      <TextInput
        style={styles.input}
        placeholder="10"
        value={formData.serviceRadius}
        onChangeText={(text) =>
          setFormData({ ...formData, serviceRadius: text })
        }
        keyboardType="numeric"
      />

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={24} color={COLORS.info} />
        <Text style={styles.infoText}>
          Vous recevrez uniquement les demandes correspondant à vos 2 métiers
          sélectionnés et situées dans votre rayon d'intervention.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Complétez votre profil</Text>
        <Text style={styles.headerSubtitle}>
          Étape {currentStep} sur 6
        </Text>
        {renderStepIndicator()}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, currentStep === 1 && { flex: 1 }]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === 6 ? 'Terminer' : 'Suivant'}
              </Text>
              {currentStep < 6 && (
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              )}
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
  header: {
    backgroundColor: COLORS.white,
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepDot: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 20,
  },
  categoryCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    margin: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  categoryCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryName: {
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 8,
  },
  categoryNameSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginBottom: 16,
  },
  addItemContainer: {
    marginBottom: 20,
  },
  levelSelector: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  levelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  levelButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  levelButtonText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  levelButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  itemsList: {
    marginTop: 8,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCardContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  itemDetail: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  itemDescription: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 4,
    lineHeight: 18,
  },
  skillLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  skillLevelText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  pickerContainer: {
    flexDirection: 'column',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerOptionActive: {
    backgroundColor: COLORS.primary + '20',
  },
  pickerOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  pickerOptionTextActive: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 15,
    color: COLORS.text,
    marginLeft: 8,
  },
  infoBox: {
    backgroundColor: COLORS.info + '20',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.info,
    marginLeft: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: 12,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  nextButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default CompleteProfileScreen;
