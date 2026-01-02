const { ChatMessage, Conversation } = require('../models/Chat');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');

// @desc    Créer ou obtenir une conversation
// @route   POST /api/chat/conversations
// @access  Private
exports.createOrGetConversation = async (req, res) => {
  try {
    const { requestId, workerId } = req.body;

    // Vérifier que la demande existe
    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demande de service non trouvée',
      });
    }

    // Vérifier si une conversation existe déjà
    let conversation = await Conversation.findOne({
      requestId,
      clientId: serviceRequest.clientId,
      workerId,
    })
      .populate('clientId', 'fullName photoURL')
      .populate('workerId', 'fullName photoURL')
      .populate('requestId', 'title');

    // Créer une nouvelle conversation si elle n'existe pas
    if (!conversation) {
      conversation = await Conversation.create({
        requestId,
        clientId: serviceRequest.clientId,
        workerId,
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('clientId', 'fullName photoURL')
        .populate('workerId', 'fullName photoURL')
        .populate('requestId', 'title');
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la conversation',
      error: error.message,
    });
  }
};

// @desc    Obtenir les conversations d'un utilisateur
// @route   GET /api/chat/conversations
// @access  Private
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    let query;
    if (user.userType === 'client') {
      query = { clientId: userId };
    } else {
      query = { workerId: userId };
    }

    const conversations = await Conversation.find(query)
      .populate('clientId', 'fullName photoURL')
      .populate('workerId', 'fullName photoURL')
      .populate('requestId', 'title status')
      .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des conversations',
      error: error.message,
    });
  }
};

// @desc    Obtenir une conversation
// @route   GET /api/chat/conversations/:id
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('clientId', 'fullName photoURL')
      .populate('workerId', 'fullName photoURL')
      .populate('requestId', 'title status');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée',
      });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    if (
      conversation.clientId._id.toString() !== req.user.id &&
      conversation.workerId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé',
      });
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la conversation',
      error: error.message,
    });
  }
};

// @desc    Envoyer un message
// @route   POST /api/chat/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, type, content, metadata } = req.body;

    const conversation = await Conversation.findById(conversationId).populate('requestId');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée. La conversation doit être créée lors de l\'acceptation du devis.',
      });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    if (
      conversation.clientId.toString() !== req.user.id &&
      conversation.workerId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé',
      });
    }

    // Note: Si la conversation existe, cela signifie qu'un worksite a été créé
    // (conversation créée lors de l'acceptation du devis), donc pas besoin de vérifications supplémentaires

    const user = await User.findById(req.user.id);

    const message = await ChatMessage.create({
      conversationId,
      senderId: req.user.id,
      senderName: user.fullName,
      receiverId,
      type: type || 'text',
      content,
      metadata,
      status: 'sent',
    });

    // Mettre à jour la conversation
    conversation.lastMessage = content;
    conversation.lastMessageAt = Date.now();

    // Incrémenter le compteur de messages non lus pour le destinataire
    if (receiverId === conversation.clientId.toString()) {
      conversation.clientUnreadCount += 1;
    } else {
      conversation.workerUnreadCount += 1;
    }

    await conversation.save();

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('senderId', 'fullName photoURL')
      .populate('receiverId', 'fullName photoURL');

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message',
      error: error.message,
    });
  }
};

// @desc    Obtenir les messages d'une conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const conversationId = req.params.id;

    console.log('🔍 Get messages - conversationId:', conversationId);

    // Vérifier que conversationId est fourni
    if (!conversationId || conversationId === 'undefined') {
      console.log('❌ conversationId invalide');
      return res.status(400).json({
        success: false,
        message: 'ID de conversation invalide',
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      console.log('❌ Conversation non trouvée');
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée',
      });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    if (
      conversation.clientId.toString() !== req.user.id &&
      conversation.workerId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé',
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await ChatMessage.find({ conversationId: req.params.id })
      .populate('senderId', 'fullName photoURL')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ChatMessage.countDocuments({
      conversationId: req.params.id,
    });

    res.json({
      success: true,
      count: messages.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      messages: messages.reverse(), // Inverser pour avoir les plus anciens en premier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages',
      error: error.message,
    });
  }
};

// @desc    Marquer les messages comme lus
// @route   PUT /api/chat/conversations/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée',
      });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    if (
      conversation.clientId.toString() !== req.user.id &&
      conversation.workerId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé',
      });
    }

    // Réinitialiser le compteur de messages non lus
    if (req.user.id === conversation.clientId.toString()) {
      conversation.clientUnreadCount = 0;
    } else {
      conversation.workerUnreadCount = 0;
    }

    await conversation.save();

    // Marquer tous les messages comme lus
    await ChatMessage.updateMany(
      {
        conversationId: req.params.id,
        receiverId: req.user.id,
        status: { $ne: 'read' },
      },
      {
        status: 'read',
        readAt: Date.now(),
      }
    );

    res.json({
      success: true,
      message: 'Messages marqués comme lus',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message,
    });
  }
};

// @desc    Supprimer une conversation
// @route   DELETE /api/chat/conversations/:id
// @access  Private
exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée',
      });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    if (
      conversation.clientId.toString() !== req.user.id &&
      conversation.workerId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé',
      });
    }

    // Supprimer tous les messages de la conversation
    await ChatMessage.deleteMany({ conversationId: req.params.id });

    // Supprimer la conversation
    await Conversation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Conversation supprimée',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message,
    });
  }
};
