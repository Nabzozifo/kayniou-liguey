import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Switch,
} from 'react-native';
import MapsView from '../../components/MapsView';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

const WorkerHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Catégories normalisées (lowercase sans accents pour correspondre au backend)
  const categories = [
    { id: 'plomberie', label: 'Plomberie' },
    { id: 'electricite', label: 'Électricité' },
    { id: 'menuiserie', label: 'Menuiserie' },
    { id: 'maconnerie', label: 'Maçonnerie' },
    { id: 'peinture', label: 'Peinture' },
    { id: 'jardinage', label: 'Jardinage' },
    { id: 'nettoyage', label: 'Nettoyage' },
  ];

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (location) {
      fetchNearbyRequests();
      updateWorkerLocation();
    }
  }, [location, selectedCategory]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'L\'application a besoin d\'accéder à votre localisation pour afficher les demandes à proximité.'
        );
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setLoading(false);
    } catch (error) {
      console.error('Erreur localisation:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre localisation');
      setLoading(false);
    }
  };

  const updateWorkerLocation = async () => {
    try {
      await api.put(`/worker-profile/${user.id}/location`, {
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error) {
      console.error('Erreur mise à jour localisation:', error);
    }
  };

  const fetchNearbyRequests = async () => {
    try {
      console.log('🔍 Fetching available requests for worker:', user.id);

      // Use the filtered endpoint for workers
      const response = await api.get(`/service-requests/available-for-worker/${user.id}`);
      console.log('✅ Requests response:', response.data);

      if (response.data.success) {
        let filteredRequests = response.data.requests || [];

        // Check if worker needs to set categories
        if (response.data.needsCategories) {
          Alert.alert(
            'Complétez votre profil',
            response.data.message || 'Veuillez sélectionner vos métiers dans votre profil pour voir les demandes correspondantes.',
            [
              {
                text: 'Compléter le profil',
                onPress: () => navigation.navigate('EditWorkerProfile')
              },
              {
                text: 'Plus tard',
                style: 'cancel'
              }
            ]
          );
        }

        // Apply category filter if selected
        if (selectedCategory) {
          filteredRequests = filteredRequests.filter(request =>
            request.categories && request.categories.includes(selectedCategory)
          );
        }

        setRequests(filteredRequests);
      }
    } catch (error) {
      console.error('❌ Erreur chargement demandes:', error.response?.status, error.message);
      console.error('Error details:', error.response?.data);

      // If error is 400, worker profile is incomplete
      if (error.response?.status === 400) {
        Alert.alert(
          'Profil incomplet',
          'Veuillez compléter votre profil pour voir les demandes disponibles.',
          [
            {
              text: 'Compléter',
              onPress: () => navigation.navigate('EditWorkerProfile')
            },
            {
              text: 'Plus tard',
              style: 'cancel'
            }
          ]
        );
        setRequests([]);
      } else {
        Alert.alert('Erreur', `Impossible de charger les demandes: ${error.message}`);
      }
    }
  };

  const toggleAvailability = async (value) => {
    try {
      setIsAvailable(value);
      await api.put(`/worker-profile/${user.id}/availability`, {
        isAvailable: value,
      });

      Alert.alert(
        'Disponibilité mise à jour',
        value
          ? 'Vous êtes maintenant disponible pour recevoir des demandes'
          : 'Vous êtes maintenant indisponible'
      );
    } catch (error) {
      console.error('Erreur changement disponibilité:', error);
      Alert.alert('Erreur', 'Impossible de changer votre disponibilité');
      setIsAvailable(!value);
    }
  };

  const handleRequestPress = (request) => {
    navigation.navigate('RequestDetails', { requestId: request._id });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Localisation non disponible</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={requestLocationPermission}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map with Google Maps or OpenStreetMap fallback */}
      {location && (
        <MapsView
          style={styles.map}
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          markers={requests.map((request) => ({
            id: request._id,
            coordinate: {
              latitude: request.location?.coordinates?.[1] || location.latitude,
              longitude: request.location?.coordinates?.[0] || location.longitude,
            },
            title: request.title || 'Demande de service',
            description: `${request.category} - ${request.urgency}`,
          }))}
          onMarkerPress={(marker) => {
            const request = requests.find((r) => r._id === marker.id);
            if (request) {
              navigation.navigate('RequestDetails', { requestId: request._id });
            }
          }}
        />
      )}
      {!location && (
        <View style={styles.map}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.placeholderText}>Chargement de la carte...</Text>
            <Text style={styles.placeholderSubtext}>
              {requests.length} demande{requests.length > 1 ? 's' : ''} disponible{requests.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      )}

      {/* Compact Header with Availability - Overlay on top */}
      <View style={styles.compactHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.requestCount}>
            {requests.length} demande{requests.length > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.availabilityChip}>
          <View style={[styles.statusDot, { backgroundColor: isAvailable ? COLORS.success : COLORS.error }]} />
          <Text style={styles.availabilityText}>
            {isAvailable ? 'Dispo' : 'Indispo'}
          </Text>
          <Switch
            value={isAvailable}
            onValueChange={toggleAvailability}
            trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
            thumbColor={COLORS.white}
            style={styles.switch}
          />
        </View>
      </View>

      {/* Compact Categories Filter - Overlay */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipSelected,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryText,
                !selectedCategory && styles.categoryTextSelected,
              ]}
            >
              Toutes
            </Text>
          </TouchableOpacity>

          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextSelected,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AvailableRequests')}
      >
        <Ionicons name="list" size={24} color={COLORS.white} />
        <Text style={styles.fabText}>Liste</Text>
      </TouchableOpacity>

      {/* Chatbot FAB */}
      <TouchableOpacity
        style={styles.chatbotFab}
        onPress={() => navigation.navigate('Chatbot')}
      >
        <Ionicons name="chatbubbles" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Requests Counter Badge */}
      {requests.length > 0 && (
        <View style={styles.counterBadge}>
          <Ionicons name="document-text" size={16} color={COLORS.primary} />
          <Text style={styles.counterText}>
            {requests.length} à proximité
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 8,
    fontWeight: '600',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerLeft: {
    flex: 1,
  },
  requestCount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  availabilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availabilityText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  categoryContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundDark,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryTextSelected: {
    color: COLORS.white,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  markerUrgent: {
    backgroundColor: COLORS.error,
  },
  markerMedium: {
    backgroundColor: COLORS.warning,
  },
  markerText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  markerBudget: {
    marginTop: 4,
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  markerBudgetText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    flexDirection: 'column',
    gap: 2,
  },
  chatbotFab: {
    position: 'absolute',
    right: 16,
    bottom: 104, // 32 + 60 (FAB height) + 12 (gap)
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
  },
  counterBadge: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default WorkerHomeScreen;
