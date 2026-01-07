import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import api from '../services/api';
import MapsView from './MapsView';

const { width } = Dimensions.get('window');

/**
 * Composant de suivi en temps réel pour le CLIENT
 * Affiche la carte OpenStreetMap avec la position du worker et le trajet
 * S'active quand le worker indique qu'il est "en route"
 */
const ClientWorksiteTracker = ({ worksite, onStatusUpdated }) => {
  const [workerLocation, setWorkerLocation] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Préparer les markers pour MapsView
  const markers = [];

  // Marker: Destination (Chantier)
  if (worksite.location) {
    markers.push({
      id: 'chantier',
      coordinate: {
        latitude: worksite.location.coordinates[1],
        longitude: worksite.location.coordinates[0],
      },
      title: 'Chantier',
      description: worksite.address,
      color: COLORS.danger,
      icon: 'location',
    });
  }

  // Marker: Position actuelle du worker
  if (workerLocation) {
    markers.push({
      id: 'worker',
      coordinate: {
        latitude: workerLocation.coordinates[1],
        longitude: workerLocation.coordinates[0],
      },
      title: 'Travailleur',
      description: worksite.workerInfo?.name || 'En déplacement',
      color: statusInfo.color,
      icon: statusInfo.icon,
    });
  }

  // Calculer la région pour centrer la carte
  const region = worksite.location ? {
    latitude: worksite.location.coordinates[1],
    longitude: worksite.location.coordinates[0],
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : null;

  return (
    <View style={styles.container}>
      {/* Header - Toujours visible */}
      <TouchableOpacity
        style={[styles.header, { backgroundColor: statusInfo.color + '20' }]}
        onPress={() => setIsExpanded(!isExpanded)}
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

      {/* Carte OpenStreetMap - Affichée uniquement si expanded */}
      {isExpanded && region && (
        <View style={styles.mapContainer}>
          <MapsView
            region={region}
            markers={markers}
            style={styles.map}
          />

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
