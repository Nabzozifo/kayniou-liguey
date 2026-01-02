import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { formatCurrency } from '../../config/regional';

const AvailableRequestsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [filterInfo, setFilterInfo] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchFilteredRequests();
    }, [user])
  );

  const fetchFilteredRequests = async () => {
    try {
      console.log('🔍 Chargement demandes filtrées pour worker:', user.id);

      // Nouvelle route qui filtre automatiquement par les métiers du worker
      const response = await api.get(`/service-requests/available-for-worker/${user.id}`);

      console.log('📊 Response:', response.data);

      if (response.data.success) {
        setRequests(response.data.requests || []);
        setFilterInfo(response.data.filters);

        // Afficher un message si le worker n'a pas de métiers sélectionnés
        if (response.data.requests.length === 0 && !response.data.filters) {
          Alert.alert(
            'Profil incomplet',
            'Veuillez compléter votre profil et sélectionner vos métiers pour voir les demandes disponibles.',
            [
              {
                text: 'Compléter',
                onPress: () => navigation.navigate('EditWorkerProfile'),
              },
              { text: 'Plus tard', style: 'cancel' },
            ]
          );
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement demandes:', error);
      console.error('Error details:', error.response?.data);

      if (error.response?.status === 404) {
        Alert.alert(
          'Profil Worker Non Trouvé',
          'Vous devez d\'abord créer votre profil professionnel.',
          [
            {
              text: 'Créer mon profil',
              onPress: () => navigation.navigate('EditWorkerProfile'),
            },
            { text: 'Plus tard', style: 'cancel' },
          ]
        );
        setRequests([]);
      } else if (error.response?.status === 400) {
        Alert.alert(
          'Profil Incomplet',
          error.response.data.message || 'Veuillez sélectionner vos métiers dans votre profil.',
          [
            {
              text: 'Compléter le profil',
              onPress: () => navigation.navigate('EditWorkerProfile'),
            },
            { text: 'Plus tard', style: 'cancel' },
          ]
        );
        setRequests([]);
      } else {
        Alert.alert('Erreur', 'Impossible de charger les demandes');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFilteredRequests();
    setRefreshing(false);
  };

  const getUrgencyConfig = (urgency) => {
    switch (urgency) {
      case 'high':
        return {
          label: 'Urgent',
          color: COLORS.error,
          icon: 'alert-circle',
          bgColor: COLORS.error + '20',
        };
      case 'medium':
        return {
          label: 'Moyen',
          color: COLORS.warning,
          icon: 'time',
          bgColor: COLORS.warning + '20',
        };
      case 'low':
        return {
          label: 'Normal',
          color: COLORS.success,
          icon: 'checkmark-circle',
          bgColor: COLORS.success + '20',
        };
      default:
        return {
          label: urgency,
          color: COLORS.textSecondary,
          icon: 'help-circle',
          bgColor: COLORS.backgroundDark,
        };
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const renderRequestCard = ({ item: request }) => {
    const urgencyConfig = getUrgencyConfig(request.urgency);

    // Utiliser la distance du backend (calculée par $geoNear)
    // distance est en mètres, convertir en km
    const distance = request.distance
      ? (request.distance / 1000).toFixed(1)
      : null;

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => navigation.navigate('RequestDetails', { requestId: request._id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.requestTitle} numberOfLines={2}>
              {request.title}
            </Text>
            <Text style={styles.requestDate}>{formatDate(request.createdAt)}</Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyConfig.bgColor }]}>
            <Ionicons name={urgencyConfig.icon} size={14} color={urgencyConfig.color} />
            <Text style={[styles.urgencyText, { color: urgencyConfig.color }]}>
              {urgencyConfig.label}
            </Text>
          </View>
        </View>

        <Text style={styles.requestDescription} numberOfLines={3}>
          {request.description}
        </Text>

        <View style={styles.cardDivider} />

        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>
                {distance ? `${distance} km` : request.location.address || 'À proximité'}
              </Text>
            </View>

            {request.estimatedBudget && (
              <View style={styles.infoItem}>
                <Ionicons name="cash" size={16} color={COLORS.success} />
                <Text style={styles.infoValue}>
                  {formatCurrency(request.estimatedBudget)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.categoriesContainer}>
              {request.categories.slice(0, 3).map((category, index) => (
                <View key={index} style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{category}</Text>
                </View>
              ))}
              {request.categories.length > 3 && (
                <Text style={styles.moreCategories}>+{request.categories.length - 3}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.quoteCount}>
            <Ionicons name="document-text" size={16} color={COLORS.textSecondary} />
            <Text style={styles.quoteCountText}>
              {request.quoteCount || 0} devis
            </Text>
          </View>

          <View style={styles.viewDetailsLink}>
            <Text style={styles.viewDetailsText}>Soumettre un devis</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={COLORS.textLight} />
      <Text style={styles.emptyTitle}>Aucune demande disponible</Text>
      <Text style={styles.emptyMessage}>
        Il n'y a pas de demandes correspondant à vos critères pour le moment. Vérifiez plus tard.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Ionicons name="refresh" size={20} color={COLORS.white} />
        <Text style={styles.refreshButtonText}>Actualiser</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des demandes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Info Banner */}
      {filterInfo && (
        <View style={styles.filterBanner}>
          <Ionicons name="filter" size={20} color={COLORS.primary} />
          <View style={styles.filterBannerContent}>
            <Text style={styles.filterBannerTitle}>Demandes filtrées</Text>
            <Text style={styles.filterBannerText}>
              Métiers: {filterInfo.categories?.join(', ')}
              {filterInfo.radius && ` • Rayon: ${filterInfo.radius} km`}
            </Text>
          </View>
        </View>
      )}

      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{requests.length}</Text>
          <Text style={styles.statLabel}>Demandes disponibles</Text>
        </View>
        {filterInfo?.radius && (
          <View style={styles.locationBadge}>
            <Ionicons name="location" size={14} color={COLORS.primary} />
            <Text style={styles.locationText}>{filterInfo.radius} km de rayon</Text>
          </View>
        )}
      </View>

      {/* Requests List */}
      <FlatList
        data={requests}
        renderItem={renderRequestCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />
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
  filterBanner: {
    backgroundColor: COLORS.primary + '15',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary + '30',
  },
  filterBannerContent: {
    flex: 1,
    marginLeft: 12,
  },
  filterBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  filterBannerText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  cardInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryTag: {
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  moreCategories: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  quoteCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quoteCountText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  viewDetailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AvailableRequestsScreen;
