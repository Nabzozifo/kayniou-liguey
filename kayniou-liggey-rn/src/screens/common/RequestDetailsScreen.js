import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { formatCurrency } from '../../config/regional';

const RequestDetailsScreen = ({ route, navigation }) => {
  const { requestId } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [request, setRequest] = useState(null);
  const [quotes, setQuotes] = useState([]);

  // Refetch data when screen comes into focus (after navigation back)
  useFocusEffect(
    useCallback(() => {
      fetchRequestDetails();
    }, [requestId])
  );

  const fetchRequestDetails = async () => {
    try {
      console.log('🔍 Chargement détails request:', requestId);

      const [requestRes, quotesRes] = await Promise.all([
        api.get(`/service-requests/${requestId}`),
        api.get(`/service-requests/${requestId}/quotes`),
      ]);

      console.log('📊 Request response:', requestRes.data);
      console.log('📊 Quotes response:', quotesRes.data);

      if (requestRes.data.success) {
        // L'API retourne 'serviceRequest' pas 'request'
        setRequest(requestRes.data.serviceRequest || requestRes.data.request);
      }

      if (quotesRes.data.success) {
        setQuotes(quotesRes.data.quotes || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement détails:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la demande');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequestDetails();
    setRefreshing(false);
  };

  const handleAcceptQuote = async (quoteId) => {
    Alert.alert(
      'Accepter le devis',
      'Voulez-vous accepter ce devis ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            try {
              const response = await api.put(`/quotes/${quoteId}/accept`);
              if (response.data.success) {
                Alert.alert('Succès', 'Devis accepté avec succès');
                fetchRequestDetails();
              }
            } catch (error) {
              console.error('Erreur acceptation devis:', error);
              Alert.alert('Erreur', 'Impossible d\'accepter le devis');
            }
          },
        },
      ]
    );
  };

  const handleRejectQuote = async (quoteId) => {
    Alert.alert(
      'Rejeter le devis',
      'Voulez-vous rejeter ce devis ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.put(`/quotes/${quoteId}/reject`);
              if (response.data.success) {
                Alert.alert('Succès', 'Devis rejeté');
                fetchRequestDetails();
              }
            } catch (error) {
              console.error('Erreur rejet devis:', error);
              Alert.alert('Erreur', 'Impossible de rejeter le devis');
            }
          },
        },
      ]
    );
  };

  const handleCreateQuote = () => {
    navigation.navigate('CreateQuote', { requestId: request._id });
  };

  const handleEditRequest = () => {
    // Navigate to edit screen with request data
    navigation.navigate('CreateRequest', {
      requestId: request._id,
      editMode: true,
      requestData: request
    });
  };

  const handleDeleteRequest = () => {
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
                Alert.alert('Succès', 'Demande supprimée avec succès', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              }
            } catch (error) {
              console.error('Erreur suppression demande:', error);
              const message = error.response?.data?.message || 'Impossible de supprimer la demande';
              Alert.alert('Erreur', message);
            }
          },
        },
      ]
    );
  };

  const getUrgencyConfig = (urgency) => {
    switch (urgency) {
      case 'high':
        return { label: 'Urgente', color: COLORS.error, icon: 'alert' };
      case 'medium':
        return { label: 'Moyenne', color: COLORS.warning, icon: 'alert-circle' };
      case 'low':
        return { label: 'Faible', color: COLORS.info, icon: 'time' };
      default:
        return { label: urgency, color: COLORS.textSecondary, icon: 'help-circle' };
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'En attente', color: COLORS.warning, icon: 'time' };
      case 'active':
        return { label: 'Active', color: COLORS.info, icon: 'checkmark-circle' };
      case 'assigned':
        return { label: 'Assignée', color: COLORS.primary, icon: 'person-add' };
      case 'inProgress':
        return { label: 'En cours', color: COLORS.accent, icon: 'hammer' };
      case 'completed':
        return { label: 'Terminée', color: COLORS.success, icon: 'checkmark-done' };
      case 'cancelled':
        return { label: 'Annulée', color: COLORS.error, icon: 'close-circle' };
      default:
        return { label: status, color: COLORS.textSecondary, icon: 'help-circle' };
    }
  };

  const getQuoteStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'En attente', color: COLORS.warning };
      case 'accepted':
        return { label: 'Accepté', color: COLORS.success };
      case 'rejected':
        return { label: 'Rejeté', color: COLORS.error };
      case 'expired':
        return { label: 'Expiré', color: COLORS.textLight };
      default:
        return { label: status, color: COLORS.textSecondary };
    }
  };

  const renderQuoteCard = (quote) => {
    const statusConfig = getQuoteStatusConfig(quote.status);
    const isClient = user.userType === 'client';
    // Le client peut accepter/rejeter les devis si la request est 'pending' OU 'active'
    const canInteract = isClient && quote.status === 'pending' && (request.status === 'pending' || request.status === 'active');

    return (
      <View key={quote._id} style={styles.quoteCard}>
        {/* Badge Meilleure Offre - visible seulement pour le client */}
        {isClient && quote.isBestOffer && (
          <View style={styles.bestOfferBadge}>
            <Ionicons name="trophy" size={16} color="#FFD700" />
            <Text style={styles.bestOfferText}>MEILLEURE OFFRE</Text>
          </View>
        )}

        <View style={styles.quoteHeader}>
          <View style={styles.workerInfo}>
            <View style={styles.workerAvatar}>
              <Text style={styles.workerAvatarText}>
                {quote.workerName?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.workerDetails}>
              <Text style={styles.workerName}>{quote.workerName}</Text>
              {quote.workerRating > 0 && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color={COLORS.warning} />
                  <Text style={styles.ratingText}>{quote.workerRating?.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.quoteStatusBadge, { backgroundColor: statusConfig.color + '20' }]}>
            <Text style={[styles.quoteStatusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Auction Score Display */}
        {quote.auctionScore > 0 && (
          <View style={styles.auctionScoreContainer}>
            <View style={styles.auctionScoreHeader}>
              <Ionicons name="analytics-outline" size={18} color={COLORS.primary} />
              <Text style={styles.auctionScoreLabel}>Score Global</Text>
              <Text style={styles.auctionScoreValue}>{quote.auctionScore}/100</Text>
            </View>
            {quote.scoreBreakdown && (
              <View style={styles.scoreBreakdownBars}>
                {Object.entries({
                  priceScore: { label: 'Prix', weight: '30%' },
                  qualityScore: { label: 'Qualité', weight: '25%' },
                  reliabilityScore: { label: 'Fiabilité', weight: '20%' },
                  speedScore: { label: 'Rapidité', weight: '15%' },
                }).map(([key, info]) => (
                  <View key={key} style={styles.scoreBarRow}>
                    <Text style={styles.scoreBarLabel}>{info.label}</Text>
                    <View style={styles.scoreBarContainer}>
                      <View
                        style={[
                          styles.scoreBarFill,
                          { width: `${quote.scoreBreakdown[key]}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.scoreBarValue}>{quote.scoreBreakdown[key]}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.quoteDivider} />

        <View style={styles.quoteContent}>
          <View style={styles.quoteRow}>
            <View style={styles.quoteInfoItem}>
              <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
              <Text style={styles.quoteInfoLabel}>Prix</Text>
            </View>
            <Text style={styles.quotePrice}>{formatCurrency(quote.price)}</Text>
          </View>

          <View style={styles.quoteRow}>
            <View style={styles.quoteInfoItem}>
              <Ionicons name="time-outline" size={18} color={COLORS.accent} />
              <Text style={styles.quoteInfoLabel}>Durée estimée</Text>
            </View>
            <Text style={styles.quoteValue}>{quote.estimatedDuration}h</Text>
          </View>

          {quote.description && (
            <View style={styles.quoteDescriptionContainer}>
              <Text style={styles.quoteDescriptionLabel}>Description:</Text>
              <Text style={styles.quoteDescription}>{quote.description}</Text>
            </View>
          )}

          {quote.servicesIncluded && quote.servicesIncluded.length > 0 && (
            <View style={styles.servicesContainer}>
              <Text style={styles.servicesLabel}>Services inclus:</Text>
              {quote.servicesIncluded.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.serviceText}>{service}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {canInteract && (
          <View style={styles.quoteActions}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleRejectQuote(quote._id)}
            >
              <Ionicons name="close" size={20} color={COLORS.error} />
              <Text style={styles.rejectButtonText}>Rejeter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptQuote(quote._id)}
            >
              <Ionicons name="checkmark" size={20} color={COLORS.white} />
              <Text style={styles.acceptButtonText}>Accepter</Text>
            </TouchableOpacity>
          </View>
        )}
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

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>Demande introuvable</Text>
      </View>
    );
  }

  const urgencyConfig = getUrgencyConfig(request.urgency);
  const statusConfig = getStatusConfig(request.status);
  const isClient = user.userType === 'client';
  const isWorker = user.userType === 'worker';
  const canSubmitQuote = isWorker && (request.mode === 'auction' || request.mode === 'private_auction' || request.mode === 'direct_hire') && (request.status === 'pending' || request.status === 'active');

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Request Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{request.title}</Text>
          </View>

          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: statusConfig.color + '20' }]}>
              <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
              <Text style={[styles.badgeText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: urgencyConfig.color + '20' }]}>
              <Ionicons name={urgencyConfig.icon} size={14} color={urgencyConfig.color} />
              <Text style={[styles.badgeText, { color: urgencyConfig.color }]}>
                {urgencyConfig.label}
              </Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="swap-horizontal-outline" size={14} color={COLORS.primary} />
              <Text style={styles.badgeText}>
                {request.mode === 'direct_hire' ? 'Direct' : request.mode === 'private_auction' ? 'Enchère Privée' : 'Enchères'}
              </Text>
            </View>
          </View>
        </View>

        {/* Request Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails de la demande</Text>

          {isClient && (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Client</Text>
                <Text style={styles.infoValue}>{request.clientName}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="reader-outline" size={20} color={COLORS.accent} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{request.description}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="apps-outline" size={20} color={COLORS.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Catégories</Text>
              <View style={styles.categoriesContainer}>
                {request.categories.map((category, index) => (
                  <View key={index} style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{category}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={20} color={COLORS.success} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Budget estimé</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(request.estimatedBudget)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={COLORS.error} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Localisation</Text>
              <Text style={styles.infoValue}>{request.location?.address || 'Non spécifiée'}</Text>
            </View>
          </View>
        </View>

        {/* Edit/Delete Buttons for Owner */}
        {isClient && request.clientId === user.id &&
         request.status !== 'inProgress' && request.status !== 'completed' && (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditRequest}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteRequest}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              <Text style={styles.deleteButtonText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quotes Section */}
        <View style={styles.card}>
          <View style={styles.quotesHeader}>
            <Text style={styles.cardTitle}>
              Devis reçus ({quotes.length})
            </Text>
            {canSubmitQuote && (
              <TouchableOpacity style={styles.addQuoteButton} onPress={handleCreateQuote}>
                <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                <Text style={styles.addQuoteText}>Soumettre</Text>
              </TouchableOpacity>
            )}
          </View>

          {quotes.length === 0 ? (
            <View style={styles.noQuotesContainer}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.noQuotesText}>Aucun devis pour le moment</Text>
              {canSubmitQuote && (
                <Text style={styles.noQuotesHint}>
                  Soyez le premier à soumettre un devis
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.quotesContainer}>
              {quotes.map(renderQuoteCard)}
            </View>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundDark,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.white,
    marginTop: 12,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quotesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addQuoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    gap: 4,
  },
  addQuoteText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  noQuotesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noQuotesText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  noQuotesHint: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
  quotesContainer: {
    gap: 12,
  },
  quoteCard: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workerAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  workerDetails: {
    gap: 2,
  },
  workerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  quoteStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quoteStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bestOfferBadge: {
    position: 'absolute',
    top: -12,
    right: 12,
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    zIndex: 1,
    elevation: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bestOfferText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B4513',
    letterSpacing: 0.5,
  },
  auctionScoreContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  auctionScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  auctionScoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  auctionScoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scoreBreakdownBars: {
    gap: 8,
  },
  scoreBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBarLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    width: 70,
  },
  scoreBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  scoreBarValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    width: 30,
    textAlign: 'right',
  },
  quoteDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  quoteContent: {
    gap: 12,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quoteInfoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  quotePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  quoteValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  quoteDescriptionContainer: {
    marginTop: 4,
  },
  quoteDescriptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  quoteDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  servicesContainer: {
    marginTop: 4,
  },
  servicesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  serviceText: {
    fontSize: 14,
    color: COLORS.text,
  },
  quoteActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.error,
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  bottomSpace: {
    height: 40,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 6,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.error,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },
});

export default RequestDetailsScreen;
