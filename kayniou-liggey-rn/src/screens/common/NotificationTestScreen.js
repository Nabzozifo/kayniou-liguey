import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { COLORS } from '../../constants';
import notificationService from '../../services/notificationService';
import * as PushNotifications from '../../services/pushNotificationService';
import { useAuth } from '../../contexts/AuthContext';

const NotificationTestScreen = () => {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [channels, setChannels] = useState([]);
  const [lastNotification, setLastNotification] = useState(null);

  useEffect(() => {
    checkPermissions();
    getExpoPushToken();
    if (Platform.OS === 'android') {
      getNotificationChannels();
    }

    // Écouter les notifications reçues
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📩 Notification reçue:', notification);
      setLastNotification(notification);
    });

    return () => subscription.remove();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
    Alert.alert('Permissions', `Statut: ${status}`);
  };

  const getExpoPushToken = async () => {
    try {
      const token = await notificationService.initialize();
      setExpoPushToken(token);
    } catch (error) {
      console.error('Erreur token:', error);
    }
  };

  const getNotificationChannels = async () => {
    if (Platform.OS === 'android') {
      const channelsList = await Notifications.getNotificationChannelsAsync();
      setChannels(channelsList || []);
    }
  };

  const testLocalNotification = async (channelId = 'default') => {
    try {
      await notificationService.sendLocalNotification(
        'Test Notification Locale',
        'Ceci est une notification de test. Si vous la voyez, ça fonctionne!',
        { test: true, timestamp: Date.now() },
        channelId
      );
      Alert.alert('Succès', 'Notification envoyée! Vérifiez la barre de notifications.');
    } catch (error) {
      console.error('Erreur notification:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  const testAllNotificationTypes = async () => {
    const notifications = [
      { method: 'notifyNewMessage', args: ['Jean Dupont', 'Bonjour, comment allez-vous?'] },
      { method: 'notifyNewQuote', args: ['Marie Martin', 50000] },
      { method: 'notifyQuoteAccepted', args: ['Paul Durand'] },
      { method: 'notifyRequestAccepted', args: ['Sophie Bernard'] },
      { method: 'notifyMissionCompleted', args: ['Client Test'] },
      { method: 'notifyNewEvaluation', args: ['Client Satisfait', 5] },
      { method: 'notifyWorksiteStatusChange', args: ['Mise à jour chantier', 'Le worker est arrivé sur le chantier'] },
    ];

    for (let i = 0; i < notifications.length; i++) {
      const { method, args } = notifications[i];
      setTimeout(() => {
        notificationService[method](...args);
      }, i * 2000); // 2 secondes entre chaque notification
    }

    Alert.alert(
      'Test en cours',
      `${notifications.length} notifications vont être envoyées sur 14 secondes. Mettez l'app en arrière-plan pour les voir!`
    );
  };

  const clearAllNotifications = async () => {
    await notificationService.clearAllNotifications();
    Alert.alert('Succès', 'Toutes les notifications ont été effacées');
  };

  const reregisterPushToken = async () => {
    try {
      console.log('🔄 Réenregistrement forcé du push token...');
      const token = await PushNotifications.registerForPushNotificationsAsync(user.id);
      if (token) {
        setExpoPushToken(token);
        Alert.alert('Succès', `Token enregistré!\n\n${token.substring(0, 50)}...`);
      } else {
        Alert.alert('Erreur', 'Impossible d\'obtenir le token. Vérifiez les logs dans le terminal.');
      }
    } catch (error) {
      console.error('Erreur réenregistrement:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  const getPermissionIcon = () => {
    switch (permissionStatus) {
      case 'granted':
        return { name: 'checkmark-circle', color: COLORS.success };
      case 'denied':
        return { name: 'close-circle', color: COLORS.danger };
      default:
        return { name: 'help-circle', color: COLORS.warning };
    }
  };

  const permissionIcon = getPermissionIcon();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={48} color={COLORS.primary} />
        <Text style={styles.title}>Test Notifications Push</Text>
        <Text style={styles.subtitle}>
          Testez toutes les fonctionnalités des notifications
        </Text>
      </View>

      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Statut</Text>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons name={permissionIcon.name} size={24} color={permissionIcon.color} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Permissions</Text>
              <Text style={[styles.statusValue, { color: permissionIcon.color }]}>
                {permissionStatus}
              </Text>
            </View>
            {permissionStatus !== 'granted' && (
              <TouchableOpacity style={styles.miniButton} onPress={requestPermissions}>
                <Text style={styles.miniButtonText}>Demander</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons name="key" size={24} color={COLORS.primary} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Expo Push Token</Text>
              <Text style={styles.statusValue} numberOfLines={1}>
                {expoPushToken ? expoPushToken.substring(0, 30) + '...' : 'Non généré'}
              </Text>
            </View>
          </View>
        </View>

        {Platform.OS === 'android' && (
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Ionicons name="albums" size={24} color={COLORS.info} />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Canaux Android</Text>
                <Text style={styles.statusValue}>{channels.length} configurés</Text>
              </View>
              <TouchableOpacity style={styles.miniButton} onPress={getNotificationChannels}>
                <Ionicons name="refresh" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            {channels.length > 0 && (
              <View style={styles.channelsList}>
                {channels.map((channel, index) => (
                  <View key={index} style={styles.channelItem}>
                    <Text style={styles.channelName}>{channel.name}</Text>
                    <Text style={styles.channelImportance}>
                      Importance: {channel.importance}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Test Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Tests Rapides</Text>

        <TouchableOpacity
          style={[styles.testButton, styles.primaryButton]}
          onPress={() => testLocalNotification('default')}
        >
          <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
          <Text style={styles.testButtonText}>Test Notification Basique</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.importantButton]}
          onPress={() => testLocalNotification('important')}
        >
          <Ionicons name="alert-circle" size={20} color={COLORS.white} />
          <Text style={styles.testButtonText}>Test Notification Importante</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.worksiteButton]}
          onPress={() => testLocalNotification('worksite')}
        >
          <Ionicons name="briefcase" size={20} color={COLORS.white} />
          <Text style={styles.testButtonText}>Test Notification Chantier</Text>
        </TouchableOpacity>
      </View>

      {/* Test All Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Tests Complets</Text>

        <TouchableOpacity
          style={[styles.testButton, styles.allTypesButton]}
          onPress={testAllNotificationTypes}
        >
          <Ionicons name="rocket" size={20} color={COLORS.white} />
          <Text style={styles.testButtonText}>Tester Tous les Types (7)</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          💡 Mettez l'application en arrière-plan pour voir les notifications système
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛠️ Actions</Text>

        <TouchableOpacity
          style={[styles.testButton, styles.warningButton]}
          onPress={reregisterPushToken}
        >
          <Ionicons name="refresh-circle" size={20} color={COLORS.white} />
          <Text style={styles.testButtonText}>Réenregistrer Push Token</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          ⚠️ Utilisez ce bouton si votre token n'est pas généré. Vérifiez les logs dans le terminal.
        </Text>

        <TouchableOpacity
          style={[styles.testButton, styles.clearButton]}
          onPress={clearAllNotifications}
        >
          <Ionicons name="trash" size={20} color={COLORS.white} />
          <Text style={styles.testButtonText}>Effacer Toutes les Notifications</Text>
        </TouchableOpacity>
      </View>

      {/* Last Notification */}
      {lastNotification && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📬 Dernière Notification Reçue</Text>
          <View style={styles.notificationCard}>
            <Text style={styles.notificationTitle}>
              {lastNotification.request.content.title}
            </Text>
            <Text style={styles.notificationBody}>
              {lastNotification.request.content.body}
            </Text>
            <Text style={styles.notificationTime}>
              {new Date(lastNotification.date).toLocaleTimeString('fr-FR')}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  miniButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  miniButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  channelsList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  channelItem: {
    paddingVertical: 6,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  channelImportance: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  importantButton: {
    backgroundColor: '#FF3B30',
  },
  worksiteButton: {
    backgroundColor: COLORS.info,
  },
  allTypesButton: {
    backgroundColor: COLORS.success,
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  clearButton: {
    backgroundColor: COLORS.danger,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  hint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  notificationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  notificationBody: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: 40,
  },
});

export default NotificationTestScreen;
