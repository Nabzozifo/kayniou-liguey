import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

// Configuration du comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Enregistrer le device pour les notifications push
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<string>} - Push token
 */
export async function registerForPushNotificationsAsync(userId) {
  let token;

  console.log('🔔 ========== DÉBUT ENREGISTREMENT PUSH TOKEN ==========');
  console.log('📋 userId:', userId);
  console.log('📋 Device.isDevice:', Device.isDevice);
  console.log('📋 Platform:', Platform.OS);

  if (!Device.isDevice) {
    console.log('⚠️ Les notifications push ne fonctionnent que sur un appareil physique');
    return null;
  }

  try {
    // Vérifier les permissions existantes
    console.log('🔍 Vérification des permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📋 Permission existante:', existingStatus);
    let finalStatus = existingStatus;

    // Demander la permission si pas encore accordée
    if (existingStatus !== 'granted') {
      console.log('📝 Demande de permission...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📋 Nouvelle permission:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Permission notifications refusée');
      return null;
    }

    // Obtenir le token Expo Push
    console.log('🎫 Récupération du token Expo...');
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    console.log('📋 Project ID:', projectId);

    if (!projectId) {
      console.error('❌ Project ID manquant! Vérifier app.json');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId,
    })).data;

    console.log('✅ Push token obtenu:', token);

    // Enregistrer le token sur le serveur
    if (userId && token) {
      console.log('📤 Enregistrement du token sur le serveur...');
      const response = await api.post('/auth/register-push-token', {
        userId,
        pushToken: token,
        platform: Platform.OS,
        deviceInfo: {
          brand: Device.brand,
          model: Device.modelName,
          osVersion: Device.osVersion,
        },
      });
      console.log('✅ Réponse serveur:', response.data);
      console.log('✅ Token enregistré sur le serveur');
    } else {
      console.log('⚠️ userId ou token manquant:', { userId: !!userId, token: !!token });
    }

    // Configuration Android spécifique
    if (Platform.OS === 'android') {
      console.log('🔧 Configuration canal Android...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications Kayniou-Liggey',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        sound: 'default',
      });
      console.log('✅ Canal Android configuré');
    }

    console.log('🔔 ========== FIN ENREGISTREMENT PUSH TOKEN ==========\n');
    return token;
  } catch (error) {
    console.error('❌ ========== ERREUR ENREGISTREMENT NOTIFICATIONS ==========');
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Response:', error.response?.data);
    console.error('❌ ===========================================================\n');
    return null;
  }
}

/**
 * Configurer les listeners de notifications
 * @param {Function} onNotificationReceived - Callback quand notification reçue
 * @param {Function} onNotificationTapped - Callback quand notification tapée
 * @returns {Object} - Subscriptions à nettoyer
 */
export function setupNotificationListeners(onNotificationReceived, onNotificationTapped) {
  // Notification reçue pendant que l'app est au premier plan
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📬 Notification reçue:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Notification tapée par l'utilisateur
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification tapée:', response);
    const data = response.notification.request.content.data;
    if (onNotificationTapped) {
      onNotificationTapped(data);
    }
  });

  return {
    notificationListener,
    responseListener,
  };
}

/**
 * Nettoyer les listeners
 * @param {Object} subscriptions - Subscriptions retournées par setupNotificationListeners
 */
export function cleanupNotificationListeners(subscriptions) {
  if (subscriptions?.notificationListener) {
    Notifications.removeNotificationSubscription(subscriptions.notificationListener);
  }
  if (subscriptions?.responseListener) {
    Notifications.removeNotificationSubscription(subscriptions.responseListener);
  }
}

/**
 * Envoyer une notification locale (test)
 * @param {string} title - Titre
 * @param {string} body - Message
 * @param {Object} data - Données supplémentaires
 */
export async function scheduleLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Immédiat
  });
}

/**
 * Obtenir le nombre de notifications non lues (badge)
 * @returns {Promise<number>}
 */
export async function getBadgeCount() {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Définir le nombre de notifications non lues (badge)
 * @param {number} count
 */
export async function setBadgeCount(count) {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Effacer toutes les notifications
 */
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}
