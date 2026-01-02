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

const MyRequestsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, assigned, completed

  useFocusEffect(
    useCallback(() => {
      fetchMyRequests();
    }, [filter])
  );

  const fetchMyRequests = async () => {
    try {
      // Récupérer toutes les demandes du client
      const response = await api.get('/service-requests', {
        params: {
          clientId: user.id,
        },
      });

      if (response.data.success) {
        let filteredRequests = response.data.requests;

        // Filtrer par statut si nécessaire
        if (filter !== 'all') {
          filteredRequests = filteredRequests.filter((r) => r.status === filter);
        }

        setRequests(filteredRequests);
      }
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
      Alert.alert('Erreur', 'Impossible de charger vos demandes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyRequests();
    setRefreshing(false);
  };

  const handleDeleteRequest = (request) => {
    // Vérifier que le chantier n'a pas commencé
    if (request.status === 'inProgress' || request.status === 'completed') {
      Alert.alert(
        'Suppression impossible',
        'Impossible de supprimer une demande dont le travail a commencé ou est terminé.'
      );
      return;
    }

    Alert.alert(
      'Supprimer la demande',
      'Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/service-requests/${request._id}`);

              if (response.data.success) {
                Alert.alert('Succès', 'Demande supprimée avec succès');
                fetchMyRequests(); // Refresh list
              }
            } catch (error) {
              console.error('Erreur suppression:', error);
              const message = error.response?.data?.message || 'Impossible de supprimer la demande';
              Alert.alert('Erreur', message);
            }
          },
        },
      ]
    );
  };

  const handleModifyRequest = async (request) => {
    // Vérifier d'abord s'il y a des devis
    try {
      const quotesResponse = await api.get(`/quotes/request/${request._id}`);
      const quoteCount = quotesResponse.data.totalCount || 0;

      if (quoteCount > 0) {
        Alert.alert(
          'Modification impossible',
          `Impossible de modifier la demande car ${quoteCount} devis ont déjà été soumis. Vous pouvez supprimer la demande et en créer une nouvelle.`,
          [
            { text: 'OK', style: 'cancel' },
            {
              text: 'Supprimer',
              style: 'destructive',
              onPress: () => handleDeleteRequest(request),
            },
          ]
        );
        return;
      }

      // Pas de devis, autoriser la modification
      navigation.navigate('EditRequest', { request });
    } catch (error) {
      console.error('Erreur vérification devis:', error);
      Alert.alert('Erreur', 'Impossible de vérifier les devis');
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          label: 'En attente',
          color: COLORS.warning,
          icon: 'time',
          bgColor: COLORS.warning + '20',
        };
      case 'assigned':
        return {
          label: 'Assignée',
          color: COLORS.info,
          icon: 'person',
          bgColor: COLORS.info + '20',
        };
      case 'inProgress':
        return {
          label: 'En cours',
          color: COLORS.primary,
          icon: 'build',
          bgColor: COLORS.primary + '20',
        };
      case 'completed':
        return {
          label: 'Terminée',
          color: COLORS.success,
          icon: 'checkmark-circle',
          bgColor: COLORS.success + '20',
        };
      case 'cancelled':
        return {
          label: 'Annulée',
          color: COLORS.error,
          icon: 'close-circle',
          bgColor: COLORS.error + '20',
        };
      default:
        return {
          label: status,
          color: COLORS.textSecondary,
          icon: 'help-circle',
          bgColor: COLORS.backgroundDark,
        };
    }
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

  const renderFilterButton = (value, label) => (
    <TouchableOpacity
      key={value}
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => {
        setFilter(value);
        setLoading(true);
      }}
    >
      <Text style={[styles.filterButtonText, filter === value && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderRequestCard = ({ item: request }) => {
    const statusConfig = getStatusConfig(request.status);

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
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <Text style={styles.requestDescription} numberOfLines={2}>
          {request.description}
        </Text>

        <View style={styles.cardDivider} />

        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={styles.infoText} numberOfLines={1}>
                {request.location?.address || 'Localisation'}
              </Text>
            </View>

            {request.estimatedBudget && (
              <View style={styles.infoItem}>
                <Ionicons name="cash" size={16} color={COLORS.success} />
                <Text style={styles.infoValue}>{formatCurrency(request.estimatedBudget)}</Text>
              </View>
            )}
          </View>

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

        <View style={styles.cardFooter}>
          <View style={styles.quoteCount}>
            <Ionicons name="document-text" size={16} color={COLORS.textSecondary} />
            <Text style={styles.quoteCountText}>{request.quoteCount || 0} devis reçus</Text>
          </View>

          <View style={styles.cardActions}>
            {/* Modifier button - only show if status is pending or assigned */}
            {(request.status === 'pending' || request.status === 'assigned') && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleModifyRequest(request);
                }}
              >
                <Ionicons name="create-outline" size={18} color={COLORS.info} />
              </TouchableOpacity>
            )}

            {/* Supprimer button - only show if status is pending or assigned */}
            {(request.status === 'pending' || request.status === 'assigned') && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteRequest(request);
                }}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            )}

            <View style={styles.viewDetailsLink}>
              <Text style={styles.viewDetailsText}>Détails</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const emptyMessages = {
      all: {
        icon: 'document-text-outline',
        title: 'Aucune demande',
        message: "Vous n'avez créé aucune demande pour le moment",
        action: 'Créer une demande',
      },
      pending: {
        icon: 'time-outline',
        title: 'Aucune demande en attente',
        message: 'Toutes vos demandes ont été traitées',
      },
      assigned: {
        icon: 'person-outline',
        title: 'Aucune demande assignée',
        message: "Aucun travailleur n'a été assigné pour le moment",
      },
      completed: {
        icon: 'checkmark-circle-outline',
        title: 'Aucune demande terminée',
        message: "Vous n'avez pas encore de demandes terminées",
      },
    };

    const config = emptyMessages[filter] || emptyMessages.all;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name={config.icon} size={64} color={COLORS.textLight} />
        <Text style={styles.emptyTitle}>{config.title}</Text>
        <Text style={styles.emptyMessage}>{config.message}</Text>
        {config.action && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateRequest')}
          >
            <Ionicons name="add" size={20} color={COLORS.white} />
            <Text style={styles.createButtonText}>{config.action}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement de vos demandes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{requests.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>
            {requests.filter((r) => r.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>
            {requests.filter((r) => r.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Terminées</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersRow}>
          {renderFilterButton('all', 'Toutes')}
          {renderFilterButton('pending', 'En attente')}
          {renderFilterButton('assigned', 'Assignées')}
          {renderFilterButton('completed', 'Terminées')}
        </View>
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateRequest')}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
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
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterButtonTextActive: {
    color: COLORS.white,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
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
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
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
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
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
});

export default MyRequestsScreen;
