import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { formatCurrency } from '../../config/regional';
import WorkerStatusTracker from '../../components/WorkerStatusTracker';

const WorksiteDetailsScreen = ({ route, navigation }) => {
  const { worksiteId } = route.params;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [worksite, setWorksite] = useState(null);
  const [activities, setActivities] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    fetchWorksite();
    fetchActivities();
  }, [worksiteId]);

  useEffect(() => {
    if (worksite && worksite.status === 'completed') {
      checkCanRate();
    }
  }, [worksite]);

  const fetchWorksite = async () => {
    try {
      console.log('🔍 Chargement chantier:', worksiteId);
      const response = await api.get(`/worksites/${worksiteId}`);

      console.log('✅ Chantier:', response.data);

      if (response.data.success) {
        setWorksite(response.data.worksite);
      }
    } catch (error) {
      console.error('❌ Erreur chargement chantier:', error);
      Alert.alert('Erreur', 'Impossible de charger le chantier');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await api.get(`/worksites/${worksiteId}/activity`);

      if (response.data.success) {
        setActivities(response.data.activities || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement activités:', error);
    }
  };

  const checkCanRate = async () => {
    try {
      const response = await api.get(`/ratings/can-rate/${worksiteId}`);

      if (response.data.success) {
        setCanRate(response.data.canRate);
        setHasRated(!response.data.canRate && response.data.existingRating);
      }
    } catch (error) {
      console.error('❌ Erreur vérification notation:', error);
    }
  };

  const handleRateWorksite = () => {
    const isWorker = user.id === worksite.workerId?._id;
    const reviewedId = isWorker ? worksite.clientId?._id : worksite.workerId?._id;
    const reviewedName = isWorker ? worksite.clientInfo?.name : worksite.workerInfo?.name;

    navigation.navigate('Rating', {
      worksiteId: worksite._id,
      worksiteTitle: worksite.title,
      reviewedId,
      reviewedName,
      reviewerType: isWorker ? 'worker' : 'client',
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWorksite(), fetchActivities()]);
    setRefreshing(false);
  };

  // Communication functions
  const handleSendMessage = async () => {
    const otherUserId = isClient ? worksite.workerId?._id : worksite.clientId?._id;
    const otherUserName = isClient ? worksite.workerInfo?.name : worksite.clientInfo?.name;

    if (!otherUserId) {
      Alert.alert('Erreur', 'Informations du destinataire non disponibles');
      return;
    }

    try {
      // Créer ou récupérer la conversation
      console.log('🔍 Récupération conversation pour requestId:', worksite.requestId);

      const response = await api.post('/chat/conversations', {
        requestId: worksite.requestId?._id || worksite.requestId,
        workerId: worksite.workerId?._id || worksite.workerId,
      });

      if (response.data.success) {
        const conversationId = response.data.conversation._id;
        console.log('✅ Conversation récupérée:', conversationId);

        navigation.navigate('Chat', {
          conversationId,
          otherUserId,
          otherUserName,
          worksiteId: worksite._id,
          worksiteTitle: worksite.title,
        });
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir la conversation');
      }
    } catch (error) {
      console.error('❌ Erreur création/récupération conversation:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la conversation. Veuillez réessayer.');
    }
  };

  const handleCall = () => {
    const phoneNumber = isClient ? worksite.workerInfo?.phone : worksite.clientInfo?.phone;

    if (!phoneNumber) {
      Alert.alert('Erreur', 'Numéro de téléphone non disponible');
      return;
    }

    Alert.alert(
      'Appeler',
      `Voulez-vous appeler ${isClient ? worksite.workerInfo?.name : worksite.clientInfo?.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Appeler',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`);
          },
        },
      ]
    );
  };

  const handleStartWork = async () => {
    Alert.alert(
      'Démarrer le travail',
      'Confirmez-vous le démarrage de ce chantier ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Démarrer',
          onPress: async () => {
            setActionLoading(true);
            try {
              const response = await api.put(`/worksites/${worksiteId}/start`);

              if (response.data.success) {
                Alert.alert('Succès', 'Chantier démarré avec succès');
                await onRefresh();
              }
            } catch (error) {
              console.error('❌ Erreur démarrage:', error);
              Alert.alert(
                'Erreur',
                error.response?.data?.message || 'Impossible de démarrer le travail'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleFinishWork = async () => {
    Alert.alert(
      'Terminer le travail',
      'Confirmez-vous la fin de ce chantier ? Le client sera notifié.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: async () => {
            setActionLoading(true);
            try {
              const response = await api.put(`/worksites/${worksiteId}/finish`);

              if (response.data.success) {
                const duration = response.data.duration?.toFixed(2);
                Alert.alert(
                  'Succès',
                  `Chantier terminé avec succès!\n\nDurée totale: ${duration} heures`
                );
                await onRefresh();
              }
            } catch (error) {
              console.error('❌ Erreur terminaison:', error);
              Alert.alert(
                'Erreur',
                error.response?.data?.message || 'Impossible de terminer le travail'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleValidateWork = async () => {
    Alert.alert(
      'Valider le travail',
      'Confirmez-vous la validation de ce travail ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: async () => {
            setActionLoading(true);
            try {
              const response = await api.put(`/worksites/${worksiteId}/validate`);

              if (response.data.success) {
                Alert.alert('Succès', 'Travail validé avec succès');
                await onRefresh();
              }
            } catch (error) {
              console.error('❌ Erreur validation:', error);
              Alert.alert(
                'Erreur',
                error.response?.data?.message || 'Impossible de valider le travail'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelWorksite = async () => {
    Alert.alert(
      'Annuler le chantier',
      'Êtes-vous sûr de vouloir annuler ce chantier ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const response = await api.put(`/worksites/${worksiteId}/cancel`, {
                reason: 'Annulé par ' + (isClient ? 'le client' : 'le travailleur'),
              });

              if (response.data.success) {
                Alert.alert('Succès', 'Chantier annulé', [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              }
            } catch (error) {
              console.error('❌ Erreur annulation:', error);
              Alert.alert(
                'Erreur',
                error.response?.data?.message || 'Impossible d\'annuler le chantier'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'En attente', color: COLORS.warning, icon: 'time' };
      case 'in_progress':
        return { label: 'En cours', color: COLORS.info, icon: 'hammer' };
      case 'completed':
        return { label: 'Terminé', color: COLORS.success, icon: 'checkmark-circle' };
      case 'cancelled':
        return { label: 'Annulé', color: COLORS.danger, icon: 'close-circle' };
      default:
        return { label: status, color: COLORS.textSecondary, icon: 'help-circle' };
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (hours) => {
    if (!hours) return 'N/A';
    if (hours < 24) return `${hours.toFixed(1)} heures`;
    const days = Math.floor(hours / 24);
    const remainingHours = (hours % 24).toFixed(1);
    return `${days} jour${days > 1 ? 's' : ''} ${remainingHours}h`;
  };

  const renderActivity = ({ item: activity }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityIconContainer}>
        <Ionicons
          name={getActivityIcon(activity.type)}
          size={20}
          color={COLORS.primary}
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        <Text style={styles.activityTime}>
          {formatDateTime(activity.createdAt)}
        </Text>
      </View>
    </View>
  );

  const getActivityIcon = (type) => {
    const icons = {
      created: 'add-circle',
      started: 'play-circle',
      completed: 'checkmark-circle',
      validated: 'shield-checkmark',
      cancelled: 'close-circle',
      status_changed: 'swap-horizontal',
    };
    return icons[type] || 'information-circle';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!worksite) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.danger} />
        <Text style={styles.errorText}>Chantier introuvable</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isWorker = user.id === worksite.workerId?._id;
  const isClient = user.id === worksite.clientId?._id;
  const statusConfig = getStatusConfig(worksite.status);

  const canStart = isWorker && worksite.status === 'pending';
  const canFinish = isWorker && worksite.status === 'in_progress';
  const canValidate =
    isClient && worksite.status === 'completed' && !worksite.isValidatedByClient;
  const canCancel =
    (isWorker || isClient) &&
    (worksite.status === 'pending' || worksite.status === 'in_progress');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Status Badge */}
      <View
        style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}
      >
        <Ionicons name={statusConfig.icon} size={24} color={statusConfig.color} />
        <Text style={[styles.statusText, { color: statusConfig.color }]}>
          {statusConfig.label}
        </Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{worksite.title}</Text>

      {/* Info Cards */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>
              {isWorker ? 'Client' : 'Travailleur'}
            </Text>
            <Text style={styles.infoValue}>
              {isWorker ? worksite.clientInfo?.name : worksite.workerInfo?.name}
            </Text>
            <Text style={styles.infoSubValue}>
              {isWorker ? worksite.clientInfo?.phone : worksite.workerInfo?.phone}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={20} color={COLORS.success} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Prix convenu</Text>
            <Text style={styles.infoValue}>
              {formatCurrency(worksite.agreedPrice)}
            </Text>
          </View>
        </View>
      </View>

      {/* Worker Real-time Status Tracker - Only for workers */}
      {isWorker && worksite.status !== 'cancelled' && worksite.status !== 'completed' && (
        <WorkerStatusTracker worksite={worksite} onStatusUpdated={onRefresh} />
      )}

      {/* Time Tracking */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏱️ Suivi du temps</Text>
        <View style={styles.timeCard}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Début:</Text>
            <Text style={styles.timeValue}>
              {formatDateTime(worksite.startTime)}
            </Text>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Fin:</Text>
            <Text style={styles.timeValue}>
              {formatDateTime(worksite.endTime)}
            </Text>
          </View>
          {worksite.actualDuration && (
            <View style={[styles.timeRow, styles.durationRow]}>
              <Text style={styles.durationLabel}>Durée totale:</Text>
              <Text style={styles.durationValue}>
                {formatDuration(worksite.actualDuration)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Description</Text>
        <Text style={styles.description}>{worksite.description}</Text>
      </View>

      {/* Services Included */}
      {worksite.servicesIncluded && worksite.servicesIncluded.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✓ Services inclus</Text>
          {worksite.servicesIncluded.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Communication Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💬 Communication</Text>
        <View style={styles.communicationContainer}>
          <TouchableOpacity
            style={styles.communicationButton}
            onPress={handleSendMessage}
          >
            <View style={[styles.communicationIconContainer, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="chatbubble-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.communicationButtonText}>Envoyer un message</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.communicationButton}
            onPress={handleCall}
          >
            <View style={[styles.communicationIconContainer, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="call-outline" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.communicationButtonText}>Appeler</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.communicationNote}>
          📌 Tous les messages sont liés à ce chantier
        </Text>
      </View>

      {/* Activity Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Historique</Text>
        {activities.map((activity, index) => (
          <View key={activity._id || index}>
            {renderActivity({ item: activity })}
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {canStart && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={handleStartWork}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="play-circle" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Démarrer le travail</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {canFinish && (
          <TouchableOpacity
            style={[styles.actionButton, styles.finishButton]}
            onPress={handleFinishWork}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Terminer le travail</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {canValidate && (
          <TouchableOpacity
            style={[styles.actionButton, styles.validateButton]}
            onPress={handleValidateWork}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Valider le travail</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelWorksite}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Annuler le chantier</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {canRate && (
          <TouchableOpacity
            style={[styles.actionButton, styles.rateButton]}
            onPress={handleRateWorksite}
          >
            <Ionicons name="star" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Évaluer ce chantier</Text>
          </TouchableOpacity>
        )}

        {hasRated && (
          <View style={styles.ratedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.ratedText}>Vous avez déjà évalué ce chantier</Text>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  infoSubValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  timeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  durationRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  serviceText: {
    fontSize: 14,
    color: COLORS.text,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  startButton: {
    backgroundColor: COLORS.info,
  },
  finishButton: {
    backgroundColor: COLORS.success,
  },
  validateButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: COLORS.danger,
  },
  rateButton: {
    backgroundColor: COLORS.warning,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  ratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.success + '15',
    borderWidth: 1,
    borderColor: COLORS.success,
    gap: 8,
  },
  ratedText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  communicationContainer: {
    gap: 12,
  },
  communicationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  communicationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communicationButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  communicationNote: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default WorksiteDetailsScreen;
