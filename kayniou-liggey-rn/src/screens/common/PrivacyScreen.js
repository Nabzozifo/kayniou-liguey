import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

const PrivacyScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={60} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Politique de Confidentialité</Text>
        <Text style={styles.headerSubtitle}>Kayniou Liggey</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Collecte des données</Text>
        <Text style={styles.sectionText}>
          Nous collectons les informations que vous nous fournissez directement lors de votre inscription et utilisation de l'application, notamment :
        </Text>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Nom complet et informations de contact</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Numéro de téléphone et adresse email</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Localisation pour les services à proximité</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Informations de paiement (sécurisées)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Utilisation des données</Text>
        <Text style={styles.sectionText}>
          Vos données personnelles sont utilisées pour :
        </Text>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Faciliter la mise en relation entre clients et travailleurs</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Traiter les paiements et transactions</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Améliorer nos services et votre expérience</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Vous envoyer des notifications importantes</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Protection des données</Text>
        <Text style={styles.sectionText}>
          Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Partage des données</Text>
        <Text style={styles.sectionText}>
          Nous ne partageons vos données personnelles avec des tiers que dans les cas suivants :
        </Text>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Avec votre consentement explicite</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Pour se conformer à des obligations légales</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Avec les prestataires de services (paiement, etc.)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Vos droits</Text>
        <Text style={styles.sectionText}>
          Vous avez le droit de :
        </Text>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Accéder à vos données personnelles</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Rectifier ou supprimer vos données</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Limiter le traitement de vos données</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Retirer votre consentement à tout moment</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Contact</Text>
        <Text style={styles.sectionText}>
          Pour toute question concernant cette politique de confidentialité, vous pouvez nous contacter à :
        </Text>
        <Text style={styles.contactInfo}>Email: privacy@kayniouliggey.com</Text>
        <Text style={styles.contactInfo}>Tél: +221 XX XXX XX XX</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Dernière mise à jour: Janvier 2026
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 10,
  },
  bullet: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 8,
    fontWeight: 'bold',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  contactInfo: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
});

export default PrivacyScreen;
