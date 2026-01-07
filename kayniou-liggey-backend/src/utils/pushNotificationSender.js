const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

// Créer une instance Expo SDK
const expo = new Expo();

/**
 * Envoyer une notification push à un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} notification - Données de la notification
 * @param {string} notification.title - Titre
 * @param {string} notification.body - Message
 * @param {Object} notification.data - Données supplémentaires
 * @param {string} notification.priority - 'default' | 'normal' | 'high'
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
async function sendPushNotification(userId, notification) {
  try {
    console.log('\n🔔 ========== DÉBUT ENVOI PUSH NOTIFICATION ==========');
    console.log('📋 userId:', userId);
    console.log('📋 notification:', JSON.stringify(notification, null, 2));

    const user = await User.findById(userId);

    if (!user) {
      console.log(`❌ User non trouvé: ${userId}`);
      return { success: false, reason: 'user_not_found' };
    }

    console.log(`👤 User trouvé: ${user.fullName} (${user.email})`);
    console.log(`🎫 Push token présent: ${!!user.expoPushToken}`);

    if (user.expoPushToken) {
      console.log(`🎫 Push token: ${user.expoPushToken.substring(0, 30)}...`);
    }

    if (!user.expoPushToken) {
      console.log(`⚠️ Pas de push token pour ${user.fullName} (${userId})`);
      return { success: false, reason: 'no_token' };
    }

    const pushToken = user.expoPushToken;

    // Vérifier que le token est valide
    const isValidToken = Expo.isExpoPushToken(pushToken);
    console.log(`✔️ Token valide Expo: ${isValidToken}`);

    if (!isValidToken) {
      console.error(`❌ Token push invalide pour ${user.fullName}:`, pushToken);
      return { success: false, reason: 'invalid_token' };
    }

    // Construire le message
    const message = {
      to: pushToken,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      priority: notification.priority || 'high',
      badge: notification.badge,
    };

    console.log(`📤 Message construit:`, JSON.stringify(message, null, 2));
    console.log(`📤 Envoi push notification à ${user.fullName}...`);

    const tickets = await expo.sendPushNotificationsAsync([message]);
    const ticket = tickets[0];

    console.log('📬 Ticket reçu:', JSON.stringify(ticket, null, 2));

    if (ticket.status === 'error') {
      console.error('❌ Erreur dans le ticket:', ticket.message, ticket.details);
      return {
        success: false,
        reason: 'ticket_error',
        error: ticket.message,
        details: ticket.details,
      };
    }

    console.log('✅ Notification envoyée avec succès!');
    console.log('🔔 ========== FIN ENVOI PUSH NOTIFICATION ==========\n');

    return {
      success: true,
      ticket: ticket,
    };
  } catch (error) {
    console.error('❌ ========== ERREUR ENVOI PUSH NOTIFICATION ==========');
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ ====================================================\n');
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Envoyer une notification push à plusieurs utilisateurs
 * @param {Array<string>} userIds - IDs des utilisateurs
 * @param {Object} notification - Données de la notification
 * @returns {Promise<Array>} - Résultats des envois
 */
async function sendPushNotificationToMultiple(userIds, notification) {
  const results = [];

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, notification);
    results.push({ userId, ...result });
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`📊 Notifications envoyées: ${successCount}/${userIds.length}`);

  return results;
}

/**
 * Envoyer une notification push en batch (plus efficace)
 * @param {Array<string>} userIds - IDs des utilisateurs
 * @param {Object} notification - Données de la notification
 * @returns {Promise<Object>} - Résultat global
 */
async function sendPushNotificationBatch(userIds, notification) {
  try {
    // Récupérer les tokens de tous les utilisateurs
    const users = await User.find({
      _id: { $in: userIds },
      expoPushToken: { $exists: true, $ne: null },
    });

    if (users.length === 0) {
      console.log('⚠️ Aucun utilisateur avec push token trouvé');
      return { success: false, sent: 0, total: userIds.length };
    }

    // Construire les messages
    const messages = users
      .filter(user => Expo.isExpoPushToken(user.expoPushToken))
      .map(user => ({
        to: user.expoPushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        priority: notification.priority || 'high',
        badge: notification.badge,
      }));

    if (messages.length === 0) {
      console.log('⚠️ Aucun token valide trouvé');
      return { success: false, sent: 0, total: userIds.length };
    }

    console.log(`📤 Envoi batch de ${messages.length} notifications...`);

    // Envoyer en batch (max 100 par batch recommandé par Expo)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ Erreur envoi chunk:', error);
      }
    }

    const successCount = tickets.filter(
      ticket => ticket.status === 'ok'
    ).length;

    console.log(`✅ Notifications envoyées: ${successCount}/${messages.length}`);

    return {
      success: true,
      sent: successCount,
      total: userIds.length,
      tickets,
    };
  } catch (error) {
    console.error('❌ Erreur sendPushNotificationBatch:', error);
    return {
      success: false,
      error: error.message,
      sent: 0,
      total: userIds.length,
    };
  }
}

module.exports = {
  sendPushNotification,
  sendPushNotificationToMultiple,
  sendPushNotificationBatch,
};
