import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { SPACING, RADIUS, SHADOWS } from '../../theme';
import api from '../../services/api';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const shakeAnim = useRef(new Animated.Value(0)).current;

  // ─── Password strength ───────────────────────────────────────
  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
    return score; // 0-4
  };

  const strengthConfig = [
    { label: 'Très faible', color: '#EF4444' },
    { label: 'Faible',      color: '#F97316' },
    { label: 'Moyen',       color: '#F59E0B' },
    { label: 'Fort',        color: '#22C55E' },
    { label: 'Très fort',   color: '#16A34A' },
  ];

  const strength = getPasswordStrength(newPassword);
  const strengthInfo = strengthConfig[strength];

  // ─── Shake animation ─────────────────────────────────────────
  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ─── Validation ──────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!currentPassword) newErrors.currentPassword = 'Mot de passe actuel requis';
    if (!newPassword) {
      newErrors.newPassword = 'Nouveau mot de passe requis';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Au moins 6 caractères requis';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmation requise';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) {
      triggerShake();
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      Alert.alert(
        'Mot de passe mis à jour',
        'Votre mot de passe a été changé avec succès.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const message =
        error.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.';
      Alert.alert('Erreur', message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ─── Field component ─────────────────────────────────────────
  const PasswordField = ({
    label,
    value,
    onChangeText,
    showValue,
    onToggleShow,
    error,
    placeholder,
  }) => (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={error ? COLORS.error : COLORS.textSecondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            if (errors[label]) setErrors((prev) => ({ ...prev, [label]: undefined }));
          }}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={!showValue}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={onToggleShow} style={styles.eyeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons
            name={showValue ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Changer le mot de passe</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Intro card ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Sécurisez votre compte</Text>
            <Text style={styles.infoSub}>
              Utilisez un mot de passe fort d'au moins 6 caractères.
            </Text>
          </View>
        </View>

        {/* ── Form ── */}
        <Animated.View style={[styles.formCard, { transform: [{ translateX: shakeAnim }] }]}>
          <PasswordField
            label="currentPassword"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            showValue={showCurrent}
            onToggleShow={() => setShowCurrent((v) => !v)}
            error={errors.currentPassword}
            placeholder="Mot de passe actuel"
          />

          <PasswordField
            label="newPassword"
            value={newPassword}
            onChangeText={setNewPassword}
            showValue={showNew}
            onToggleShow={() => setShowNew((v) => !v)}
            error={errors.newPassword}
            placeholder="Nouveau mot de passe"
          />

          {/* ── Strength indicator ── */}
          {newPassword.length > 0 && (
            <View style={styles.strengthWrapper}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          strength >= level ? strengthInfo.color : COLORS.border,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: strengthInfo.color }]}>
                {strengthInfo.label}
              </Text>
            </View>
          )}

          <PasswordField
            label="confirmPassword"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            showValue={showConfirm}
            onToggleShow={() => setShowConfirm((v) => !v)}
            error={errors.confirmPassword}
            placeholder="Confirmer le nouveau mot de passe"
          />

          {/* Match indicator */}
          {confirmPassword.length > 0 && newPassword.length > 0 && (
            <View style={styles.matchRow}>
              <Ionicons
                name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={newPassword === confirmPassword ? COLORS.success : COLORS.error}
              />
              <Text
                style={[
                  styles.matchText,
                  { color: newPassword === confirmPassword ? COLORS.success : COLORS.error },
                ]}
              >
                {newPassword === confirmPassword
                  ? 'Les mots de passe correspondent'
                  : 'Les mots de passe ne correspondent pas'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ── Submit button ── */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color={COLORS.white} style={{ marginRight: SPACING.xs }} />
              <Text style={styles.submitButtonText}>Mettre à jour</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 52 : StatusBar.currentHeight + 8,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginHorizontal: SPACING.xs,
  },
  headerRight: {
    width: 40,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl ?? 48,
  },

  // Info card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xs,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  infoSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Form card
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },

  // Field
  fieldWrapper: {
    gap: SPACING.xxs,
  },
  fieldLabel: {
    display: 'none', // label is the placeholder; we hide the raw key
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    height: 52,
  },
  inputContainerError: {
    borderColor: COLORS.error,
    backgroundColor: '#FFF5F5',
  },
  inputIcon: {
    marginRight: SPACING.xs,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },
  eyeButton: {
    paddingLeft: SPACING.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
  },

  // Strength
  strengthWrapper: {
    marginTop: -SPACING.xs,
    gap: SPACING.xxs,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: RADIUS.full,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },

  // Match
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -SPACING.xs,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Submit
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    ...SHADOWS.primary,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});

export default ChangePasswordScreen;
