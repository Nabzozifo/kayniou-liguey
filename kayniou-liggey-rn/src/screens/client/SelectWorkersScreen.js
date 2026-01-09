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
      }
    } catch (error) {
      console.log('Erreur localisation:', error);
    } finally {
      fetchWorkers();
    }
  };

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Récupération workers top-rated pour:', category);

      const params = {
        category,
        limit: 20,
      };

      if (location) {
        params.latitude = location.latitude;
        params.longitude = location.longitude;
        params.radius = user?.searchRadius || 50; // Utiliser le rayon configuré par l'utilisateur
      }

      const response = await api.get('/worker-profile/top-rated', { params });

      console.log(`✅ ${response.data.count} workers trouvés`);
      setWorkers(response.data.workers || []);
    } catch (error) {
      console.error('❌ Erreur fetchWorkers:', error);
      Alert.alert('Erreur', 'Impossible de charger les workers');
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkerSelection = (workerId) => {
    if (selectedIds.includes(workerId)) {
      // Désélectionner
      setSelectedIds(selectedIds.filter((id) => id !== workerId));
    } else {
      // Sélectionner (max 3)
      if (selectedIds.length < maxSelection) {
        setSelectedIds([...selectedIds, workerId]);
      } else {
        Alert.alert(
          'Limite atteinte',
          `Vous pouvez sélectionner maximum ${maxSelection} workers`
        );
      }
    }
  };

  const handleValidate = () => {
    if (selectedIds.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins 1 worker');
      return;
    }

    // Retourner les IDs sélectionnés
    if (onSelect) {
      onSelect(selectedIds);
    }
    navigation.goBack();
  };

  const renderWorkerCard = ({ item }) => {
    const worker = item.user || item.userId;
    const isSelected = selectedIds.includes(worker._id);
    const canSelect = selectedIds.length < maxSelection || isSelected;

    return (
      <TouchableOpacity
        style={[
          styles.workerCard,
          isSelected && styles.workerCardSelected,
          !canSelect && styles.workerCardDisabled,
        ]}
        onPress={() => toggleWorkerSelection(worker._id)}
        disabled={!canSelect && !isSelected}
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
                {worker.fullName?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{worker.fullName}</Text>

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

          {/* Categories */}
          <View style={styles.categoriesContainer}>
            {item.categories?.slice(0, 2).map((cat, index) => (
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
        <Text style={styles.loadingText}>Chargement des workers...</Text>
      </View>
    );
  }

  if (workers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.emptyText}>Aucun worker disponible</Text>
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
          Sélectionnez 1 à {maxSelection} workers
        </Text>
        <Text style={styles.headerSubtitle}>
          Seuls les workers sélectionnés verront votre demande
        </Text>
        <Text style={styles.headerCount}>
          {selectedIds.length}/{maxSelection} sélectionné{selectedIds.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={workers}
        keyExtractor={(item) => item._id || item.user?._id || item.userId?._id}
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
    marginBottom: 4,
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
