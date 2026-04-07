import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, USER_TYPES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

const TYPES = [
  {
    value: USER_TYPES.CLIENT,
    icon: 'search-outline',
    iconFilled: 'search',
    emoji: '🏠',
    title: 'Je suis client',
    subtitle: 'Je cherche des professionnels',
    color: '#0EA5E9',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    features: [
      { icon: 'megaphone-outline', text: 'Publier des demandes de service' },
      { icon: 'document-text-outline', text: 'Recevoir et comparer des devis' },
      { icon: 'checkmark-circle-outline', text: 'Choisir le meilleur professionnel' },
      { icon: 'star-outline', text: 'Noter et évaluer les services' },
    ],
  },
  {
    value: USER_TYPES.WORKER,
    icon: 'hammer-outline',
    iconFilled: 'hammer',
    emoji: '👷',
    title: 'Je suis travailleur',
    subtitle: 'Je propose mes services',
    color: COLORS.primary,
    bg: '#F0FDF4',
    border: '#86EFAC',
    features: [
      { icon: 'briefcase-outline', text: 'Trouver des opportunités proches' },
      { icon: 'cash-outline', text: 'Envoyer des devis et décrocher des chantiers' },
      { icon: 'trending-up-outline', text: 'Construire ma réputation' },
      { icon: 'trophy-outline', text: 'Accéder au plan Premium' },
    ],
  },
];

const ProfileTypeSelectionScreen = ({ route, navigation }) => {
  const { userData } = route.params;
  const { register, loading } = useAuth();
  const [selectedType, setSelectedType] = useState(null);

  const handleSelectType = async () => {
    if (!selectedType) {
      Alert.alert('Attention', 'Veuillez sélectionner un type de profil');
      return;
    }

    const result = await register({ ...userData, userType: selectedType });

    if (result.success) {
      if (selectedType === USER_TYPES.WORKER && result.user?._id) {
        navigation.replace('CategorySelection', { userId: result.user._id });
      }
    } else {
      Alert.alert('Erreur d\'inscription', result.error);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="person-add" size={32} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Choisissez votre profil</Text>
        <Text style={styles.heroSub}>Sélectionnez le type de compte qui vous correspond</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {TYPES.map((type) => {
          const isSelected = selectedType === type.value;
          return (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.card,
                { borderColor: isSelected ? type.color : '#E5E7EB' },
                isSelected && { backgroundColor: type.bg, shadowColor: type.color, elevation: 6 },
              ]}
              onPress={() => setSelectedType(type.value)}
              activeOpacity={0.85}
              disabled={loading}
            >
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconBg, { backgroundColor: isSelected ? type.color : '#F3F4F6' }]}>
                  <Text style={styles.cardEmoji}>{type.emoji}</Text>
                </View>

                <View style={styles.cardHeaderText}>
                  <Text style={[styles.cardTitle, isSelected && { color: type.color }]}>
                    {type.title}
                  </Text>
                  <Text style={styles.cardSubtitle}>{type.subtitle}</Text>
                </View>

                <View style={[
                  styles.radio,
                  isSelected && { backgroundColor: type.color, borderColor: type.color },
                ]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
              </View>

              {/* Features */}
              <View style={[styles.featuresList, isSelected && { borderTopColor: type.border }]}>
                {type.features.map((feat, i) => (
                  <View key={i} style={styles.featureRow}>
                    <View style={[styles.featIcon, { backgroundColor: isSelected ? type.color + '18' : '#F3F4F6' }]}>
                      <Ionicons
                        name={feat.icon}
                        size={14}
                        color={isSelected ? type.color : '#9CA3AF'}
                      />
                    </View>
                    <Text style={[styles.featureText, isSelected && { color: '#374151' }]}>
                      {feat.text}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (!selectedType || loading) && styles.confirmBtnDisabled,
          ]}
          onPress={handleSelectType}
          disabled={!selectedType || loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.confirmBtnText}>Créer mon compte</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          Vous pourrez modifier ce paramètre plus tard dans votre profil
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },

  // ── Hero ──
  hero: {
    backgroundColor: COLORS.primary,
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },

  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 20 },

  // ── Cards ──
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardEmoji: { fontSize: 26 },
  cardHeaderText: { flex: 1 },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresList: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // ── Confirm btn ──
  confirmBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnDisabled: { opacity: 0.45, elevation: 0 },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  note: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 14,
    fontStyle: 'italic',
  },
});

export default ProfileTypeSelectionScreen;
