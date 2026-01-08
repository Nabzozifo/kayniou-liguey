import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import api from './api';

/**
 * Service de notifications Firebase Cloud Messaging (FCM)
 * Utilisé comme fallback quand Expo Push Notifications ne fonctionne pas (APK local)
 */

/**
 * Demander la permission pour les notifications FCM
 * @returns {Promise<boolean>} - true si permission accordée
 */
export async function requestFCMPermission() {
  try {
    console.log('🔔 [FCM] Demande de permission...');
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ [FCM] Permission accordée:', authStatus);
      return true;
    } else {
      console.log('❌ [FCM] Permission refusée:', authStatus);
      return false;
    }
  } catch (error) {
    console.error('❌ [FCM] Erreur demande permission:', error);
    return false;
  }
}

/**
 * Obtenir le token FCM
 * @returns {Promise<string|null>} - Token FCM
 */
export async function getFCMToken() {
  try {
    console.log('🎫 [FCM] Récupération du token...');

    // Vérifier si les notifications sont autorisées
    const hasPermission = await messaging().hasPermission();
    if (!hasPermission) {
      const granted = await requestFCMPermission();
      if (!granted) {
        console.log('❌ [FCM] Permission non accordée');
        return null;
      }
    }

    // Obtenir le token
    const token = await messaging().getToken();
    console.log('✅ [FCM] Token obtenu:', token.substring(0, 30) + '...');
    return token;
  } catch (error) {
    console.error('❌ [FCM] Erreur obtention token:', error);
    return null;
  }
}

/**
 * Enregistrer le token FCM sur le serveur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<string|null>} - Token FCM enregistré
 */
export async function registerFCMToken(userId) {
  try {
    console.log('🔔 ========== DÉBUT ENREGISTREMENT FCM TOKEN ==========');
    console.log('📋 userId:', userId);
    console.log('📋 Platform:', Platform.OS);

    // Obtenir le token FCM
    const fcmToken = await getFCMToken();

    if (!fcmToken) {
      console.log('❌ [FCM] Impossible d\'obtenir le token');
      return null;
    }

    // Enregistrer sur le serveur
    if (userId && fcmToken) {
      console.log('📤 [FCM] Enregistrement du token sur le serveur...');
      const response = await api.post('/auth/register-push-token', {
        userId,
        pushToken: fcmToken,
        tokenType: 'fcm', // Important: indiquer que c'est un token FCM
        platform: Platform.OS,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
        },
      });
      console.log('✅ [FCM] Réponse serveur:', response.data);
      console.log('✅ [FCM] Token enregistré sur le serveur');
    }

    console.log('🔔 ========== FIN ENREGISTREMENT FCM TOKEN ==========\n');
    return fcmToken;
  } catch (error) {
    console.error('❌ ========== ERREUR ENREGISTREMENT FCM ==========');
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ ==================================================\n');
    return null;
  }
}

/**
 * Configurer les listeners FCM
 * @param {Function} onMessage - Callback pour messages en foreground
 * @param {Function} onNotificationOpen - Callback pour notification tapée
 */
export function setupFCMListeners(onMessage, onNotificationOpen) {
  console.log('🎧 [FCM] Configuration des listeners...');

  // Message reçu en foreground
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    console.log('📬 [FCM] Message reçu en foreground:', remoteMessage);
    if (onMessage) {
      onMessage(remoteMessage);
    }
  });

  // Notification tapée (app fermée ou background)
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('👆 [FCM] Notification tapée (app en background):', remoteMessage);
    if (onNotificationOpen) {
      onNotificationOpen(remoteMessage.data);
    }
  });

  // Notification tapée (app complètement fermée)
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('👆 [FCM] Notification tapée (app fermée):', remoteMessage);
        if (onNotificationOpen) {
          onNotificationOpen(remoteMessage.data);
        }
      }
    });

  console.log('✅ [FCM] Listeners configurés');

  return unsubscribeForeground;
}

/**
 * Nettoyer les listeners FCM
 * @param {Function} unsubscribe - Fonction de désabonnement
 */
export function cleanupFCMListeners(unsubscribe) {
  if (unsubscribe) {
    unsubscribe();
  }
}

/**
 * Gérer le rafraîchissement du token FCM
 * @param {string} userId - ID de l'utilisateur
 */
export function setupTokenRefreshListener(userId) {
  console.log('🔄 [FCM] Configuration listener rafraîchissement token...');

  return messaging().onTokenRefresh(async (newToken) => {
    console.log('🔄 [FCM] Token rafraîchi:', newToken.substring(0, 30) + '...');

    // Enregistrer le nouveau token sur le serveur
    try {
      await api.post('/auth/register-push-token', {
        userId,
        pushToken: newToken,
        tokenType: 'fcm',
        platform: Platform.OS,
      });
      console.log('✅ [FCM] Nouveau token enregistré');
    } catch (error) {
      console.error('❌ [FCM] Erreur enregistrement nouveau token:', error);
    }
  });
}
