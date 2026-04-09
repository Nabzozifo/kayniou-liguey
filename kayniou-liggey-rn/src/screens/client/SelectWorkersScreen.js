import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const SelectWorkersScreen = ({ route, navigation }) => {
  const { category, onSelect, maxSelection = 3 } = route.params;
  const { user } = useAuth();

  const [workers, setWorkers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
        // Appeler fetchWorkers avec la localisation
        await fetchWorkers(loc.coords);
      } else {
        // Permission refusée - alerter l'utilisateur
        Alert.alert(
          'Localisation requise',
          'La localisation est nécessaire pour trouver des travailleurs près de vous.',
          [{ text: 'OK' }]
        );
        setLoading(false);
      }
    } catch (error) {
      console.log('Erreur localisation:', error);
      Alert.alert(
        'Erreur',
        'Impossible de récupérer votre localisation. Veuillez vérifier vos paramètres.',
        [{ text: 'OK' }]
      );
      setLoading(false);
    }
  };

  const fetchWorkers = async (coords) => {
    try {
      setLoading(true);
      console.log('🔍 Récupération workers top-rated pour:', category);

      // Utiliser les coordonnées passées en paramètre ou celles du state
      const currentLocation = coords || location;

      if (!currentLocation) {
        console.log('❌ Pas de localisation disponible - impossible de rechercher');
        Alert.alert(
          'Localisation requise',
          'Impossible de rechercher des travailleurs sans votre localisation.'
        );
        setLoading(false);
        return;
      }

      const params = {
        category,
        limit: 20,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radius: user?.searchRadius || 10, // Utiliser 10km par défaut pour respecter le rayon du client
      };

      console.log('📍 Recherche avec localisation:', {
        lat: params.latitude,
        lng: params.longitude,
        radius: params.radius,
      });

      const response = await api.get('/worker-profile/top-rated', { params });

      console.log(`✅ ${response.data.count} workers trouvés dans un rayon de ${params.radius}km`);
      setWorkers(response.data.workers || []);
    } catch (error) {
      console.error('❌ Erreur fetchWorkers:', error);
      Alert.alert('Erreur', 'Impossible de charger les travailleurs');
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkerSelection = (workerId, workerItem) => {
    if (selectedIds.includes(workerId)) {
      setSelectedIds(selectedIds.filter((id) => id !== workerId));
    } else {
      // Bloquer la sélection d'un travailleur non vérifié
      if (!workerItem?.isVerified) {
        Alert.alert(
          'Travailleur non vérifié',
          'Impossible de proposer du travail à ce travailleur car son identité n\'a pas encore été vérifiée.',
          [{ text: 'OK' }]
        );
        return;
      }
      if (selectedIds.length < maxSelection) {
        setSelectedIds([...selectedIds, workerId]);
      } else {
        Alert.alert(
          'Limite atteinte',
          `Vous pouvez sélectionner maximum ${maxSelection} travailleurs`
        );
      }
    }
  };

  const handleValidate = () => {
    if (selectedIds.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins 1 travailleur');
      return;
    }

    // Retourner les IDs sélectionnés
    if (onSelect) {
      onSelect(selectedIds);
    }
    navigation.goBack();
  };

  const renderWorkerCard = ({ item }) => {
    const worker = item.user || (typeof item.userId === 'object' ? item.userId : null);
    if (!worker) return null;
    const workerId = worker._id?.toString() || item._id?.toString();
    const isSelected = selectedIds.includes(workerId);
    const canSelect = selectedIds.length < maxSelection || isSelected;
    const isUnverified = !item.isVerified;

    return (
      <TouchableOpacity
        style={[
          styles.workerCard,
          isSelected && styles.workerCardSelected,
          !canSelect && !isUnverified && styles.workerCardDisabled,
          isUnverified && styles.workerCardUnverified,
          worker.subscription?.plan === 'premium' && worker.subscription?.status === 'active' && !isSelected && !isUnverified && { borderColor: '#FFD700', borderWidth: 2 },
        ]}
        onPress={() => toggleWorkerSelection(workerId, item)}
        disabled={!canSelect && !isSelected && !isUnverified}
      >
        {/* Checkbox */}
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={20} color={COLORS.white} />
          )}
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {worker.photoURL ? (
            <Image
              source={{ uri: worker.photoURL }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {(worker.fullName?.[0] || '?').toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.workerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.workerName}>{worker.fullName}</Text>
            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={9} color="#fff" />
              </View>
            )}
            {worker.subscription?.plan === 'premium' && worker.subscription?.status === 'active' && (
              <View style={styles.premiumBadge}>
                <Ionicons name="trophy" size={10} color={COLORS.white} />
                <Text style={styles.premiumText}>TOP</Text>
              </View>
            )}
          </View>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={COLORS.warning} />
            <Text style={styles.ratingText}>
              {worker.rating ? worker.rating.toFixed(1) : 'N/A'}
            </Text>
            <Text style={styles.jobsText}>
              • {item.completedJobs || 0} travaux
            </Text>
          </View>

          {/* Non vérifié */}
          {isUnverified && (
            <View style={styles.unverifiedTag}>
              <Ionicons name="alert-circle-outline" size={12} color="#9CA3AF" />
              <Text style={styles.unverifiedText}>Identité non vérifiée</Text>
            </View>
          )}

          {/* Categories */}
          <View style={styles.categoriesContainer}>
            {(item.categories || []).slice(0, 2).map((cat, index) => (
              <View key={index} style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>

          {/* Distance */}
          {item.distance && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.distanceText}>
                {(item.distance / 1000).toFixed(1)} km
              </Text>
            </View>
          )}

          {/* Experience */}
          {item.experienceYears && (
            <Text style={styles.experienceText}>
              Expérience: {item.experienceYears}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des travailleurs...</Text>
      </View>
    );
  }

  if (workers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.emptyText}>Aucun travailleur disponible</Text>
        <Text style={styles.emptySubtext}>
          pour la catégorie {category}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Sélectionnez 1 à {maxSelection} travailleurs
        </Text>
        <Text style={styles.headerSubtitle}>
          Seuls les travailleurs sélectionnés verront votre demande
        </Text>
        <Text style={styles.headerCount}>
          {selectedIds.length}/{maxSelection} sélectionné{selectedIds.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={workers}
        keyExtractor={(item) => String(item._id || item.user?._id || item.userId || Math.random())}
        renderItem={renderWorkerCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Validate Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.validateButton,
            selectedIds.length === 0 && styles.validateButtonDisabled,
          ]}
          onPress={handleValidate}
          disabled={selectedIds.length === 0}
        >
          <Text style={styles.validateButtonText}>
            Valider ({selectedIds.length})
          </Text>
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
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  headerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 8,
  },
  list: {
    padding: 16,
  },
  workerCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workerCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  workerCardDisabled: {
    opacity: 0.5,
  },
  workerCardUnverified: {
    opacity: 0.6,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  unverifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  unverifiedText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.white,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1D9BF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  jobsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  experienceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  validateButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  validateButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  validateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SelectWorkersScreen;
