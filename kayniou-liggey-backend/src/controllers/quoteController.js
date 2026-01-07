const Quote = require('../models/Quote');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');

// @desc    Créer un devis
// @route   POST /api/quotes
// @access  Private (Worker only)
exports.createQuote = async (req, res) => {
  try {
    console.log('📝 Création devis - Body:', req.body);
    console.log('📝 User ID:', req.user.id);

    const {
      requestId,
      price,
      estimatedDuration,
      description,
      servicesIncluded,
      availableDate,
      additionalNotes,
    } = req.body;

    // Validation des champs requis
    if (!requestId || !price || !estimatedDuration || !description) {
      console.log('❌ Champs manquants');
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants',
      });
    }

    // Vérifier que l'utilisateur est un travailleur
    const user = await User.findById(req.user.id);
    if (!user || user.userType !== 'worker') {
      console.log('❌ Utilisateur non autorisé:', user?.userType);
      return res.status(403).json({
        success: false,
        message: 'Seuls les travailleurs peuvent créer des devis',
      });
    }

    console.log('✅ User trouvé:', user.fullName);

    // Vérifier que la demande existe
    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demande de service non trouvée',
      });
    }

    // Vérifier si l'enchère est expirée (pour les demandes en mode auction)
    if (serviceRequest.mode === 'auction' && serviceRequest.auctionEndsAt) {
      const now = new Date();
      if (now > serviceRequest.auctionEndsAt) {
        return res.status(400).json({
          success: false,
          message: 'L\'enchère est expirée. Aucun nouveau devis ne peut être soumis.',
          auctionEnded: true,
        });
      }
    }

    // Vérifier que le travailleur n'a pas déjà soumis un devis
    const existingQuote = await Quote.findOne({
      requestId,
      workerId: req.user.id,
    });

    if (existingQuote) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà soumis un devis pour cette demande',
      });
    }

    // Récupérer le profil du travailleur pour le rating
    const workerProfile = await WorkerProfile.findOne({ userId: req.user.id });

    const quote = await Quote.create({
      requestId,
      workerId: req.user.id,
      workerName: user.fullName,
      workerPhoto: user.photoURL || '',
      workerRating: user.rating || workerProfile?.rating || 0,
      price,
      estimatedDuration,
      description,
      servicesIncluded: servicesIncluded || [],
      availableDate: availableDate || null,
      additionalNotes: additionalNotes || '',
    });

    // Incrémenter le compteur de devis de la demande
    serviceRequest.quoteCount += 1;
    await serviceRequest.save();

    console.log('✅ Devis créé avec succès:', quote._id);

    // Créer notification pour le client
    const Notification = require('../models/Notification');
    const { sendPushNotification } = require('../utils/pushNotificationSender');

    await Notification.create({
      userId: serviceRequest.clientId,
      type: 'new_quote_submitted',
      title: 'Nouveau devis reçu',
      message: `${user.fullName} a soumis un devis de ${price} XOF pour "${serviceRequest.title}"`,
      relatedResource: {
        type: 'quote',
        id: quote._id,
      },
      actionData: {
        screen: 'RequestDetails',
        params: { requestId: serviceRequest._id.toString() },
      },
      priority: 'high',
    });

    console.log('✅ Notification devis créée en BD');

    // Envoyer push notification au client
    await sendPushNotification(serviceRequest.clientId, {
      title: 'Nouveau devis reçu',
      body: `${user.fullName} propose ${price} XOF pour "${serviceRequest.title}"`,
      data: {
        screen: 'RequestDetails',
        params: { requestId: serviceRequest._id.toString() },
        type: 'new_quote_submitted',
      },
    });

    console.log('✅ Push notification devis envoyée');

    res.status(201).json({
      success: true,
      message: 'Devis créé avec succès',
      quote,
    });
  } catch (error) {
    console.error('❌ Erreur createQuote:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du devis',
      error: error.message,
    });
  }
};

// @desc    Obtenir un devis
// @route   GET /api/quotes/:id
// @access  Public
exports.getQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('workerId', 'fullName phoneNumber photoURL')
      .populate('requestId', 'title description clientId');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    res.json({
      success: true,
      quote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du devis',
      error: error.message,
    });
  }
};

// @desc    Obtenir les devis d'un travailleur
// @route   GET /api/quotes/worker/:workerId
// @access  Public
exports.getWorkerQuotes = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { workerId: req.params.workerId };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const quotes = await Quote.find(query)
      .populate('requestId', 'title description status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Ajouter le titre de la demande à chaque devis pour faciliter l'affichage
    const quotesWithTitle = quotes.map(quote => ({
      ...quote.toObject(),
      requestId: quote.requestId?._id || quote.requestId, // Forcer ID au lieu d'objet
      requestTitle: quote.requestId?.title || 'Demande supprimée'
    }));

    const total = await Quote.countDocuments(query);

    res.json({
      success: true,
      count: quotesWithTitle.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      quotes: quotesWithTitle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des devis',
      error: error.message,
    });
  }
};

// @desc    Obtenir les devis d'une demande avec logique d'enchère
// @route   GET /api/quotes/request/:requestId
// @access  Private
exports.getQuotesByRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    // Récupérer la demande
    const ServiceRequest = require('../models/ServiceRequest');
    const request = await ServiceRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée',
      });
    }

    const isClient = request.clientId.toString() === userId;
    const isWorker = !isClient;

    let quotes;
    let totalCount;

    // LOGIQUE SELON LE TYPE D'ENCHÈRE
    if (request.mode === 'auction') {
      // ENCHÈRE PUBLIQUE: Tout le monde voit tous les devis
      quotes = await Quote.find({ requestId })
        .populate('workerId', 'fullName phoneNumber photoURL rating')
        .sort({ price: 1 }); // Trié par prix croissant

      totalCount = quotes.length;

    } else if (request.mode === 'private_auction') {
      // ENCHÈRE PRIVÉE
      totalCount = await Quote.countDocuments({ requestId });

      if (isClient) {
        // Le client voit TOUS les devis
        quotes = await Quote.find({ requestId })
          .populate('workerId', 'fullName phoneNumber photoURL rating')
          .sort({ price: 1 });
      } else if (isWorker) {
        // Le worker ne voit QUE son propre devis
        quotes = await Quote.find({ requestId, workerId: userId })
          .populate('workerId', 'fullName phoneNumber photoURL rating');

        // Masquer les détails des autres devis (on renvoie juste le compte)
      } else {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé',
        });
      }

    } else if (request.mode === 'direct') {
      // ENTENTE DIRECTE: Pas de système de devis multiples
      // Le client a directement sélectionné un worker
      quotes = [];
      totalCount = 0;
    } else {
      quotes = [];
      totalCount = 0;
    }

    res.json({
      success: true,
      quotes,
      totalCount,
      mode: request.mode,
      isClient,
      canSeeAllQuotes: isClient || request.mode === 'auction',
    });

  } catch (error) {
    console.error('❌ Erreur getQuotesByRequest:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des devis',
      error: error.message,
    });
  }
};

// @desc    Mettre à jour un devis
// @route   PUT /api/quotes/:id
// @access  Private (Worker only - owner)
exports.updateQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (quote.workerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier ce devis',
      });
    }

    // Ne pas permettre la modification si le devis n'est pas en pending
    if (quote.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier un devis qui n\'est pas en attente',
      });
    }

    const {
      price,
      estimatedDuration,
      description,
      servicesIncluded,
      availableDate,
      additionalNotes,
    } = req.body;

    const updatedQuote = await Quote.findByIdAndUpdate(
      req.params.id,
      {
        price,
        estimatedDuration,
        description,
        servicesIncluded,
        availableDate,
        additionalNotes,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Devis mis à jour',
      quote: updatedQuote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message,
    });
  }
};

// @desc    Accepter un devis
// @route   PUT /api/quotes/:id/accept
// @access  Private (Client only - request owner)
exports.acceptQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('requestId')
      .populate('workerId', 'fullName email phoneNumber photoURL');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Vérifier que l'utilisateur est le propriétaire de la demande
    if (quote.requestId.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé',
      });
    }

    // Accepter ce devis
    quote.status = 'accepted';
    await quote.save();

    // Refuser tous les autres devis pour cette demande
    await Quote.updateMany(
      { requestId: quote.requestId._id, _id: { $ne: quote._id } },
      { status: 'rejected' }
    );

    // Mettre à jour la demande de service
    const serviceRequest = await ServiceRequest.findById(quote.requestId._id);
    serviceRequest.status = 'assigned';
    serviceRequest.assignedWorkerId = quote.workerId;
    serviceRequest.acceptedQuoteId = quote._id;
    await serviceRequest.save();

    // Créer un contrat
    const Contract = require('../models/Contract');
    const contract = await Contract.create({
      requestId: quote.requestId._id,
      quoteId: quote._id,
      clientId: quote.requestId.clientId,
      workerId: quote.workerId,
      agreedPrice: quote.price,
      estimatedDuration: quote.estimatedDuration,
      status: 'active',
    });

    console.log('✅ Contract créé:', contract._id);

    // Créer un chantier (Worksite)
    const Worksite = require('../models/Worksite');
    const WorksiteActivity = require('../models/WorksiteActivity');
    const User = require('../models/User');

    // Get client and worker info
    const client = await User.findById(quote.requestId.clientId);
    const worker = await User.findById(quote.workerId);

    const worksite = await Worksite.create({
      contractId: contract._id,
      requestId: quote.requestId._id,
      quoteId: quote._id,
      clientId: quote.requestId.clientId,
      workerId: quote.workerId,
      title: quote.requestId.title,
      description: quote.requestId.description,
      category: quote.requestId.categories?.[0] || 'General',
      agreedPrice: quote.price,
      estimatedDuration: quote.estimatedDuration,
      location: quote.requestId.location,
      deadline: quote.requestId.preferredDate,
      servicesIncluded: quote.servicesIncluded || [],
      additionalNotes: quote.additionalNotes || '',
      clientInfo: {
        name: client?.fullName || '',
        phone: client?.phoneNumber || '',
        email: client?.email || '',
        photoURL: client?.photoURL || '',
      },
      workerInfo: {
        name: worker?.fullName || '',
        phone: worker?.phoneNumber || '',
        email: worker?.email || '',
        photoURL: worker?.photoURL || '',
      },
      status: 'pending',
      workerStatus: 'assigned',
      statusHistory: [{
        status: 'assigned',
        timestamp: new Date(),
        note: 'Devis accepté, chantier créé'
      }],
    });

    console.log('✅ Worksite créé:', worksite._id);

    // Créer une entrée dans l'audit log
    await WorksiteActivity.create({
      worksiteId: worksite._id,
      type: 'created',
      actorId: req.user.id,
      actorType: 'client',
      actorName: client?.fullName || 'Client',
      description: 'Chantier créé suite à l\'acceptation du devis',
      metadata: {
        quoteId: quote._id,
        contractId: contract._id,
        price: quote.price,
      },
    });

    // Créer des notifications
    const Notification = require('../models/Notification');
    const { sendPushNotification } = require('../utils/pushNotificationSender');

    // Notification pour le worker
    await Notification.create({
      userId: quote.workerId,
      type: 'quote_accepted',
      title: 'Devis accepté !',
      message: `Votre devis pour "${quote.requestId.title}" a été accepté par le client.`,
      relatedResource: {
        type: 'worksite',
        id: worksite._id,
      },
      actionData: {
        screen: 'WorksiteDetails',
        params: { worksiteId: worksite._id },
      },
      priority: 'high',
    });

    console.log('✅ Notification créée en BD pour worker');

    // Envoyer push notification au worker
    await sendPushNotification(quote.workerId, {
      title: 'Devis accepté !',
      body: `Votre devis pour "${quote.requestId.title}" a été accepté par le client.`,
      data: {
        screen: 'WorksiteDetails',
        params: { worksiteId: worksite._id.toString() },
        type: 'quote_accepted',
      },
    });

    console.log('✅ Push notification envoyée au worker');

    // Créer la conversation pour le chat
    const { Conversation, ChatMessage } = require('../models/Chat');
    let conversation = await Conversation.findOne({
      requestId: quote.requestId._id,
      clientId: quote.requestId.clientId,
      workerId: quote.workerId,
    });

    if (!conversation) {
      // Créer la conversation
      conversation = await Conversation.create({
        requestId: quote.requestId._id,
        clientId: quote.requestId.clientId,
        workerId: quote.workerId,
        lastMessage: 'Chantier créé - Vous pouvez maintenant communiquer',
        lastMessageAt: new Date(),
      });
      console.log('✅ Conversation créée:', conversation._id);

      // Créer le message système initial
      await ChatMessage.create({
        conversationId: conversation._id,
        senderId: req.user.id,
        senderName: client?.fullName || 'Client',
        receiverId: quote.workerId,
        type: 'system',
        content: `Chantier "${quote.requestId.title}" créé. Vous pouvez maintenant communiquer avec ${worker?.fullName || 'le travailleur'}.`,
        status: 'sent',
      });
      console.log('✅ Message système initial créé');
    } else {
      console.log('ℹ️ Conversation existe déjà');
    }

    res.json({
      success: true,
      message: 'Devis accepté, contrat et chantier créés',
      quote,
      contract,
      worksite,
    });
  } catch (error) {
    console.error('❌ Erreur acceptation devis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'acceptation du devis',
      error: error.message,
    });
  }
};

// @desc    Refuser un devis
// @route   PUT /api/quotes/:id/reject
// @access  Private (Client only - request owner)
exports.rejectQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('requestId');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Vérifier que l'utilisateur est le propriétaire de la demande
    if (quote.requestId.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé',
      });
    }

    quote.status = 'rejected';
    await quote.save();

    res.json({
      success: true,
      message: 'Devis refusé',
      quote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du refus du devis',
      error: error.message,
    });
  }
};

// @desc    Supprimer un devis
// @route   DELETE /api/quotes/:id
// @access  Private (Worker only - owner)
exports.deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (quote.workerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé',
      });
    }

    // Ne pas permettre la suppression si le devis n'est pas en pending
    if (quote.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un devis qui n\'est pas en attente',
      });
    }

    await Quote.findByIdAndDelete(req.params.id);

    // Décrémenter le compteur de devis de la demande
    const serviceRequest = await ServiceRequest.findById(quote.requestId);
    if (serviceRequest) {
      serviceRequest.quoteCount = Math.max(0, serviceRequest.quoteCount - 1);
      await serviceRequest.save();
    }

    res.json({
      success: true,
      message: 'Devis supprimé',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message,
    });
  }
};
