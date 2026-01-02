import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

const MyQuotesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected

  useFocusEffect(
    useCallback(() => {
      fetchQuotes();
    }, [filter])
  );

  const fetchQuotes = async () => {
    try {
      const response = await api.get(`/quotes/worker/${user.id}`);

      if (response.data.success) {
        let filteredQuotes = response.data.quotes;

        if (filter !== 'all') {
          filteredQuotes = filteredQuotes.filter(q => q.status === filter);
        }

        setQuotes(filteredQuotes);
      }
    } catch (error) {
      console.error('Erreur chargement devis:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQuotes();
    setRefreshing(false);
  };

  const handleEditQuote = (quote) => {
    // Navigate to CreateQuote with edit mode
    navigation.navigate('CreateQuote', {
      requestId: quote.requestId,
      quoteId: quote._id,
      editMode: true,
      quoteData: quote
    });
  };

  const handleDeleteQuote = (quoteId) => {
    Alert.alert(
      'Supprimer le devis',
      'Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/quotes/${quoteId}`);
              if (response.data.success) {
                Alert.alert('Succès', 'Devis supprimé avec succès');
                fetchQuotes(); // Refresh list
              }
            } catch (error) {
              console.error('Erreur suppression devis:', error);
              const message = error.response?.data?.message || 'Impossible de supprimer le devis';
              Alert.alert('Erreur', message);
            }
          },
        },
      ]
    );
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
      case 'accepted':
        return {
          label: 'Accepté',
          color: COLORS.success,
          icon: 'checkmark-circle',
          bgColor: COLORS.success + '20',
        };
      case 'rejected':
        return {
          label: 'Rejeté',
          color: COLORS.error,
          icon: 'close-circle',
          bgColor: COLORS.error + '20',
        };
      case 'expired':
        return {
          label: 'Expiré',
          color: COLORS.textLight,
          icon: 'time-outline',
          bgColor: COLORS.backgroundDark,
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
      <Text
        style={[styles.filterButtonText, filter === value && styles.filterButtonTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderQuoteCard = ({ item: quote }) => {
    const statusConfig = getStatusConfig(quote.status);
    const isPending = quote.status === 'pending';

    return (
      <View style={styles.quoteCard}>
        <TouchableOpacity
          onPress={() => navigation.navigate('RequestDetails', { requestId: quote.requestId })}
        >
          <View style={styles.quoteHeader}>
            <View style={styles.quoteHeaderLeft}>
              <Text style={styles.quoteTitle} numberOfLines={1}>
                {quote.requestTitle || 'Demande'}
              </Text>
              <Text style={styles.quoteDate}>{formatDate(quote.createdAt)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <View style={styles.quoteDivider} />

          <View style={styles.quoteContent}>
            <View style={styles.quoteInfo}>
              <View style={styles.quoteInfoItem}>
                <Ionicons name="cash" size={20} color={COLORS.primary} />
                <View style={styles.quoteInfoText}>
                  <Text style={styles.quoteInfoLabel}>Prix</Text>
                  <Text style={styles.quoteInfoValue}>
                    {formatCurrency(quote.price)}
                  </Text>
                </View>
              </View>

              <View style={styles.quoteInfoItem}>
                <Ionicons name="time" size={20} color={COLORS.accent} />
                <View style={styles.quoteInfoText}>
                  <Text style={styles.quoteInfoLabel}>Durée</Text>
                  <Text style={styles.quoteInfoValue}>{quote.estimatedDuration}h</Text>
                </View>
              </View>
            </View>

            {quote.description && (
              <Text style={styles.quoteDescription} numberOfLines={2}>
                {quote.description}
              </Text>
            )}

            {quote.servicesIncluded && quote.servicesIncluded.length > 0 && (
              <View style={styles.servicesPreview}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                <Text style={styles.servicesPreviewText}>
                  {quote.servicesIncluded.length} service{quote.servicesIncluded.length > 1 ? 's' : ''} inclus
                </Text>
              </View>
            )}
          </View>

          <View style={styles.quoteFooter}>
            <View style={styles.scoreContainer}>
              {quote.score > 0 && (
                <>
                  <Ionicons name="trophy" size={16} color={COLORS.warning} />
                  <Text style={styles.scoreText}>Score: {quote.score}</Text>
                </>
              )}
            </View>
            <View style={styles.viewDetailsLink}>
              <Text style={styles.viewDetailsText}>Voir détails</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Edit/Delete Buttons - Only for pending quotes */}
        {isPending && (
          <View style={styles.quoteActions}>
            <TouchableOpacity
              style={styles.editQuoteButton}
              onPress={() => handleEditQuote(quote)}
            >
              <Ionicons name="create-outline" size={18} color={COLORS.primary} />
              <Text style={styles.editQuoteButtonText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteQuoteButton}
              onPress={() => handleDeleteQuote(quote._id)}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              <Text style={styles.deleteQuoteButtonText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => {
    const emptyMessages = {
      all: {
        icon: 'document-text-outline',
        title: 'Aucun devis',
        message: 'Vous n\'avez soumis aucun devis pour le moment',
      },
      pending: {
        icon: 'time-outline',
        title: 'Aucun devis en attente',
        message: 'Tous vos devis ont été traités',
      },
      accepted: {
        icon: 'checkmark-circle-outline',
        title: 'Aucun devis accepté',
        message: 'Continuez à proposer vos services',
      },
      rejected: {
        icon: 'close-circle-outline',
        title: 'Aucun devis rejeté',
        message: 'Vos devis sont appréciés',
      },
    };

    const config = emptyMessages[filter];

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name={config.icon} size={64} color={COLORS.textLight} />
        <Text style={styles.emptyTitle}>{config.title}</Text>
        <Text style={styles.emptyMessage}>{config.message}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{quotes.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>
            {quotes.filter(q => q.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>
            {quotes.filter(q => q.status === 'accepted').length}
          </Text>
          <Text style={styles.statLabel}>Acceptés</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtersRow}>
            {renderFilterButton('all', 'Tous')}
            {renderFilterButton('pending', 'En attente')}
            {renderFilterButton('accepted', 'Acceptés')}
            {renderFilterButton('rejected', 'Rejetés')}
          </View>
        </ScrollView>
      </View>

      {/* Quotes List */}
      <FlatList
        data={quotes}
        renderItem={renderQuoteCard}
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
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
  quoteCard: {
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
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quoteHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  quoteDate: {
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
  quoteDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  quoteContent: {
    gap: 12,
  },
  quoteInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  quoteInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quoteInfoText: {
    gap: 2,
  },
  quoteInfoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  quoteInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  quoteDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  servicesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  servicesPreviewText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '500',
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
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
  },
  quoteActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  editQuoteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 6,
  },
  editQuoteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  deleteQuoteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error,
    gap: 6,
  },
  deleteQuoteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.error,
  },
});

export default MyQuotesScreen;
