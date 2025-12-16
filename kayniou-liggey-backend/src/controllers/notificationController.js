const PushToken = require('../models/PushToken');
const Notification = require('../models/Notification');
const { Expo } = require('expo-server-sdk');

// Créer instance Expo SDK
const expo = new Expo();

// @desc    Enregistrer un push token
// @route   POST /api/notifications/register-token
// @access  Private
exports.registerPushToken = async (req, res) => {
  try {
    const { pushToken, platform } = req.body;
    const userId = req.user.id;

    console.log('📱 Enregistrement push token:', { userId, pushToken, platform });

    // Valider le token Expo
    if (!Expo.isExpoPushToken(pushToken)) {
      return res.status(400).json({
        success: false,
        message: 'Token push invalide',
      });
    }

    // Désactiver les anciens tokens de cet utilisateur
    await PushToken.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    // Créer ou mettre à jour le token
    let token = await PushToken.findOne({ pushToken });

    if (token) {
      token.userId = userId;
      token.platform = platform;
      token.isActive = true;
      token.lastUsedAt = Date.now();
      await token.save();
    } else {
      token = await PushToken.create({
        userId,
        pushToken,
        platform,
        isActive: true,
      });
    }

    console.log('✅ Push token enregistré');

    res.json({
      success: true,
      message: 'Token enregistré avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur registerPushToken:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du token',
      error: error.message,
    });
  }
};

// @desc    Envoyer une notification push
// @route   POST /api/notifications/send
// @access  Private (Admin ou système)
exports.sendPushNotification = async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    console.log('📤 Envoi notification à:', userId);

    // Récupérer les tokens actifs de l'utilisateur
    const tokens = await PushToken.find({ userId, isActive: true });

    if (tokens.length === 0) {
      return res.json({
        success: true,
        message: 'Aucun token actif trouvé',
        sent: 0,
      });
    }

    // Préparer les messages
    const messages = tokens.map((token) => ({
      to: token.pushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
    }));

    // Envoyer via Expo
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

    console.log('✅ Notifications envoyées:', tickets.length);

    res.json({
      success: true,
      message: 'Notifications envoyées',
      sent: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error('❌ Erreur sendPushNotification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la notification',
      error: error.message,
    });
  }
};

// Fonction helper pour envoyer notification à un utilisateur
async function sendNotificationToUser(userId, title, body, data = {}) {
  try {
    const tokens = await PushToken.find({ userId, isActive: true });

    if (tokens.length === 0) {
      console.log('⚠️ Aucun token pour user:', userId);
      return;
    }

    const messages = tokens.map((token) => ({
      to: token.pushToken,
      sound: 'default',
      title,
      body,
      data,
    }));

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('❌ Erreur envoi notification:', error);
      }
    }

    console.log('✅ Notification envoyée à', userId);
  } catch (error) {
    console.error('❌ Erreur sendNotificationToUser:', error);
  }
}

// Export des fonctions helper
exports.sendNotificationToUser = sendNotificationToUser;

// Helpers pour types de notifications spécifiques
exports.notifyNewMessage = async (receiverId, senderName, messageContent) => {
  await sendNotificationToUser(
    receiverId,
    `Nouveau message de ${senderName}`,
    messageContent.substring(0, 100),
    { type: 'new_message', senderName }
  );
};

exports.notifyNewQuote = async (clientId, workerName, price) => {
  await sendNotificationToUser(
    clientId,
    'Nouveau devis reçu',
    `${workerName} a soumis un devis de ${price.toLocaleString()} FCFA`,
    { type: 'new_quote', workerName }
  );
};

exports.notifyQuoteAccepted = async (workerId, clientName) => {
  await sendNotificationToUser(
    workerId,
    'Devis accepté!',
    `${clientName} a accepté votre devis`,
    { type: 'quote_accepted', clientName }
  );
};

exports.notifyQuoteRejected = async (workerId, clientName) => {
  await sendNotificationToUser(
    workerId,
    'Devis refusé',
    `${clientName} a refusé votre devis`,
    { type: 'quote_rejected', clientName }
  );
};

exports.notifyRequestAccepted = async (clientId, workerName) => {
  await sendNotificationToUser(
    clientId,
    'Demande acceptée!',
    `${workerName} a accepté votre demande`,
    { type: 'request_accepted', workerName }
  );
};

exports.notifyMissionCompleted = async (workerId, clientName) => {
  await sendNotificationToUser(
    workerId,
    'Mission terminée',
    `${clientName} a marqué la mission comme terminée`,
    { type: 'mission_completed', clientName }
  );
};

exports.notifyNewEvaluation = async (workerId, clientName, rating) => {
  await sendNotificationToUser(
    workerId,
    'Nouvelle évaluation',
    `${clientName} vous a évalué: ${rating}/5`,
    { type: 'new_evaluation', clientName, rating }
  );
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50 } = req.query;

    console.log('📋 Récupération notifications pour:', userId);

    const query = { userId };
    if (status === 'unread') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    console.log(`✅ ${notifications.length} notifications trouvées (${unreadCount} non lues)`);

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('❌ Erreur getNotifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications',
      error: error.message,
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('❌ Erreur getUnreadCount:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du compteur',
      error: error.message,
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée',
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    console.log('✅ Notification marquée comme lue:', id);

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('❌ Erreur markAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage de la notification',
      error: error.message,
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    console.log(`✅ ${result.modifiedCount} notifications marquées comme lues`);

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marquées comme lues`,
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error('❌ Erreur markAllAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage des notifications',
      error: error.message,
    });
  }
};

// @desc    Unregister push token
// @route   POST /api/notifications/unregister-token
// @access  Private
exports.unregisterPushToken = async (req, res) => {
  try {
    const userId = req.user.id;

    await PushToken.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    console.log('✅ Tokens désactivés pour user:', userId);

    res.json({
      success: true,
      message: 'Tokens désactivés',
    });
  } catch (error) {
    console.error('❌ Erreur unregisterPushToken:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation des tokens',
      error: error.message,
    });
  }
};

module.exports = exports;
