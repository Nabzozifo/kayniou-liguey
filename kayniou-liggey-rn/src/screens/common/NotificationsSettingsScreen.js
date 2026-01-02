import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

const NotificationsSettingsScreen = () => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: false,
    newRequests: true,
    quotes: true,
    messages: true,
    worksiteUpdates: true,
    ratings: true,
    payments: true,
    promotions: false,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const toggleSetting = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const SettingItem = ({ icon, title, subtitle, settingKey }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color={COLORS.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={() => toggleSetting(settingKey)}
        trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
        thumbColor={settings[settingKey] ? COLORS.primary : COLORS.textLight}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Channels Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Canaux de notification</Text>

        <SettingItem
          icon="notifications"
          title="Notifications Push"
          subtitle="Recevoir des notifications sur votre appareil"
          settingKey="pushNotifications"
        />

        <SettingItem
          icon="mail"
          title="Notifications Email"
          subtitle="Recevoir des emails pour les événements importants"
          settingKey="emailNotifications"
        />

        <SettingItem
          icon="chatbubbles"
          title="Notifications SMS"
          subtitle="Recevoir des SMS pour les événements urgents"
          settingKey="smsNotifications"
        />
      </View>

      {/* Event Types Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Types d'événements</Text>

        <SettingItem
          icon="document-text"
          title="Nouvelles demandes"
          subtitle="Quand une nouvelle demande est disponible"
          settingKey="newRequests"
        />

        <SettingItem
          icon="cash"
          title="Devis"
          subtitle="Réception et acceptation de devis"
          settingKey="quotes"
        />

        <SettingItem
          icon="chatbubble-ellipses"
          title="Messages"
          subtitle="Nouveaux messages de chat"
          settingKey="messages"
        />

        <SettingItem
          icon="hammer"
          title="Mises à jour de chantier"
          subtitle="Changements de statut des chantiers"
          settingKey="worksiteUpdates"
        />

        <SettingItem
          icon="star"
          title="Évaluations"
          subtitle="Nouvelles évaluations reçues"
          settingKey="ratings"
        />

        <SettingItem
          icon="card"
          title="Paiements"
          subtitle="Confirmations et reçus de paiement"
          settingKey="payments"
        />

        <SettingItem
          icon="megaphone"
          title="Promotions"
          subtitle="Offres spéciales et nouveautés"
          settingKey="promotions"
        />
      </View>

      {/* Sound & Vibration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Son et vibration</Text>

        <SettingItem
          icon="volume-high"
          title="Son"
          subtitle="Activer les sons de notification"
          settingKey="soundEnabled"
        />

        <SettingItem
          icon="phone-portrait"
          title="Vibration"
          subtitle="Activer les vibrations"
          settingKey="vibrationEnabled"
        />
      </View>

      {/* Info Section */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color={COLORS.info} />
        <Text style={styles.infoText}>
          Les notifications vous permettent de rester informé en temps réel des événements importants concernant vos demandes et chantiers.
        </Text>
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
  section: {
    backgroundColor: COLORS.white,
    marginTop: 16,
    paddingTop: 12,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.infoLight,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
    marginLeft: 12,
  },
  bottomSpace: {
    height: 30,
  },
});

export default NotificationsSettingsScreen;
