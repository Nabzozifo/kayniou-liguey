const mongoose = require('mongoose');
const ServiceRequest = require('../models/ServiceRequest');
const Quote = require('../models/Quote');
const User = require('../models/User');

// @desc    Créer une demande de service
// @route   POST /api/service-requests
// @access  Private (Client only)
exports.createRequest = async (req, res) => {
  try {
    const {
      title,
      description,
      categories,
      mode,
      urgency,
      location,
      address,
      estimatedBudget,
      preferredDate,
      photos,
      targetWorkerId, // For direct hire
      invitedWorkerIds, // For private auction
      auctionDuration, // For auction (in hours)
    } = req.body;

    // Vérifier que l'utilisateur est un client
    const user = await User.findById(req.user.id);
    if (!user || user.userType !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les clients peuvent créer des demandes de service',
      });
    }

    // Validate direct hire
    if (mode === 'direct_hire') {
      if (!targetWorkerId) {
        return res.status(400).json({
          success: false,
          message: 'Un travailleur doit être sélectionné pour une entente directe',
        });
      }

      // Verify target is a worker
      const targetWorker = await User.findById(targetWorkerId);
      if (!targetWorker || targetWorker.userType !== 'worker') {
        return res.status(400).json({
          success: false,
          message: 'Le travailleur sélectionné est invalide',
        });
      }
    }

    // Validate private auction
    if (mode === 'private_auction') {
      if (!invitedWorkerIds || invitedWorkerIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Au moins un travailleur doit être invité pour une enchère privée',
        });
      }

      if (invitedWorkerIds.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 travailleurs peuvent être invités',
        });
      }

      // Verify all invited workers exist and are workers
      const invitedWorkers = await User.find({
        _id: { $in: invitedWorkerIds },
        userType: 'worker',
      });

      if (invitedWorkers.length !== invitedWorkerIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Certains travailleurs invités sont invalides',
        });
      }
    }

    // Ajouter l'adresse à la location si fournie
    const locationData = location;
    if (address && locationData) {
      locationData.address = address;
    }

    // Prepare request data
    const requestData = {
      clientId: req.user.id,
      clientName: user.fullName,
      title,
      description,
      categories,
      mode,
      urgency,
      location: locationData,
      estimatedBudget,
      preferredDate,
      photos,
    };

    // Add direct hire target
    if (mode === 'direct_hire' && targetWorkerId) {
      requestData.targetWorkerId = targetWorkerId;
      requestData.status = 'pending'; // Waiting for worker acceptance
    }

    // Add private auction invited workers
    if (mode === 'private_auction' && invitedWorkerIds) {
      requestData.invitedWorkerIds = invitedWorkerIds;
    }

    // Add auction duration
    if ((mode === 'auction' || mode === 'private_auction') && auctionDuration) {
      requestData.auctionDuration = auctionDuration;
    }

    const serviceRequest = await ServiceRequest.create(requestData);

    // Populate worker info if direct hire
    if (mode === 'direct_hire') {
      await serviceRequest.populate('targetWorkerId', 'fullName phoneNumber photoURL');

      // TODO: Send notification to target worker
      console.log(`📧 Notification à envoyer au worker ${targetWorkerId} pour entente directe`);
    }

    res.status(201).json({
      success: true,
      message: 'Demande de service créée avec succès',
      serviceRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la demande',
      error: error.message,
    });
  }
};

// @desc    Obtenir une demande de service
// @route   GET /api/service-requests/:id
// @access  Public
exports.getRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate('clientId', 'fullName phoneNumber photoURL')
      .populate('assignedWorkerId', 'fullName phoneNumber photoURL');

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée',
      });
    }

    // Incrémenter le compteur de vues
    serviceRequest.viewCount += 1;
    await serviceRequest.save();

    res.json({
      success: true,
      serviceRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la demande',
      error: error.message,
    });
  }
};

// @desc    Obtenir toutes les demandes (avec filtres)
// @route   GET /api/service-requests
// @access  Public
exports.getAllRequests = async (req, res) => {
  try {
    const {
      category,
      mode,
      status,
      urgency,
      latitude,
      longitude,
      radius = 10,
      page = 1,
      limit = 20,
      clientId,
    } = req.query;

    console.log('📊 Filters:', { category, mode, status, urgency, latitude, longitude, radius, clientId });

    // Si recherche par proximité, utiliser agrégation
    if (latitude && longitude) {
      const pipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            distanceField: 'distance',
            maxDistance: parseFloat(radius) * 1000, // km to meters
            spherical: true,
          },
        },
      ];

      // Ajouter filtres
      const matchStage = {};
      if (category) matchStage.categories = category;
      if (mode) matchStage.mode = mode;
      if (status) matchStage.status = status;
      if (urgency) matchStage.urgency = urgency;
      if (clientId) matchStage.clientId = clientId;

      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: parseInt(limit) });

      // Populate
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'clientId',
          foreignField: '_id',
          as: 'clientInfo',
        },
      });

      pipeline.push({
        $addFields: {
          clientId: { $arrayElemAt: ['$clientInfo', 0] },
        },
      });

      const requests = await ServiceRequest.aggregate(pipeline);

      // Count pour pagination
      const countPipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            distanceField: 'distance',
            maxDistance: parseFloat(radius) * 1000,
            spherical: true,
          },
        },
      ];

      if (Object.keys(matchStage).length > 0) {
        countPipeline.push({ $match: matchStage });
      }

      countPipeline.push({ $count: 'total' });

      const countResult = await ServiceRequest.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      console.log('✅ Found requests:', requests.length);

      return res.json({
        success: true,
        count: requests.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        requests,
      });
    }

    // Sans géolocalisation, utiliser find normal
    const query = {};
    if (category) query.categories = category;
    if (mode) query.mode = mode;
    if (status) query.status = status;
    if (urgency) query.urgency = urgency;
    if (clientId) query.clientId = clientId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await ServiceRequest.find(query)
      .populate('clientId', 'fullName photoURL')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ServiceRequest.countDocuments(query);

    console.log('✅ Found requests (no geo):', requests.length);

    res.json({
      success: true,
      count: requests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      requests,
    });
  } catch (error) {
    console.error('❌ Error in getAllRequests:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des demandes',
      error: error.message,
    });
  }
};

// @desc    Changer le statut d'une demande
// @route   PUT /api/service-requests/:id/status
// @access  Private
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée',
      });
    }

    // Vérifier les permissions
    if (
      serviceRequest.clientId.toString() !== req.user.id &&
      serviceRequest.assignedWorkerId?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé',
      });
    }

    serviceRequest.status = status;
    await serviceRequest.save();

    res.json({
      success: true,
      message: `Statut changé en ${status}`,
      serviceRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut',
      error: error.message,
    });
  }
};

// @desc    Assigner un travailleur à une demande
// @route   PUT /api/service-requests/:id/assign
// @access  Private (Client only - owner)
exports.assignWorker = async (req, res) => {
  try {
    const { workerId, quoteId } = req.body;

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée',
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (serviceRequest.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé',
      });
    }

    serviceRequest.assignedWorkerId = workerId;
    serviceRequest.acceptedQuoteId = quoteId;
    serviceRequest.status = 'assigned';
    await serviceRequest.save();

    // Mettre à jour le statut du devis accepté
    if (quoteId) {
      await Quote.findByIdAndUpdate(quoteId, { status: 'accepted' });
      // Refuser tous les autres devis
      await Quote.updateMany(
        { serviceRequestId: req.params.id, _id: { $ne: quoteId } },
        { status: 'rejected' }
      );
    }

    res.json({
      success: true,
      message: 'Travailleur assigné avec succès',
      serviceRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'assignation",
      error: error.message,
    });
  }
};

// @desc    Mettre à jour une demande
// @route   PUT /api/service-requests/:id
// @access  Private (Client only - owner)
exports.updateRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée',
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (serviceRequest.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé',
      });
    }

    // Empêcher la modification si le travail a commencé
    if (serviceRequest.status === 'inProgress' || serviceRequest.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier une demande dont le travail a commencé ou est terminé',
      });
    }

    // Vérifier s'il existe des devis soumis
    const quoteCount = await Quote.countDocuments({ requestId: req.params.id });
    if (quoteCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de modifier la demande car ${quoteCount} devis ont déjà été soumis. Vous pouvez supprimer la demande et en créer une nouvelle.`,
        hasQuotes: true,
        quoteCount,
      });
    }

    const {
      title,
      description,
      categories,
      urgency,
      location,
      address,
      estimatedBudget,
      preferredDate,
      photos,
      auctionDuration,
    } = req.body;

    // Update fields if provided
    if (title) serviceRequest.title = title;
    if (description) serviceRequest.description = description;
    if (categories) serviceRequest.categories = categories;
    if (urgency) serviceRequest.urgency = urgency;
    if (estimatedBudget !== undefined) serviceRequest.estimatedBudget = estimatedBudget;
    if (preferredDate) serviceRequest.preferredDate = preferredDate;
    if (photos) serviceRequest.photos = photos;

    if (location) {
      serviceRequest.location = location;
      if (address) serviceRequest.location.address = address;
    }

    // Update auction duration if auction mode
    if (serviceRequest.mode === 'auction' && auctionDuration) {
      serviceRequest.auctionDuration = auctionDuration;
      // Recalculate end time
      const durationInMs = auctionDuration * 60 * 60 * 1000;
      serviceRequest.auctionEndsAt = new Date(serviceRequest.createdAt.getTime() + durationInMs);
    }

    await serviceRequest.save();

    res.json({
      success: true,
      message: 'Demande mise à jour avec succès',
      serviceRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message,
    });
  }
};

// @desc    Supprimer une demande
// @route   DELETE /api/service-requests/:id
// @access  Private (Client only - owner)
exports.deleteRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée',
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (serviceRequest.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé',
      });
    }

    // Empêcher la suppression si le travail a commencé
    if (serviceRequest.status === 'inProgress' || serviceRequest.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une demande dont le travail a commencé ou est terminé',
      });
    }

    // Delete associated quotes if in pending/assigned status
    if (serviceRequest.status === 'pending' || serviceRequest.status === 'assigned') {
      await Quote.deleteMany({ requestId: req.params.id });
      console.log(`🗑️ Devis associés supprimés pour la demande ${req.params.id}`);
    }

    await ServiceRequest.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Demande supprimée avec succès',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message,
    });
  }
};

// @desc    Obtenir les demandes disponibles pour un worker (filtrées par ses métiers)
// @route   GET /api/service-requests/available-for-worker/:workerId
// @access  Public
exports.getAvailableRequestsForWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    console.log('🔍 Recherche demandes pour worker:', workerId);

    // Récupérer le profil du worker avec ses métiers
    const WorkerProfile = require('../models/WorkerProfile');
    const workerProfile = await WorkerProfile.findOne({ userId: workerId });

    if (!workerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profil worker non trouvé',
      });
    }

    if (!workerProfile.categories || workerProfile.categories.length === 0) {
      // Return empty list instead of error - worker can still browse but won't see category-matched requests
      console.log('⚠️ Worker n\'a pas encore sélectionné de métiers');
      return res.json({
        success: true,
        count: 0,
        total: 0,
        page: parseInt(page),
        pages: 0,
        requests: [],
        message: 'Veuillez sélectionner vos métiers dans votre profil pour voir les demandes correspondantes',
        needsCategories: true,
      });
    }

    console.log('👷 Métiers du worker:', workerProfile.categories);
    console.log('📍 Position:', workerProfile.location);

    // Si le worker a une localisation, filtrer par proximité + métiers
    if (workerProfile.location && workerProfile.location.coordinates) {
      const [longitude, latitude] = workerProfile.location.coordinates;
      const radius = workerProfile.serviceRadius || 10; // km

      const pipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            distanceField: 'distance',
            maxDistance: radius * 1000, // km to meters
            spherical: true,
          },
        },
        {
          $match: {
            status: { $in: ['pending', 'active'] },
            // Filtrer par métiers: case-insensitive match
            $or: workerProfile.categories.map(cat => ({
              categories: { $regex: new RegExp(`^${cat}$`, 'i') }
            })),
            // Exclure les enchères privées sauf si worker est invité
            $and: [
              {
                $or: [
                  { mode: { $ne: 'private_auction' } },
                  { invitedWorkerIds: new mongoose.Types.ObjectId(workerId) },
                ]
              }
            ],
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: (parseInt(page) - 1) * parseInt(limit),
        },
        {
          $limit: parseInt(limit),
        },
        {
          $lookup: {
            from: 'users',
            localField: 'clientId',
            foreignField: '_id',
            as: 'clientInfo',
          },
        },
        {
          $addFields: {
            clientId: { $arrayElemAt: ['$clientInfo', 0] },
          },
        },
        {
          $lookup: {
            from: 'quotes',
            let: { requestId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$requestId', '$$requestId'] },
                      { $eq: ['$workerId', new mongoose.Types.ObjectId(workerId)] }
                    ]
                  }
                }
              }
            ],
            as: 'workerQuotes',
          },
        },
        {
          $addFields: {
            hasSubmittedQuote: { $gt: [{ $size: '$workerQuotes' }, 0] },
          },
        },
        {
          $project: {
            workerQuotes: 0,
          },
        },
      ];

      const requests = await ServiceRequest.aggregate(pipeline);

      // Count
      const countPipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            distanceField: 'distance',
            maxDistance: radius * 1000,
            spherical: true,
          },
        },
        {
          $match: {
            status: { $in: ['pending', 'active'] },
            // Case-insensitive category match
            $or: workerProfile.categories.map(cat => ({
              categories: { $regex: new RegExp(`^${cat}$`, 'i') }
            })),
            // Exclure les enchères privées sauf si worker est invité
            $and: [
              {
                $or: [
                  { mode: { $ne: 'private_auction' } },
                  { invitedWorkerIds: new mongoose.Types.ObjectId(workerId) },
                ]
              }
            ],
          },
        },
        {
          $count: 'total',
        },
      ];

      const countResult = await ServiceRequest.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;

      console.log(`✅ Trouvé ${requests.length} demandes (total: ${total})`);

      return res.json({
        success: true,
        count: requests.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        requests,
        filters: {
          categories: workerProfile.categories,
          radius,
        },
      });
    } else {
      // Pas de localisation: filtrer uniquement par métiers
      const query = {
        status: { $in: ['pending', 'active'] },
        // Case-insensitive category match
        $or: workerProfile.categories.map(cat => ({
          categories: { $regex: new RegExp(`^${cat}$`, 'i') }
        })),
        // Exclure les enchères privées sauf si worker est invité
        $and: [
          {
            $or: [
              { mode: { $ne: 'private_auction' } },
              { invitedWorkerIds: workerId },
            ]
          }
        ],
      };

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const requests = await ServiceRequest.find(query)
        .populate('clientId', 'fullName photoURL phoneNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await ServiceRequest.countDocuments(query);

      // Ajouter hasSubmittedQuote pour chaque requête
      const Quote = require('../models/Quote');
      const requestsWithQuoteStatus = await Promise.all(
        requests.map(async (request) => {
          const existingQuote = await Quote.findOne({
            requestId: request._id,
            workerId: workerId,
          });
          return {
            ...request.toObject(),
            hasSubmittedQuote: !!existingQuote,
          };
        })
      );

      console.log(`✅ Trouvé ${requests.length} demandes (total: ${total})`);

      return res.json({
        success: true,
        count: requestsWithQuoteStatus.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        requests: requestsWithQuoteStatus,
        filters: {
          categories: workerProfile.categories,
        },
      });
    }
  } catch (error) {
    console.error('❌ Erreur getAvailableRequestsForWorker:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des demandes',
      error: error.message,
    });
  }
};

// @desc    Obtenir les devis pour une demande
// @route   GET /api/service-requests/:id/quotes
// @access  Private (authentication required for visibility rules)
exports.getRequestQuotes = async (req, res) => {
  try {
    console.log('🔍 Recherche devis pour request:', req.params.id);

    // Vérifier que l'ID est valide
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('❌ ID invalide');
      return res.status(400).json({
        success: false,
        message: 'ID de demande invalide',
      });
    }

    // Récupérer la demande de service pour connaître le mode
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demande de service non trouvée',
      });
    }

    // Déterminer l'utilisateur qui fait la requête
    const userId = req.user?.id;
    const isClient = userId && serviceRequest.clientId.toString() === userId;
    const isWorker = !isClient;

    console.log('👤 User:', userId, '| Client:', isClient, '| Mode:', serviceRequest.mode);

    // Construire la requête de base
    let quoteQuery = { requestId: req.params.id };

    // Appliquer les règles de visibilité selon le mode
    if (serviceRequest.mode === 'private_auction') {
      // ENCHÈRE PRIVÉE: Workers voient seulement leur devis, client voit tout
      if (isWorker && userId) {
        quoteQuery.workerId = userId; // Worker ne voit que son propre devis
        console.log('🔒 Enchère privée - Worker ne voit que son devis');
      } else if (isClient) {
        console.log('👁️ Enchère privée - Client voit tous les devis');
      } else {
        // Utilisateur non autorisé
        return res.json({
          success: true,
          count: 0,
          quotes: [],
          message: 'Enchère privée - accès restreint',
        });
      }
    } else if (serviceRequest.mode === 'auction') {
      // ENCHÈRE PUBLIQUE: Tout le monde voit tous les devis
      console.log('🌐 Enchère publique - Tous les devis visibles');
    }
    // Pour 'direct' et 'direct_hire', pas de restrictions particulières

    const quotes = await Quote.find(quoteQuery)
      .populate('workerId', 'fullName phoneNumber photoURL rating')
      .sort({ auctionScore: -1, createdAt: -1 }); // Tri par score d'enchère

    console.log('✅ Devis trouvés:', quotes.length);

    // Recalculer les scores si nécessaire (si nouveau devis ou scores manquants)
    const needsRecalculation = quotes.some(q => !q.auctionScore || q.auctionScore === 0);
    if (needsRecalculation && quotes.length > 0) {
      console.log('🔄 Recalcul des scores nécessaire');
      const auctionService = require('../services/auctionService');
      await auctionService.recalculateAuctionScores(req.params.id);

      // Recharger les devis avec les nouveaux scores et la même visibilité
      const updatedQuotes = await Quote.find(quoteQuery)
        .populate('workerId', 'fullName phoneNumber photoURL rating')
        .sort({ auctionScore: -1, createdAt: -1 });

      return res.json({
        success: true,
        count: updatedQuotes.length,
        quotes: updatedQuotes,
        mode: serviceRequest.mode,
        isPrivateAuction: serviceRequest.mode === 'private_auction',
        canSeeAllQuotes: isClient || serviceRequest.mode === 'auction',
      });
    }

    res.json({
      success: true,
      count: quotes.length,
      quotes,
      mode: serviceRequest.mode,
      isPrivateAuction: serviceRequest.mode === 'private_auction',
      canSeeAllQuotes: isClient || serviceRequest.mode === 'auction',
    });
  } catch (error) {
    console.error('❌ Erreur getRequestQuotes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des devis',
      error: error.message,
    });
  }
};
