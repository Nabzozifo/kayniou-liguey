import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';

const LoginScreen = ({ navigation }) => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide';
    }
    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    const result = await login({ email: email.trim().toLowerCase(), password });
    if (!result.success) {
      setErrors({ general: result.error });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Header band ─────────────────────────────── */}
      <View style={styles.headerBand}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.brandName}>Göllè</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Title ────────────────────────────────── */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Bon retour 👋</Text>
          <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>
        </View>

        {/* ── Form card ────────────────────────────── */}
        <View style={styles.card}>
          {/* General error */}
          {errors.general && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Adresse e-mail</Text>
            <View style={[styles.inputWrap, errors.email && styles.inputWrapError]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={errors.email ? COLORS.error : COLORS.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="exemple@email.com"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: null }); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>
            {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={[styles.inputWrap, errors.password && styles.inputWrapError]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={errors.password ? COLORS.error : COLORS.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: null }); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeToggle}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
          </View>

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Submit */}
          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            size="lg"
            style={styles.submitButton}
          />
        </View>

        {/* ── Sign up link ──────────────────────────── */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
            <Text style={styles.signupLink}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header band ──────────────────────────────────────────
  headerBand: {
    backgroundColor: COLORS.primary,
    paddingTop: 52,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },

  // ── Title ────────────────────────────────────────────────
  titleBlock: {
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    marginBottom: 6,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },

  // ── Card ─────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
    marginBottom: SPACING.lg,
  },

  // ── Error banner ─────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    fontSize: 13,
    color: COLORS.error,
    flex: 1,
  },

  // ── Fields ───────────────────────────────────────────────
  fieldWrap: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
  },
  inputWrapError: {
    borderColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.sm + 1,
    fontSize: 15,
    color: COLORS.text,
  },
  passwordInput: {
    paddingRight: 4,
  },
  eyeToggle: {
    padding: 6,
  },
  fieldError: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 5,
    marginLeft: 2,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  forgotText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: RADIUS.md,
  },

  // ── Sign-up link ─────────────────────────────────────────
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default LoginScreen;
