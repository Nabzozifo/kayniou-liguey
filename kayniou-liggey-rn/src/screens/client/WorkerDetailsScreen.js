import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import api from '../../services/api';
import { formatCurrency } from '../../config/regional';

const { width } = Dimensions.get('window');

const WorkerDetailsScreen = ({ route, navigation }) => {
  const { workerId } = route.params;
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState(null);
  const [selectedTab, setSelectedTab] = useState('about'); // about, reviews, portfolio
  const [ratings, setRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  useEffect(() => {
    fetchWorkerDetails();
  }, [workerId]);

  useEffect(() => {
    if (selectedTab === 'reviews') {
      fetchRatings();
    }
  }, [selectedTab]);

  const fetchWorkerDetails = async () => {
    try {
      const response = await api.get(`/worker-profile/${workerId}`);

      if (response.data.success) {
        setWorker(response.data.profile);
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil du travailleur');
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      setLoadingRatings(true);
      const response = await api.get(`/ratings/user/${workerId}`);

      if (response.data.success) {
        setRatings(response.data.ratings);
      }
    } catch (error) {
      console.error('Erreur chargement avis:', error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleCall = () => {
    if (worker?.userId?.phoneNumber) {
      Linking.openURL(`tel:${worker.userId.phoneNumber}`);
    }
  };

  const handleMessage = () => {
    // Les conversations nécessitent un contexte de demande
    Alert.alert(
      'Créer une demande',
      'Pour contacter ce travailleur, vous devez d\'abord créer une demande de service. Il pourra alors vous envoyer un devis et vous pourrez discuter.',
      [
        {
          text: 'Créer une demande',
          onPress: () => navigation.navigate('CreateRequest'),
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const renderScoreCircle = (score, label, color) => (
    <View style={styles.scoreCircle}>
      <View style={[styles.scoreRing, { borderColor: color }]}>
        <Text style={[styles.scoreValue, { color }]}>{score}</Text>
      </View>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );

  const renderBadge = (badge) => (
    <View key={badge.name} style={styles.badgeCard}>
      <Ionicons name={badge.icon} size={24} color={COLORS.warning} />
      <Text style={styles.badgeName}>{badge.name}</Text>
      <Text style={styles.badgeDescription}>{badge.description}</Text>
    </View>
  );

  const renderExperience = (exp) => (
    <View key={exp._id} style={styles.experienceCard}>
      <View style={styles.experienceHeader}>
        <View style={styles.experienceIcon}>
          <Ionicons name="briefcase" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.experienceInfo}>
          <Text style={styles.experiencePosition}>{exp.position}</Text>
          <Text style={styles.experienceCompany}>{exp.company}</Text>
          <Text style={styles.experienceDate}>
            {new Date(exp.startDate).getFullYear()} -{' '}
            {exp.isCurrent ? 'Présent' : new Date(exp.endDate).getFullYear()}
          </Text>
        </View>
      </View>
      {exp.description && (
        <Text style={styles.experienceDescription}>{exp.description}</Text>
      )}
    </View>
  );

  const renderSkill = (skill) => (
    <View key={skill.name} style={styles.skillCard}>
      <Text style={styles.skillName}>{skill.name}</Text>
      <View style={styles.skillLevelContainer}>
        {[1, 2, 3].map((level) => (
          <View
            key={level}
            style={[
              styles.skillLevelDot,
              {
                backgroundColor:
                  (skill.level === 'expert' && level <= 3) ||
                    (skill.level === 'intermediate' && level <= 2) ||
                    (skill.level === 'beginner' && level <= 1)
                    ? COLORS.primary
                    : COLORS.border,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      {/* Bio */}
      {worker.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.bioText}>{worker.bio}</Text>
        </View>
      )}

      {/* Statistiques détaillées */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>{worker.completedJobs}</Text>
            <Text style={styles.statLabel}>Travaux terminés</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={COLORS.info} />
            <Text style={styles.statValue}>{worker.averageCompletionTime.toFixed(1)}h</Text>
            <Text style={styles.statLabel}>Temps moyen</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="happy" size={24} color={COLORS.warning} />
            <Text style={styles.statValue}>{worker.customerSatisfactionRate}%</Text>
            <Text style={styles.statLabel}>Satisfaction</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="refresh" size={24} color={COLORS.accent} />
            <Text style={styles.statValue}>{worker.repeatClientRate}%</Text>
            <Text style={styles.statLabel}>Clients récurrents</Text>
          </View>
        </View>
      </View>

      {/* Compétences */}
      {worker.skills && worker.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compétences</Text>
          <View style={styles.skillsGrid}>
            {worker.skills.map(renderSkill)}
          </View>
        </View>
      )}

      {/* Expériences */}
      {worker.experiences && worker.experiences.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expérience professionnelle</Text>
          {worker.experiences.map(renderExperience)}
        </View>
      )}

      {/* Diplômes */}
      {worker.diplomas && worker.diplomas.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Formation</Text>
          {worker.diplomas.map((diploma) => (
            <View key={diploma._id} style={styles.diplomaCard}>
              <Ionicons name="school" size={20} color={COLORS.primary} />
              <View style={styles.diplomaInfo}>
                <Text style={styles.diplomaTitle}>{diploma.title}</Text>
                <Text style={styles.diplomaInstitution}>{diploma.institution}</Text>
                <Text style={styles.diplomaYear}>{diploma.year}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Certifications */}
      {worker.certifications && worker.certifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {worker.certifications.map((cert) => (
            <View key={cert._id} style={styles.certCard}>
              <Ionicons name="ribbon" size={20} color={COLORS.warning} />
              <View style={styles.certInfo}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                {cert.issueDate && (
                  <Text style={styles.certDate}>
                    Délivré: {new Date(cert.issueDate).toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Languages */}
      {worker.languages && worker.languages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Langues</Text>
          <View style={styles.languagesContainer}>
            {worker.languages.map((lang, index) => (
              <View key={index} style={styles.languageCard}>
                <Ionicons name="language" size={18} color={COLORS.primary} />
                <Text style={styles.languageName}>{lang.language}</Text>
                <Text style={styles.languageLevel}>({lang.proficiency})</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Insurance */}
      {worker.insurance?.hasInsurance && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assurance</Text>
          <View style={styles.insuranceCard}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
            <View style={styles.insuranceInfo}>
              <Text style={styles.insuranceProvider}>
                Assuré chez {worker.insurance.provider}
              </Text>
              {worker.insurance.coverageAmount && (
                <Text style={styles.insuranceCoverage}>
                  Couverture: {formatCurrency(worker.insurance.coverageAmount)}
                </Text>
              )}
              {worker.insurance.expiryDate && (
                <Text style={styles.insuranceExpiry}>
                  Expire: {new Date(worker.insurance.expiryDate).toLocaleDateString('fr-FR')}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Equipment */}
      {worker.equipment && worker.equipment.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Équipements</Text>
          <View style={styles.equipmentGrid}>
            {worker.equipment.map((equip, index) => (
              <View key={index} style={styles.equipmentCard}>
                <Ionicons name="construct" size={20} color={COLORS.accent} />
                <Text style={styles.equipmentName}>{equip.name}</Text>
                {equip.condition && (
                  <View style={[
                    styles.conditionBadge,
                    {
                      backgroundColor:
                        equip.condition === 'excellent' ? COLORS.success + '20' :
                          equip.condition === 'bon' ? COLORS.info + '20' :
                            equip.condition === 'acceptable' ? COLORS.warning + '20' :
                              COLORS.error + '20'
                    }
                  ]}>
                    <Text style={[
                      styles.conditionText,
                      {
                        color:
                          equip.condition === 'excellent' ? COLORS.success :
                            equip.condition === 'bon' ? COLORS.info :
                              equip.condition === 'acceptable' ? COLORS.warning :
                                COLORS.error
                      }
                    ]}>
                      {equip.condition}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Weekly Availability */}
      {worker.weeklyAvailability && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilité hebdomadaire</Text>
          <View style={styles.availabilityContainer}>
            {Object.entries(worker.weeklyAvailability).map(([day, data]) => {
              const dayNames = {
                monday: 'Lundi',
                tuesday: 'Mardi',
                wednesday: 'Mercredi',
                thursday: 'Jeudi',
                friday: 'Vendredi',
                saturday: 'Samedi',
                sunday: 'Dimanche',
              };
              return (
                <View key={day} style={styles.availabilityRow}>
                  <Text style={styles.dayName}>{dayNames[day]}</Text>
                  {data.available ? (
                    <View style={styles.availableTag}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                      <Text style={styles.availableText}>
                        {data.hours || 'Disponible'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.unavailableTag}>
                      <Ionicons name="close-circle" size={16} color={COLORS.error} />
                      <Text style={styles.unavailableText}>Indisponible</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Badges */}
      {worker.badges && worker.badges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges & Récompenses</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.badgesContainer}>
              {worker.badges.map(renderBadge)}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderReviewsTab = () => {
    if (loadingRatings) {
      return (
        <View style={styles.tabContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (ratings.length === 0) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateText}>Aucun avis pour le moment</Text>
            <Text style={styles.emptyStateSubtext}>
              Les avis des clients apparaîtront ici après leurs chantiers
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {ratings.map((rating, index) => (
          <View key={rating._id || index} style={styles.ratingCard}>
            {/* En-tête de l'avis */}
            <View style={styles.ratingHeader}>
              <View style={styles.ratingUserInfo}>
                <View style={styles.ratingAvatar}>
                  <Ionicons name="person" size={20} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.ratingUserName}>{rating.reviewerName}</Text>
                  <Text style={styles.ratingDate}>
                    {new Date(rating.createdAt).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>
              <View style={styles.ratingStars}>
                <Ionicons name="star" size={18} color={COLORS.warning} />
                <Text style={styles.ratingValue}>{rating.overallRating.toFixed(1)}</Text>
              </View>
            </View>

            {/* Commentaire */}
            {rating.comment && (
              <Text style={styles.ratingComment}>{rating.comment}</Text>
            )}

            {/* Détails des notes */}
            {rating.detailedRatings && Object.keys(rating.detailedRatings).length > 0 && (
              <View style={styles.detailedRatings}>
                {Object.entries(rating.detailedRatings).map(([key, value]) => (
                  <View key={key} style={styles.detailedRatingRow}>
                    <Text style={styles.detailedRatingLabel}>
                      {key === 'quality' && 'Qualité du travail'}
                      {key === 'communication' && 'Communication'}
                      {key === 'punctuality' && 'Ponctualité'}
                      {key === 'professionalism' && 'Professionnalisme'}
                    </Text>
                    <View style={styles.detailedRatingStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= value ? 'star' : 'star-outline'}
                          size={14}
                          color={COLORS.warning}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Badge recommandation */}
            {rating.wouldRecommend && (
              <View style={styles.recommendBadge}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.recommendText}>Recommande ce travailleur</Text>
              </View>
            )}

            {/* Réponse du travailleur */}
            {rating.response && (
              <View style={styles.workerResponse}>
                <Text style={styles.responseLabel}>Réponse du travailleur:</Text>
                <Text style={styles.responseText}>{rating.response.text}</Text>
                <Text style={styles.responseDate}>
                  {new Date(rating.response.createdAt).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderPortfolioTab = () => (
    <View style={styles.tabContent}>
      {worker.portfolio && worker.portfolio.length > 0 ? (
        <View style={styles.portfolioGrid}>
          {worker.portfolio.map((photo, index) => (
            <TouchableOpacity key={index} style={styles.portfolioItem}>
              <Image source={{ uri: photo }} style={styles.portfolioImage} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>Aucune photo dans le portfolio</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>Profil introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header avec photo et infos principales */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {worker.userId?.photoURL ? (
                <Image source={{ uri: worker.userId.photoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {worker.userId?.fullName?.charAt(0)}
                  </Text>
                </View>
              )}
              {worker.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                </View>
              )}
            </View>

            <View style={styles.nameRow}>
              <Text style={styles.workerName}>{worker.userId?.fullName}</Text>
              {worker.userId?.subscription?.plan === 'premium' && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="trophy" size={14} color={COLORS.white} />
                  <Text style={styles.premiumText}>PREMIUM</Text>
                </View>
              )}
            </View>

            {/* Catégories */}
            <View style={styles.categoriesContainer}>
              {worker.categories.slice(0, 3).map((category, index) => (
                <View key={index} style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
              ))}
            </View>

            {/* Rating */}
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color={COLORS.warning} />
              <Text style={styles.ratingText}>
                {worker.averageRating.toFixed(1)} ({worker.totalReviews} avis)
              </Text>
            </View>
          </View>

          {/* Scores de performance */}
          <View style={styles.scoresSection}>
            <Text style={styles.scoresSectionTitle}>Scores de performance</Text>
            <View style={styles.scoresContainer}>
              {renderScoreCircle(worker.performanceScore, 'Global', COLORS.primary)}
              {renderScoreCircle(worker.qualityScore, 'Qualité', COLORS.success)}
              {renderScoreCircle(worker.reliabilityScore, 'Fiabilité', COLORS.info)}
              {renderScoreCircle(worker.speedScore, 'Rapidité', COLORS.accent)}
            </View>
          </View>

          {/* Tarifs */}
          {worker.hourlyRate > 0 && (
            <View style={styles.priceContainer}>
              <Ionicons name="cash" size={20} color={COLORS.success} />
              <Text style={styles.priceText}>
                {formatCurrency(worker.hourlyRate)}/heure
              </Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'about' && styles.tabActive]}
            onPress={() => setSelectedTab('about')}
          >
            <Text style={[styles.tabText, selectedTab === 'about' && styles.tabTextActive]}>
              À propos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'reviews' && styles.tabActive]}
            onPress={() => setSelectedTab('reviews')}
          >
            <Text style={[styles.tabText, selectedTab === 'reviews' && styles.tabTextActive]}>
              Avis
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'portfolio' && styles.tabActive]}
            onPress={() => setSelectedTab('portfolio')}
          >
            <Text style={[styles.tabText, selectedTab === 'portfolio' && styles.tabTextActive]}>
              Portfolio
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {selectedTab === 'about' && renderAboutTab()}
        {selectedTab === 'reviews' && renderReviewsTab()}
        {selectedTab === 'portfolio' && renderPortfolioTab()}

        {/* Spacer pour les boutons fixes */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Boutons d'action fixes en bas */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Ionicons name="call" size={24} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Appeler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
          <Ionicons name="chatbubble" size={24} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    backgroundColor: COLORS.white,
    paddingBottom: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  workerName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    elevation: 2,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  categoryBadge: {
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  scoresSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  scoresSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreCircle: {
    alignItems: 'center',
  },
  scoreRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillCard: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  skillLevelContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  skillLevelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  experienceCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  experienceHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  experienceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  experienceInfo: {
    flex: 1,
  },
  experiencePosition: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  experienceCompany: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 2,
  },
  experienceDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  experienceDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 12,
  },
  diplomaCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  diplomaInfo: {
    flex: 1,
  },
  diplomaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  diplomaInstitution: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 4,
  },
  diplomaYear: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  badgeCard: {
    width: 120,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  portfolioItem: {
    width: (width - 40) / 3,
    height: (width - 40) / 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 40,
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
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Certifications
  certCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  certInfo: {
    flex: 1,
  },
  certName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  certOrg: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 4,
  },
  certDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // Languages
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  languageLevel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Insurance
  insuranceCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  insuranceInfo: {
    flex: 1,
  },
  insuranceProvider: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  insuranceCoverage: {
    fontSize: 14,
    color: COLORS.success,
    marginTop: 4,
  },
  insuranceExpiry: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // Equipment
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  equipmentCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  equipmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    textAlign: 'center',
  },
  conditionBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Weekly Availability
  availabilityContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  availableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availableText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '500',
  },
  unavailableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unavailableText: {
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '500',
  },
  // Styles pour les avis
  ratingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  ratingDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warning + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.warning,
  },
  ratingComment: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  detailedRatings: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailedRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailedRatingLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  detailedRatingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  recommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.success + '10',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  recommendText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '500',
  },
  workerResponse: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  responseLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  responseText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  responseDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});

export default WorkerDetailsScreen;
