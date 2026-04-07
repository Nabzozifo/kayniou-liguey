import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { SPACING, RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../services/api';
import { WEST_AFRICAN_COUNTRIES } from '../../config/westAfricanCountries';

// ─── Prix de l'abonnement par pays ──────────────────────────────
// Base de référence : 3 000 FCFA/mois (XOF)
// Taux de change approximatifs (Jan 2025)
const PRICING_BY_COUNTRY = {
  // Zone FCFA Afrique de l'Ouest (XOF)
  SN: { amount: 3000, display: '3 000 FCFA', period: '/mois' },
  CI: { amount: 3000, display: '3 000 FCFA', period: '/mois' },
  ML: { amount: 3000, display: '3 000 FCFA', period: '/mois' },
  BF: { amount: 3000, display: '3 000 FCFA', period: '/mois' },
  NE: { amount: 3000, display: '3 000 FCFA', period: '/mois' },
  TG: { amount: 3000, display: '3 000 FCFA', period: '/mois' },
  BJ: { amount: 3000, display: '3 000 FCFA', period: '/mois' },
  GW: { amount: 3000, display: '3 000 FCFA', period: '/mois' },
  // Zone FCFA Afrique Centrale (XAF — parité identique au XOF)
  CM: { amount: 3000, display: '3 000 FCFA', period: '/mois' },
  GA: { amount: 3000, display: '3 000 FCFA', period: '/mois' },
  CG: { amount: 3000, display: '3 000 FCFA', period: '/mois' },
  TD: { amount: 3000, display: '3 000 FCFA', period: '/mois' },
  CF: { amount: 3000, display: '3 000 FCFA', period: '/mois' },
  // Guinée (GNF : 1 XOF ≈ 14,3 GNF → 3 000 XOF ≈ 43 000 GNF)
  GN: { amount: 43000, display: '43 000 GF', period: '/mois' },
  // Maroc (MAD : 3 000 XOF ≈ 50 MAD)
  MA: { amount: 50, display: '50 DH', period: '/mois' },
  // France (EUR : 3 000 XOF ≈ 4,57 € → 5 €)
  FR: { amount: 5, display: '5 €', period: '/mois' },
  // Canada (CAD : 3 000 XOF ≈ 6,83 $CA → 7 $CA)
  CA: { amount: 7, display: '7 $CA', period: '/mois' },
};

const DEFAULT_PRICING = { amount: 3000, display: '3 000 FCFA', period: '/mois' };

const getPricing = (countryCode) =>
  PRICING_BY_COUNTRY[countryCode] || DEFAULT_PRICING;

// ─── Feature item ────────────────────────────────────────────────
const FeatureItem = ({ text, included }) => (
  <View style={styles.featureItem}>
    <View
      style={[
        styles.featureIcon,
        { backgroundColor: included ? '#D1FAE5' : '#F3F4F6' },
      ]}
    >
      <Ionicons
        name={included ? 'checkmark' : 'close'}
        size={13}
        color={included ? '#059669' : '#9CA3AF'}
      />
    </View>
    <Text style={[styles.featureText, !included && styles.featureTextDisabled]}>
      {text}
    </Text>
  </View>
);

// ─── Screen ──────────────────────────────────────────────────────
const PricingScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [subscribing, setSubscribing] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const countryCode = user?.country || 'SN';
  const pricing = getPricing(countryCode);
  const countryInfo = WEST_AFRICAN_COUNTRIES[countryCode];
  const isPremium = user?.subscription?.plan === 'premium';

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start();

  const handleSubscribe = () => {
    if (isPremium) {
      Alert.alert('Déjà Premium', 'Vous bénéficiez déjà de tous les avantages Premium.');
      return;
    }

    const flag = countryInfo?.flag || '';
    Alert.alert(
      'Passer Premium',
      `Abonnement mensuel : ${pricing.display}${pricing.period}\n\nVoulez-vous continuer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setSubscribing(true);
            try {
              const response = await subscriptionService.subscribe('premium');
              if (response.success) {
                Alert.alert(
                  'Demande envoyée !',
                  'Votre demande Premium est en cours de validation par notre équipe. Vous serez notifié sous 24–48h.',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              }
            } catch (error) {
              Alert.alert('Erreur', error.response?.data?.message || 'Impossible de souscrire. Réessayez.');
            } finally {
              setSubscribing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Header ── */}
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <View style={styles.crownBadge}>
            <Ionicons name="trophy" size={28} color="#FFD700" />
          </View>
          <Text style={styles.heroTitle}>Passez Premium</Text>
          <Text style={styles.heroSub}>
            Décrochez plus de chantiers, gagnez plus
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Country price banner ── */}
        <View style={styles.priceBanner}>
          <View style={styles.priceBannerLeft}>
            <Text style={styles.priceBannerFlag}>
              {countryInfo?.flag || '🌍'}
            </Text>
            <View>
              <Text style={styles.priceBannerLabel}>Prix dans votre pays</Text>
              <Text style={styles.priceBannerCountry}>
                {countryInfo?.name || 'Votre pays'}
              </Text>
            </View>
          </View>
          <View style={styles.priceBannerRight}>
            <Text style={styles.priceBannerAmount}>{pricing.display}</Text>
            <Text style={styles.priceBannerPeriod}>{pricing.period}</Text>
          </View>
        </View>

        {/* ── Plan Gratuit ── */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.planIconWrap}>
              <Ionicons name="person-outline" size={22} color={COLORS.textSecondary} />
            </View>
            <View style={styles.planHeaderInfo}>
              <Text style={styles.planName}>Basique</Text>
              <Text style={styles.planPrice}>Gratuit</Text>
            </View>
            {!isPremium && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Actuel</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.featuresList}>
            <FeatureItem text="Accès aux offres (délai 24h)" included />
            <FeatureItem text="Visibilité standard dans les recherches" included />
            <FeatureItem text="5 candidatures par jour max" included />
            <FeatureItem text="Badge Premium" included={false} />
            <FeatureItem text="Priorité dans les résultats" included={false} />
            <FeatureItem text="Support prioritaire" included={false} />
          </View>
        </View>

        {/* ── Plan Premium ── */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View style={[styles.planCard, styles.premiumCard]}>
            {/* Top ribbon */}
            <View style={styles.ribbon}>
              <Text style={styles.ribbonText}>RECOMMANDÉ</Text>
            </View>

            <View style={styles.planHeader}>
              <View style={[styles.planIconWrap, styles.premiumIconWrap]}>
                <Ionicons name="trophy" size={22} color="#FFD700" />
              </View>
              <View style={styles.planHeaderInfo}>
                <Text style={[styles.planName, styles.premiumName]}>Premium</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.premiumPrice}>{pricing.display}</Text>
                  <Text style={styles.premiumPeriod}>{pricing.period}</Text>
                </View>
              </View>
              {isPremium && (
                <View style={[styles.currentBadge, styles.activeBadge]}>
                  <Text style={[styles.currentBadgeText, { color: '#059669' }]}>Actif</Text>
                </View>
              )}
            </View>

            <View style={[styles.divider, { borderColor: '#FDE68A' }]} />

            <View style={styles.featuresList}>
              <FeatureItem text="Accès instantané aux nouvelles offres" included />
              <FeatureItem text="Priorité dans les recherches (Top liste)" included />
              <FeatureItem text="Candidatures illimitées" included />
              <FeatureItem text="Badge Premium 🏆 visible par les clients" included />
              <FeatureItem text="Support prioritaire 24h/24" included />
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.cta, isPremium && styles.ctaDisabled]}
              onPress={handleSubscribe}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={1}
              disabled={subscribing || isPremium}
            >
              {subscribing ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons
                    name={isPremium ? 'checkmark-circle' : 'rocket'}
                    size={20}
                    color={isPremium ? '#059669' : COLORS.primary}
                  />
                  <Text style={[styles.ctaText, isPremium && styles.ctaTextActive]}>
                    {isPremium ? 'Premium activé' : 'Devenir Premium'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Disclaimer ── */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.disclaimerText}>
            L'abonnement se renouvelle automatiquement chaque mois. Résiliable à tout moment depuis votre profil.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Hero
  hero: {
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 8,
    paddingBottom: 32,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  heroContent: {
    alignItems: 'center',
  },
  crownBadge: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },

  // Price banner
  priceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  priceBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  priceBannerFlag: {
    fontSize: 28,
  },
  priceBannerLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  priceBannerCountry: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  priceBannerRight: {
    alignItems: 'flex-end',
  },
  priceBannerAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  priceBannerPeriod: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Plan card
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  premiumCard: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: '#FFFDF5',
    overflow: 'hidden',
  },

  // Ribbon
  ribbon: {
    position: 'absolute',
    top: 16,
    right: -28,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 36,
    paddingVertical: 4,
    transform: [{ rotate: '35deg' }],
  },
  ribbonText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },

  // Plan header
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  planIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumIconWrap: {
    backgroundColor: '#FEF3C7',
  },
  planHeaderInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  premiumName: {
    color: '#92400E',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  premiumPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#92400E',
  },
  premiumPeriod: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Badges
  currentBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  // Divider
  divider: {
    height: 0,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },

  // Features
  featuresList: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureIcon: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  featureTextDisabled: {
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },

  // CTA
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: '#FFD700',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  ctaDisabled: {
    backgroundColor: '#D1FAE5',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350F',
  },
  ctaTextActive: {
    color: '#059669',
  },

  // Disclaimer
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

export default PricingScreen;
