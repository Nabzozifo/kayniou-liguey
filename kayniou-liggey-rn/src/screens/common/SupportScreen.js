import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

const SupportScreen = () => {
  const handlePhoneCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleWhatsApp = (phoneNumber) => {
    Linking.openURL(`whatsapp://send?phone=${phoneNumber}`);
  };

  const handleFAQ = (question) => {
    Alert.alert(
      question.title,
      question.answer,
      [{ text: 'OK' }]
    );
  };

  const faqs = [
    {
      title: 'Comment créer une demande de service ?',
      answer: 'Depuis l\'écran d\'accueil, appuyez sur le bouton "Nouvelle demande", remplissez les détails de votre demande (catégorie, description, budget) et choisissez le mode (entente directe, enchère privée ou publique).',
    },
    {
      title: 'Comment accepter un devis ?',
      answer: 'Consultez les devis reçus dans "Mes demandes", comparez les offres et cliquez sur "Accepter" pour le devis qui vous convient. Un chantier sera automatiquement créé.',
    },
    {
      title: 'Comment contacter un travailleur ?',
      answer: 'Une fois qu\'un chantier est créé, vous pouvez envoyer des messages au travailleur via le bouton "Envoyer message" dans les détails du chantier.',
    },
    {
      title: 'Comment effectuer un paiement ?',
      answer: 'Les paiements sont sécurisés via Orange Money ou Wave. Suivez les instructions dans les détails du chantier une fois le travail validé.',
    },
    {
      title: 'Que faire en cas de problème avec un chantier ?',
      answer: 'Contactez immédiatement notre support via le chat, email ou téléphone. Nous sommes disponibles pour résoudre tout litige.',
    },
    {
      title: 'Comment devenir travailleur sur la plateforme ?',
      answer: 'Lors de l\'inscription, sélectionnez le profil "Travailleur", puis complétez votre profil professionnel avec vos métiers, expériences et certifications.',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="help-circle" size={60} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Aide & Support</Text>
        <Text style={styles.headerSubtitle}>Nous sommes là pour vous aider</Text>
      </View>

      {/* Contact Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nous contacter</Text>

        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => handlePhoneCall('+221XXXXXXXXX')}
        >
          <View style={[styles.contactIcon, { backgroundColor: COLORS.successLight }]}>
            <Ionicons name="call" size={24} color={COLORS.success} />
          </View>
          <View style={styles.contactText}>
            <Text style={styles.contactTitle}>Téléphone</Text>
            <Text style={styles.contactValue}>+221 XX XXX XX XX</Text>
            <Text style={styles.contactHint}>Lun-Sam: 8h-20h</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => handleEmail('support@golle.app')}
        >
          <View style={[styles.contactIcon, { backgroundColor: COLORS.primaryLight }]}>
            <Ionicons name="mail" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.contactText}>
            <Text style={styles.contactTitle}>Email</Text>
            <Text style={styles.contactValue}>support@golle.app</Text>
            <Text style={styles.contactHint}>Réponse sous 24h</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => handleWhatsApp('+221XXXXXXXXX')}
        >
          <View style={[styles.contactIcon, { backgroundColor: '#25D366' + '20' }]}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          </View>
          <View style={styles.contactText}>
            <Text style={styles.contactTitle}>WhatsApp</Text>
            <Text style={styles.contactValue}>+221 XX XXX XX XX</Text>
            <Text style={styles.contactHint}>Support instantané</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Questions Fréquentes</Text>

        {faqs.map((faq, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faqItem}
            onPress={() => handleFAQ(faq)}
          >
            <View style={styles.faqIcon}>
              <Ionicons name="help-circle-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.faqText}>{faq.title}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Additional Resources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ressources</Text>

        <TouchableOpacity style={styles.resourceItem}>
          <Ionicons name="book-outline" size={22} color={COLORS.accent} />
          <Text style={styles.resourceText}>Guide d'utilisation</Text>
          <Ionicons name="open-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.resourceItem}>
          <Ionicons name="videocam-outline" size={22} color={COLORS.secondary} />
          <Text style={styles.resourceText}>Tutoriels vidéo</Text>
          <Ionicons name="open-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.resourceItem}>
          <Ionicons name="document-text-outline" size={22} color={COLORS.primary} />
          <Text style={styles.resourceText}>Conditions d'utilisation</Text>
          <Ionicons name="open-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
        <Text style={styles.versionSubtext}>Göllè - 2026</Text>
      </View>

      <View style={styles.bottomSpace} />
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
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  faqIcon: {
    marginRight: 12,
  },
  faqText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  resourceText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    marginLeft: 12,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  versionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  versionSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  bottomSpace: {
    height: 30,
  },
});

export default SupportScreen;
