import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SERVICE_CATEGORIES } from '../../constants';

const LandingScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Kayniou Liggey</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Connexion</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>
          Trouvez le travailleur qualifié dont vous avez besoin
        </Text>
        <Text style={styles.heroSubtitle}>
          Connectez-vous instantanément avec des professionnels près de chez
          vous
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.ctaButtonText}>Commencer maintenant</Text>
        </TouchableOpacity>
      </View>

      {/* Comment ça marche */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comment ça marche</Text>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Décrivez votre besoin</Text>
            <Text style={styles.stepDescription}>
              Expliquez simplement ce dont vous avez besoin
            </Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Trouvez des professionnels</Text>
            <Text style={styles.stepDescription}>
              Découvrez les travailleurs qualifiés à proximité
            </Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Réalisez votre projet</Text>
            <Text style={styles.stepDescription}>
              Suivez l'avancement en temps réel et notez le travail
            </Text>
          </View>
        </View>
      </View>

      {/* Catégories populaires */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Catégories populaires</Text>
        <View style={styles.categoriesGrid}>
          {SERVICE_CATEGORIES.map((category) => (
            <View key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryIconContainer}>
                <Ionicons name={category.iconName} size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.categoryLabel}>{category.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Nos Offres */}
      <View style={styles.pricingSection}>
        <Text style={styles.sectionTitle}>Nos Offres pour les Pros</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pricingScroll}>
          {/* Basic Plan */}
          <View style={[styles.pricingCard, styles.basicCard]}>
            <Text style={styles.planName}>Basique</Text>
            <Text style={styles.planPrice}>Gratuit</Text>
            <View style={styles.planFeatures}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Profil visible</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>3 réponses / mois</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Commission standard</Text>
              </View>
            </View>
          </View>

          {/* Premium Plan */}
          <View style={[styles.pricingCard, styles.premiumCard]}>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>POPULAIRE</Text>
            </View>
            <Text style={[styles.planName, styles.premiumText]}>Premium</Text>
            <Text style={[styles.planPrice, styles.premiumText]}>10.000 FCFA</Text>
            <Text style={styles.planPeriod}>/ mois</Text>
            <View style={styles.planFeatures}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={[styles.featureText, styles.premiumText]}>Visibilité prioritaire (TOP)</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={[styles.featureText, styles.premiumText]}>Réponses illimitées</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={[styles.featureText, styles.premiumText]}>Commission réduite</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={[styles.featureText, styles.premiumText]}>Badge Premium</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.subscribeButtonText}>Devenir Premium</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* CTA Final */}
      <View style={styles.finalCTA}>
        <Text style={styles.finalCTATitle}>
          Prêt à trouver votre travailleur ?
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.ctaButtonText}>Créer un compte</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>
            Vous avez déjà un compte ? Connectez-vous
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: COLORS.primary,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  loginButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  loginButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  heroSection: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 15,
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  ctaButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
  },
  ctaButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
    paddingTop: 5,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    elevation: 2,
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  finalCTA: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    marginTop: 20,
  },
  finalCTATitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    marginTop: 15,
  },
  pricingSection: {
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
  },
  pricingScroll: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  pricingCard: {
    width: 250,
    padding: 20,
    borderRadius: 16,
    marginRight: 15,
    backgroundColor: COLORS.white,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  basicCard: {
    backgroundColor: COLORS.white,
  },
  premiumCard: {
    backgroundColor: '#1E293B', // Dark blue/slate
    borderColor: '#FFD700',
    borderWidth: 2,
    transform: [{ scale: 1.05 }], // Slightly bigger
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  planPeriod: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 15,
  },
  planFeatures: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  premiumText: {
    color: COLORS.white,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  subscribeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default LandingScreen;
