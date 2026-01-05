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

      // Obtenir token Expo Push
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'kayniou-liggey-rn'
      })).data;
      console.log('✅ Expo Push Token:', token);

      this.expoPushToken = token;

      // Configuration Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4A90E2',
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
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
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
      { type: 'new_message', senderName }
    );
  }

  async notifyNewQuote(workerName, price) {
    await this.sendLocalNotification(
      'Nouveau devis reçu',
      `${workerName} a soumis un devis de ${price.toLocaleString()} FCFA`,
      { type: 'new_quote', workerName }
    );
  }

  async notifyQuoteAccepted(clientName) {
    await this.sendLocalNotification(
      'Devis accepté!',
      `${clientName} a accepté votre devis`,
      { type: 'quote_accepted', clientName }
    );
  }

  async notifyQuoteRejected(clientName) {
    await this.sendLocalNotification(
      'Devis refusé',
      `${clientName} a refusé votre devis`,
      { type: 'quote_rejected', clientName }
    );
  }

  async notifyRequestAccepted(workerName) {
    await this.sendLocalNotification(
      'Demande acceptée!',
      `${workerName} a accepté votre demande`,
      { type: 'request_accepted', workerName }
    );
  }

  async notifyMissionCompleted(clientName) {
    await this.sendLocalNotification(
      'Mission terminée',
      `${clientName} a marqué la mission comme terminée. N'oubliez pas de laisser une évaluation!`,
      { type: 'mission_completed', clientName }
    );
  }

  async notifyNewEvaluation(clientName, rating) {
    await this.sendLocalNotification(
      'Nouvelle évaluation',
      `${clientName} vous a évalué: ${rating}/5`,
      { type: 'new_evaluation', clientName, rating }
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
