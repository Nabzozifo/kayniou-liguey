import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
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
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryLabel}>{category.label}</Text>
            </View>
          ))}
        </View>
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
  categoryIcon: {
    fontSize: 40,
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
});

export default LandingScreen;
