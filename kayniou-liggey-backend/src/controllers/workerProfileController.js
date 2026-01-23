const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');

// @desc    Obtenir le profil d'un travailleur
// @route   GET /api/worker-profile/:userId
// @access  Public
exports.getProfile = async (req, res) => {
  try {
    console.log('🔍 Recherche profil worker avec ID:', req.params.userId);

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      console.log('❌ ID invalide');
      return res.status(400).json({
        success: false,
        message: 'ID invalide',
      });
    }

    // Essayer de trouver par userId d'abord
    let profile = await WorkerProfile.findOne({ userId: req.params.userId })
      .populate('userId', 'fullName email phoneNumber photoURL rating');

    // Si pas trouvé, essayer par _id du profil
    if (!profile) {
      console.log('⚠️ Pas trouvé par userId, essai par _id...');
      profile = await WorkerProfile.findById(req.params.userId)
        .populate('userId', 'fullName email phoneNumber photoURL rating');
    }

    if (!profile) {
      console.log('❌ Profil non trouvé');
      return res.status(404).json({
        success: false,
        message: 'Profil travailleur non trouvé',
      });
    }

    console.log('✅ Profil trouvé:', profile._id);

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('❌ Erreur getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message,
    });
  }
};

// @desc    Mettre à jour le profil travailleur
// @route   PUT /api/worker-profile/:userId
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const {
      bio,
      categories,
      skills,
      diplomas,
      experiences,
      hourlyRate,
      serviceRadius,
      experience,
      description,
      motivation,
      availability,
    } = req.body;

    const updateData = {
      bio: bio || description,
      professionalSummary: description || bio,
      categories,
      skillsText: skills || '',
      diplomas: diplomas === '' || diplomas === null ? [] : diplomas,
      experiences: experiences === '' || experiences === null ? [] : experiences,
      hourlyRate,
      serviceRadius,
      experienceLevel: experience || undefined,
      motivation: motivation || '',
      availability,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    console.log('📝 Mise à jour profil avec:', updateData);

    const profile = await WorkerProfile.findOneAndUpdate(
      { userId: req.params.userId },
      updateData,
      { new: true, runValidators: true, upsert: true }
    ).populate('userId', 'fullName email phoneNumber photoURL');

    console.log('✅ Profil mis à jour:', profile._id);

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('❌ Erreur updateProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message,
    });
  }
};

// @desc    Mettre à jour la disponibilité
// @route   PUT /api/worker-profile/:userId/availability
// @access  Private
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const profile = await WorkerProfile.findOneAndUpdate(
      { userId: req.params.userId },
      { isAvailable },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil travailleur non trouvé',
      });
    }

    res.json({
      success: true,
      message: `Disponibilité ${isAvailable ? 'activée' : 'désactivée'}`,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la disponibilité',
      error: error.message,
    });
  }
};

// @desc    Mettre à jour la localisation
// @route   PUT /api/worker-profile/:userId/location
// @access  Private
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude sont requis',
      });
    }

    const profile = await WorkerProfile.findOneAndUpdate(
      { userId: req.params.userId },
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil travailleur non trouvé',
      });
    }

    res.json({
      success: true,
      message: 'Localisation mise à jour',
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la localisation',
      error: error.message,
    });
  }
};

// @desc    Trouver des travailleurs à proximité
// @route   GET /api/worker-profile/nearby
// @access  Public
exports.getNearbyWorkers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, category } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude sont requis',
      });
    }

    const query = {
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseFloat(radius) * 1000, // Convert km to meters
        },
      },
    };

    // Filtre par catégorie si fourni (case-insensitive match)
    if (category) {
      query.categories = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    const workers = await WorkerProfile.find(query)
      .populate('userId', 'fullName phoneNumber photoURL')
      .limit(50);

    res.json({
      success: true,
      count: workers.length,
      workers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de travailleurs',
      error: error.message,
    });
  }
};

// @desc    Ajouter une photo au portfolio
// @route   POST /api/worker-profile/:userId/portfolio
// @access  Private
exports.addPortfolioPhoto = async (req, res) => {
  try {
    const { photoURL, title, description } = req.body;

    const profile = await WorkerProfile.findOne({ userId: req.params.userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil travailleur non trouvé',
      });
    }

    profile.portfolio.push({
      photoURL,
      title,
      description,
    });

    await profile.save();

    res.json({
      success: true,
      message: 'Photo ajoutée au portfolio',
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la photo',
      error: error.message,
    });
  }
};

// @desc    Get dashboard statistics for worker
// @route   GET /api/worker-profile/:userId/dashboard
// @access  Public
exports.getDashboardStats = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('📊 Récupération stats dashboard pour:', userId);

    const WorkerProfile = require('../models/WorkerProfile');
    const Worksite = require('../models/Worksite');
    const Quote = require('../models/Quote');

    // Récupérer le profil du worker
    const profile = await WorkerProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil worker non trouvé',
      });
    }

    // Calculer les gains totaux et du mois depuis les chantiers validés
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedWorksites = await Worksite.find({
      workerId: userId,
      status: 'completed',
      isValidatedByClient: true, // Seulement les chantiers validés par le client
    });

    const totalEarnings = completedWorksites.reduce((sum, worksite) => sum + (worksite.agreedPrice || 0), 0);

    const monthWorksites = completedWorksites.filter(
      worksite => new Date(worksite.clientValidatedAt || worksite.endTime) >= startOfMonth
    );

    const monthEarnings = monthWorksites.reduce((sum, worksite) => sum + (worksite.agreedPrice || 0), 0);

    // Devis actifs
    const activeQuotes = await Quote.countDocuments({
      workerId: userId,
      status: { $in: ['pending', 'accepted'] },
    });

    // Taux d'acceptation
    const totalQuotes = await Quote.countDocuments({ workerId: userId });
    const acceptedQuotes = await Quote.countDocuments({
      workerId: userId,
      status: 'accepted',
    });

    const acceptanceRate = totalQuotes > 0
      ? Math.round((acceptedQuotes / totalQuotes) * 100)
      : 0;

    // Nouveaux clients ce mois
    const newClients = await Worksite.distinct('clientId', {
      workerId: userId,
      createdAt: { $gte: startOfMonth },
    });

    const stats = {
      // Gains
      totalEarnings,
      monthEarnings,

      // Performance
      averageRating: profile.averageRating || 0,
      totalReviews: profile.totalReviews || 0,
      completedJobs: profile.completedJobs || 0,
      totalJobs: profile.totalJobs || 0,
      averageCompletionTime: profile.averageCompletionTime || 0,
      onTimeCompletionRate: profile.onTimeCompletionRate || 0,

      // Activité
      activeQuotes,
      acceptanceRate,
      newClients: newClients.length,

      // Scores
      performanceScore: profile.performanceScore || 0,
      reliabilityScore: profile.reliabilityScore || 0,
      qualityScore: profile.qualityScore || 0,
      speedScore: profile.speedScore || 0,
    };

    console.log('✅ Stats calculées:', stats);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('❌ Erreur getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message,
    });
  }
};

// @desc    Supprimer une photo du portfolio
// @route   DELETE /api/worker-profile/:userId/portfolio/:photoId
// @access  Private
exports.deletePortfolioPhoto = async (req, res) => {
  try {
    const profile = await WorkerProfile.findOne({ userId: req.params.userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil travailleur non trouvé',
      });
    }

    profile.portfolio = profile.portfolio.filter(
      (photo) => photo._id.toString() !== req.params.photoId
    );

    await profile.save();

    res.json({
      success: true,
      message: 'Photo supprimée du portfolio',
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la photo',
      error: error.message,
    });
  }
};

// @desc    Obtenir les workers les mieux notés par catégorie (pour enchère privée)
// @route   GET /api/worker-profile/top-rated
// @access  Public
exports.getTopRatedWorkers = async (req, res) => {
  try {
    const { category, latitude, longitude, radius = 50, limit = 10 } = req.query;

    console.log('🔍 Recherche workers top-rated:', { category, latitude, longitude, radius, limit });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'La catégorie est requise',
      });
    }

    let workers;

    // Si localisation fournie, filtrer par proximité
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
        {
          $match: {
            isAvailable: true,
            categories: { $regex: new RegExp(`^${category}$`, 'i') }, // Case-insensitive match
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        {
          $addFields: {
            user: { $arrayElemAt: ['$userInfo', 0] },
          },
        },
        {
          $addFields: {
            rating: { $ifNull: ['$user.rating', 0] },
          },
        },
        {
          $sort: {
            distance: 1, // Trier par distance croissante (plus proche d'abord)
            rating: -1, // Puis par note décroissante
            completedJobs: -1, // Puis par nombre de jobs complétés
          },
        },
        {
          $limit: parseInt(limit),
        },
        {
          $project: {
            userId: 1,
            categories: 1,
            description: 1,
            experienceYears: 1,
            hourlyRate: 1,
            completedJobs: 1,
            isAvailable: 1,
            distance: 1,
            user: {
              _id: 1,
              fullName: 1,
              email: 1,
              phoneNumber: 1,
              photoURL: 1,
              rating: 1,
            },
          },
        },
      ];

      workers = await WorkerProfile.aggregate(pipeline);
    } else {
      // Sans localisation: filtrer uniquement par catégorie
      const profiles = await WorkerProfile.find({
        isAvailable: true,
        categories: { $regex: new RegExp(`^${category}$`, 'i') }, // Case-insensitive match
      })
        .populate('userId', 'fullName email phoneNumber photoURL rating')
        .limit(parseInt(limit));

      // Trier par rating
      workers = profiles
        .map((p) => ({
          ...p.toObject(),
          user: p.userId,
          rating: p.userId?.rating || 0,
        }))
        .sort((a, b) => {
          // Trier par rating décroissant
          if (b.rating !== a.rating) return b.rating - a.rating;
          // Puis par completedJobs décroissant
          return (b.completedJobs || 0) - (a.completedJobs || 0);
        })
        .slice(0, parseInt(limit));
    }

    console.log(`✅ Trouvé ${workers.length} workers top-rated`);

    res.json({
      success: true,
      count: workers.length,
      workers,
    });
  } catch (error) {
    console.error('❌ Erreur getTopRatedWorkers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des workers',
      error: error.message,
    });
  }
};
