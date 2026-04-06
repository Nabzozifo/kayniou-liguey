import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, USER_TYPES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

const ProfileTypeSelectionScreen = ({ route, navigation }) => {
  const { userData } = route.params;
  const { register, loading } = useAuth();
  const [selectedType, setSelectedType] = useState(null);

  const handleSelectType = async () => {
    if (!selectedType) {
      Alert.alert('Attention', 'Veuillez sélectionner un type de profil');
      return;
    }

    // Inscription directe pour clients ET travailleurs.
    // La vérification d'identité (CIN / passeport) se fait depuis le profil,
    // après inscription. Un travailleur non vérifié peut parcourir l'app
    // mais ne peut pas postuler à une mission.
    const result = await register({
      ...userData,
      userType: selectedType,
    });

    if (result.success) {
      // Si c'est un travailleur, il doit choisir ses catégories.
      // AppNavigator n'a pas encore rendu WorkerMain car la nav est en cours,
      // donc on navigue manuellement vers CategorySelection.
      if (selectedType === USER_TYPES.WORKER && result.user?._id) {
        navigation.replace('CategorySelection', { userId: result.user._id });
      }
      // Pour les clients, AppNavigator bascule automatiquement sur ClientMain.
    } else {
      Alert.alert('Erreur d\'inscription', result.error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Choisissez votre profil</Text>
        <Text style={styles.subtitle}>
          Sélectionnez le type de compte qui vous correspond
        </Text>
      </View>

      {/* Options de profil */}
      <View style={styles.optionsContainer}>
        {/* Client */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            selectedType === USER_TYPES.CLIENT && styles.optionCardSelected,
          ]}
          onPress={() => setSelectedType(USER_TYPES.CLIENT)}
          disabled={loading}
        >
          <View
            style={[
              styles.radioButton,
              selectedType === USER_TYPES.CLIENT && styles.radioButtonSelected,
            ]}
          >
            {selectedType === USER_TYPES.CLIENT && (
              <View style={styles.radioButtonInner} />
            )}
          </View>

          <View style={styles.optionContent}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionIcon}>👤</Text>
              <Text style={styles.optionTitle}>Client</Text>
            </View>
            <Text style={styles.optionDescription}>
              Je recherche des travailleurs qualifiés pour mes projets
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>✓</Text>
                <Text style={styles.featureText}>Publier des demandes de service</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>✓</Text>
                <Text style={styles.featureText}>Recevoir des devis</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>✓</Text>
                <Text style={styles.featureText}>Choisir le meilleur travailleur</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>✓</Text>
                <Text style={styles.featureText}>Noter et évaluer les services</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Travailleur */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            selectedType === USER_TYPES.WORKER && styles.optionCardSelected,
          ]}
          onPress={() => setSelectedType(USER_TYPES.WORKER)}
          disabled={loading}
        >
          <View
            style={[
              styles.radioButton,
              selectedType === USER_TYPES.WORKER && styles.radioButtonSelected,
            ]}
          >
            {selectedType === USER_TYPES.WORKER && (
              <View style={styles.radioButtonInner} />
            )}
          </View>

          <View style={styles.optionContent}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionIcon}>👷</Text>
              <Text style={styles.optionTitle}>Travailleur</Text>
            </View>
            <Text style={styles.optionDescription}>
              Je propose mes services et compétences
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>✓</Text>
                <Text style={styles.featureText}>Trouver des opportunités</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>✓</Text>
                <Text style={styles.featureText}>Envoyer des devis</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>✓</Text>
                <Text style={styles.featureText}>Gérer mon portfolio</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>✓</Text>
                <Text style={styles.featureText}>Construire ma réputation</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bouton de confirmation */}
      <TouchableOpacity
        style={[
          styles.confirmButton,
          (!selectedType || loading) && styles.confirmButtonDisabled,
        ]}
        onPress={handleSelectType}
        disabled={!selectedType || loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.confirmButtonText}>Créer mon compte</Text>
        )}
      </TouchableOpacity>

      {/* Note */}
      <Text style={styles.note}>
        Vous pourrez modifier ce paramètre plus tard dans votre profil
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: 10,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  optionDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 15,
    lineHeight: 22,
  },
  featuresList: {
    marginTop: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 16,
    color: COLORS.success,
    marginRight: 8,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ProfileTypeSelectionScreen;
