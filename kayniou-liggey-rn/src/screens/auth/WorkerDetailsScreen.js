/**
 * WorkerDetailsScreen — Vérification d'identité du travailleur
 *
 * Accessible depuis le profil (EditWorkerProfile → "Vérifier mon identité").
 * N'est PLUS utilisé dans le flux d'inscription.
 *
 * Un travailleur non vérifié peut parcourir l'app, mais ne peut pas
 * postuler à une mission tant que sa pièce d'identité n'est pas validée.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { SPACING, RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const IDENTITY_TYPES = [
  { value: 'cin',      label: 'Carte Nationale d\'Identité', short: 'CIN' },
  { value: 'passport', label: 'Passeport',                   short: 'PASSEPORT' },
];

const WorkerDetailsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    dob:      '',          // AAAA-MM-JJ
    address:  '',
    city:     '',
    idType:   'cin',
    idNumber: '',
  });

  const [docs, setDocs] = useState({ recto: false, verso: false, selfie: false });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.dob.trim()) {
      e.dob = 'La date de naissance est requise';
    } else {
      const d = new Date(formData.dob.trim());
      if (isNaN(d.getTime())) e.dob = 'Format invalide (AAAA-MM-JJ)';
    }
    if (!formData.address.trim()) e.address = 'L\'adresse est requise';
    if (!formData.city.trim())    e.city    = 'La ville est requise';
    if (!formData.idNumber.trim()) e.idNumber = 'Le numéro de pièce est requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        dob:     formData.dob.trim(),
        address: `${formData.address.trim()}, ${formData.city.trim()}`,
        identityDocuments: {
          idType:   formData.idType,
          idNumber: formData.idNumber.trim(),
          // Dans une future version : URLs réelles des documents uploadés
          rectoURL:  docs.recto  ? 'pending_upload' : null,
          versoURL:  docs.verso  ? 'pending_upload' : null,
          selfieURL: docs.selfie ? 'pending_upload' : null,
        },
      };

      await api.put(`/worker-profile/${user.id}`, payload);

      Alert.alert(
        'Documents soumis',
        'Votre dossier a été soumis pour vérification. Vous serez notifié sous 24–48h.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erreur vérification identité:', error);
      Alert.alert('Erreur', 'Impossible de soumettre le dossier. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const pickDoc = (key) => {
    Alert.alert('Document', `Ajouter la photo "${key}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'OK', onPress: () => setDocs({ ...docs, [key]: true }) },
    ]);
  };

  const field = (key, label, placeholder, opts = {}) => (
    <View style={styles.fieldWrap} key={key}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[key] && styles.inputError]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        value={formData[key]}
        onChangeText={(v) => {
          setFormData({ ...formData, [key]: v });
          setErrors({ ...errors, [key]: null });
        }}
        {...opts}
      />
      {errors[key] && <Text style={styles.fieldError}>{errors[key]}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Info banner ───────────────────────────────── */}
      <View style={styles.infoBanner}>
        <Ionicons name="shield-checkmark" size={22} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Pourquoi vérifier mon identité ?</Text>
          <Text style={styles.infoText}>
            La vérification est obligatoire pour postuler à des missions. Elle protège les clients et renforce votre crédibilité.
          </Text>
        </View>
      </View>

      {/* ── Personal info ─────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        {field('dob',     'Date de naissance',   'AAAA-MM-JJ', { keyboardType: 'numeric' })}
        {field('address', 'Quartier / Rue',       'Ex: Parcelles Assainies, Rue 10')}
        {field('city',    'Ville',                'Ex: Dakar')}
      </View>

      {/* ── Identity document ─────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pièce d'identité</Text>

        {/* Type selector */}
        <View style={styles.typeRow}>
          {IDENTITY_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeChip, formData.idType === t.value && styles.typeChipSelected]}
              onPress={() => setFormData({ ...formData, idType: t.value })}
            >
              <Text style={[styles.typeChipText, formData.idType === t.value && styles.typeChipTextSelected]}>
                {t.short}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {field('idNumber', 'Numéro de pièce', 'Ex: 1234567890')}

        {/* Photo uploads */}
        <Text style={styles.label}>Photos de la pièce</Text>
        <View style={styles.docsRow}>
          {[
            { key: 'recto',  icon: 'card-outline',    label: 'Recto' },
            { key: 'verso',  icon: 'card-outline',    label: 'Verso' },
            { key: 'selfie', icon: 'camera-outline',  label: 'Selfie' },
          ].map(({ key, icon, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.docCard, docs[key] && styles.docCardDone]}
              onPress={() => pickDoc(key)}
            >
              <Ionicons
                name={docs[key] ? 'checkmark-circle' : icon}
                size={26}
                color={docs[key] ? COLORS.success : COLORS.primary}
              />
              <Text style={styles.docLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.docHint}>
          Les photos doivent être lisibles et en couleur. Formats acceptés: JPG, PNG.
        </Text>
      </View>

      {/* ── Submit ────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="checkmark-shield" size={20} color={COLORS.white} />
            <Text style={styles.submitText}>Soumettre pour vérification</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.bottomNote}>
        La vérification prend généralement 24 à 48 heures ouvrables.
      </Text>

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },

  // ── Info banner ──────────────────────────────────────────
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accentLight,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },

  // ── Cards ────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // ── Fields ───────────────────────────────────────────────
  fieldWrap: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  fieldError: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },

  // ── ID type chips ────────────────────────────────────────
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  typeChip: {
    flex: 1,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  typeChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  typeChipTextSelected: {
    color: COLORS.white,
  },

  // ── Doc upload cards ─────────────────────────────────────
  docsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  docCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    gap: 6,
  },
  docCardDone: {
    borderColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  docLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  docHint: {
    fontSize: 11,
    color: COLORS.textLight,
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: 4,
  },

  // ── Submit ───────────────────────────────────────────────
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.primary,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  bottomNote: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default WorkerDetailsScreen;
