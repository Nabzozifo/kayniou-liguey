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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { getCurrentRegion } from '../../config/regional';

const COLORS = {
  primary: '#4A90E2',
  secondary: '#50C878',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E0E0E0',
  warning: '#F39C12',
  danger: '#E74C3C',
};

const SubmitQuoteScreen = ({ route, navigation }) => {
  console.log('🔵 SubmitQuoteScreen - route.params:', route.params);

  const { requestId, requestData } = route.params || {};
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState(requestData || null);

  // Données du devis
  const [price, setPrice] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [description, setDescription] = useState('');
  const [servicesIncluded, setServicesIncluded] = useState(['']);
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    console.log('🔍 useEffect - requestData:', requestData ? 'présent' : 'absent');
    console.log('🔍 useEffect - requestId:', requestId);

    if (!requestData && requestId) {
      console.log('📥 Chargement détails demande...');
      fetchRequestDetails();
    } else if (requestData) {
      console.log('✅ requestData fourni, pas besoin de fetch');
      setLoading(false);
    } else {
      console.error('❌ Ni requestData ni requestId fourni!');
      setLoading(false);
    }
  }, []);

  const fetchRequestDetails = async () => {
    try {
      console.log('🌐 API call: /service-requests/' + requestId);
      const response = await api.get(`/service-requests/${requestId}`);

      console.log('📊 Response:', response.data);

      if (response.data.success) {
        console.log('✅ Request loaded:', response.data.serviceRequest?.title);
        setRequest(response.data.serviceRequest);
      } else {
        console.log('⚠️ Response success = false');
      }
    } catch (error) {
      console.error('❌ Erreur chargement demande:', error.response?.status, error.message);
      Alert.alert('Erreur', 'Impossible de charger les détails de la demande');
    } finally {
      console.log('🏁 Fin chargement, setLoading(false)');
      setLoading(false);
    }
  };

  const addServiceField = () => {
    setServicesIncluded([...servicesIncluded, '']);
  };

  const removeServiceField = (index) => {
    const newServices = servicesIncluded.filter((_, i) => i !== index);
    setServicesIncluded(newServices);
  };

  const updateService = (index, value) => {
    const newServices = [...servicesIncluded];
    newServices[index] = value;
    setServicesIncluded(newServices);
  };

  const validateForm = () => {
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un prix valide');
      return false;
    }

    if (!estimatedDuration || parseFloat(estimatedDuration) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer une durée estimée valide');
      return false;
    }

    if (!description || description.trim().length < 20) {
      Alert.alert('Erreur', 'La description doit contenir au moins 20 caractères');
      return false;
    }

    const validServices = servicesIncluded.filter((s) => s.trim().length > 0);
    if (validServices.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un service inclus');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Avertissement pour les enchères publiques
    if (request.mode === 'auction' && request.visibility === 'public') {
      Alert.alert(
        'Enchère Publique',
        'Attention: Cette demande est en mode enchère publique. Tous les autres prestataires pourront voir votre offre (prix et détails).\n\nVoulez-vous continuer?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Continuer',
            onPress: submitQuote,
          },
        ]
      );
    } else {
      submitQuote();
    }
  };

  const submitQuote = async () => {
    setSubmitting(true);

    try {
      console.log('📤 Soumission devis...');

      const validServices = servicesIncluded.filter((s) => s.trim().length > 0);

      const quoteData = {
        requestId,
        price: parseFloat(price),
        estimatedDuration: parseFloat(estimatedDuration),
        description: description.trim(),
        servicesIncluded: validServices,
        additionalNotes: additionalNotes.trim(),
      };

      const response = await api.post('/quotes', quoteData);

      console.log('✅ Devis soumis:', response.data);

      if (response.data.success) {
        Alert.alert(
          'Succès',
          request.mode === 'auction'
            ? `Votre devis a été soumis avec succès!\n\nMode: Enchère ${
                request.visibility === 'public' ? 'Publique' : 'Privée'
              }\n\n${
                request.visibility === 'public'
                  ? 'Les autres prestataires peuvent voir votre offre.'
                  : 'Votre offre est confidentielle.'
              }`
            : 'Votre devis a été soumis avec succès!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Erreur soumission devis:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Impossible de soumettre le devis'
      );
    } finally {
      setSubmitting(false);
    }
  };

  console.log('🔄 Render - loading:', loading, 'request:', request ? 'présent' : 'null');

  if (loading) {
    console.log('⏳ Affichage loading...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!request) {
    console.log('❌ Affichage erreur - request null');
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.danger} />
        <Text style={styles.errorText}>Demande introuvable</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log('✅ Affichage formulaire devis');

  const isPrivateAuction = request.mode === 'auction' && request.visibility === 'private';
  const isPublicAuction = request.mode === 'auction' && request.visibility === 'public';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Soumettre un Devis</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info demande */}
        <View style={styles.requestInfoCard}>
          <Text style={styles.requestTitle}>{request.title}</Text>
          <View style={styles.requestMetaRow}>
            <View style={styles.requestMetaItem}>
              <Ionicons name="pricetag-outline" size={16} color={COLORS.primary} />
              <Text style={styles.requestMetaText}>{request.category}</Text>
            </View>
            <View style={styles.requestMetaItem}>
              <Ionicons
                name={request.mode === 'direct' ? 'person-outline' : 'trophy-outline'}
                size={16}
                color={COLORS.secondary}
              />
              <Text style={styles.requestMetaText}>
                {request.mode === 'direct' ? 'Direct' : 'Enchères'}
              </Text>
            </View>
          </View>
        </View>

        {/* Badge mode enchère */}
        {request.mode === 'auction' && (
          <View
            style={[
              styles.auctionBanner,
              isPublicAuction
                ? styles.auctionBannerPublic
                : styles.auctionBannerPrivate,
            ]}
          >
            <Ionicons
              name={isPublicAuction ? 'eye' : 'eye-off'}
              size={20}
              color={isPublicAuction ? COLORS.warning : COLORS.secondary}
            />
            <View style={styles.auctionBannerContent}>
              <Text style={styles.auctionBannerTitle}>
                {isPublicAuction ? 'Enchère Publique' : 'Enchère Privée'}
              </Text>
              <Text style={styles.auctionBannerText}>
                {isPublicAuction
                  ? 'Les autres prestataires verront votre offre'
                  : 'Votre offre restera confidentielle'}
              </Text>
            </View>
          </View>
        )}

        {/* Formulaire */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Détails de votre offre</Text>

          {/* Prix */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Prix proposé <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="cash-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Ex: 25000"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
              <Text style={styles.inputUnit}>{getCurrentRegion().currency}</Text>
            </View>
          </View>

          {/* Durée */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Durée estimée <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Ex: 4"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
              />
              <Text style={styles.inputUnit}>heures</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Description de votre approche <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="Décrivez en détail comment vous comptez réaliser ce travail..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={6}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length} / 500 caractères</Text>
          </View>

          {/* Services inclus */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Services inclus <Text style={styles.required}>*</Text>
            </Text>
            {servicesIncluded.map((service, index) => (
              <View key={index} style={styles.serviceRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.secondary}
                />
                <TextInput
                  style={styles.serviceInput}
                  placeholder={`Service ${index + 1}`}
                  placeholderTextColor={COLORS.textSecondary}
                  value={service}
                  onChangeText={(text) => updateService(index, text)}
                />
                {servicesIncluded.length > 1 && (
                  <TouchableOpacity onPress={() => removeServiceField(index)}>
                    <Ionicons name="close-circle" size={24} color={COLORS.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity
              style={styles.addServiceButton}
              onPress={addServiceField}
            >
              <Ionicons name="add-circle" size={20} color={COLORS.primary} />
              <Text style={styles.addServiceText}>Ajouter un service</Text>
            </TouchableOpacity>
          </View>

          {/* Notes additionnelles */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes additionnelles (optionnel)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Informations complémentaires, conditions particulières..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={4}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Bouton soumission */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <ActivityIndicator color={COLORS.white} size="small" />
              <Text style={styles.submitButtonText}>Envoi en cours...</Text>
            </>
          ) : (
            <>
              <Ionicons name="send" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Soumettre le devis</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  requestInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  requestMetaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  requestMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestMetaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  auctionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  auctionBannerPublic: {
    backgroundColor: '#FFF4E5',
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  auctionBannerPrivate: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  auctionBannerContent: {
    flex: 1,
  },
  auctionBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  auctionBannerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  formSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: COLORS.danger,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 15,
    color: COLORS.text,
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  textArea: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  serviceInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  addServiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default SubmitQuoteScreen;
