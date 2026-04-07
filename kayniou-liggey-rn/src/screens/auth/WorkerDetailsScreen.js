/**
 * WorkerDetailsScreen — Vérification d'identité du travailleur
 *
 * Accessible depuis le profil → "Vérifier mon identité".
 * Un travailleur non vérifié peut parcourir l'app mais ne peut pas
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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const IDENTITY_TYPES = [
  { value: 'cin',      label: 'Carte Nationale d\'Identité', short: 'CIN',       icon: 'card-outline' },
  { value: 'passport', label: 'Passeport',                   short: 'Passeport', icon: 'book-outline' },
];

const STEPS = [
  { id: 1, title: 'Infos personnelles', icon: 'person-outline' },
  { id: 2, title: 'Pièce d\'identité',  icon: 'card-outline' },
  { id: 3, title: 'Confirmation',       icon: 'shield-checkmark-outline' },
];

const WorkerDetailsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState(1);

  const [formData, setFormData] = useState({
    dob:      '',
    address:  '',
    city:     '',
    idType:   'cin',
    idNumber: '',
  });

  const [docs, setDocs] = useState({ recto: false, verso: false, selfie: false });
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setFormData(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: null }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!formData.dob.trim()) e.dob = 'Date de naissance requise';
    else if (isNaN(new Date(formData.dob.trim()).getTime())) e.dob = 'Format invalide (AAAA-MM-JJ)';
    if (!formData.address.trim()) e.address = 'Adresse requise';
    if (!formData.city.trim())    e.city    = 'Ville requise';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!formData.idNumber.trim()) e.idNumber = 'Numéro de pièce requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.put(`/worker-profile/${user.id}`, {
        dob: formData.dob.trim(),
        address: `${formData.address.trim()}, ${formData.city.trim()}`,
        identityDocuments: {
          idType:    formData.idType,
          idNumber:  formData.idNumber.trim(),
          rectoURL:  docs.recto  ? 'pending_upload' : null,
          versoURL:  docs.verso  ? 'pending_upload' : null,
          selfieURL: docs.selfie ? 'pending_upload' : null,
        },
      });
      Alert.alert(
        '✅ Dossier soumis !',
        'Votre dossier est en cours de vérification. Vous serez notifié sous 24–48h.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Erreur', 'Impossible de soumettre le dossier. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const pickDoc = (key) => {
    Alert.alert('Ajouter une photo', `Photo "${key}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: () => setDocs(d => ({ ...d, [key]: true })) },
    ]);
  };

  // ── Step indicator ──────────────────────────────────────────────
  const renderSteps = () => (
    <View style={styles.stepRow}>
      {STEPS.map((s, i) => {
        const done    = step > s.id;
        const active  = step === s.id;
        return (
          <React.Fragment key={s.id}>
            <View style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                done   && styles.stepDone,
                active && styles.stepActive,
              ]}>
                {done
                  ? <Ionicons name="checkmark" size={14} color="#fff" />
                  : <Text style={[styles.stepNum, active && { color: '#fff' }]}>{s.id}</Text>
                }
              </View>
              <Text style={[styles.stepLabel, active && { color: COLORS.primary, fontWeight: '700' }]}>
                {s.title}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, done && { backgroundColor: COLORS.primary }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );

  // ── Field helper ────────────────────────────────────────────────
  const Field = ({ fkey, label, placeholder, opts = {} }) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[fkey] && styles.inputError]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={formData[fkey]}
        onChangeText={v => set(fkey, v)}
        {...opts}
      />
      {errors[fkey] ? <Text style={styles.fieldError}>{errors[fkey]}</Text> : null}
    </View>
  );

  // ── Step 1 ──────────────────────────────────────────────────────
  const renderStep1 = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="person" size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.cardTitle}>Informations personnelles</Text>
      </View>
      <Field
        fkey="dob"
        label="Date de naissance"
        placeholder="AAAA-MM-JJ"
        opts={{ keyboardType: 'numeric' }}
      />
      <Field fkey="address" label="Quartier / Rue" placeholder="Ex: Parcelles Assainies, Rue 10" />
      <Field fkey="city"    label="Ville"          placeholder="Ex: Dakar" />
    </View>
  );

  // ── Step 2 ──────────────────────────────────────────────────────
  const renderStep2 = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="card" size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.cardTitle}>Pièce d'identité</Text>
      </View>

      {/* Type selector */}
      <Text style={styles.label}>Type de document</Text>
      <View style={styles.typeRow}>
        {IDENTITY_TYPES.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[styles.typeCard, formData.idType === t.value && styles.typeCardSelected]}
            onPress={() => set('idType', t.value)}
          >
            <Ionicons
              name={t.icon}
              size={22}
              color={formData.idType === t.value ? '#fff' : '#6B7280'}
            />
            <Text style={[styles.typeLabel, formData.idType === t.value && { color: '#fff' }]}>
              {t.short}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Field fkey="idNumber" label="Numéro de pièce" placeholder="Ex: 1234567890" />

      {/* Doc uploads */}
      <Text style={styles.label}>Photos du document</Text>
      <View style={styles.docsRow}>
        {[
          { key: 'recto',  icon: 'card-outline',   label: 'Recto',  hint: 'Face avant' },
          { key: 'verso',  icon: 'card-outline',   label: 'Verso',  hint: 'Face arrière' },
          { key: 'selfie', icon: 'camera-outline', label: 'Selfie', hint: 'Avec la pièce' },
        ].map(({ key, icon, label, hint }) => (
          <TouchableOpacity
            key={key}
            style={[styles.docCard, docs[key] && styles.docCardDone]}
            onPress={() => pickDoc(key)}
          >
            <Ionicons
              name={docs[key] ? 'checkmark-circle' : icon}
              size={28}
              color={docs[key] ? '#10B981' : COLORS.primary}
            />
            <Text style={[styles.docLabel, docs[key] && { color: '#10B981' }]}>{label}</Text>
            <Text style={styles.docHint}>{docs[key] ? 'Ajouté ✓' : hint}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.photoNote}>📷 Photos lisibles, en couleur (JPG ou PNG)</Text>
    </View>
  );

  // ── Step 3 (confirmation) ───────────────────────────────────────
  const renderStep3 = () => (
    <View>
      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="shield-checkmark" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.summaryTitle}>Récapitulatif</Text>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Nom</Text>
            <Text style={styles.summaryValue}>{user?.fullName || '—'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date de naissance</Text>
            <Text style={styles.summaryValue}>{formData.dob}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Adresse</Text>
            <Text style={styles.summaryValue}>{formData.address}, {formData.city}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type de pièce</Text>
            <Text style={styles.summaryValue}>
              {IDENTITY_TYPES.find(t => t.value === formData.idType)?.label}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Numéro</Text>
            <Text style={styles.summaryValue}>{formData.idNumber}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Documents</Text>
            <Text style={styles.summaryValue}>
              {[docs.recto && 'Recto', docs.verso && 'Verso', docs.selfie && 'Selfie']
                .filter(Boolean).join(', ') || 'Aucun'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.timelineBanner}>
        <Ionicons name="time-outline" size={18} color="#0EA5E9" />
        <Text style={styles.timelineText}>
          Vérification sous <Text style={{ fontWeight: '700' }}>24 à 48h ouvrables</Text>.
          Vous serez notifié par notification.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="shield-checkmark" size={28} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Vérification d'identité</Text>
        <Text style={styles.heroSub}>Obligatoire pour postuler aux missions</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderSteps()}

        {/* Why banner */}
        {step === 1 && (
          <View style={styles.whyBanner}>
            <Ionicons name="information-circle" size={18} color="#0EA5E9" />
            <Text style={styles.whyText}>
              La vérification protège les clients et renforce votre crédibilité. Les travailleurs vérifiés sont{' '}
              <Text style={{ fontWeight: '700', color: '#0EA5E9' }}>mis en avant</Text> dans les résultats.
            </Text>
          </View>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Navigation buttons */}
        <View style={styles.btnRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
              <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
              <Text style={styles.backBtnText}>Retour</Text>
            </TouchableOpacity>
          )}

          {step < 3 ? (
            <TouchableOpacity style={[styles.nextBtn, step === 1 && { flex: 1 }]} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Continuer</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="checkmark-shield" size={20} color="#fff" />
                    <Text style={styles.submitBtnText}>Soumettre le dossier</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },

  // ── Hero ──────────────────────────────────────────────────────
  hero: {
    backgroundColor: COLORS.primary,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  scroll:  { flex: 1 },
  content: { padding: 16, paddingTop: 20 },

  // ── Steps ─────────────────────────────────────────────────────
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: { backgroundColor: COLORS.primary },
  stepDone:   { backgroundColor: '#10B981' },
  stepNum:    { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  stepLabel:  { fontSize: 10, color: '#9CA3AF', textAlign: 'center', maxWidth: 70 },
  stepLine:   { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginBottom: 16, marginHorizontal: 4 },

  // ── Why banner ─────────────────────────────────────────────────
  whyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
  },
  whyText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },

  // ── Card ───────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },

  // ── Fields ────────────────────────────────────────────────────
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FAFAFA',
  },
  inputError:  { borderColor: '#EF4444' },
  fieldError:  { fontSize: 12, color: '#EF4444', marginTop: 4 },

  // ── ID type chips ──────────────────────────────────────────────
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  typeCardSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280' },

  // ── Doc cards ──────────────────────────────────────────────────
  docsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  docCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  docCardDone: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  docLabel:    { fontSize: 12, fontWeight: '700', color: '#374151' },
  docHint:     { fontSize: 10, color: '#9CA3AF', textAlign: 'center' },
  photoNote:   { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', marginTop: 4 },

  // ── Summary ────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIcon:  {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
  summaryGrid:  { width: '100%', gap: 8 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  summaryLabel: { fontSize: 13, color: '#6B7280' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1, textAlign: 'right' },

  timelineBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  timelineText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },

  // ── Navigation buttons ─────────────────────────────────────────
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  nextBtnText:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default WorkerDetailsScreen;
