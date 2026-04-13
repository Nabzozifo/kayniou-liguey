import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { formatCurrency } from '../../config/regional';

const QuoteDetailsScreen = ({ route, navigation }) => {
  const { quoteId } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    fetchQuoteDetails();
  }, [quoteId]);

  const fetchQuoteDetails = async () => {
    try {
      console.log('🔍 Fetching quote details:', quoteId);
      const response = await api.get(`/quotes/${quoteId}`);
      console.log('✅ Quote response:', response.data);

      if (response.data.success) {
        setQuote(response.data.quote);
      }
    } catch (error) {
      console.error('❌ Erreur chargement devis:', error.response?.status, error.message);
      Alert.alert('Erreur', 'Impossible de charger les détails du devis');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    Alert.alert(
      'Accepter le devis',
      'Voulez-vous vraiment accepter ce devis ? Cette action assignera le travailleur à votre demande.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            try {
              const response = await api.put(`/quotes/${quoteId}/accept`);
              if (response.data.success) {
                Alert.alert('Succès', 'Devis accepté avec succès!', [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]);
              }
            } catch (error) {
              console.error('Erreur acceptation:', error);
              Alert.alert('Erreur', "Impossible d'accepter le devis");
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    Alert.alert(
      'Rejeter le devis',
      'Voulez-vous vraiment rejeter ce devis ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.put(`/quotes/${quoteId}/reject`);
              if (response.data.success) {
                Alert.alert('Succès', 'Devis rejeté', [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]);
              }
            } catch (error) {
              console.error('Erreur rejet:', error);
              Alert.alert('Erreur', 'Impossible de rejeter le devis');
            }
          },
        },
      ]
    );
  };

  const handleCall = () => {
    if (quote?.workerPhone) {
      Linking.openURL(`tel:${quote.workerPhone}`);
    }
  };

  const handleMessage = () => {
    navigation.navigate('Chat', {
      workerId: quote.workerId,
      workerName: quote.workerName,
    });
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
          icon: 'alert-circle',
          bgColor: COLORS.textLight + '20',
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement du devis...</Text>
      </View>
    );
  }

  if (!quote) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>Devis introuvable</Text>
      </View>
    );
  }

  const statusConfig = getStatusConfig(quote.status);
  const isClient = user.userType === 'client';
  const canAccept = isClient && quote.status === 'pending';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.statusBadge} style={{ backgroundColor: statusConfig.bgColor }}>
            <Ionicons name={statusConfig.icon} size={18} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>

          <Text style={styles.headerTitle}>Devis</Text>
          <Text style={styles.quoteNumber}>#{quote._id.slice(-8).toUpperCase()}</Text>
        </View>

        {/* Worker Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Travailleur</Text>

          <View style={styles.workerSection}>
            <View style={styles.workerAvatar}>
              <Text style={styles.workerAvatarText}>
                {(quote.workerName?.[0] || '?').toUpperCase()}
              </Text>
            </View>

            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{quote.workerName}</Text>

              {quote.workerRating > 0 && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color={COLORS.warning} />
                  <Text style={styles.ratingText}>
                    {quote.workerRating.toFixed(1)}
                  </Text>
                  <Text style={styles.reviewCount}>
                    ({quote.workerReviews || 0} avis)
                  </Text>
                </View>
              )}

              {quote.workerPhone && (
                <TouchableOpacity style={styles.phoneRow} onPress={handleCall}>
                  <Ionicons name="call" size={14} color={COLORS.primary} />
                  <Text style={styles.phoneText}>{quote.workerPhone}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Quote Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails du devis</Text>

          {/* Price */}
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="cash" size={24} color={COLORS.success} />
              <Text style={styles.detailLabel}>Prix total</Text>
            </View>
            <Text style={styles.priceValue}>{formatCurrency(quote.price)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Duration */}
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="time" size={24} color={COLORS.info} />
              <Text style={styles.detailLabel}>Durée estimée</Text>
            </View>
            <Text style={styles.detailValue}>{quote.estimatedDuration}h</Text>
          </View>

          <View style={styles.divider} />

          {/* Validity */}
          {quote.validUntil && (
            <>
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Ionicons name="calendar" size={24} color={COLORS.accent} />
                  <Text style={styles.detailLabel}>Valide jusqu'au</Text>
                </View>
                <Text style={styles.detailValue}>
                  {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Description */}
          {quote.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Description du travail</Text>
              <Text style={styles.descriptionText}>{quote.description}</Text>
            </View>
          )}

          {/* Services Included */}
          {quote.servicesIncluded && quote.servicesIncluded.length > 0 && (
            <View style={styles.servicesSection}>
              <Text style={styles.servicesTitle}>Services inclus</Text>
              {quote.servicesIncluded.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  <Text style={styles.serviceText}>{service}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Materials */}
          {quote.materialsIncluded !== undefined && (
            <>
              <View style={styles.divider} />
              <View style={styles.materialRow}>
                <Ionicons
                  name={quote.materialsIncluded ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={quote.materialsIncluded ? COLORS.success : COLORS.error}
                />
                <Text style={styles.materialText}>
                  {quote.materialsIncluded
                    ? 'Matériaux inclus dans le prix'
                    : 'Matériaux non inclus'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Request Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Demande associée</Text>

          <TouchableOpacity
            style={styles.requestCard}
            onPress={() => navigation.navigate('RequestDetails', { requestId: quote.requestId })}
          >
            <Text style={styles.requestTitle}>{quote.requestTitle}</Text>
            <View style={styles.requestFooter}>
              <Text style={styles.requestBudget}>
                Budget: {formatCurrency(quote.requestBudget)}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Dates Info */}
        <View style={styles.card}>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.dateText}>
              Créé le {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>

          {quote.updatedAt !== quote.createdAt && (
            <View style={styles.dateRow}>
              <Ionicons name="refresh-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.dateText}>
                Modifié le {new Date(quote.updatedAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Action Buttons */}
      {canAccept && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
            <Ionicons name="close" size={24} color={COLORS.error} />
            <Text style={styles.rejectButtonText}>Rejeter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Ionicons name="checkmark" size={24} color={COLORS.white} />
            <Text style={styles.acceptButtonText}>Accepter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contact Buttons for accepted quotes */}
      {quote.status === 'accepted' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color={COLORS.white} />
            <Text style={styles.callButtonText}>Appeler</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
            <Ionicons name="chatbubble" size={24} color={COLORS.white} />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
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
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.error,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  quoteNumber: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
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
  workerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  workerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workerAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  workerInfo: {
    flex: 1,
    gap: 6,
  },
  workerName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  descriptionSection: {
    marginTop: 16,
  },
  descriptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  servicesSection: {
    marginTop: 16,
  },
  servicesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  materialText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  requestCard: {
    backgroundColor: COLORS.backgroundDark,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestBudget: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bottomSpace: {
    height: 100,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.error,
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    gap: 8,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default QuoteDetailsScreen;
