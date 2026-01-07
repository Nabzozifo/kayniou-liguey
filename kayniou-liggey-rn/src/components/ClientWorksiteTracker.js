import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import api from '../services/api';

const { width } = Dimensions.get('window');

/**
 * Composant de suivi en temps réel pour le CLIENT
 * Affiche la carte avec la position du worker et le trajet (style Uber/InDrive)
 * S'active quand le worker indique qu'il est "en route"
 */
const ClientWorksiteTracker = ({ worksite, onStatusUpdated }) => {
  const [workerLocation, setWorkerLocation] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const mapRef = useRef(null);

  // Polling pour récupérer la position du worker toutes les 10 secondes
  useEffect(() => {
    if (worksite.workerStatus === 'en_route' || worksite.workerStatus === 'arrived' || worksite.workerStatus === 'work_started') {
      fetchWorkerLocation();
      const interval = setInterval(fetchWorkerLocation, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [worksite.workerStatus, worksite._id]);

  const fetchWorkerLocation = async () => {
    try {
      const response = await api.get(`/worksites/${worksite._id}`);
      if (response.data.success && response.data.worksite.workerCurrentLocation) {
        setWorkerLocation(response.data.worksite.workerCurrentLocation);
      }
    } catch (error) {
      console.error('Erreur récupération position worker:', error);
    }
  };

  // Animation pour centrer la carte sur le worker et le chantier
  const fitMapToMarkers = () => {
    if (mapRef.current && workerLocation && worksite.location) {
      mapRef.current.fitToCoordinates(
        [
          {
            latitude: workerLocation.coordinates[1],
            longitude: workerLocation.coordinates[0],
          },
          {
            latitude: worksite.location.coordinates[1],
            longitude: worksite.location.coordinates[0],
          },
        ],
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        }
      );
    }
  };

  // Ne rien afficher si le worker n'est pas encore en route
  if (!worksite.workerStatus || worksite.workerStatus === 'assigned') {
    return null;
  }

  const getStatusInfo = () => {
    switch (worksite.workerStatus) {
      case 'en_route':
        return {
          icon: 'car',
          color: COLORS.info,
          label: 'Le travailleur est en route',
          message: 'Suivez sa position en temps réel',
        };
      case 'arrived':
        return {
          icon: 'location',
          color: COLORS.success,
          label: 'Le travailleur est arrivé',
          message: 'Il est sur place et va bientôt commencer',
        };
      case 'work_started':
        return {
          icon: 'hammer',
          color: COLORS.primary,
          label: 'Travail en cours',
          message: 'Le travailleur a commencé les travaux',
        };
      default:
        return {
          icon: 'information-circle',
          color: COLORS.textSecondary,
          label: 'Statut inconnu',
          message: '',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      {/* Header - Toujours visible */}
      <TouchableOpacity
        style={[styles.header, { backgroundColor: statusInfo.color + '20' }]}
        onPress={() => {
          setIsExpanded(!isExpanded);
          if (!isExpanded && workerLocation) {
            setTimeout(fitMapToMarkers, 100);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons name={statusInfo.icon} size={24} color={statusInfo.color} />
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
            <Text style={styles.headerSubtitle}>{statusInfo.message}</Text>
          </View>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={statusInfo.color}
        />
      </TouchableOpacity>

      {/* Carte - Affichée uniquement si expanded */}
      {isExpanded && workerLocation && worksite.location && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            style={styles.map}
            initialRegion={{
              latitude: worksite.location.coordinates[1],
              longitude: worksite.location.coordinates[0],
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
            onMapReady={fitMapToMarkers}
          >
            {/* Marker: Destination (Chantier) */}
            <Marker
              coordinate={{
                latitude: worksite.location.coordinates[1],
                longitude: worksite.location.coordinates[0],
              }}
              title="Chantier"
              description={worksite.address}
              pinColor={COLORS.danger}
            >
              <View style={styles.markerContainer}>
                <Ionicons name="location" size={40} color={COLORS.danger} />
              </View>
            </Marker>

            {/* Marker: Position actuelle du worker */}
            <Marker
              coordinate={{
                latitude: workerLocation.coordinates[1],
                longitude: workerLocation.coordinates[0],
              }}
              title="Travailleur"
              description={worksite.workerInfo?.name || 'En déplacement'}
              pinColor={statusInfo.color}
            >
              <View style={[styles.markerContainer, { backgroundColor: statusInfo.color }]}>
                <Ionicons name={statusInfo.icon} size={30} color="#fff" />
              </View>
            </Marker>

            {/* Ligne de trajet entre worker et chantier (seulement si en_route) */}
            {worksite.workerStatus === 'en_route' && (
              <Polyline
                coordinates={[
                  {
                    latitude: workerLocation.coordinates[1],
                    longitude: workerLocation.coordinates[0],
                  },
                  {
                    latitude: worksite.location.coordinates[1],
                    longitude: worksite.location.coordinates[0],
                  },
                ]}
                strokeColor={COLORS.primary}
                strokeWidth={3}
                lineDashPattern={[10, 5]}
              />
            )}
          </MapView>

          {/* Bouton pour recentrer la carte */}
          <TouchableOpacity
            style={styles.recenterButton}
            onPress={fitMapToMarkers}
            activeOpacity={0.8}
          >
            <Ionicons name="locate" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Info distance (si disponible) */}
          {worksite.workerDistance && worksite.workerStatus === 'en_route' && (
            <View style={styles.distanceContainer}>
              <Ionicons name="navigate" size={16} color={COLORS.textSecondary} />
              <Text style={styles.distanceText}>
                {worksite.workerDistance < 1000
                  ? `${Math.round(worksite.workerDistance)}m`
                  : `${(worksite.workerDistance / 1000).toFixed(1)}km`}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Message si pas de position GPS */}
      {isExpanded && !workerLocation && (
        <View style={styles.noLocationContainer}>
          <Ionicons name="location-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.noLocationText}>
            Position du travailleur non disponible
          </Text>
          <Text style={styles.noLocationSubtext}>
            La position sera affichée dès que le travailleur activera son GPS
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  mapContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  distanceContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  distanceText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  noLocationContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  noLocationText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
  },
  noLocationSubtext: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default ClientWorksiteTracker;
