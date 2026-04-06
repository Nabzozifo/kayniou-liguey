import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SERVICE_CATEGORIES } from '../../constants';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme';

const STEPS = [
  {
    icon: 'create-outline',
    title: 'Décrivez votre besoin',
    description: 'Expliquez simplement ce dont vous avez besoin en quelques mots.',
  },
  {
    icon: 'search-outline',
    title: 'Trouvez des professionnels',
    description: 'Découvrez des travailleurs qualifiés et disponibles près de chez vous.',
  },
  {
    icon: 'checkmark-circle-outline',
    title: 'Réalisez votre projet',
    description: 'Suivez l\'avancement en temps réel et évaluez le travail accompli.',
  },
];

const LandingScreen = ({ navigation }) => {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Hero ──────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Text style={styles.logo}>Göllè</Text>
            <TouchableOpacity
              style={styles.loginPill}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={styles.loginPillText}>Connexion</Text>
            </TouchableOpacity>
          </View>

          {/* Hero content */}
          <View style={styles.heroContent}>
            <Text style={styles.slogan}>
              Trouve un travailleur.{'\n'}Trouve du travail.
            </Text>
            <Text style={styles.heroSubtitle}>
              Connectez-vous instantanément avec des artisans et prestataires qualifiés près de chez vous.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.88}
            >
              <Text style={styles.ctaButtonText}>Commencer gratuitement</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Floating stat cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Pros actifs</Text>
            </View>
            <View style={[styles.statCard, styles.statCardAccent]}>
              <Text style={[styles.statNumber, { color: COLORS.primary }]}>4.8 ★</Text>
              <Text style={styles.statLabel}>Note moyenne</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>20km</Text>
              <Text style={styles.statLabel}>Rayon max</Text>
            </View>
          </View>
        </View>

        {/* ── Comment ça marche ──────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionOverline}>SIMPLE & RAPIDE</Text>
          <Text style={styles.sectionTitle}>Comment ça marche ?</Text>

          {STEPS.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepIconWrap}>
                <Ionicons name={step.icon} size={24} color={COLORS.primary} />
              </View>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Catégories ────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionOverline}>TOUS LES MÉTIERS</Text>
          <Text style={styles.sectionTitle}>Catégories populaires</Text>
          <View style={styles.categoriesGrid}>
            {SERVICE_CATEGORIES.slice(0, 8).map((category) => (
              <View key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryIconWrap}>
                  <Ionicons name={category.iconName} size={26} color={COLORS.primary} />
                </View>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Offres ───────────────────────────────────── */}
        <View style={styles.pricingSection}>
          <Text style={styles.sectionOverline}>POUR LES PROS</Text>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Nos Offres</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pricingScroll}
          >
            {/* Basique */}
            <View style={[styles.planCard, styles.planCardBasic]}>
              <Text style={styles.planName}>Basique</Text>
              <Text style={styles.planPrice}>Gratuit</Text>
              <View style={styles.planDivider} />
              {['Profil visible', '3 réponses / mois', 'Commission standard'].map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            {/* Premium */}
            <View style={[styles.planCard, styles.planCardPremium]}>
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>POPULAIRE</Text>
              </View>
              <Text style={[styles.planName, { color: COLORS.white }]}>Premium</Text>
              <View style={styles.planPriceRow}>
                <Text style={[styles.planPrice, { color: COLORS.secondary }]}>10 000</Text>
                <Text style={styles.planCurrency}> FCFA/mois</Text>
              </View>
              <View style={[styles.planDivider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
              {[
                'Visibilité prioritaire (TOP)',
                'Réponses illimitées',
                'Commission réduite',
                'Badge Premium',
              ].map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                  <Text style={[styles.featureText, { color: 'rgba(255,255,255,0.9)' }]}>{f}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={styles.premiumCTA}
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.85}
              >
                <Text style={styles.premiumCTAText}>Devenir Premium</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* ── Final CTA ─────────────────────────────────── */}
        <View style={styles.finalCTA}>
          <Text style={styles.finalTitle}>Prêt à trouver votre professionnel ?</Text>
          <TouchableOpacity
            style={styles.finalButton}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.88}
          >
            <Text style={styles.finalButtonText}>Créer un compte</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              Déjà un compte ?{' '}
              <Text style={styles.linkTextBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },

  // ── Hero ─────────────────────────────────────────────────
  hero: {
    backgroundColor: COLORS.primary,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 56,
    paddingBottom: SPACING.lg,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  loginPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs - 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  loginPillText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  heroContent: {
    paddingHorizontal: SPACING.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  heroBadgeText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  slogan: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 23,
    marginBottom: SPACING.lg,
  },
  ctaButton: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
    ...SHADOWS.md,
  },
  ctaButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  statCardAccent: {
    backgroundColor: COLORS.white,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
  },

  // ── Sections ─────────────────────────────────────────────
  section: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  sectionOverline: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.2,
    marginBottom: SPACING.xxs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.md,
  },

  // ── Steps ────────────────────────────────────────────────
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    ...SHADOWS.xs,
    position: 'relative',
  },
  stepIconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  stepNumber: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },

  // ── Categories ───────────────────────────────────────────
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  categoryCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xs,
    marginBottom: SPACING.xxs,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },

  // ── Pricing ──────────────────────────────────────────────
  pricingSection: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
    paddingLeft: SPACING.md,
  },
  pricingScroll: {
    paddingRight: SPACING.md,
    paddingBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  planCard: {
    width: 240,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  planCardBasic: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planCardPremium: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: SPACING.lg + 8,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.6,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
  },
  planCurrency: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  planDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  premiumCTA: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  premiumCTAText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },

  // ── Final CTA ────────────────────────────────────────────
  finalCTA: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accentLight,
  },
  finalTitle: {
    ...TYPOGRAPHY.h3,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  finalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.primary,
  },
  finalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  linkText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  linkTextBold: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default LandingScreen;
