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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, USER_TYPES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const { register, loading } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validation du nom complet
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Le nom complet est requis';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Le nom doit contenir au moins 3 caractères';
    }

    // Validation de l'email
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    // Validation du numéro de téléphone (format sénégalais)
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Le numéro de téléphone est requis';
    } else if (!/^(77|78|76|75|70)\d{7}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Numéro de téléphone invalide (ex: 771234567)';
    }

    // Validation du mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    // Validation de la confirmation du mot de passe
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    // Rediriger vers l'écran de sélection du type de profil
    navigation.navigate('ProfileTypeSelection', {
      userData: {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: '221' + formData.phoneNumber.replace(/\s/g, ''),
        password: formData.password,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>
            Rejoignez notre communauté
          </Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          {/* Nom complet */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              placeholder="Prénom et Nom"
              value={formData.fullName}
              onChangeText={(text) => handleInputChange('fullName', text)}
              autoCapitalize="words"
              editable={!loading}
            />
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="exemple@email.com"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Numéro de téléphone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <View style={styles.phoneContainer}>
              <Text style={styles.phonePrefix}>+221</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.phoneInput,
                  errors.phoneNumber && styles.inputError,
                ]}
                placeholder="77 123 45 67"
                value={formData.phoneNumber}
                onChangeText={(text) => handleInputChange('phoneNumber', text)}
                keyboardType="phone-pad"
                maxLength={9}
                editable={!loading}
              />
            </View>
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            )}
          </View>

          {/* Mot de passe */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.password && styles.inputError,
                ]}
                placeholder="••••••••"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIconText}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Confirmation du mot de passe */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.confirmPassword && styles.inputError,
                ]}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChangeText={(text) =>
                  handleInputChange('confirmPassword', text)
                }
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.eyeIconText}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Bouton d'inscription */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              loading && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.registerButtonText}>Continuer</Text>
            )}
          </TouchableOpacity>

          {/* Lien vers la connexion */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 10,
    paddingVertical: 12,
  },
  phoneInput: {
    flex: 1,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  eyeIconText: {
    fontSize: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
