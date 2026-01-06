import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS } from '../constants';
import { worksiteService } from '../services/api';

const WorkerStatusTracker = ({ worksite, onStatusUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert(
          'Permission GPS requise',
          'Pour suivre votre position et prévenir la fraude, l\'accès GPS est nécessaire.'
        );
      }
    } catch (error) {
      console.error('Erreur permission GPS:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setGpsLoading(true);
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
    } catch (error) {
      console.error('Erreur GPS:', error);
      Alert.alert('Erreur GPS', 'Impossible d\'obtenir votre position actuelle.');
      return null;
    } finally {
      setGpsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus, statusLabel) => {
    if (!locationPermission) {
      Alert.alert(
        'Permission GPS requise',
        'Veuillez autoriser l\'accès à votre position pour continuer.'
      );
      requestLocationPermission();
      return;
    }

    Alert.alert(
      `Confirmer - ${statusLabel}`,
      `Voulez-vous marquer le statut comme "${statusLabel}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setLoading(true);
            try {
              // Get current GPS location
              const currentLocation = await getCurrentLocation();

              if (!currentLocation) {
                Alert.alert('Erreur', 'Position GPS introuvable. Veuillez réessayer.');
                setLoading(false);
                return;
              }

              console.log('📍 Mise à jour statut:', newStatus, currentLocation);

              // Call API to update status
              const response = await worksiteService.updateWorkerStatus(
                worksite._id,
                {
                  status: newStatus,
                  location: currentLocation,
                }
              );

              if (response.success) {
                Alert.alert('Succès', `Statut mis à jour: ${statusLabel}`);
                if (onStatusUpdated) {
                  onStatusUpdated();
                }
              }
            } catch (error) {
              console.error('❌ Erreur mise à jour statut:', error);

              const errorMessage = error.response?.data?.message ||
                                  'Impossible de mettre à jour le statut';

              // Show distance error if applicable
              if (error.response?.data?.distance) {
                const distance = error.response.data.distance;
                const maxDistance = error.response.data.maxDistance;
                Alert.alert(
                  'Distance insuffisante',
                  `${errorMessage}\n\nVotre distance: ${distance}km\nMaximum autorisé: ${maxDistance}km`
                );
              } else {
                Alert.alert('Erreur', errorMessage);
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'assigned':
        return {
          label: 'Assigné',
          color: COLORS.textSecondary,
          icon: 'clipboard',
          nextActions: [
            { status: 'en_route', label: 'Partir en route', icon: 'car', color: COLORS.info },
          ],
        };
      case 'en_route':
        return {
          label: 'En route',
          color: COLORS.info,
          icon: 'car',
          nextActions: [
            { status: 'arrived', label: 'Marquer arrivé', icon: 'location', color: COLORS.success },
          ],
        };
      case 'arrived':
        return {
          label: 'Arrivé',
          color: COLORS.success,
          icon: 'location',
          nextActions: [
            { status: 'work_started', label: 'Commencer travail', icon: 'hammer', color: COLORS.primary },
          ],
        };
      case 'work_started':
        return {
          label: 'Travail en cours',
          color: COLORS.primary,
          icon: 'hammer',
          nextActions: [
            { status: 'work_completed', label: 'Terminer travail', icon: 'checkmark-circle', color: COLORS.success },
          ],
        };
      case 'work_completed':
        return {
          label: 'Travail terminé',
          color: COLORS.success,
          icon: 'checkmark-circle',
          nextActions: [],
        };
      case 'left':
        return {
          label: 'Parti',
          color: COLORS.textSecondary,
          icon: 'exit',
          nextActions: [],
        };
      default:
        return {
          label: status || 'Inconnu',
          color: COLORS.textSecondary,
          icon: 'help-circle',
          nextActions: [],
        };
    }
  };

  const currentStatus = worksite.workerStatus || 'assigned';
  const statusConfig = getStatusConfig(currentStatus);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>📍 Suivi en temps réel</Text>

      {/* Current Status */}
      <View style={[styles.statusCard, { borderLeftColor: statusConfig.color }]}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusIconContainer, { backgroundColor: statusConfig.color + '20' }]}>
            <Ionicons name={statusConfig.icon} size={24} color={statusConfig.color} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Statut actuel</Text>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* GPS Status */}
        <View style={styles.gpsStatus}>
          <Ionicons
            name={locationPermission ? 'location' : 'location-outline'}
            size={16}
            color={locationPermission ? COLORS.success : COLORS.danger}
          />
          <Text style={styles.gpsText}>
            {gpsLoading ? 'Obtention GPS...' :
             locationPermission ? 'GPS activé' : 'GPS désactivé'}
          </Text>
          {location && (
            <Text style={styles.gpsCoords}>
              ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
            </Text>
          )}
        </View>
      </View>

      {/* Anti-Fraud Notice */}
      {currentStatus !== 'work_started' && currentStatus !== 'work_completed' && currentStatus !== 'left' ? (
        <View style={styles.noticeCard}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.warning} />
          <Text style={styles.noticeText}>
            {currentStatus === 'arrived'
              ? '✅ Vous êtes arrivé! Vous pouvez maintenant commencer le travail.'
              : '⚠️ Anti-fraude: Vous devez être physiquement sur le chantier (GPS validé) pour commencer le travail.'}
          </Text>
        </View>
      ) : null}

      {/* Next Actions */}
      {statusConfig.nextActions.length > 0 && (
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Actions disponibles:</Text>
          {statusConfig.nextActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, { backgroundColor: action.color }]}
              onPress={() => handleStatusUpdate(action.status, action.label)}
              disabled={loading || gpsLoading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name={action.icon} size={20} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>{action.label}</Text>
                  {gpsLoading && <ActivityIndicator size="small" color={COLORS.white} />}
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Status History Preview */}
      {worksite.statusHistory && worksite.statusHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Historique récent:</Text>
          {worksite.statusHistory.slice(-3).reverse().map((entry, index) => {
            const entryConfig = getStatusConfig(entry.status);
            return (
              <View key={index} style={styles.historyItem}>
                <Ionicons name={entryConfig.icon} size={16} color={entryConfig.color} />
                <Text style={styles.historyStatus}>{entryConfig.label}</Text>
                <Text style={styles.historyTime}>
                  {new Date(entry.timestamp).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
  },
  gpsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  gpsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  gpsCoords: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.warning + '15',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  actionsContainer: {
    marginBottom: 12,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  historyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  historyStatus: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  historyTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default WorkerStatusTracker;
