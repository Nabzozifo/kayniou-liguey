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

    let conversation = await Conversation.findById(conversationId).populate('requestId');

    if (!conversation) {
      console.log('⚠️ Conversation non trouvée pour sendMessage, tentative de création:', conversationId);

      // Essayer de trouver la demande associée à l'expéditeur et au destinataire
      const ServiceRequest = require('../models/ServiceRequest');
      const request = await ServiceRequest.findOne({
        $or: [
          { clientId: req.user.id, assignedWorkerId: receiverId },
          { clientId: receiverId, assignedWorkerId: req.user.id }
        ],
        status: { $in: ['assigned', 'in_progress', 'completed'] }
      });

      if (request) {
        console.log('ℹ️ Demande trouvée, création de la conversation');

        // Déterminer clientId et workerId
        const clientId = request.clientId;
        const workerId = request.assignedWorkerId;

        // Vérifier si la conversation existe déjà
        conversation = await Conversation.findOne({
          requestId: request._id,
          clientId: clientId,
          workerId: workerId
        }).populate('requestId');

        if (!conversation) {
          conversation = await Conversation.create({
            requestId: request._id,
            clientId: clientId,
            workerId: workerId,
            lastMessage: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            lastMessageAt: new Date(),
          });
          console.log('✅ Conversation créée pour sendMessage:', conversation._id);
        }
      }

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation non trouvée et impossible de la créer',
        });
      }
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

    // RESTRICTION: Vérifier qu'il y a un contrat actif (demande acceptée)
    // On peut envoyer des messages uniquement si:
    // 1. La demande est en mode direct ET status = 'accepted' ou 'in_progress' ou 'completed'
    // 2. La demande est en mode auction ET il y a un devis accepté
    const request = conversation.requestId;

    if (!request) {
      return res.status(403).json({
        success: false,
        message: 'Demande associée non trouvée',
      });
    }

    const allowedStatuses = ['accepted', 'in_progress', 'completed'];

    if (request.mode === 'direct') {
      // Mode direct: vérifier que la demande est acceptée/en cours
      if (!allowedStatuses.includes(request.status)) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez envoyer des messages que lorsqu\'un contrat est actif (demande acceptée).',
        });
      }
    } else if (request.mode === 'auction') {
      // Mode auction: vérifier qu'un devis a été accepté
      const Quote = require('../models/Quote');
      const acceptedQuote = await Quote.findOne({
        requestId: request._id,
        workerId: conversation.workerId,
        status: 'accepted',
      });

      if (!acceptedQuote && !allowedStatuses.includes(request.status)) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez envoyer des messages que lorsqu\'un devis est accepté.',
        });
      }
    }

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
      console.log('⚠️ Conversation non trouvée, vérification si elle devrait exister:', conversationId);

      // Essayer de trouver une demande de service associée à cet utilisateur
      const ServiceRequest = require('../models/ServiceRequest');
      const requests = await ServiceRequest.find({
        $or: [
          { clientId: req.user.id },
          { assignedWorkerId: req.user.id }
        ],
        status: { $in: ['assigned', 'in_progress', 'completed'] }
      });

      if (requests.length > 0) {
        console.log('ℹ️ Utilisateur a des demandes actives, création de conversation manquante');

        // Pour chaque demande, vérifier si une conversation devrait exister
        for (const request of requests) {
          const workerId = request.assignedWorkerId;
          if (workerId) {
            const existingConv = await Conversation.findOne({
              requestId: request._id,
              clientId: request.clientId,
              workerId: workerId
            });

            if (!existingConv) {
              const newConv = await Conversation.create({
                requestId: request._id,
                clientId: request.clientId,
                workerId: workerId,
                lastMessage: 'Conversation créée automatiquement',
                lastMessageAt: new Date(),
              });
              console.log('✅ Conversation créée:', newConv._id);

              // Si c'est la conversation demandée, l'utiliser
              if (newConv._id.toString() === conversationId) {
                conversation = newConv;
                break;
              }
            }
          }
        }
      }

      if (!conversation) {
        console.log('❌ Aucune conversation trouvée ou créée');
        return res.status(404).json({
          success: false,
          message: 'Conversation non trouvée',
        });
      }
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
