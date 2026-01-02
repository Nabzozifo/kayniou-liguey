const Rating = require('../models/Rating');
const Worksite = require('../models/Worksite');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Notification = require('../models/Notification');

// @desc    Créer une notation
// @route   POST /api/ratings
// @access  Private
exports.createRating = async (req, res) => {
  try {
    const {
      worksiteId,
      reviewedId,
      overallRating,
      comment,
      detailedRatings,
      wouldRecommend,
    } = req.body;

    // Validation
    if (!worksiteId || !reviewedId || !overallRating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants',
      });
    }

    // Vérifier que le chantier existe et est terminé
    const worksite = await Worksite.findById(worksiteId);
    if (!worksite) {
      return res.status(404).json({
        success: false,
        message: 'Chantier non trouvé',
      });
    }

    if (worksite.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez noter qu\'un chantier terminé',
      });
    }

    // Déterminer le type de reviewer
    const user = await User.findById(req.user.id);
    let reviewerType;

    if (worksite.clientId.toString() === req.user.id) {
      reviewerType = 'client';
      // Vérifier que le client note bien le travailleur
      if (worksite.workerId.toString() !== reviewedId) {
        return res.status(400).json({
          success: false,
          message: 'Vous ne pouvez noter que le travailleur de ce chantier',
        });
      }
    } else if (worksite.workerId.toString() === req.user.id) {
      reviewerType = 'worker';
      // Vérifier que le travailleur note bien le client
      if (worksite.clientId.toString() !== reviewedId) {
        return res.status(400).json({
          success: false,
          message: 'Vous ne pouvez noter que le client de ce chantier',
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à noter ce chantier',
      });
    }

    // Vérifier si une notation existe déjà
    const existingRating = await Rating.findOne({
      worksiteId,
      reviewerType,
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà noté ce chantier',
      });
    }

    // Récupérer les infos de l'utilisateur noté
    const reviewedUser = await User.findById(reviewedId);
    if (!reviewedUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur à noter non trouvé',
      });
    }

    // Créer la notation
    const rating = await Rating.create({
      worksiteId,
      reviewerType,
      reviewerId: req.user.id,
      reviewerName: user.fullName,
      reviewedId,
      reviewedName: reviewedUser.fullName,
      overallRating,
      comment,
      detailedRatings: detailedRatings || {},
      wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true,
    });

    // Mettre à jour la moyenne des notes de l'utilisateur noté
    await updateUserRating(reviewedId, reviewerType);

    // Créer une notification pour l'utilisateur noté
    await Notification.create({
      userId: reviewedId,
      type: 'new_rating',
      title: 'Nouvelle évaluation',
      message: `${user.fullName} vous a évalué ${overallRating}/5 pour le chantier "${worksite.title}"`,
      relatedResource: {
        type: 'rating',
        id: rating._id,
      },
      actionData: {
        screen: 'RatingDetails',
        params: { ratingId: rating._id },
      },
      priority: 'normal',
    });

    console.log('✅ Notation créée:', rating._id);

    res.status(201).json({
      success: true,
      message: 'Notation créée avec succès',
      rating,
    });
  } catch (error) {
    console.error('❌ Erreur createRating:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la notation',
      error: error.message,
    });
  }
};

// @desc    Obtenir les notations d'un utilisateur
// @route   GET /api/ratings/user/:userId
// @access  Public
exports.getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, reviewerType } = req.query;

    const query = {
      reviewedId: userId,
      isPublic: true,
    };

    if (reviewerType) {
      query.reviewerType = reviewerType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const ratings = await Rating.find(query)
      .populate('worksiteId', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Rating.countDocuments(query);

    // Calculer les statistiques
    const stats = await Rating.aggregate([
      { $match: { reviewedId: new mongoose.Types.ObjectId(userId), isPublic: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$overallRating' },
          totalRatings: { $sum: 1 },
          fiveStars: {
            $sum: { $cond: [{ $eq: ['$overallRating', 5] }, 1, 0] },
          },
          fourStars: {
            $sum: { $cond: [{ $eq: ['$overallRating', 4] }, 1, 0] },
          },
          threeStars: {
            $sum: { $cond: [{ $eq: ['$overallRating', 3] }, 1, 0] },
          },
          twoStars: {
            $sum: { $cond: [{ $eq: ['$overallRating', 2] }, 1, 0] },
          },
          oneStar: {
            $sum: { $cond: [{ $eq: ['$overallRating', 1] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      ratings,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      stats: stats[0] || {
        averageRating: 0,
        totalRatings: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0,
      },
    });
  } catch (error) {
    console.error('❌ Erreur getUserRatings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notations',
      error: error.message,
    });
  }
};

// @desc    Obtenir une notation spécifique
// @route   GET /api/ratings/:id
// @access  Public
exports.getRating = async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id)
      .populate('worksiteId', 'title description category')
      .populate('reviewerId', 'fullName photoURL')
      .populate('reviewedId', 'fullName photoURL');

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Notation non trouvée',
      });
    }

    res.json({
      success: true,
      rating,
    });
  } catch (error) {
    console.error('❌ Erreur getRating:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la notation',
      error: error.message,
    });
  }
};

// @desc    Vérifier si l'utilisateur peut noter un chantier
// @route   GET /api/ratings/can-rate/:worksiteId
// @access  Private
exports.canRateWorksite = async (req, res) => {
  try {
    const { worksiteId } = req.params;

    const worksite = await Worksite.findById(worksiteId);
    if (!worksite) {
      return res.status(404).json({
        success: false,
        message: 'Chantier non trouvé',
      });
    }

    // Vérifier si le chantier est terminé
    if (worksite.status !== 'completed') {
      return res.json({
        success: true,
        canRate: false,
        reason: 'Le chantier n\'est pas encore terminé',
      });
    }

    // Déterminer le type de reviewer
    let reviewerType;
    if (worksite.clientId.toString() === req.user.id) {
      reviewerType = 'client';
    } else if (worksite.workerId.toString() === req.user.id) {
      reviewerType = 'worker';
    } else {
      return res.json({
        success: true,
        canRate: false,
        reason: 'Vous n\'êtes pas participant de ce chantier',
      });
    }

    // Vérifier si une notation existe déjà
    const existingRating = await Rating.findOne({
      worksiteId,
      reviewerType,
    });

    if (existingRating) {
      return res.json({
        success: true,
        canRate: false,
        reason: 'Vous avez déjà noté ce chantier',
        existingRating,
      });
    }

    res.json({
      success: true,
      canRate: true,
      reviewerType,
    });
  } catch (error) {
    console.error('❌ Erreur canRateWorksite:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
      error: error.message,
    });
  }
};

// @desc    Répondre à une notation
// @route   PUT /api/ratings/:id/respond
// @access  Private
exports.respondToRating = async (req, res) => {
  try {
    const { response } = req.body;

    if (!response || response.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'La réponse doit contenir au moins 10 caractères',
      });
    }

    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Notation non trouvée',
      });
    }

    // Vérifier que c'est l'utilisateur noté qui répond
    if (rating.reviewedId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez répondre qu\'aux notations vous concernant',
      });
    }

    rating.response = response.trim();
    rating.respondedAt = new Date();
    await rating.save();

    res.json({
      success: true,
      message: 'Réponse ajoutée avec succès',
      rating,
    });
  } catch (error) {
    console.error('❌ Erreur respondToRating:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la réponse',
      error: error.message,
    });
  }
};

// Fonction helper pour mettre à jour la moyenne des notes
async function updateUserRating(userId, reviewerType) {
  try {
    const mongoose = require('mongoose');

    // Calculer la moyenne des notes reçues
    const stats = await Rating.aggregate([
      {
        $match: {
          reviewedId: new mongoose.Types.ObjectId(userId),
          isPublic: true,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$overallRating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stats[0]?.averageRating || 0;
    const totalRatings = stats[0]?.totalRatings || 0;

    // Mettre à jour l'utilisateur
    await User.findByIdAndUpdate(userId, {
      rating: Math.round(averageRating * 10) / 10, // Arrondi à 1 décimale
      reviewCount: totalRatings,
    });

    // Si c'est un travailleur, mettre à jour aussi son profil
    if (reviewerType === 'client') {
      await WorkerProfile.findOneAndUpdate(
        { userId },
        {
          rating: Math.round(averageRating * 10) / 10,
          reviewCount: totalRatings,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: totalRatings,
        }
      );
    }

    console.log(`✅ Rating mis à jour pour user ${userId}: ${averageRating}/5 (${totalRatings} avis)`);
  } catch (error) {
    console.error('❌ Erreur updateUserRating:', error);
  }
}

module.exports = {
  createRating: exports.createRating,
  getUserRatings: exports.getUserRatings,
  getRating: exports.getRating,
  canRateWorksite: exports.canRateWorksite,
  respondToRating: exports.respondToRating,
};
