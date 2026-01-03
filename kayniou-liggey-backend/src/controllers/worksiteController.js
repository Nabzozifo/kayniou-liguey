const Worksite = require('../models/Worksite');
const WorksiteActivity = require('../models/WorksiteActivity');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Contract = require('../models/Contract');
const ServiceRequest = require('../models/ServiceRequest');
const Quote = require('../models/Quote');
const { sendPushNotification } = require('../utils/pushNotificationSender');

// @desc    Get all worksites for a user (client or worker)
// @route   GET /api/worksites
// @access  Private
exports.getWorksites = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.id;

    console.log('🔍 Chargement chantiers pour:', userId);

    // Construire la query selon le type d'utilisateur
    const query = {
      $or: [
        { clientId: userId },
        { workerId: userId },
      ],
    };

    if (status) {
      query.status = status;
    }

    const worksites = await Worksite.find(query)
      .populate('clientId', 'fullName photoURL phoneNumber')
      .populate('workerId', 'fullName photoURL phoneNumber')
      .populate('requestId', 'title category')
      .sort({ updatedAt: -1 });

    console.log(`✅ Trouvé ${worksites.length} chantiers`);

    res.json({
      success: true,
      count: worksites.length,
      worksites,
    });
  } catch (error) {
    console.error('❌ Erreur getWorksites:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des chantiers',
      error: error.message,
    });
  }
};

// @desc    Get single worksite
// @route   GET /api/worksites/:id
// @access  Private
exports.getWorksite = async (req, res) => {
  try {
    console.log('🔍 Chargement chantier:', req.params.id);

    const worksite = await Worksite.findById(req.params.id)
      .populate('clientId', 'fullName photoURL phoneNumber email')
      .populate('workerId', 'fullName photoURL phoneNumber email')
      .populate('requestId')
      .populate('quoteId')
      .populate('contractId');

    if (!worksite) {
      console.log('❌ Chantier non trouvé');
      return res.status(404).json({
        success: false,
        message: 'Chantier non trouvé',
      });
    }

    console.log('✅ Chantier trouvé');
    console.log('   clientId:', worksite.clientId?._id || worksite.clientId);
    console.log('   workerId:', worksite.workerId?._id || worksite.workerId);
    console.log('   user.id:', req.user.id);

    // Vérifier que l'utilisateur a accès à ce chantier
    // Handle both populated and non-populated IDs
    const clientIdStr = worksite.clientId?._id?.toString() || worksite.clientId?.toString();
    const workerIdStr = worksite.workerId?._id?.toString() || worksite.workerId?.toString();

    if (clientIdStr !== req.user.id && workerIdStr !== req.user.id) {
      console.log('❌ Accès refusé');
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    console.log('✅ Accès autorisé');

    res.json({
      success: true,
      worksite,
    });
  } catch (error) {
    console.error('❌ Erreur getWorksite:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du chantier',
      error: error.message,
    });
  }
};

// @desc    Get worksite activity timeline
// @route   GET /api/worksites/:id/activity
// @access  Private
exports.getWorksiteActivity = async (req, res) => {
  try {
    const worksite = await Worksite.findById(req.params.id);

    if (!worksite) {
      return res.status(404).json({
        success: false,
        message: 'Chantier non trouvé',
      });
    }

    // Vérifier accès
    if (
      worksite.clientId.toString() !== req.user.id &&
      worksite.workerId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    const activities = await WorksiteActivity.find({ worksiteId: req.params.id })
      .populate('actorId', 'fullName photoURL')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error('❌ Erreur getWorksiteActivity:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message,
    });
  }
};

// @desc    Start work on a worksite
// @route   PUT /api/worksites/:id/start
// @access  Private (Worker only)
exports.startWork = async (req, res) => {
  try {
    const worksite = await Worksite.findById(req.params.id);

    if (!worksite) {
      return res.status(404).json({
        success: false,
        message: 'Chantier non trouvé',
      });
    }

    // Vérifier que c'est le worker assigné
    if (worksite.workerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Seul le travailleur assigné peut démarrer ce chantier',
      });
    }

    // Vérifier que le chantier n'est pas déjà démarré
    if (worksite.status === 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Le chantier a déjà été démarré',
      });
    }

    // Démarrer le chantier
    worksite.status = 'in_progress';
    worksite.startTime = new Date();
    await worksite.save();

    console.log('✅ Chantier démarré:', worksite._id);

    // Créer une entrée dans l'audit log
    const worker = await User.findById(req.user.id);
    await WorksiteActivity.create({
      worksiteId: worksite._id,
      type: 'started',
      actorId: req.user.id,
      actorType: 'worker',
      actorName: worker.fullName,
      description: `${worker.fullName} a démarré le travail`,
      metadata: {
        startTime: worksite.startTime,
      },
    });

    // Créer notification pour le client
    await Notification.create({
      userId: worksite.clientId,
      type: 'job_started',
      title: 'Travail démarré',
      message: `${worker.fullName} a commencé à travailler sur "${worksite.title}"`,
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

    console.log('✅ Notification envoyée au client');

    // Envoyer push notification
    await sendPushNotification(worksite.clientId, {
      title: 'Travail démarré',
      body: `${worker.fullName} a commencé à travailler sur "${worksite.title}"`,
      data: {
        screen: 'WorksiteDetails',
        params: { worksiteId: worksite._id.toString() },
        type: 'job_started',
      },
    });

    res.json({
      success: true,
      message: 'Chantier démarré avec succès',
      worksite,
    });
  } catch (error) {
    console.error('❌ Erreur startWork:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du démarrage du travail',
      error: error.message,
    });
  }
};

// @desc    Finish work on a worksite
// @route   PUT /api/worksites/:id/finish
// @access  Private (Worker only)
exports.finishWork = async (req, res) => {
  try {
    const worksite = await Worksite.findById(req.params.id);

    if (!worksite) {
      return res.status(404).json({
        success: false,
        message: 'Chantier non trouvé',
      });
    }

    // Vérifier que c'est le worker assigné
    if (worksite.workerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Seul le travailleur assigné peut terminer ce chantier',
      });
    }

    // Vérifier que le chantier est en cours
    if (worksite.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Le chantier doit être en cours pour être terminé',
      });
    }

    // Terminer le chantier
    worksite.status = 'completed';
    worksite.endTime = new Date();
    worksite.workerCompletedAt = new Date();

    // Calculer la durée réelle
    if (worksite.startTime && worksite.endTime) {
      const durationMs = worksite.endTime - worksite.startTime;
      worksite.actualDuration = durationMs / (1000 * 60 * 60); // heures
    }

    await worksite.save();

    console.log('✅ Chantier terminé:', worksite._id);
    console.log(`⏱️ Durée: ${worksite.actualDuration?.toFixed(2)} heures`);

    // Créer une entrée dans l'audit log
    const worker = await User.findById(req.user.id);
    await WorksiteActivity.create({
      worksiteId: worksite._id,
      type: 'completed',
      actorId: req.user.id,
      actorType: 'worker',
      actorName: worker.fullName,
      description: `${worker.fullName} a terminé le travail`,
      metadata: {
        endTime: worksite.endTime,
        duration: worksite.actualDuration,
      },
    });

    // Créer notification pour le client
    await Notification.create({
      userId: worksite.clientId,
      type: 'job_completed',
      title: 'Travail terminé',
      message: `${worker.fullName} a terminé "${worksite.title}". Veuillez vérifier et valider le travail.`,
      relatedResource: {
        type: 'worksite',
        id: worksite._id,
      },
      actionData: {
        screen: 'WorksiteDetails',
        params: { worksiteId: worksite._id },
      },
      priority: 'urgent',
    });

    console.log('✅ Notification envoyée au client');

    // Envoyer push notification
    await sendPushNotification(worksite.clientId, {
      title: 'Travail démarré',
      body: `${worker.fullName} a commencé à travailler sur "${worksite.title}"`,
      data: {
        screen: 'WorksiteDetails',
        params: { worksiteId: worksite._id.toString() },
        type: 'job_started',
      },
    });

    res.json({
      success: true,
      message: 'Chantier terminé avec succès',
      worksite,
      duration: worksite.actualDuration,
    });
  } catch (error) {
    console.error('❌ Erreur finishWork:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la terminaison du travail',
      error: error.message,
    });
  }
};

// @desc    Client validates completed work
// @route   PUT /api/worksites/:id/validate
// @access  Private (Client only)
exports.validateWork = async (req, res) => {
  try {
    const worksite = await Worksite.findById(req.params.id);

    if (!worksite) {
      return res.status(404).json({
        success: false,
        message: 'Chantier non trouvé',
      });
    }

    // Vérifier que c'est le client
    if (worksite.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Seul le client peut valider ce chantier',
      });
    }

    // Vérifier que le chantier est terminé
    if (worksite.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Le chantier doit être terminé pour être validé',
      });
    }

    // Valider le chantier
    worksite.isValidatedByClient = true;
    worksite.clientValidatedAt = new Date();
    await worksite.save();

    console.log('✅ Chantier validé par le client:', worksite._id);

    // Mettre à jour le profil du worker (stats)
    const WorkerProfile = require('../models/WorkerProfile');
    const workerProfile = await WorkerProfile.findOne({ userId: worksite.workerId });
    if (workerProfile) {
      workerProfile.completedJobs = (workerProfile.completedJobs || 0) + 1;
      workerProfile.totalJobs = (workerProfile.totalJobs || 0) + 1;

      // Calculer le taux de complétion à temps
      if (worksite.actualDuration && worksite.estimatedDuration) {
        const onTime = worksite.actualDuration <= worksite.estimatedDuration * 1.1; // 10% marge
        const currentOnTimeJobs = Math.round((workerProfile.onTimeCompletionRate / 100) * (workerProfile.completedJobs - 1));
        const newOnTimeJobs = currentOnTimeJobs + (onTime ? 1 : 0);
        workerProfile.onTimeCompletionRate = Math.round((newOnTimeJobs / workerProfile.completedJobs) * 100);
      }

      // Mettre à jour le temps moyen de complétion
      if (worksite.actualDuration) {
        const totalTime = (workerProfile.averageCompletionTime || 0) * (workerProfile.completedJobs - 1);
        workerProfile.averageCompletionTime = (totalTime + worksite.actualDuration) / workerProfile.completedJobs;
      }

      await workerProfile.save();
      console.log('📊 Profil worker mis à jour:', workerProfile.completedJobs, 'travaux complétés');
    }

    // Créer une entrée dans l'audit log
    const client = await User.findById(req.user.id);
    await WorksiteActivity.create({
      worksiteId: worksite._id,
      type: 'validated',
      actorId: req.user.id,
      actorType: 'client',
      actorName: client.fullName,
      description: `${client.fullName} a validé le travail`,
      metadata: {
        validatedAt: worksite.clientValidatedAt,
      },
    });

    // Notification pour le worker
    await Notification.create({
      userId: worksite.workerId,
      type: 'job_completed_confirmation',
      title: 'Travail validé !',
      message: `Le client a validé votre travail sur "${worksite.title}"`,
      relatedResource: {
        type: 'worksite',
        id: worksite._id,
      },
      actionData: {
        screen: 'WorksiteDetails',
        params: { worksiteId: worksite._id },
      },
      priority: 'normal',
    });

    res.json({
      success: true,
      message: 'Travail validé avec succès',
      worksite,
    });
  } catch (error) {
    console.error('❌ Erreur validateWork:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du travail',
      error: error.message,
    });
  }
};

// @desc    Cancel a worksite
// @route   PUT /api/worksites/:id/cancel
// @access  Private
exports.cancelWorksite = async (req, res) => {
  try {
    const { reason } = req.body;
    const worksite = await Worksite.findById(req.params.id);

    if (!worksite) {
      return res.status(404).json({
        success: false,
        message: 'Chantier non trouvé',
      });
    }

    // Vérifier que l'utilisateur est impliqué dans ce chantier
    const isClient = worksite.clientId.toString() === req.user.id;
    const isWorker = worksite.workerId.toString() === req.user.id;

    if (!isClient && !isWorker) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    // Annuler le chantier
    worksite.status = 'cancelled';
    worksite.cancelledBy = isClient ? 'client' : 'worker';
    worksite.cancellationReason = reason || '';
    worksite.cancelledAt = new Date();
    await worksite.save();

    console.log('❌ Chantier annulé:', worksite._id);

    // Créer une entrée dans l'audit log
    const user = await User.findById(req.user.id);
    await WorksiteActivity.create({
      worksiteId: worksite._id,
      type: 'cancelled',
      actorId: req.user.id,
      actorType: isClient ? 'client' : 'worker',
      actorName: user.fullName,
      description: `${user.fullName} a annulé le chantier`,
      metadata: {
        reason,
        cancelledAt: worksite.cancelledAt,
      },
    });

    // Notification pour l'autre partie
    const otherUserId = isClient ? worksite.workerId : worksite.clientId;
    await Notification.create({
      userId: otherUserId,
      type: 'action_required',
      title: 'Chantier annulé',
      message: `Le chantier "${worksite.title}" a été annulé par ${user.fullName}`,
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

    res.json({
      success: true,
      message: 'Chantier annulé',
      worksite,
    });
  } catch (error) {
    console.error('❌ Erreur cancelWorksite:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation du chantier',
      error: error.message,
    });
  }
};

// @desc    Update worker status (en route, arrived, etc.)
// @route   PUT /api/worksites/:id/worker-status
// @access  Private (Worker only)
exports.updateWorkerStatus = async (req, res) => {
  try {
    const { status, location, note } = req.body;
    const worksiteId = req.params.id;
    const workerId = req.user.id;

    console.log('?? Mise � jour statut worker:', { worksiteId, status, location });

    // Validation du statut
    const validStatuses = ['assigned', 'en_route', 'arrived', 'work_started', 'work_completed', 'left'];
    if (\!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide',
      });
    }

    // R�cup�rer le chantier
    const worksite = await Worksite.findById(worksiteId);
    if (\!worksite) {
      return res.status(404).json({
        success: false,
        message: 'Chantier non trouv�',
      });
    }

    // V�rifier que c'est bien le worker du chantier
    if (worksite.workerId.toString() \!== workerId) {
      return res.status(403).json({
        success: false,
        message: 'Non autoris� - vous n''�tes pas le worker de ce chantier',
      });
    }

    // Mettre � jour le statut actuel
    worksite.workerStatus = status;

    // Ajouter � l''historique
    const historyEntry = {
      status,
      timestamp: new Date(),
      note: note || null,
    };

    // Ajouter la localisation si fournie
    if (location && location.latitude && location.longitude) {
      historyEntry.location = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      };

      // Mettre � jour la position actuelle du worker
      worksite.workerCurrentLocation = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        lastUpdated: new Date(),
      };
    }

    worksite.statusHistory.push(historyEntry);

    // Mettre � jour le statut g�n�ral du chantier selon le statut worker
    if (status === 'work_started' && worksite.status === 'pending') {
      worksite.status = 'in_progress';
      worksite.startTime = new Date();
    } else if (status === 'work_completed') {
      worksite.workerCompletedAt = new Date();
      worksite.endTime = new Date();
    }

    await worksite.save();

    // Envoyer notification au client
    const client = await User.findById(worksite.clientId);
    const statusMessages = {
      en_route: 'est en route vers le chantier',
      arrived: 'est arriv� sur le chantier',
      work_started: 'a commenc� les travaux',
      work_completed: 'a termin� les travaux',
      left: 'a quitt� le chantier',
    };

    const message = statusMessages[status];
    if (message && client) {
      // Cr�er notification
      await Notification.create({
        userId: client._id,
        type: 'worksite_status',
        title: ,
        message: ,
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

      // Push notification
      if (client.expoPushToken) {
        await sendPushNotification(
          client.expoPushToken,
          ,
          ,
          { screen: 'WorksiteDetails', worksiteId: worksite._id.toString() }
        );
      }
    }

    console.log('? Statut worker mis � jour:', status);

    res.json({
      success: true,
      message: 'Statut mis � jour avec succ�s',
      worksite: {
        _id: worksite._id,
        workerStatus: worksite.workerStatus,
        status: worksite.status,
        statusHistory: worksite.statusHistory,
        workerCurrentLocation: worksite.workerCurrentLocation,
      },
    });
  } catch (error) {
    console.error('? Erreur updateWorkerStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise � jour du statut',
      error: error.message,
    });
  }
};

// @desc    Update worker status (en route, arrived, etc.)
// @route   PUT /api/worksites/:id/worker-status
// @access  Private (Worker only)
exports.updateWorkerStatus = async (req, res) => {
  try {
    const { status, location, note } = req.body;
    const worksiteId = req.params.id;
    const workerId = req.user.id;

    console.log('📍 Mise à jour statut worker:', { worksiteId, status, location });

    // Validation du statut
    const validStatuses = ['assigned', 'en_route', 'arrived', 'work_started', 'work_completed', 'left'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide',
      });
    }

    // Récupérer le chantier
    const worksite = await Worksite.findById(worksiteId);
    if (!worksite) {
      return res.status(404).json({
        success: false,
        message: 'Chantier non trouvé',
      });
    }

    // Vérifier que c'est bien le worker du chantier
    if (worksite.workerId.toString() !== workerId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé - vous n\'êtes pas le worker de ce chantier',
      });
    }

    // Mettre à jour le statut actuel
    worksite.workerStatus = status;

    // Ajouter à l'historique
    const historyEntry = {
      status,
      timestamp: new Date(),
      note: note || null,
    };

    // Ajouter la localisation si fournie
    if (location && location.latitude && location.longitude) {
      historyEntry.location = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      };

      // Mettre à jour la position actuelle du worker
      worksite.workerCurrentLocation = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        lastUpdated: new Date(),
      };
    }

    worksite.statusHistory.push(historyEntry);

    // Mettre à jour le statut général du chantier selon le statut worker
    if (status === 'work_started' && worksite.status === 'pending') {
      worksite.status = 'in_progress';
      worksite.startTime = new Date();
    } else if (status === 'work_completed') {
      worksite.workerCompletedAt = new Date();
      worksite.endTime = new Date();
    }

    await worksite.save();

    // Envoyer notification au client
    const client = await User.findById(worksite.clientId);
    const statusMessages = {
      en_route: 'est en route vers le chantier',
      arrived: 'est arrivé sur le chantier',
      work_started: 'a commencé les travaux',
      work_completed: 'a terminé les travaux',
      left: 'a quitté le chantier',
    };

    const message = statusMessages[status];
    if (message && client) {
      // Créer notification
      await Notification.create({
        userId: client._id,
        type: 'worksite_status',
        title: `Mise à jour chantier - ${worksite.title}`,
        message: `Le worker ${message}`,
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

      // Push notification
      if (client.expoPushToken) {
        await sendPushNotification(
          client.expoPushToken,
          `Chantier - ${worksite.title}`,
          `Le worker ${message}`,
          { screen: 'WorksiteDetails', worksiteId: worksite._id.toString() }
        );
      }
    }

    console.log('✅ Statut worker mis à jour:', status);

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      worksite: {
        _id: worksite._id,
        workerStatus: worksite.workerStatus,
        status: worksite.status,
        statusHistory: worksite.statusHistory,
        workerCurrentLocation: worksite.workerCurrentLocation,
      },
    });
  } catch (error) {
    console.error('❌ Erreur updateWorkerStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message,
    });
  }
};
