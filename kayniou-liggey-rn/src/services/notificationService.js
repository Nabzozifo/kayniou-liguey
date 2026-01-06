import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Initialiser le service de notifications
   */
  async initialize() {
    try {
      // Vérifier si c'est un appareil physique
      if (!Device.isDevice) {
        console.log('⚠️ Les notifications ne fonctionnent pas sur simulateur');
        return null;
      }

      // Demander permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Permission notifications refusée');
        return null;
      }

      // Obtenir token Expo Push (projectId lu automatiquement depuis app.json)
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('✅ Expo Push Token:', token);

      this.expoPushToken = token;

      // Configuration Android - Créer les canaux de notification
      if (Platform.OS === 'android') {
        // Canal par défaut
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notifications générales',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4A90E2',
          sound: true,
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });

        // Canal pour messages importants
        await Notifications.setNotificationChannelAsync('important', {
          name: 'Messages importants',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF0000',
          sound: true,
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });

        // Canal pour le suivi de chantier
        await Notifications.setNotificationChannelAsync('worksite', {
          name: 'Suivi de chantier',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4A90E2',
          sound: true,
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      return token;
    } catch (error) {
      console.error('❌ Erreur initialisation notifications:', error);
      return null;
    }
  }

  /**
   * Enregistrer le token sur le serveur
   */
  async registerPushToken(userId) {
    try {
      if (!this.expoPushToken) {
        await this.initialize();
      }

      if (this.expoPushToken) {
        await api.post('/notifications/register-token', {
          userId,
          pushToken: this.expoPushToken,
          platform: Platform.OS,
        });
        console.log('✅ Token enregistré sur le serveur');
      }
    } catch (error) {
      console.error('❌ Erreur enregistrement token:', error);
    }
  }

  /**
   * Écouter les notifications reçues
   */
  addNotificationReceivedListener(callback) {
    this.notificationListener = Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Écouter les interactions avec les notifications
   */
  addNotificationResponseReceivedListener(callback) {
    this.responseListener = Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Envoyer une notification locale
   */
  async sendLocalNotification(title, body, data = {}, channelId = 'default') {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...(Platform.OS === 'android' && {
            channelId,
            vibrate: [0, 250, 250, 250],
            badge: 1,
          }),
        },
        trigger: null, // Immédiat
      });
    } catch (error) {
      console.error('❌ Erreur notification locale:', error);
    }
  }

  /**
   * Notifications prédéfinies
   */
  async notifyNewMessage(senderName, message) {
    await this.sendLocalNotification(
      `Nouveau message de ${senderName}`,
      message.substring(0, 100),
      { type: 'new_message', senderName },
      'important'
    );
  }

  async notifyNewQuote(workerName, price) {
    await this.sendLocalNotification(
      'Nouveau devis reçu',
      `${workerName} a soumis un devis de ${price.toLocaleString()} FCFA`,
      { type: 'new_quote', workerName },
      'important'
    );
  }

  async notifyQuoteAccepted(clientName) {
    await this.sendLocalNotification(
      'Devis accepté!',
      `${clientName} a accepté votre devis`,
      { type: 'quote_accepted', clientName },
      'important'
    );
  }

  async notifyQuoteRejected(clientName) {
    await this.sendLocalNotification(
      'Devis refusé',
      `${clientName} a refusé votre devis`,
      { type: 'quote_rejected', clientName },
      'default'
    );
  }

  async notifyRequestAccepted(workerName) {
    await this.sendLocalNotification(
      'Demande acceptée!',
      `${workerName} a accepté votre demande`,
      { type: 'request_accepted', workerName },
      'important'
    );
  }

  async notifyMissionCompleted(clientName) {
    await this.sendLocalNotification(
      'Mission terminée',
      `${clientName} a marqué la mission comme terminée. N'oubliez pas de laisser une évaluation!`,
      { type: 'mission_completed', clientName },
      'worksite'
    );
  }

  async notifyNewEvaluation(clientName, rating) {
    await this.sendLocalNotification(
      'Nouvelle évaluation',
      `${clientName} vous a évalué: ${rating}/5`,
      { type: 'new_evaluation', clientName, rating },
      'default'
    );
  }

  async notifyWorksiteStatusChange(title, message, data = {}) {
    await this.sendLocalNotification(
      title,
      message,
      { type: 'worksite_status', ...data },
      'worksite'
    );
  }

  /**
   * Nettoyer les listeners
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Obtenir le badge count
   */
  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Définir le badge count
   */
  async setBadgeCount(count) {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Effacer toutes les notifications
   */
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }
}

// Export singleton
const notificationService = new NotificationService();
export default notificationService;
