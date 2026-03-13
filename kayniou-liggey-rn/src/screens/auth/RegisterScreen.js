import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, USER_TYPES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { WEST_AFRICAN_COUNTRIES, getSupportedCountries } from '../../config/westAfricanCountries';
import api from '../../services/api';

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

  // État pour le pays détecté
  const [selectedCountry, setSelectedCountry] = useState(WEST_AFRICAN_COUNTRIES.SN); // Défaut: Sénégal
  const [detectingCountry, setDetectingCountry] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [countries] = useState(getSupportedCountries());

  // Auto-détection du pays au chargement de l'écran
  useEffect(() => {
    detectCountryFromGPS();
  }, []);

  const detectCountryFromGPS = async () => {
    try {
      setDetectingCountry(true);
      console.log('🌍 Tentative de détection du pays...');

      // Demander permission de géolocalisation
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.log('⚠️ Permission GPS refusée, utilisation pays par défaut (Sénégal)');
        return;
      }

      // Obtenir position GPS
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log('📍 Position GPS obtenue:', location.coords);

      // Appeler l'API de détection de pays
      const response = await api.post('/location/detect-country-gps', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (response.data.success && response.data.country) {
        const detectedCountry = WEST_AFRICAN_COUNTRIES[response.data.country.code];

        if (detectedCountry) {
          setSelectedCountry(detectedCountry);
          console.log(`✅ Pays détecté: ${detectedCountry.name} (${detectedCountry.code})`);
        }
      }

    } catch (error) {
      console.error('❌ Erreur détection pays:', error);
      // On garde le pays par défaut (Sénégal)
    } finally {
      setDetectingCountry(false);
    }
  };

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

    // Validation du numéro de téléphone (format dynamique selon pays)
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Le numéro de téléphone est requis';
    } else {
      const cleanPhone = formData.phoneNumber.replace(/\s/g, '');
      // Allow length match OR length+1 if user typed a leading 0
      const isValidLength = cleanPhone.length === selectedCountry.phoneLength ||
        (cleanPhone.length === selectedCountry.phoneLength + 1 && cleanPhone.startsWith('0'));

      if (!isValidLength) {
        newErrors.phoneNumber = `Numéro invalide (${selectedCountry.phoneLength} chiffres requis)`;
      }
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

    // Nettoyer le numéro (enlever les espaces et le 0 initial si présent)
    let cleanPhone = formData.phoneNumber.replace(/\s/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }

    // Préparer le numéro avec l'indicatif du pays sélectionné (Format E.164 required by Firebase: +212...)
    const phoneWithCountryCode = selectedCountry.dialCode + cleanPhone;

    console.log('📱 Sending OTP to:', phoneWithCountryCode);

    // Rediriger vers la vérification OTP
    navigation.navigate('OTP', {
      phoneNumber: phoneWithCountryCode, // Ensure backend/Firebase uses same format with +
      userData: {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: phoneWithCountryCode,
        password: formData.password,
        country: selectedCountry.code,
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
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={() => setShowCountrySelector(true)}
                disabled={loading || detectingCountry}
              >
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.phonePrefix}>{selectedCountry.dialCode}</Text>
                <Ionicons name="chevron-down" size={12} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.input,
                  styles.phoneInput,
                  errors.phoneNumber && styles.inputError,
                ]}
                placeholder={selectedCountry.phoneFormat.replace(/X/g, '0')}
                value={formData.phoneNumber}
                onChangeText={(text) => handleInputChange('phoneNumber', text)}
                keyboardType="phone-pad"
                maxLength={selectedCountry.phoneLength + 2} // +2 pour les espaces
                editable={!loading && !detectingCountry}
              />
            </View>
            {detectingCountry && (
              <View style={styles.detectingRow}>
                <Ionicons name="locate-outline" size={14} color={COLORS.primary} />
                <Text style={styles.detectingText}> Détection du pays...</Text>
              </View>
            )}
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
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color={COLORS.textSecondary}
                />
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
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color={COLORS.textSecondary}
                />
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

      {/* Modal de sélection du pays */}
      <Modal
        visible={showCountrySelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountrySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner le pays</Text>
              <TouchableOpacity onPress={() => setShowCountrySelector(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.countryList}>
              {countries.map((country) => {
                const countryData = WEST_AFRICAN_COUNTRIES[country.code];
                return (
                  <TouchableOpacity
                    key={country.code}
                    style={[
                      styles.countryItem,
                      selectedCountry.code === country.code && styles.countryItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedCountry(countryData);
                      setShowCountrySelector(false);
                      setFormData({ ...formData, phoneNumber: '' }); // Réinitialiser le numéro
                    }}
                  >
                    <Text style={styles.countryItemFlag}>{country.flag}</Text>
                    <View style={styles.countryItemInfo}>
                      <Text style={styles.countryItemName}>{country.name}</Text>
                      <Text style={styles.countryItemDialCode}>{country.dialCode}</Text>
                    </View>
                    {selectedCountry.code === country.code && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
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
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 6,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 4,
  },
  dropdownIcon: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  phoneInput: {
    flex: 1,
  },
  detectingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detectingText: {
    fontSize: 12,
    color: COLORS.primary,
    fontStyle: 'italic',
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
    padding: 2,
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
  // Styles pour le modal de sélection de pays
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
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
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  countryList: {
    maxHeight: 500,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  countryItemSelected: {
    backgroundColor: COLORS.primaryLight || COLORS.surface,
  },
  countryItemFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  countryItemInfo: {
    flex: 1,
  },
  countryItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  countryItemDialCode: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  countryItemCheck: {
    color: COLORS.primary,
  },
});

export default RegisterScreen;
