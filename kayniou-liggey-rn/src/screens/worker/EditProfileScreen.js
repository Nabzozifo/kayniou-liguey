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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { getCurrentRegion } from '../../config/regional';

const EditProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Info de base
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [serviceRadius, setServiceRadius] = useState('');

  // Compétences
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');

  // Expériences
  const [experiences, setExperiences] = useState([]);
  const [showAddExperience, setShowAddExperience] = useState(false);

  // Diplômes
  const [diplomas, setDiplomas] = useState([]);
  const [showAddDiploma, setShowAddDiploma] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      console.log('🔍 Chargement profil worker...');
      const response = await api.get(`/worker-profile/${user.id}`);
      console.log('✅ Profil chargé:', response.data);

      if (response.data.success) {
        const profile = response.data.profile;
        setBio(profile.bio || '');
        setHourlyRate(profile.hourlyRate?.toString() || '');
        setServiceRadius(profile.serviceRadius?.toString() || '');
        setSkills(profile.skills || []);
        setExperiences(profile.experiences || []);
        setDiplomas(profile.diplomas || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!bio.trim()) {
      Alert.alert('Attention', 'Veuillez ajouter une bio');
      return;
    }

    if (!hourlyRate || isNaN(hourlyRate)) {
      Alert.alert('Attention', 'Veuillez entrer un tarif horaire valide');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/worker-profile/${user.id}`, {
        bio,
        skills,
        diplomas,
        experiences,
        hourlyRate: parseFloat(hourlyRate),
        serviceRadius: parseFloat(serviceRadius) || 10,
      });

      if (response.data.success) {
        Alert.alert('Succès', 'Profil mis à jour avec succès', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil');
    } finally {
      setSaving(false);
    }
  };

  // Compétences
  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // Expériences
  const handleAddExperience = (experience) => {
    setExperiences([...experiences, experience]);
    setShowAddExperience(false);
  };

  const handleRemoveExperience = (index) => {
    Alert.alert('Confirmer', 'Supprimer cette expérience ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => setExperiences(experiences.filter((_, i) => i !== index)),
      },
    ]);
  };

  // Diplômes
  const handleAddDiploma = (diploma) => {
    setDiplomas([...diplomas, diploma]);
    setShowAddDiploma(false);
  };

  const handleRemoveDiploma = (index) => {
    Alert.alert('Confirmer', 'Supprimer ce diplôme ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => setDiplomas(diplomas.filter((_, i) => i !== index)),
      },
    ]);
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
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Section Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio / Présentation</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Présentez-vous en quelques mots..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Section Tarifs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarifs et Zone</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tarif horaire ({getCurrentRegion().currency.code})</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 5000"
              value={hourlyRate}
              onChangeText={setHourlyRate}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Rayon d'intervention (km)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 10"
              value={serviceRadius}
              onChangeText={setServiceRadius}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Section Compétences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compétences</Text>

          <View style={styles.skillsContainer}>
            {skills.map((skill, index) => (
              <View key={index} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
                <TouchableOpacity onPress={() => handleRemoveSkill(index)}>
                  <Ionicons name="close-circle" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.addSkillContainer}>
            <TextInput
              style={[styles.input, styles.addSkillInput]}
              placeholder="Nouvelle compétence"
              value={newSkill}
              onChangeText={setNewSkill}
              onSubmitEditing={handleAddSkill}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddSkill}>
              <Ionicons name="add" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Expériences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expériences professionnelles</Text>
            <TouchableOpacity
              style={styles.addIconButton}
              onPress={() => setShowAddExperience(true)}
            >
              <Ionicons name="add-circle" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {experiences.map((exp, index) => (
            <View key={index} style={styles.experienceCard}>
              <View style={styles.experienceHeader}>
                <View style={styles.experienceInfo}>
                  <Text style={styles.experienceCompany}>{exp.company}</Text>
                  <Text style={styles.experiencePosition}>{exp.position}</Text>
                  <Text style={styles.experiencePeriod}>{exp.period}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveExperience(index)}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
              {exp.description && (
                <Text style={styles.experienceDescription}>{exp.description}</Text>
              )}
            </View>
          ))}

          {experiences.length === 0 && (
            <Text style={styles.emptyText}>Aucune expérience ajoutée</Text>
          )}
        </View>

        {/* Section Diplômes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Diplômes et Formations</Text>
            <TouchableOpacity
              style={styles.addIconButton}
              onPress={() => setShowAddDiploma(true)}
            >
              <Ionicons name="add-circle" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {diplomas.map((diploma, index) => (
            <View key={index} style={styles.diplomaCard}>
              <View style={styles.diplomaHeader}>
                <View style={styles.diplomaInfo}>
                  <Text style={styles.diplomaTitle}>{diploma.degree}</Text>
                  <Text style={styles.diplomaField}>{diploma.field}</Text>
                  <Text style={styles.diplomaInstitution}>
                    {diploma.institution} • {diploma.year}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveDiploma(index)}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {diplomas.length === 0 && (
            <Text style={styles.emptyText}>Aucun diplôme ajouté</Text>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Bouton Sauvegarder */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal Ajouter Expérience */}
      {showAddExperience && (
        <ExperienceModal
          onClose={() => setShowAddExperience(false)}
          onAdd={handleAddExperience}
        />
      )}

      {/* Modal Ajouter Diplôme */}
      {showAddDiploma && (
        <DiplomaModal onClose={() => setShowAddDiploma(false)} onAdd={handleAddDiploma} />
      )}
    </View>
  );
};

// Modal Expérience
const ExperienceModal = ({ onClose, onAdd }) => {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [period, setPeriod] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    if (!company.trim() || !position.trim() || !period.trim()) {
      Alert.alert('Attention', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    onAdd({ company, position, period, description });
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Ajouter une expérience</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Entreprise *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom de l'entreprise"
              value={company}
              onChangeText={setCompany}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Poste *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Plombier, Électricien"
              value={position}
              onChangeText={setPosition}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Période *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2020 - 2023"
              value={period}
              onChangeText={setPeriod}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Décrivez vos responsabilités..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalAddButton} onPress={handleAdd}>
            <Text style={styles.modalAddText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Modal Diplôme
const DiplomaModal = ({ onClose, onAdd }) => {
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [field, setField] = useState('');
  const [year, setYear] = useState('');

  const handleAdd = () => {
    if (!institution.trim() || !degree.trim() || !field.trim() || !year.trim()) {
      Alert.alert('Attention', 'Veuillez remplir tous les champs');
      return;
    }

    onAdd({ institution, degree, field, year });
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Ajouter un diplôme</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Institution *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom de l'école/université"
              value={institution}
              onChangeText={setInstitution}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Diplôme *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: CAP, BTS, Licence..."
              value={degree}
              onChangeText={setDegree}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Spécialité *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Plomberie, Électricité"
              value={field}
              onChangeText={setField}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Année *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2020"
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalAddButton} onPress={handleAdd}>
            <Text style={styles.modalAddText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  addIconButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  addSkillContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  addSkillInput: {
    flex: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  experienceCard: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  experienceInfo: {
    flex: 1,
  },
  experienceCompany: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  experiencePosition: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  experiencePeriod: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  experienceDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginTop: 8,
  },
  diplomaCard: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  diplomaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  diplomaInfo: {
    flex: 1,
  },
  diplomaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  diplomaField: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  diplomaInstitution: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomSpace: {
    height: 100,
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalAddButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalAddText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default EditProfileScreen;
