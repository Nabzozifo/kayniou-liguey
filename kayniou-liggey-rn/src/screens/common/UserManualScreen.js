import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Contenu du manuel ---
const MANUAL_SECTIONS = [
  {
    id: 'presentation',
    title: "Présentation de l'application",
    icon: 'information-circle-outline',
    content: [
      {
        subtitle: "Qu'est-ce que Göllè ?",
        text: "Göllè est une application de mise en relation entre clients qui ont besoin de services et travailleurs qualifiés en Afrique de l'Ouest.",
      },
      {
        subtitle: 'Catégories de services',
        text: "Plomberie, Électricité, Menuiserie, Maçonnerie, Peinture, Carrelage, Jardinage, Nettoyage, Déménagement, Réparation, Installation, Climatisation, Mécanique.",
      },
      {
        subtitle: 'Pays supportés',
        text: "Sénégal, Côte d'Ivoire, Mali, Burkina Faso, Guinée, Togo, Bénin, Niger, Mauritanie, Gambie, Guinée-Bissau, Cap-Vert, Sierra Leone, Libéria, Ghana, Nigéria.",
      },
    ],
  },
  {
    id: 'inscription',
    title: 'Inscription et Connexion',
    icon: 'person-add-outline',
    content: [
      {
        subtitle: 'Créer un compte',
        text: "1. Appuyez sur \"Commencer maintenant\"\n2. Remplissez : nom complet, email, téléphone (pays détecté par GPS), mot de passe (min. 6 caractères)\n3. Appuyez sur \"Continuer\"",
      },
      {
        subtitle: 'Vérification OTP',
        text: "Entrez le code à 5 chiffres reçu par SMS. Si vous ne le recevez pas, appuyez sur \"Renvoyer le code\" après 60s. Code de test : 12345.",
      },
      {
        subtitle: 'Choix du profil',
        text: "Choisissez \"Client\" pour chercher des travailleurs, ou \"Worker\" pour proposer vos services (vous devrez sélectionner vos métiers).",
      },
      {
        subtitle: 'Se connecter',
        text: "Entrez votre numéro de téléphone et mot de passe, puis appuyez sur \"Se connecter\".",
      },
    ],
  },
  {
    id: 'client-accueil',
    title: 'Client : Accueil et Carte',
    icon: 'map-outline',
    content: [
      {
        subtitle: 'Carte interactive',
        text: "L'accueil affiche une carte avec les travailleurs disponibles à proximité. Un compteur en bas indique le nombre de travailleurs proches.",
      },
      {
        subtitle: 'Filtrer par catégorie',
        text: "Utilisez la barre horizontale en haut pour filtrer : Tous, Plomberie, Électricité, Menuiserie, etc.",
      },
      {
        subtitle: 'Boutons disponibles',
        text: "- Bouton \"+\" (bleu, en bas à droite) : Créer une demande\n- \"Recherche IA\" (orange) : Recherche intelligente par texte libre\n- Chatbot (orange, en bas à gauche) : Assistant IA\n- Recentrer (blanc) : Recentrer sur votre position",
      },
    ],
  },
  {
    id: 'client-demande',
    title: 'Client : Créer une Demande',
    icon: 'add-circle-outline',
    content: [
      {
        subtitle: 'Étape 1 : Informations de base',
        text: "- Titre : Un titre court et clair\n- Description : Détails du travail\n- Catégories : Sélectionnez une ou plusieurs\n- Urgence : Faible, Moyenne ou Urgente",
      },
      {
        subtitle: 'Étape 2 : Détails et budget',
        text: "- Budget estimé en monnaie locale\n- Mode de demande :\n  * Direct : Assignez un worker spécifique\n  * Enchères Publiques : Comparez les devis ouvertement\n  * Enchère Privée : Devis confidentiels entre workers\n- Durée d'enchère : 12h, 24h, 48h, 72h ou 7 jours\n- Localisation : Détectée par GPS (modifiable)",
      },
      {
        subtitle: 'Expiration',
        text: "Après la durée choisie, la demande expire automatiquement. Les workers ne pourront plus soumettre de devis.",
      },
    ],
  },
  {
    id: 'client-devis',
    title: 'Client : Gestion des Devis',
    icon: 'document-text-outline',
    content: [
      {
        subtitle: 'Voir les devis',
        text: "Dans \"Mes demandes\", appuyez sur une demande pour voir les devis reçus : nom du worker, montant, délai, message.",
      },
      {
        subtitle: 'Accepter ou rejeter',
        text: "Pour chaque devis : bouton \"Accepter\" (vert) ou \"Rejeter\" (rouge). Accepter un devis crée automatiquement un chantier.",
      },
      {
        subtitle: 'Contacter un worker',
        text: "Appuyez sur \"Contacter\" à côté d'un devis pour ouvrir une conversation directe.",
      },
    ],
  },
  {
    id: 'client-statuts',
    title: 'Client : Statuts des Demandes',
    icon: 'flag-outline',
    content: [
      {
        subtitle: 'Les statuts possibles',
        text: "- En attente (jaune) : Demande créée, en attente de devis\n- Active (bleu) : Enchère en cours, devis reçus\n- Assignée (violet) : Un worker est sélectionné\n- En cours (bleu) : Travail en cours\n- Terminée (vert) : Travail fini\n- Annulée (rouge) : Demande annulée\n- Expirée (gris) : Durée d'enchère écoulée",
      },
    ],
  },
  {
    id: 'chantiers',
    title: 'Suivi des Chantiers',
    icon: 'briefcase-outline',
    content: [
      {
        subtitle: "L'onglet Chantiers",
        text: "Affiche tous vos chantiers (en cours et terminés). Filtrez par : Tous, En attente, En cours, Terminés.",
      },
      {
        subtitle: 'Détails du chantier',
        text: "Titre, description, montant convenu, dates, historique d'activité. Bouton pour contacter le worker/client.",
      },
      {
        subtitle: 'Évaluer après complétion',
        text: "Quand le chantier est terminé, un bouton \"Évaluer\" apparaît pour noter le travailleur ou le client.",
      },
    ],
  },
  {
    id: 'worker-accueil',
    title: 'Worker : Accueil et Carte',
    icon: 'hammer-outline',
    content: [
      {
        subtitle: 'Carte des demandes',
        text: "L'accueil affiche une carte avec les demandes de service à proximité correspondant à vos métiers.",
      },
      {
        subtitle: 'Disponibilité',
        text: "Utilisez le switch en haut à droite pour activer/désactiver votre disponibilité (Dispo/Indispo).",
      },
      {
        subtitle: 'Filtrer par catégorie',
        text: "Barre horizontale pour filtrer : Toutes, Plomberie, Électricité, etc. La carte se rafraîchit automatiquement.",
      },
      {
        subtitle: 'Navigation',
        text: "- Appuyez sur un marqueur pour voir les détails\n- Bouton \"Liste\" (bleu) pour la vue liste\n- Bouton chatbot (orange) pour l'assistant",
      },
    ],
  },
  {
    id: 'worker-devis',
    title: 'Worker : Soumettre un Devis',
    icon: 'send-outline',
    content: [
      {
        subtitle: 'Soumettre un devis',
        text: "1. Ouvrez les détails d'une demande\n2. Appuyez sur \"Soumettre un devis\"\n3. Remplissez : montant, délai, message\n4. Appuyez sur \"Envoyer\"",
      },
      {
        subtitle: 'Règles importantes',
        text: "- Un seul devis par demande\n- Impossible de soumettre pour une demande expirée\n- En enchère privée, vous ne voyez que votre propre devis\n- Vous pouvez modifier/supprimer un devis \"En attente\"",
      },
      {
        subtitle: 'Mes devis',
        text: "L'onglet \"Devis\" affiche tous vos devis soumis avec filtres : Tous, En attente, Acceptés, Rejetés. Badge \"Devis envoyé\" visible sur les demandes concernées.",
      },
    ],
  },
  {
    id: 'worker-profil',
    title: 'Worker : Profil Professionnel',
    icon: 'person-circle-outline',
    content: [
      {
        subtitle: 'Modifier le profil',
        text: "Depuis Profil > Modifier le Profil :\n- Catégories de métiers\n- Description professionnelle\n- Motivation\n- Tarif horaire\n- Années d'expérience\n- Rayon de service (5 à 100 km avec boutons +/-)",
      },
      {
        subtitle: 'Tableau de bord',
        text: "Statistiques : chantiers réalisés, note moyenne, revenus cumulés.",
      },
    ],
  },
  {
    id: 'abonnements',
    title: 'Abonnements Worker',
    icon: 'trophy-outline',
    content: [
      {
        subtitle: 'Plan Basique (Gratuit)',
        text: "- Profil visible\n- 3 réponses/mois\n- Commission standard\n- 5 questions chatbot",
      },
      {
        subtitle: 'Plan Premium (10 000 FCFA/mois)',
        text: "- Visibilité prioritaire (badge TOP)\n- Réponses illimitées\n- Commission réduite\n- Badge Premium\n- Chatbot illimité",
      },
      {
        subtitle: 'Souscrire au Premium',
        text: "Allez dans Profil > Abonnements, sélectionnez Premium, confirmez. Vos avantages sont activés immédiatement.",
      },
    ],
  },
  {
    id: 'chatbot',
    title: 'Chatbot Assistant',
    icon: 'chatbubble-ellipses-outline',
    content: [
      {
        subtitle: 'Comment utiliser le chatbot',
        text: "Accessible depuis le bouton chatbot sur l'accueil ou depuis Profil > Chatbot. Tapez votre question et l'assistant IA vous répond.",
      },
      {
        subtitle: 'Exemples de questions',
        text: "- \"Comment créer une demande ?\"\n- \"Quel est le tarif moyen pour un plombier ?\"\n- \"Comment devenir Premium ?\"\n- \"J'ai un problème avec mon compte\"",
      },
      {
        subtitle: 'Limites',
        text: "Non-Premium : 5 questions maximum. Premium : illimité.",
      },
    ],
  },
  {
    id: 'notation',
    title: 'Système de Notation',
    icon: 'star-outline',
    content: [
      {
        subtitle: 'Évaluer après un chantier',
        text: "Après complétion d'un chantier, évaluez l'autre partie :\n- Note globale : 1 à 5 étoiles\n- Notes détaillées : Qualité, Ponctualité, Communication, Professionnalisme\n- Commentaire : min. 10 caractères\n- Recommandation : Oui/Non",
      },
      {
        subtitle: 'Impact des notes',
        text: "La note moyenne est affichée sur le profil du worker et aide les futurs clients à faire leur choix.",
      },
    ],
  },
  {
    id: 'messagerie',
    title: 'Messagerie',
    icon: 'chatbubbles-outline',
    content: [
      {
        subtitle: 'Conversations',
        text: "L'onglet \"Messages\" liste vos conversations. Badge rouge si messages non lus. Messages en temps réel.",
      },
      {
        subtitle: 'Envoyer un message',
        text: "Appuyez sur une conversation pour l'ouvrir. Tapez votre message et envoyez. L'heure est affichée sur chaque message.",
      },
    ],
  },
  {
    id: 'parametres',
    title: 'Paramètres',
    icon: 'settings-outline',
    content: [
      {
        subtitle: 'Rayon de recherche (Client)',
        text: "Profil > Préférences de recherche. Ajustez de 5 à 100 km avec les boutons - et +.",
      },
      {
        subtitle: 'Notifications',
        text: "Profil > Notifications. Activez/désactivez les types de notifications souhaitées.",
      },
      {
        subtitle: 'Confidentialité',
        text: "Profil > Confidentialité. Consultez la politique de données et vos droits.",
      },
      {
        subtitle: 'Déconnexion',
        text: "Profil > Déconnexion. Vous serez redirigé vers la page d'accueil.",
      },
    ],
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: 'help-circle-outline',
    content: [
      {
        subtitle: "L'app est-elle gratuite ?",
        text: "Oui pour les clients. Workers : plan Basique gratuit (limité) ou Premium à 10 000 FCFA/mois.",
      },
      {
        subtitle: "Que se passe-t-il quand une demande expire ?",
        text: "Après la durée choisie, la demande passe à \"Expirée\". Les devis en attente expirent aussi. Vous pouvez créer une nouvelle demande.",
      },
      {
        subtitle: "Pourquoi je ne vois pas de demandes ? (Worker)",
        text: "Vérifiez : 1) Profil complet (catégories sélectionnées), 2) Disponibilité activée, 3) Des demandes existent dans vos catégories et votre zone.",
      },
      {
        subtitle: "Je ne reçois pas le code SMS",
        text: "Attendez 60s puis appuyez sur \"Renvoyer\". En cas de problème, utilisez le code de test : 12345.",
      },
      {
        subtitle: "Erreur réseau / L'app ne se connecte pas",
        text: "Vérifiez votre connexion Internet (Wi-Fi ou données mobiles). Redémarrez l'application si nécessaire.",
      },
    ],
  },
];

// --- Composant Section Accordion ---
const AccordionSection = ({ section, isExpanded, onToggle }) => {
  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={[styles.sectionHeader, isExpanded && styles.sectionHeaderExpanded]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIconBox, isExpanded && styles.sectionIconBoxExpanded]}>
            <Ionicons
              name={section.icon}
              size={22}
              color={isExpanded ? COLORS.white : COLORS.primary}
            />
          </View>
          <Text style={[styles.sectionTitle, isExpanded && styles.sectionTitleExpanded]}>
            {section.title}
          </Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={isExpanded ? COLORS.primary : COLORS.textSecondary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.sectionContent}>
          {section.content.map((item, index) => (
            <View key={index} style={styles.contentItem}>
              <View style={styles.subtitleRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.contentText}>{item.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// --- Écran principal ---
const UserManualScreen = ({ navigation }) => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const expandAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const all = {};
    MANUAL_SECTIONS.forEach((s) => (all[s.id] = true));
    setExpandedSections(all);
  };

  const collapseAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections({});
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconBox}>
            <Ionicons name="book-outline" size={28} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Manuel d'utilisation</Text>
            <Text style={styles.headerSubtitle}>Göllè v1.0.0</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn} onPress={expandAll}>
            <Ionicons name="expand-outline" size={18} color={COLORS.primary} />
            <Text style={styles.headerActionText}>Tout ouvrir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} onPress={collapseAll}>
            <Ionicons name="contract-outline" size={18} color={COLORS.textSecondary} />
            <Text style={[styles.headerActionText, { color: COLORS.textSecondary }]}>Tout fermer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sections */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {MANUAL_SECTIONS.map((section) => (
          <AccordionSection
            key={section.id}
            section={section}
            isExpanded={!!expandedSections[section.id]}
            onToggle={() => toggleSection(section.id)}
          />
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Göllè - Connecter les talents aux besoins
          </Text>
          <Text style={styles.footerSubtext}>
            partout en Afrique de l'Ouest
          </Text>
          <Text style={styles.footerVersion}>Version 1.0.0 - Mars 2026</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundDark,
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconBoxExpanded: {
    backgroundColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  sectionTitleExpanded: {
    color: COLORS.primary,
  },
  sectionContent: {
    padding: 16,
    paddingTop: 12,
  },
  contentItem: {
    marginBottom: 16,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  contentText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    paddingLeft: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  footerVersion: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 12,
  },
});

export default UserManualScreen;
