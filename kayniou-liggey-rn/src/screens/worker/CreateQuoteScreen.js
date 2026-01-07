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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { formatCurrency, getCurrentRegion } from '../../config/regional';

const CreateQuoteScreen = ({ route, navigation }) => {
  console.log('🔵 CreateQuoteScreen - route.params:', route.params);

  const { requestId, editMode, quoteData, quoteId } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [skillInput, setSkillInput] = useState('');

  const [formData, setFormData] = useState({
    price: '',
    estimatedDuration: '',
    description: '',
    servicesIncluded: [],
    additionalNotes: '',
  });

  useEffect(() => {
    fetchRequest();
    // Pre-fill form if in edit mode
    if (editMode && quoteData) {
      setFormData({
        price: quoteData.price?.toString() || '',
        estimatedDuration: quoteData.estimatedDuration?.toString() || '',
        description: quoteData.description || '',
        servicesIncluded: quoteData.servicesIncluded || [],
        additionalNotes: quoteData.additionalNotes || '',
      });
    }
  }, [requestId, editMode, quoteData]);

  useEffect(() => {
    // Set dynamic title based on mode
    navigation.setOptions({
      title: editMode ? 'Modifier le Devis' : 'Créer un Devis'
    });
  }, [navigation, editMode]);

  const fetchRequest = async () => {
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
      Alert.alert('Erreur', 'Impossible de charger la demande');
      navigation.goBack();
    } finally {
      console.log('🏁 Fin chargement, setLoading(false)');
      setLoading(false);
    }
  };

  const addService = () => {
    if (!skillInput.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un service');
      return;
    }

    setFormData(prev => ({
      ...prev,
      servicesIncluded: [...prev.servicesIncluded, skillInput.trim()],
    }));
    setSkillInput('');
  };

  const removeService = (index) => {
    setFormData(prev => ({
      ...prev,
      servicesIncluded: prev.servicesIncluded.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Erreur', 'Le prix est requis et doit être supérieur à 0');
      return false;
    }

    if (!formData.estimatedDuration || parseFloat(formData.estimatedDuration) <= 0) {
      Alert.alert('Erreur', 'La durée estimée est requise');
      return false;
    }

    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'La description est requise');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        requestId: requestId,
        workerId: user.id,
        workerName: user.fullName,
        price: parseFloat(formData.price),
        estimatedDuration: parseFloat(formData.estimatedDuration),
        description: formData.description,
        servicesIncluded: formData.servicesIncluded,
        additionalNotes: formData.additionalNotes,
        status: 'pending',
      };

      let response;
      if (editMode && quoteId) {
        // Update existing quote
        response = await api.put(`/quotes/${quoteId}`, submitData);
      } else {
        // Create new quote
        response = await api.post('/quotes', submitData);
      }

      if (response.data.success) {
        Alert.alert(
          'Succès',
          editMode ? 'Votre devis a été modifié avec succès' : 'Votre devis a été soumis avec succès',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Erreur création/modification devis:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || (editMode ? 'Impossible de modifier le devis' : 'Impossible de créer le devis')
      );
    } finally {
      setLoading(false);
    }
  };

  if (!request) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Request Summary Header */}
      <View style={styles.requestSummary}>
        <View style={styles.summaryHeader}>
          <Ionicons name="document-text" size={24} color={COLORS.primary} />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>{request.title}</Text>
            <Text style={styles.summaryBudget}>
              Budget: {formatCurrency(request.estimatedBudget)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Votre proposition</Text>

          {/* Price */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="cash-outline" size={16} /> Prix proposé ({getCurrentRegion(request.clientId?.phoneNumber).currency.code}) *
            </Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              placeholder="Ex: 45000"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
            />
            {formData.price && request.estimatedBudget && (
              <View style={styles.priceComparison}>
                {parseFloat(formData.price) <= request.estimatedBudget ? (
                  <View style={styles.priceComparisonGood}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.priceComparisonTextGood}>
                      Dans le budget du client
                    </Text>
                  </View>
                ) : (
                  <View style={styles.priceComparisonWarning}>
                    <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
                    <Text style={styles.priceComparisonTextWarning}>
                      Au-dessus du budget ({formatCurrency(parseFloat(formData.price) - request.estimatedBudget)})
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Duration */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="time-outline" size={16} /> Durée estimée (heures) *
            </Text>
            <TextInput
              style={styles.input}
              value={formData.estimatedDuration}
              onChangeText={(text) => setFormData({ ...formData, estimatedDuration: text })}
              placeholder="Ex: 4"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="reader-outline" size={16} /> Description de votre proposition *
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Expliquez comment vous allez réaliser le travail, les matériaux que vous utiliserez, etc."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Services Included */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="checkmark-circle-outline" size={16} /> Services inclus
            </Text>

            <View style={styles.serviceInputContainer}>
              <TextInput
                style={[styles.input, styles.serviceInput]}
                value={skillInput}
                onChangeText={setSkillInput}
                placeholder="Ex: Fourniture de matériaux"
                placeholderTextColor={COLORS.textLight}
                onSubmitEditing={addService}
              />
              <TouchableOpacity style={styles.addServiceButton} onPress={addService}>
                <Ionicons name="add" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {formData.servicesIncluded.length > 0 && (
              <View style={styles.servicesListContainer}>
                {formData.servicesIncluded.map((service, index) => (
                  <View key={index} style={styles.serviceChip}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                    <Text style={styles.serviceChipText}>{service}</Text>
                    <TouchableOpacity onPress={() => removeService(index)}>
                      <Ionicons name="close-circle" size={18} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Additional Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="create-outline" size={16} /> Notes additionnelles (optionnel)
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.additionalNotes}
              onChangeText={(text) => setFormData({ ...formData, additionalNotes: text })}
              placeholder="Informations supplémentaires, disponibilités, garanties..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={20} color={COLORS.warning} />
              <Text style={styles.tipsTitle}>Conseils pour un bon devis</Text>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.tipText}>Soyez précis dans votre description</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.tipText}>Proposez un prix compétitif mais juste</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.tipText}>Listez tous les services inclus</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.tipText}>Soyez réaliste sur le temps nécessaire</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name={editMode ? "checkmark-circle" : "paper-plane"} size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>
                {editMode ? 'Modifier le devis' : 'Soumettre le devis'}
              </Text>
            </>
          )}
        </TouchableOpacity>
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
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  requestSummary: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  summaryBudget: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  priceComparison: {
    marginTop: 8,
  },
  priceComparisonGood: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  priceComparisonTextGood: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.success,
  },
  priceComparisonWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  priceComparisonTextWarning: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.warning,
  },
  serviceInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceInput: {
    flex: 1,
  },
  addServiceButton: {
    backgroundColor: COLORS.primary,
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servicesListContainer: {
    marginTop: 12,
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 8,
  },
  serviceChipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  tipsCard: {
    backgroundColor: COLORS.warning + '10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
    marginTop: 8,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  tipsList: {
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  submitContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
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

export default CreateQuoteScreen;
