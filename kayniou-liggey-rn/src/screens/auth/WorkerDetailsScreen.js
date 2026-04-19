/**
 * WorkerDetailsScreen — Vérification d'identité du travailleur
 *
 * Accessible depuis le profil → "Vérifier mon identité".
 * Un travailleur non vérifié peut parcourir l'app mais ne peut pas
 * postuler à une mission tant que sa pièce d'identité n'est pas validée.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
  ActionSheetIOS,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// ── Field helper — defined OUTSIDE component to prevent keyboard dismiss on re-render ──
const Field = ({ fkey, label, placeholder, value, error, onChangeText, opts = {} }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, error && styles.inputError]}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      value={value}
      onChangeText={onChangeText}
      {...opts}
    />
    {error ? <Text style={styles.fieldError}>{error}</Text> : null}
  </View>
);

const MONTHS_CAL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
const DOB_MAX_YEAR = new Date().getFullYear() - 18; // 18+ obligatoire
const DOB_MIN_YEAR = 1920;

const DOBPicker = ({ value, onChange, error }) => {
  const [showCal, setShowCal] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const initYear = value ? parseInt(value.split('-')[0], 10) : DOB_MAX_YEAR - 7;
  const [calYear,  setCalYear]  = useState(initYear);
  const [calMonth, setCalMonth] = useState(value ? parseInt(value.split('-')[1], 10) - 1 : 0);

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay    = (y, m) => new Date(y, m, 1).getDay();

  const today = new Date(); today.setHours(0,0,0,0);

  const cells = [];
  const firstDay    = getFirstDay(calYear, calMonth);
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const selectDay = (day) => {
    if (!day) return;
    const d = new Date(calYear, calMonth, day);
    if (d > today) return; // pas dans le futur
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${calYear}-${mm}-${dd}`);
    setShowCal(false);
  };

  const isFuture   = (day) => { if (!day) return false; return new Date(calYear, calMonth, day) > today; };
  const isSelected = (day) => {
    if (!value || !day) return false;
    const [y, m, d] = value.split('-').map(Number);
    return y === calYear && (m - 1) === calMonth && d === day;
  };

  const prevMonth = () => {
    if (calMonth === 0) { if (calYear > DOB_MIN_YEAR) { setCalMonth(11); setCalYear(y => y - 1); } }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { if (calYear < DOB_MAX_YEAR) { setCalMonth(0); setCalYear(y => y + 1); } }
    else setCalMonth(m => m + 1);
  };

  const displayValue = value ? (() => {
    const [y, m, d] = value.split('-');
    return `${d} ${MONTHS_SHORT[parseInt(m,10)-1]} ${y}`;
  })() : null;

  const years = Array.from({ length: DOB_MAX_YEAR - DOB_MIN_YEAR + 1 }, (_, i) => DOB_MAX_YEAR - i);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>Date de naissance</Text>
      <TouchableOpacity
        style={[styles.input, styles.dobTrigger, error && styles.inputError]}
        onPress={() => setShowCal(true)}
        activeOpacity={0.7}
      >
        <Text style={{ color: displayValue ? '#111827' : '#9CA3AF', fontSize: 15 }}>
          {displayValue || 'Sélectionner une date de naissance'}
        </Text>
        <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
      </TouchableOpacity>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}

      {/* Calendar modal */}
      <Modal visible={showCal} transparent animationType="fade" onRequestClose={() => setShowCal(false)}>
        <TouchableOpacity style={styles.dobOverlay} activeOpacity={1} onPress={() => setShowCal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.dobCalBox}>
            {/* Header */}
            <View style={styles.dobCalHeader}>
              <TouchableOpacity onPress={prevMonth} style={styles.dobNavBtn}>
                <Ionicons name="chevron-back" size={20} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowYearPicker(true)} style={styles.dobMonthYearBtn}>
                <Text style={styles.dobMonthYearText}>{MONTHS_CAL[calMonth]} {calYear}</Text>
                <Ionicons name="chevron-down" size={14} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={nextMonth} style={styles.dobNavBtn}>
                <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            {/* Day labels */}
            <View style={styles.dobDayLabels}>
              {['Lu','Ma','Me','Je','Ve','Sa','Di'].map(d => (
                <Text key={d} style={styles.dobDayLabel}>{d}</Text>
              ))}
            </View>
            {/* Grid */}
            <View style={styles.dobGrid}>
              {cells.map((day, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.dobCell, isSelected(day) && styles.dobCellSel, isFuture(day) && styles.dobCellDisabled]}
                  onPress={() => selectDay(day)}
                  disabled={!day || isFuture(day)}
                >
                  {day ? (
                    <Text style={[styles.dobCellText, isSelected(day) && styles.dobCellTextSel, isFuture(day) && styles.dobCellTextDisabled]}>
                      {day}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Year picker modal */}
      <Modal visible={showYearPicker} transparent animationType="fade" onRequestClose={() => setShowYearPicker(false)}>
        <TouchableOpacity style={styles.dobOverlay} activeOpacity={1} onPress={() => setShowYearPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.dobCalBox, { paddingBottom: 8 }]}>
            <Text style={[styles.dobMonthYearText, { textAlign: 'center', marginBottom: 12 }]}>Choisir l'année</Text>
            <FlatList
              data={years}
              keyExtractor={(y) => String(y)}
              style={{ maxHeight: 280 }}
              renderItem={({ item: y }) => (
                <TouchableOpacity
                  style={[styles.dobYearItem, y === calYear && styles.dobYearItemSel]}
                  onPress={() => { setCalYear(y); setShowYearPicker(false); }}
                >
                  <Text style={[styles.dobYearText, y === calYear && styles.dobYearTextSel]}>{y}</Text>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

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
  const [loading, setLoading]       = useState(false);
  const [checkingStatus, setChecking] = useState(true);
  const [alreadyStatus, setAlreadyStatus] = useState(null); // null | 'verified' | 'pending' | 'rejected'
  const [rejectionReason, setRejectionReason] = useState(null);
  const [step, setStep]             = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/worker-profile/${user.id}`);
        const profile = res.data?.profile;
        if (profile?.isVerified) {
          setAlreadyStatus('verified');
        } else if (profile?.identityVerification?.rejectionReason) {
          setRejectionReason(profile.identityVerification.rejectionReason);
          setAlreadyStatus('rejected');
        } else if (profile?.identityVerification?.idNumber) {
          setAlreadyStatus('pending');
        }
      } catch { /* profile not found = first time */ }
      finally { setChecking(false); }
    })();
  }, []);

  const [formData, setFormData] = useState({
    dob:      '',
    address:  '',
    city:     '',
    idType:   'cin',
    idNumber: '',
  });

  // { recto: { uri, filename } | null, verso: ..., page: ... }
  const [docs, setDocs] = useState({ recto: null, verso: null, page: null });
  const [uploadingDoc, setUploadingDoc] = useState(null); // key en cours d'upload
  const [errors, setErrors] = useState({});
  const [detectingGPS, setDetectingGPS] = useState(false);

  const detectAddressFromGPS = async () => {
    try {
      setDetectingGPS(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Activez la localisation pour détecter votre adresse.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (place) {
        const street = [place.streetNumber, place.street].filter(Boolean).join(' ') || place.district || place.subregion || '';
        const city = place.city || place.subregion || place.region || '';
        if (street) set('address', street);
        if (city) set('city', city);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de détecter votre position. Saisissez-la manuellement.');
    } finally {
      setDetectingGPS(false);
    }
  };

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
    // Vérifier que les docs requis sont uploadés
    const required = formData.idType === 'cin' ? ['recto', 'verso'] : ['page'];
    const missing = required.filter(k => !docs[k]);
    if (missing.length > 0) {
      Alert.alert('Documents manquants', `Veuillez ajouter : ${missing.join(', ')}`);
      return;
    }
    setLoading(true);
    try {
      await api.put(`/worker-profile/${user.id}`, {
        dob: formData.dob.trim(),
        address: `${formData.address.trim()}, ${formData.city.trim()}`,
        identityDocuments: {
          idType:   formData.idType,
          idNumber: formData.idNumber.trim(),
          // URLs already stored by upload-doc route
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
    const launch = async (useCamera) => {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission refusée', 'Autorisez l\'accès dans les paramètres.');
        return;
      }
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.75, allowsEditing: true, aspect: [4, 3] })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75, allowsEditing: true, aspect: [4, 3] });
      if (result.canceled) return;

      const asset = result.assets[0];
      setUploadingDoc(key);
      try {
        const formData = new FormData();
        formData.append('doc', { uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: `${key}.jpg` });
        formData.append('docType', key);
        const res = await api.post(`/worker-profile/${user.id}/upload-doc`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          transformRequest: [(data) => data], // bypass axios JSON transform — let RN set boundary
        });
        if (res.data.success) {
          setDocs(d => ({ ...d, [key]: { uri: asset.uri, filename: res.data.filename } }));
        } else {
          Alert.alert('Erreur', res.data.message || 'Upload échoué');
        }
      } catch {
        Alert.alert('Erreur', 'Impossible d\'uploader la photo. Réessayez.');
      } finally {
        setUploadingDoc(null);
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Annuler', 'Prendre une photo', 'Choisir depuis la galerie'], cancelButtonIndex: 0 },
        (i) => { if (i === 1) launch(true); else if (i === 2) launch(false); }
      );
    } else {
      Alert.alert('Ajouter une photo', '', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Appareil photo', onPress: () => launch(true) },
        { text: 'Galerie', onPress: () => launch(false) },
      ]);
    }
  };

  const confirmSubmit = () => {
    Alert.alert(
      'Soumettre le dossier',
      'Êtes-vous sûr de vouloir soumettre votre dossier de vérification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Soumettre', onPress: handleSubmit },
      ]
    );
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

  // ── Step 1 ──────────────────────────────────────────────────────
  const renderStep1 = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="person" size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.cardTitle}>Informations personnelles</Text>
      </View>

      {/* Bouton GPS */}
      <TouchableOpacity
        style={styles.gpsBtn}
        onPress={detectAddressFromGPS}
        disabled={detectingGPS}
        activeOpacity={0.8}
      >
        {detectingGPS
          ? <ActivityIndicator size="small" color={COLORS.primary} />
          : <Ionicons name="location" size={16} color={COLORS.primary} />
        }
        <Text style={styles.gpsBtnText}>
          {detectingGPS ? 'Détection en cours…' : 'Utiliser ma position actuelle'}
        </Text>
      </TouchableOpacity>

      <DOBPicker
        value={formData.dob}
        error={errors.dob}
        onChange={v => set('dob', v)}
      />
      <Field
        fkey="address"
        label="Quartier / Rue"
        placeholder="Ex: Parcelles Assainies, Rue 10"
        value={formData.address}
        error={errors.address}
        onChangeText={v => set('address', v)}
      />
      <Field
        fkey="city"
        label="Ville"
        placeholder="Ex: Dakar"
        value={formData.city}
        error={errors.city}
        onChangeText={v => set('city', v)}
      />
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

      <Field
        fkey="idNumber"
        label="Numéro de pièce"
        placeholder="Ex: 1234567890"
        value={formData.idNumber}
        error={errors.idNumber}
        onChangeText={v => set('idNumber', v)}
      />

      {/* Doc uploads */}
      <Text style={styles.label}>
        {formData.idType === 'cin' ? 'Photos recto / verso' : 'Page principale du passeport'}
      </Text>
      <View style={styles.docsRow}>
        {(formData.idType === 'cin'
          ? [{ key: 'recto', label: 'Recto', hint: 'Face avant' }, { key: 'verso', label: 'Verso', hint: 'Face arrière' }]
          : [{ key: 'page',  label: 'Page',  hint: 'Page photo' }]
        ).map(({ key, label, hint }) => {
          const doc = docs[key];
          const loading = uploadingDoc === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.docCard, doc && styles.docCardDone]}
              onPress={() => pickDoc(key)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : doc ? (
                <Image source={{ uri: doc.uri }} style={styles.docThumb} />
              ) : (
                <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
              )}
              <Text style={[styles.docLabel, doc && { color: '#10B981' }]}>{label}</Text>
              <Text style={styles.docHint}>{loading ? 'Upload…' : doc ? 'Ajouté ✓' : hint}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.photoNote}>📷 Photos lisibles, en couleur — max 8 Mo</Text>
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
              {formData.idType === 'cin'
                ? `Recto ${docs.recto ? '✓' : '✗'} · Verso ${docs.verso ? '✓' : '✗'}`
                : `Page ${docs.page ? '✓' : '✗'}`}
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

  // ── Guard: already verified or pending ─────────────────────────
  if (checkingStatus) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (alreadyStatus === 'verified') {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <Ionicons name="shield-checkmark" size={64} color={COLORS.primary} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111', marginTop: 16, textAlign: 'center' }}>
          Identité déjà vérifiée
        </Text>
        <Text style={{ color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
          Votre badge bleu est déjà actif. Aucune nouvelle soumission n'est nécessaire.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ marginTop: 24, backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (alreadyStatus === 'pending') {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <Ionicons name="time" size={64} color="#F59E0B" />
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111', marginTop: 16, textAlign: 'center' }}>
          Demande en cours
        </Text>
        <Text style={{ color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
          Votre dossier est en cours de vérification. Vous serez notifié sous 24–48h.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ marginTop: 24, backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (alreadyStatus === 'rejected') {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <Ionicons name="close-circle" size={64} color="#EF4444" />
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111', marginTop: 16, textAlign: 'center' }}>
          Vérification refusée
        </Text>
        {rejectionReason ? (
          <Text style={{ color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
            Motif : {rejectionReason}
          </Text>
        ) : null}
        <Text style={{ color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
          Vous pouvez soumettre un nouveau dossier ci-dessous.
        </Text>
        <TouchableOpacity onPress={() => setAlreadyStatus(null)}
          style={{ marginTop: 24, backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Soumettre à nouveau</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ marginTop: 12 }}>
          <Text style={{ color: '#6B7280', fontWeight: '600' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
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
              onPress={confirmSubmit}
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
    </KeyboardAvoidingView>
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

  // ── GPS button ─────────────────────────────────────────────────
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E6F4F2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  gpsBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

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

  // ── DOB picker ────────────────────────────────────────────────
  dobTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  dobOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  dobCalBox: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, width: 320,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  dobCalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  dobMonthYearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dobMonthYearText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  dobNavBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  dobDayLabels: { flexDirection: 'row', marginBottom: 6 },
  dobDayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' },
  dobGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dobCell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  dobCellSel: { backgroundColor: '#3B82F6' },
  dobCellDisabled: { opacity: 0.25 },
  dobCellText: { fontSize: 14, fontWeight: '500', color: '#111827' },
  dobCellTextSel: { color: '#fff', fontWeight: '700' },
  dobCellTextDisabled: { color: '#9CA3AF' },
  dobYearItem: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, marginBottom: 2 },
  dobYearItemSel: { backgroundColor: '#EFF6FF' },
  dobYearText: { fontSize: 15, color: '#374151', textAlign: 'center' },
  dobYearTextSel: { color: '#3B82F6', fontWeight: '700' },

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
  docThumb:    { width: 56, height: 44, borderRadius: 6, resizeMode: 'cover' },
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
