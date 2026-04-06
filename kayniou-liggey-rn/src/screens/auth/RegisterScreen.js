import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, USER_TYPES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { WEST_AFRICAN_COUNTRIES, getSupportedCountries } from '../../config/westAfricanCountries';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

// ── Animated field component ─────────────────────────────────────
const Field = ({ label, icon, error, children }) => {
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  return (
    <Animated.View style={[fStyles.wrap, { transform: [{ translateX: shake }] }]}>
      <Text style={fStyles.label}>
        <Ionicons name={icon} size={13} color={COLORS.textSecondary} />  {label}
      </Text>
      {children}
      {error ? <Text style={fStyles.error}>{error}</Text> : null}
    </Animated.View>
  );
};

const fStyles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 0.4 },
  error: { fontSize: 12, color: '#EF4444', marginTop: 5, fontWeight: '500' },
});

// ── Password strength ────────────────────────────────────────────
const strengthLevel = (pwd) => {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 6) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
};
const STRENGTH_LABELS = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
const STRENGTH_COLORS = ['', '#EF4444', '#F59E0B', '#10B981', '#0F7B6C'];

const RegisterScreen = ({ navigation }) => {
  const { loading } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(WEST_AFRICAN_COUNTRIES.SN);
  const [detectingCountry, setDetectingCountry] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countries] = useState(getSupportedCountries());

  // entrance animation
  const slideY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    detectCountry();
  }, []);

  const detectCountry = async () => {
    try {
      setDetectingCountry(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const res = await api.post('/location/detect-country-gps', {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (res.data.success && res.data.country) {
        const c = WEST_AFRICAN_COUNTRIES[res.data.country.code];
        if (c) setSelectedCountry(c);
      }
    } catch {}
    finally { setDetectingCountry(false); }
  };

  const set = (field, value) => {
    setFormData(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 3)
      e.fullName = 'Minimum 3 caractères requis';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
      e.email = 'Email invalide';
    const clean = formData.phoneNumber.replace(/\s/g, '');
    const validLen = clean.length === selectedCountry.phoneLength ||
      (clean.length === selectedCountry.phoneLength + 1 && clean.startsWith('0'));
    if (!formData.phoneNumber.trim() || !validLen)
      e.phoneNumber = `${selectedCountry.phoneLength} chiffres requis`;
    if (!formData.password || formData.password.length < 6)
      e.password = 'Minimum 6 caractères';
    if (formData.password !== formData.confirmPassword)
      e.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;
    let phone = formData.phoneNumber.replace(/\s/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    const phoneWithCode = selectedCountry.dialCode + phone;
    navigation.navigate('OTP', {
      phoneNumber: phoneWithCode,
      userData: {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: phoneWithCode,
        password: formData.password,
        country: selectedCountry.code,
      },
    });
  };

  const pwdStrength = strengthLevel(formData.password);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* ── Green hero arc ─────────────────────────────── */}
      <View style={styles.heroArc}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <Text style={styles.brand}>Göllè</Text>
          <Text style={styles.heroTitle}>Créer un compte</Text>
          <Text style={styles.heroSub}>Rejoignez +500 professionnels</Text>
        </View>
      </View>

      {/* ── Form card ──────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.card, { opacity, transform: [{ translateY: slideY }] }]}>

          {/* Nom */}
          <Field label="NOM COMPLET" icon="person-outline" error={errors.fullName}>
            <View style={[styles.inputRow, errors.fullName && styles.inputRowError]}>
              <TextInput
                style={styles.inputText}
                placeholder="Prénom et Nom"
                placeholderTextColor={COLORS.textLight}
                value={formData.fullName}
                onChangeText={v => set('fullName', v)}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
          </Field>

          {/* Email */}
          <Field label="EMAIL" icon="mail-outline" error={errors.email}>
            <View style={[styles.inputRow, errors.email && styles.inputRowError]}>
              <TextInput
                style={styles.inputText}
                placeholder="exemple@email.com"
                placeholderTextColor={COLORS.textLight}
                value={formData.email}
                onChangeText={v => set('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </Field>

          {/* Téléphone */}
          <Field label="TÉLÉPHONE" icon="call-outline" error={errors.phoneNumber}>
            <View style={[styles.inputRow, errors.phoneNumber && styles.inputRowError]}>
              <TouchableOpacity
                style={styles.flagBtn}
                onPress={() => setShowCountryModal(true)}
                disabled={loading || detectingCountry}
              >
                <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
                <Ionicons name="chevron-down" size={12} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <View style={styles.phoneDivider} />
              <TextInput
                style={[styles.inputText, { flex: 1 }]}
                placeholder={selectedCountry.phoneFormat.replace(/X/g, '0')}
                placeholderTextColor={COLORS.textLight}
                value={formData.phoneNumber}
                onChangeText={v => set('phoneNumber', v)}
                keyboardType="phone-pad"
                maxLength={selectedCountry.phoneLength + 2}
                editable={!loading && !detectingCountry}
              />
              {detectingCountry && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 10 }} />}
            </View>
          </Field>

          {/* Mot de passe */}
          <Field label="MOT DE PASSE" icon="lock-closed-outline" error={errors.password}>
            <View style={[styles.inputRow, errors.password && styles.inputRowError]}>
              <TextInput
                style={[styles.inputText, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textLight}
                value={formData.password}
                onChangeText={v => set('password', v)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(s => !s)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {/* Strength bar */}
            {formData.password.length > 0 && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthBars}>
                  {[1,2,3,4].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: i <= pwdStrength ? STRENGTH_COLORS[pwdStrength] : '#E5E7EB' },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[pwdStrength] }]}>
                  {STRENGTH_LABELS[pwdStrength]}
                </Text>
              </View>
            )}
          </Field>

          {/* Confirmation */}
          <Field label="CONFIRMER LE MOT DE PASSE" icon="shield-checkmark-outline" error={errors.confirmPassword}>
            <View style={[styles.inputRow, errors.confirmPassword && styles.inputRowError]}>
              <TextInput
                style={[styles.inputText, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textLight}
                value={formData.confirmPassword}
                onChangeText={v => set('confirmPassword', v)}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowConfirm(s => !s)} style={styles.eyeBtn}>
                <Ionicons name={showConfirm ? 'eye' : 'eye-off'} size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </Field>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.cta, loading && styles.ctaDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.ctaText}>Continuer</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Déjà membre ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Country modal ───────────────────────────────── */}
      <Modal visible={showCountryModal} animationType="slide" transparent onRequestClose={() => setShowCountryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Choisir un pays</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {countries.map(c => {
                const cd = WEST_AFRICAN_COUNTRIES[c.code];
                const selected = selectedCountry.code === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.countryRow, selected && styles.countryRowSelected]}
                    onPress={() => { setSelectedCountry(cd); setShowCountryModal(false); set('phoneNumber', ''); }}
                  >
                    <Text style={styles.cFlag}>{c.flag}</Text>
                    <View style={styles.cInfo}>
                      <Text style={styles.cName}>{c.name}</Text>
                      <Text style={styles.cDial}>{c.dialCode}</Text>
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  // ── Hero arc ──────────────────────────────────────────────
  heroArc: {
    backgroundColor: COLORS.primary,
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 48,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroContent: { paddingLeft: 4 },
  brand: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: 2, marginBottom: 4 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },

  // ── Scroll + card ─────────────────────────────────────────
  scroll: { paddingHorizontal: 16, paddingTop: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },

  // ── Input row ─────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: COLORS.background,
    minHeight: 52,
  },
  inputRowError: { borderColor: '#EF4444' },
  inputText: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 14 },
  eyeBtn: { padding: 6 },

  // ── Phone ─────────────────────────────────────────────────
  flagBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 10 },
  flagEmoji: { fontSize: 22 },
  dialCode: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  phoneDivider: { width: 1, height: 24, backgroundColor: COLORS.border, marginRight: 10 },

  // ── Password strength ─────────────────────────────────────
  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', minWidth: 40 },

  // ── CTA ───────────────────────────────────────────────────
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // ── Login link ────────────────────────────────────────────
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { fontSize: 14, color: COLORS.textSecondary },
  loginLink: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  // ── Country modal ─────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  countryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  countryRowSelected: { backgroundColor: '#F0FDF9' },
  cFlag: { fontSize: 28 },
  cInfo: { flex: 1 },
  cName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  cDial: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
});

export default RegisterScreen;
