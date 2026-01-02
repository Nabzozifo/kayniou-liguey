import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { formatCurrency } from '../../config/regional';

const WorksitesListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [worksites, setWorksites] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, in_progress, completed

  useFocusEffect(
    useCallback(() => {
      fetchWorksites();
    }, [filter])
  );

  const fetchWorksites = async () => {
    try {
      console.log('🔍 Chargement chantiers...');

      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/worksites', { params });

      console.log('✅ Chantiers:', response.data);

      if (response.data.success) {
        setWorksites(response.data.worksites || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement chantiers:', error);
      setWorksites([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorksites();
    setRefreshing(false);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          label: 'En attente',
          color: COLORS.warning,
          icon: 'time',
          bgColor: '#FFF4E5',
        };
      case 'in_progress':
        return {
          label: 'En cours',
          color: COLORS.info,
          icon: 'hammer',
          bgColor: '#E3F2FD',
        };
      case 'completed':
        return {
          label: 'Terminé',
          color: COLORS.success,
          icon: 'checkmark-circle',
          bgColor: '#E8F5E9',
        };
      case 'cancelled':
        return {
          label: 'Annulé',
          color: COLORS.danger,
          icon: 'close-circle',
          bgColor: '#FFEBEE',
        };
      default:
        return {
          label: status,
          color: COLORS.textSecondary,
          icon: 'help-circle',
          bgColor: COLORS.background,
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDuration = (hours) => {
    if (!hours) return '';
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}j ${remainingHours}h`;
  };

  const renderWorksite = ({ item: worksite }) => {
    const statusConfig = getStatusConfig(worksite.status);
    const isWorker = user.id === worksite.workerId?._id;
    const otherPerson = isWorker ? worksite.clientInfo : worksite.workerInfo;

    return (
      <TouchableOpacity
        style={styles.worksiteCard}
        onPress={() => navigation.navigate('WorksiteDetails', { worksiteId: worksite._id })}
      >
        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusConfig.bgColor, borderLeftColor: statusConfig.color },
          ]}
        >
          <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.worksiteTitle} numberOfLines={2}>
          {worksite.title}
        </Text>

        {/* Other Person Info */}
        <View style={styles.personRow}>
          <Ionicons
            name={isWorker ? 'person' : 'hammer'}
            size={16}
            color={COLORS.textSecondary}
          />
          <Text style={styles.personName} numberOfLines={1}>
            {otherPerson?.name || 'N/A'}
          </Text>
        </View>

        {/* Details Row */}
        <View style={styles.detailsRow}>
          {/* Price */}
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color={COLORS.primary} />
            <Text style={styles.detailText}>
              {formatCurrency(worksite.agreedPrice)}
            </Text>
          </View>

          {/* Duration */}
          {worksite.actualDuration && (
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.detailText}>
                {formatDuration(worksite.actualDuration)}
              </Text>
            </View>
          )}
        </View>

        {/* Date */}
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.dateText}>
            {worksite.startTime
              ? `Démarré le ${formatDate(worksite.startTime)}`
              : `Créé le ${formatDate(worksite.createdAt)}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (filterValue, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterValue && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(filterValue)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterValue && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="briefcase-outline" size={80} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>Aucun chantier</Text>
      <Text style={styles.emptyMessage}>
        {filter === 'all'
          ? 'Vos chantiers apparaîtront ici'
          : `Aucun chantier ${getStatusConfig(filter).label.toLowerCase()}`}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'Tous')}
        {renderFilterButton('pending', 'En attente')}
        {renderFilterButton('in_progress', 'En cours')}
        {renderFilterButton('completed', 'Terminés')}
      </View>

      {/* List */}
      <FlatList
        data={worksites}
        renderItem={renderWorksite}
        keyExtractor={(item) => item._id}
        contentContainerStyle={
          worksites.length === 0 ? styles.emptyList : styles.listContainer
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  listContainer: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  worksiteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderLeftWidth: 3,
    marginBottom: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  worksiteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  personName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default WorksitesListScreen;
