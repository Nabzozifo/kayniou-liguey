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
} from 'react-native';
import MapsView from '../../components/MapsView';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

const ClientHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    { id: 'Plomberie', icon: '🔧', color: COLORS.primary },
    { id: 'Électricité', icon: '⚡', color: COLORS.warning },
    { id: 'Menuiserie', icon: '🪚', color: COLORS.secondary },
    { id: 'Maçonnerie', icon: '🧱', color: COLORS.error },
    { id: 'Peinture', icon: '🎨', color: COLORS.accent },
    { id: 'Jardinage', icon: '🌿', color: COLORS.success },
    { id: 'Nettoyage', icon: '✨', color: COLORS.info },
  ];

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (location) {
      fetchNearbyWorkers();
    }
  }, [location, selectedCategory]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'L\'application a besoin d\'accéder à votre localisation pour trouver des travailleurs à proximité.'
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

  const fetchNearbyWorkers = async () => {
    try {
      const params = {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: user?.searchRadius || 50, // Utiliser le rayon configuré par l'utilisateur
        available: true,
      };

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      console.log('🔍 Fetching workers with params:', params);
      const response = await api.get('/worker-profile/nearby', { params });
      console.log('✅ Workers response:', response.data);

      if (response.data.success) {
        setWorkers(response.data.workers);
      }
    } catch (error) {
      console.error('❌ Erreur chargement workers:', error.response?.status, error.message);
      console.error('Error details:', error.response?.data);
    }
  };

  const handleWorkerPress = (worker) => {
    navigation.navigate('WorkerDetails', { workerId: worker._id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="location-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.errorTitle}>Localisation requise</Text>
        <Text style={styles.errorText}>
          Veuillez activer la localisation pour voir les travailleurs à proximité
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestLocationPermission}>
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
          markers={workers.map((worker) => ({
            id: worker._id,
            coordinate: {
              latitude: worker.location?.coordinates?.[1] || location.latitude,
              longitude: worker.location?.coordinates?.[0] || location.longitude,
            },
            title: worker.userId?.fullName || 'Travailleur',
            description: worker.categories?.join(', ') || '',
          }))}
          onMarkerPress={(marker) => {
            const worker = workers.find((w) => w._id === marker.id);
            if (worker) {
              navigation.navigate('WorkerProfile', { workerId: worker._id });
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
              {workers.length} travailleur{workers.length > 1 ? 's' : ''} disponible{workers.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      )}

      {/* Compact Category Filter - Horizontal Scroll at Top */}
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
              Tous
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
              <Text style={styles.categoryEmoji}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextSelected,
                ]}
              >
                {category.id}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Recenter Button */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={() => {
          // Recentrer sur la position de l'utilisateur
        }}
      >
        <Ionicons name="locate" size={24} color={COLORS.text} />
      </TouchableOpacity>

      {/* Smart Search Button */}
      <TouchableOpacity
        style={styles.smartSearchButton}
        onPress={() => navigation.navigate('SmartSearch')}
      >
        <Ionicons name="sparkles" size={20} color={COLORS.white} />
        <Text style={styles.smartSearchText}>Recherche IA</Text>
      </TouchableOpacity>

      {/* Chatbot FAB */}
      <TouchableOpacity
        style={[styles.fab, styles.chatbotFab]}
        onPress={() => navigation.navigate('Chatbot')}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* New Request FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateRequest')}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Workers Count Badge */}
      {workers.length > 0 && (
        <View style={styles.counterBadge}>
          <Ionicons name="people" size={16} color={COLORS.primary} />
          <Text style={styles.counterText}>
            {workers.length} travailleur{workers.length > 1 ? 's' : ''} à proximité
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
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
  categoryContainer: {
    position: 'absolute',
    top: 0,
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
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundDark,
    marginRight: 8,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryTextSelected: {
    color: COLORS.white,
  },
  customMarker: {
    alignItems: 'center',
  },
  markerBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  markerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  recenterButton: {
    position: 'absolute',
    right: 16,
    bottom: 160,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  smartSearchButton: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: COLORS.secondary || '#9C27B0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  smartSearchText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
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
  },
  chatbotFab: {
    left: 16,
    bottom: 104,
    backgroundColor: COLORS.secondary || '#9C27B0',
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

export default ClientHomeScreen;
