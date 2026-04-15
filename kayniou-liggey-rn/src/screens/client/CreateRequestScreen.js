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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SERVICE_CATEGORIES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { getCurrentRegion } from '../../config/regional';

// ─── Sélecteur de date/heure sans dépendance externe ────────────────────────
const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
const DAYS_FR = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

const DateTimePicker = ({ value, time, onChangeDate, onChangeTime, onClear }) => {
  const [showCal, setShowCal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay(); // 0=dim

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  const firstDay = getFirstDay(calYear, calMonth);
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  // Offset pour commencer lundi
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < offset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const selectDay = (day) => {
    if (!day) return;
    const d = new Date(calYear, calMonth, day);
    if (d < today) return;
    onChangeDate(d);
    setShowCal(false);
  };

  const isSelected = (day) => {
    if (!value || !day) return false;
    return value.getFullYear() === calYear && value.getMonth() === calMonth && value.getDate() === day;
  };

  const isPast = (day) => {
    if (!day) return false;
    const d = new Date(calYear, calMonth, day);
    return d < today;
  };

  const formatDate = (d) => {
    if (!d) return null;
    return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  return (
    <View>
      {/* Display row */}
      <View style={dtStyles.row}>
        <TouchableOpacity style={[dtStyles.btn, value && dtStyles.btnActive]} onPress={() => setShowCal(true)}>
          <Ionicons name="calendar-outline" size={16} color={value ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[dtStyles.btnText, value && dtStyles.btnTextActive]}>
            {value ? formatDate(value) : 'Choisir une date'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[dtStyles.btn, dtStyles.btnTime, time && dtStyles.btnActive]}
          onPress={() => setShowTimePicker(true)}
          disabled={!value}
        >
          <Ionicons name="time-outline" size={16} color={time ? COLORS.primary : COLORS.textLight} />
          <Text style={[dtStyles.btnText, time && dtStyles.btnTextActive]}>{time || 'Heure'}</Text>
        </TouchableOpacity>
        {value && (
          <TouchableOpacity onPress={onClear} style={dtStyles.clearBtn}>
            <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Calendar modal */}
      <Modal visible={showCal} transparent animationType="fade">
        <TouchableOpacity style={dtStyles.overlay} activeOpacity={1} onPress={() => setShowCal(false)}>
          <TouchableOpacity activeOpacity={1} style={dtStyles.calBox}>
            {/* Month nav */}
            <View style={dtStyles.calHeader}>
              <TouchableOpacity onPress={prevMonth} style={dtStyles.navBtn}>
                <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={dtStyles.calMonthText}>{MONTHS_FR[calMonth]} {calYear}</Text>
              <TouchableOpacity onPress={nextMonth} style={dtStyles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            {/* Day labels */}
            <View style={dtStyles.calDayLabels}>
              {['Lu','Ma','Me','Je','Ve','Sa','Di'].map(d => (
                <Text key={d} style={dtStyles.calDayLabel}>{d}</Text>
              ))}
            </View>
            {/* Grid */}
            <View style={dtStyles.calGrid}>
              {days.map((day, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    dtStyles.calCell,
                    isSelected(day) && dtStyles.calCellSelected,
                    isPast(day) && dtStyles.calCellPast,
                  ]}
                  onPress={() => selectDay(day)}
                  disabled={!day || isPast(day)}
                >
                  {day ? (
                    <Text style={[
                      dtStyles.calCellText,
                      isSelected(day) && dtStyles.calCellTextSelected,
                      isPast(day) && dtStyles.calCellTextPast,
                    ]}>{day}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Time picker modal */}
      <Modal visible={showTimePicker} transparent animationType="fade">
        <TouchableOpacity style={dtStyles.overlay} activeOpacity={1} onPress={() => setShowTimePicker(false)}>
          <TouchableOpacity activeOpacity={1} style={dtStyles.timeBox}>
            <Text style={dtStyles.timeTitle}>Choisir l'heure</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
              {HOURS.map(h => MINUTES.map(m => {
                const t = `${h}:${m}`;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[dtStyles.timeOption, time === t && dtStyles.timeOptionSelected]}
                    onPress={() => { onChangeTime(t); setShowTimePicker(false); }}
                  >
                    <Text style={[dtStyles.timeOptionText, time === t && dtStyles.timeOptionTextSelected]}>{t}</Text>
                  </TouchableOpacity>
                );
              }))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const dtStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#F9FAFB' },
  btnTime: { flex: 0, width: 90 },
  btnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight || '#F0FDF4' },
  btnText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  btnTextActive: { color: COLORS.primary, fontWeight: '600' },
  clearBtn: { padding: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  calBox: { backgroundColor: '#fff', borderRadius: 20, padding: 16, width: 320, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calMonthText: { fontSize: 16, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  calDayLabels: { flexDirection: 'row', marginBottom: 6 },
  calDayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  calCellSelected: { backgroundColor: COLORS.primary },
  calCellPast: { opacity: 0.3 },
  calCellText: { fontSize: 14, fontWeight: '500', color: '#111827' },
  calCellTextSelected: { color: '#fff', fontWeight: '700' },
  calCellTextPast: { color: '#9CA3AF' },
  timeBox: { backgroundColor: '#fff', borderRadius: 20, padding: 16, width: 200, maxHeight: 360 },
  timeTitle: { fontSize: 15, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 12 },
  timeOption: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, marginBottom: 2 },
  timeOptionSelected: { backgroundColor: COLORS.primary },
  timeOptionText: { fontSize: 15, textAlign: 'center', color: '#374151' },
  timeOptionTextSelected: { color: '#fff', fontWeight: '700' },
});

const CreateRequestScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [locationMode, setLocationMode] = useState('gps'); // 'gps' | 'search'
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);

  // Prefill depuis la recherche intelligente
  const prefill = route?.params?.prefill || {};

  const [formData, setFormData] = useState({
    title:            prefill.title        || '',
    description:      prefill.description  || '',
    categories:       prefill.categories   || [],
    urgency:          prefill.urgency      || 'medium',
    estimatedBudget:  '',
    mode:             prefill.mode         || 'auction',
    auctionDuration:  48,
    location:         null,
    address:          '',
    preferredDate:    null,
    preferredTime:    null, // "HH:MM"
    invitedWorkerIds: prefill.invitedWorkerIds || [],
  });

  const auctionDurations = [
    { value: 12, label: '12 heures' },
    { value: 24, label: '24 heures (1 jour)' },
    { value: 48, label: '48 heures (2 jours)' },
    { value: 72, label: '72 heures (3 jours)' },
    { value: 168, label: '7 jours' },
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Faible', icon: 'time-outline', color: COLORS.info },
    { value: 'medium', label: 'Moyenne', icon: 'alert-circle-outline', color: COLORS.warning },
    { value: 'high', label: 'Urgente', icon: 'alert-outline', color: COLORS.error },
  ];

  const requestModes = [
    {
      value: 'direct_hire',
      label: 'Direct',
      description: 'Assignez directement à un travailleur',
      icon: 'person-outline'
    },
    {
      value: 'auction',
      label: 'Enchères Publiques',
      description: 'Recevez plusieurs devis et choisissez',
      icon: 'people-outline'
    },
    {
      value: 'private_auction',
      label: 'Enchère Privée',
      description: 'Les travailleurs ne voient que leur propre devis',
      icon: 'eye-off-outline'
    },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre localisation pour créer la demande');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const formattedAddress = [
        address.street,
        address.city,
        address.region,
      ].filter(Boolean).join(', ');

      setFormData(prev => ({
        ...prev,
        location: {
          type: 'Point',
          coordinates: [location.coords.longitude, location.coords.latitude],
        },
        address: formattedAddress || 'Benguerir',
      }));
    } catch (error) {
      console.error('Erreur localisation:', error);
      Alert.alert('Erreur', 'Impossible de récupérer votre localisation');
    } finally {
      setLocationLoading(false);
    }
  };

  const searchAddress = async () => {
    if (addressQuery.trim().length < 3) return;
    setSearchingAddress(true);
    setAddressResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&limit=5&addressdetails=1`;
      const resp = await fetch(url, { headers: { 'Accept-Language': 'fr', 'User-Agent': 'KayniouLiggeyApp/1.0' } });
      const data = await resp.json();
      setAddressResults(data);
    } catch {
      Alert.alert('Erreur', 'Impossible de rechercher cette adresse');
    } finally {
      setSearchingAddress(false);
    }
  };

  const selectAddressResult = (item) => {
    setFormData(prev => ({
      ...prev,
      location: { type: 'Point', coordinates: [parseFloat(item.lon), parseFloat(item.lat)] },
      address: item.display_name,
    }));
    setAddressResults([]);
    setAddressQuery('');
  };

  const toggleCategory = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const validateStep1 = () => {
    if (!formData.title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'La description est requise');
      return false;
    }
    if (formData.categories.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une catégorie');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.estimatedBudget) {
      Alert.alert('Erreur', 'Le budget estimé est requis');
      return false;
    }
    if (!formData.location) {
      Alert.alert('Erreur', 'La localisation est requise');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    // Validation pour entente directe
    if (formData.mode === 'direct_hire' && formData.invitedWorkerIds.length !== 1) {
      Alert.alert('Erreur', 'Veuillez sélectionner exactement 1 travailleur pour l\'entente directe');
      return;
    }

    // Note: L'enchère privée ne nécessite pas de sélection de workers
    // Tous les workers peuvent voir la demande et soumettre des devis
    // Mais chaque worker ne voit que son propre devis

    setLoading(true);
    try {
      const requestData = {
        clientId: user.id,
        clientName: user.fullName,
        title: formData.title,
        description: formData.description,
        categories: formData.categories,
        urgency: formData.urgency,
        estimatedBudget: parseFloat(formData.estimatedBudget),
        mode: formData.mode,
        location: formData.location,
        address: formData.address,
        status: 'pending',
        preferredDate: formData.preferredDate || null,
        preferredTime: formData.preferredTime || null,
      };

      // Ajouter auctionDuration si enchère (publique ou privée)
      if (formData.mode === 'auction' || formData.mode === 'private_auction') {
        requestData.auctionDuration = formData.auctionDuration;
      }

      // Ajouter targetWorkerId si entente directe
      if (formData.mode === 'direct_hire') {
        requestData.targetWorkerId = formData.invitedWorkerIds[0];
      }

      // Ajouter invitedWorkerIds si enchère privée
      if (formData.mode === 'private_auction') {
        requestData.invitedWorkerIds = formData.invitedWorkerIds;
      }

      const response = await api.post('/service-requests', requestData);

      if (response.data.success) {
        Alert.alert(
          'Succès',
          'Votre demande a été créée avec succès',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Erreur création demande:', error);
      Alert.alert('Erreur', 'Impossible de créer la demande');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Informations de base</Text>

      {/* Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="document-text-outline" size={16} /> Titre de la demande
        </Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
          placeholder="Ex: Réparation de fuite d'eau"
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="reader-outline" size={16} /> Description détaillée
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Décrivez en détail le travail à effectuer..."
          placeholderTextColor={COLORS.textLight}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      {/* Categories */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="apps-outline" size={16} /> Catégories (sélectionnez au moins une)
        </Text>
        <View style={styles.categoriesGrid}>
          {SERVICE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                formData.categories.includes(category.id) && styles.categoryChipSelected,
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <Text style={styles.categoryEmoji}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  formData.categories.includes(category.id) && styles.categoryLabelSelected,
                ]}
              >
                {category.label}
              </Text>
              {formData.categories.includes(category.id) && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Urgency */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="speedometer-outline" size={16} /> Niveau d'urgence
        </Text>
        <View style={styles.urgencyContainer}>
          {urgencyLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.urgencyChip,
                formData.urgency === level.value && {
                  backgroundColor: level.color + '20',
                  borderColor: level.color,
                },
              ]}
              onPress={() => setFormData({ ...formData, urgency: level.value })}
            >
              <Ionicons
                name={level.icon}
                size={20}
                color={formData.urgency === level.value ? level.color : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.urgencyLabel,
                  formData.urgency === level.value && { color: level.color },
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Détails et budget</Text>

      {/* Budget */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="cash-outline" size={16} /> Budget estimé ({getCurrentRegion(user?.phoneNumber).currency.code})
        </Text>
        <TextInput
          style={styles.input}
          value={formData.estimatedBudget}
          onChangeText={(text) => setFormData({ ...formData, estimatedBudget: text })}
          placeholder="Ex: 50000"
          placeholderTextColor={COLORS.textLight}
          keyboardType="numeric"
        />
      </View>

      {/* Request Mode */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="swap-horizontal-outline" size={16} /> Mode de demande
        </Text>
        <View style={styles.modeContainer}>
          {requestModes.map((mode) => (
            <TouchableOpacity
              key={mode.value}
              style={[
                styles.modeCard,
                formData.mode === mode.value && styles.modeCardSelected,
              ]}
              onPress={() => setFormData({ ...formData, mode: mode.value })}
            >
              <View style={styles.modeHeader}>
                <Ionicons
                  name={mode.icon}
                  size={24}
                  color={formData.mode === mode.value ? COLORS.primary : COLORS.textSecondary}
                />
                {formData.mode === mode.value && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </View>
              <Text
                style={[
                  styles.modeLabel,
                  formData.mode === mode.value && styles.modeLabelSelected,
                ]}
              >
                {mode.label}
              </Text>
              <Text style={styles.modeDescription}>{mode.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Durée de l'enchère - visible seulement pour auction et private_auction */}
      {(formData.mode === 'auction' || formData.mode === 'private_auction') && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="timer-outline" size={16} /> Durée de l'enchère
          </Text>
          <Text style={styles.inputHint}>
            Temps pendant lequel les workers peuvent soumettre des devis
          </Text>
          <View style={styles.durationContainer}>
            {auctionDurations.map((duration) => (
              <TouchableOpacity
                key={duration.value}
                style={[
                  styles.durationOption,
                  formData.auctionDuration === duration.value && styles.durationOptionSelected,
                ]}
                onPress={() => setFormData({ ...formData, auctionDuration: duration.value })}
              >
                <Text
                  style={[
                    styles.durationText,
                    formData.auctionDuration === duration.value && styles.durationTextSelected,
                  ]}
                >
                  {duration.label}
                </Text>
                {formData.auctionDuration === duration.value && (
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Select Workers for Direct Hire */}
      {formData.mode === 'direct_hire' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="person-outline" size={16} /> Worker sélectionné
          </Text>
          <TouchableOpacity
            style={styles.selectWorkersButton}
            onPress={() => {
              if (formData.categories.length === 0) {
                Alert.alert('Attention', 'Veuillez d\'abord sélectionner au moins une catégorie de service');
                return;
              }
              navigation.navigate('SelectWorkers', {
                category: formData.categories[0],
                onSelect: (workerIds) => {
                  setFormData({ ...formData, invitedWorkerIds: workerIds });
                },
                maxSelection: 1, // UN SEUL worker pour entente directe
              });
            }}
          >
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={formData.invitedWorkerIds.length > 0 ? COLORS.primary : COLORS.textSecondary}
            />
            <View style={styles.selectWorkersText}>
              <Text style={styles.selectWorkersLabel}>
                {formData.invitedWorkerIds.length > 0
                  ? '1 travailleur sélectionné'
                  : 'Sélectionner un travailleur'}
              </Text>
              <Text style={styles.selectWorkersSubtext}>
                Contrat direct avec ce travailleur (classé par score)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {formData.invitedWorkerIds.length === 0 && (
            <Text style={styles.warningText}>
              ⚠️ Vous devez sélectionner 1 travailleur
            </Text>
          )}
        </View>
      )}

      {/* Info pour enchère privée */}
      {formData.mode === 'private_auction' && (
        <View style={styles.inputGroup}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              En mode enchère privée, tous les workers peuvent voir votre demande et soumettre des devis, mais chaque worker ne voit que son propre devis. Vous seul voyez tous les devis.
            </Text>
          </View>
        </View>
      )}

      {/* Date et heure d'intervention (optionnel) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="calendar-outline" size={16} /> Date d'intervention <Text style={styles.optionalLabel}>(optionnel)</Text>
        </Text>
        <Text style={styles.inputHint}>
          Si vous fixez une date, le travailleur doit impérativement venir ce jour-là. Sinon, c'est lui qui propose.
        </Text>
        <DateTimePicker
          value={formData.preferredDate}
          time={formData.preferredTime}
          onChangeDate={(d) => setFormData({ ...formData, preferredDate: d })}
          onChangeTime={(t) => setFormData({ ...formData, preferredTime: t })}
          onClear={() => setFormData({ ...formData, preferredDate: null, preferredTime: null })}
        />
      </View>

      {/* Location */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          <Ionicons name="location-outline" size={16} /> Localisation du travail
        </Text>

        {/* Mode tabs */}
        <View style={styles.locModeTabs}>
          <TouchableOpacity
            style={[styles.locModeTab, locationMode === 'gps' && styles.locModeTabActive]}
            onPress={() => { setLocationMode('gps'); setAddressResults([]); }}
          >
            <Ionicons name="navigate-outline" size={15} color={locationMode === 'gps' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.locModeTabText, locationMode === 'gps' && styles.locModeTabTextActive]}>Ma position GPS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.locModeTab, locationMode === 'search' && styles.locModeTabActive]}
            onPress={() => setLocationMode('search')}
          >
            <Ionicons name="search-outline" size={15} color={locationMode === 'search' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.locModeTabText, locationMode === 'search' && styles.locModeTabTextActive]}>Rechercher un lieu</Text>
          </TouchableOpacity>
        </View>

        {locationMode === 'gps' ? (
          <View style={styles.locationCard}>
            {locationLoading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : formData.location ? (
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={24} color={COLORS.primary} />
                <View style={styles.locationText}>
                  <Text style={styles.locationAddress}>{formData.address}</Text>
                  {formData.location.coordinates?.length === 2 && (
                    <Text style={styles.locationCoords}>
                      {formData.location.coordinates[1]?.toFixed(4)}, {formData.location.coordinates[0]?.toFixed(4)}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <Text style={styles.noLocation}>Aucune localisation GPS</Text>
            )}
            <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation} disabled={locationLoading}>
              <Ionicons name="refresh" size={20} color={COLORS.primary} />
              <Text style={styles.locationButtonText}>Actualiser</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Search input */}
            <View style={styles.addressSearchRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={addressQuery}
                onChangeText={setAddressQuery}
                placeholder="Ex : Hay Riad, Rabat"
                placeholderTextColor={COLORS.textLight}
                returnKeyType="search"
                onSubmitEditing={searchAddress}
              />
              <TouchableOpacity style={styles.addressSearchBtn} onPress={searchAddress} disabled={searchingAddress}>
                {searchingAddress
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Ionicons name="search" size={18} color={COLORS.white} />
                }
              </TouchableOpacity>
            </View>

            {/* Results */}
            {addressResults.length > 0 && (
              <View style={styles.addressResultsList}>
                {addressResults.map((item) => (
                  <TouchableOpacity
                    key={item.place_id}
                    style={styles.addressResultItem}
                    onPress={() => selectAddressResult(item)}
                  >
                    <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.addressResultText} numberOfLines={2}>{item.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Selected address display */}
            {formData.location && !addressResults.length && (
              <View style={[styles.locationCard, { marginTop: 8 }]}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={[styles.locationAddress, { flex: 1, marginLeft: 8 }]} numberOfLines={2}>{formData.address}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / 2) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Étape {currentStep} sur 2</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentStep === 1 ? renderStep1() : renderStep2()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        )}

        {currentStep === 1 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Suivant</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Créer la demande</Text>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  categoryLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 8,
  },
  urgencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modeCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  modeCardSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  modeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  modeLabelSelected: {
    color: COLORS.primary,
  },
  modeDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  locationCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  locationText: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  noLocation: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginVertical: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Mode tabs (GPS / Recherche)
  locModeTabs: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  locModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
  },
  locModeTabActive: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  locModeTabText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  locModeTabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  // Address search
  addressSearchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  addressSearchBtn: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressResultsList: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  addressResultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  addressResultText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
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
  selectWorkersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  selectWorkersText: {
    flex: 1,
  },
  selectWorkersLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectWorkersSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.warning,
    marginTop: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 8,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  durationContainer: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  durationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  durationOptionSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  durationText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  durationTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  optionalLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 8,
    lineHeight: 17,
  },
});

export default CreateRequestScreen;
