const Evaluation = require('../models/Evaluation');
const WorkerProfile = require('../models/WorkerProfile');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');

// @desc    Créer une nouvelle évaluation
// @route   POST /api/evaluations
// @access  Private (Client seulement)
exports.createEvaluation = async (req, res) => {
  try {
    const { missionId, workerId, ratings, comment, weightedScore } = req.body;

    console.log('📝 Création évaluation:', {
      missionId,
      workerId,
      clientId: req.user.id,
      weightedScore,
    });

    // Validation
    if (!missionId || !workerId || !ratings || !weightedScore) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes pour l\'évaluation',
      });
    }

    // Vérifier que tous les critères sont notés
    const requiredCriteria = ['punctuality', 'courtesy', 'quality', 'cleanliness', 'professionalism'];
    const allRated = requiredCriteria.every((criterion) => ratings[criterion] > 0);

    if (!allRated) {
      return res.status(400).json({
        success: false,
        message: 'Tous les critères doivent être notés',
      });
    }

    // Vérifier que la mission existe et appartient au client
    const mission = await ServiceRequest.findById(missionId);
    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Mission non trouvée',
      });
    }

    if (mission.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à évaluer cette mission',
      });
    }

    // Vérifier que la mission est terminée
    if (mission.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'La mission doit être terminée pour être évaluée',
      });
    }

    // Vérifier qu'une évaluation n'existe pas déjà
    const existingEvaluation = await Evaluation.findOne({
      missionId,
      clientId: req.user.id,
    });

    if (existingEvaluation) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà évalué cette mission',
      });
    }

    // Créer l'évaluation
    const evaluation = await Evaluation.create({
      missionId,
      workerId,
      clientId: req.user.id,
      ratings,
      comment: comment?.trim() || '',
      weightedScore,
    });

    console.log('✅ Évaluation créée:', evaluation._id);

    // Mettre à jour le profil du worker
    await updateWorkerScores(workerId);

    // Populate les infos
    await evaluation.populate('clientId', 'fullName photoURL');

    res.status(201).json({
      success: true,
      message: 'Évaluation enregistrée avec succès',
      evaluation,
    });
  } catch (error) {
    console.error('❌ Erreur createEvaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'évaluation',
      error: error.message,
    });
  }
};

// @desc    Obtenir les évaluations d'un worker
// @route   GET /api/evaluations/worker/:workerId
// @access  Public
exports.getWorkerEvaluations = async (req, res) => {
  try {
    const { workerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    console.log('🔍 Récupération évaluations worker:', workerId);

    const evaluations = await Evaluation.find({ workerId })
      .populate('clientId', 'fullName photoURL')
      .populate('missionId', 'title category')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Evaluation.countDocuments({ workerId });

    // Calculer les statistiques
    const stats = await calculateWorkerEvaluationStats(workerId);

    console.log('✅ Évaluations trouvées:', evaluations.length);

    res.json({
      success: true,
      evaluations,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ Erreur getWorkerEvaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des évaluations',
      error: error.message,
    });
  }
};

// @desc    Obtenir une évaluation spécifique
// @route   GET /api/evaluations/:id
// @access  Public
exports.getEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('clientId', 'fullName photoURL')
      .populate('workerId', 'fullName photoURL')
      .populate('missionId', 'title category description');

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Évaluation non trouvée',
      });
    }

    res.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error('❌ Erreur getEvaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'évaluation',
      error: error.message,
    });
  }
};

// @desc    Mettre à jour une évaluation (si besoin)
// @route   PUT /api/evaluations/:id
// @access  Private (Client propriétaire)
exports.updateEvaluation = async (req, res) => {
  try {
    const { ratings, comment, weightedScore } = req.body;

    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Évaluation non trouvée',
      });
    }

    // Vérifier que c'est le propriétaire
    if (evaluation.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé',
      });
    }

    // Ne permettre la modification que dans les 24h
    const hoursSinceCreation = (Date.now() - evaluation.createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier une évaluation après 24h',
      });
    }

    // Mettre à jour
    if (ratings) evaluation.ratings = ratings;
    if (comment !== undefined) evaluation.comment = comment.trim();
    if (weightedScore) evaluation.weightedScore = weightedScore;

    await evaluation.save();

    // Recalculer les scores du worker
    await updateWorkerScores(evaluation.workerId);

    console.log('✅ Évaluation mise à jour:', evaluation._id);

    res.json({
      success: true,
      message: 'Évaluation mise à jour',
      evaluation,
    });
  } catch (error) {
    console.error('❌ Erreur updateEvaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'évaluation',
      error: error.message,
    });
  }
};

// Fonction helper pour calculer les statistiques d'évaluation
async function calculateWorkerEvaluationStats(workerId) {
  const evaluations = await Evaluation.find({ workerId });

  if (evaluations.length === 0) {
    return {
      averageScore: 0,
      totalEvaluations: 0,
      criteriaAverages: {
        punctuality: 0,
        courtesy: 0,
        quality: 0,
        cleanliness: 0,
        professionalism: 0,
      },
      distribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    };
  }

  // Moyenne pondérée globale
  const totalWeightedScore = evaluations.reduce(
    (sum, eval) => sum + eval.weightedScore,
    0
  );
  const averageScore = totalWeightedScore / evaluations.length;

  // Moyennes par critère
  const criteriaAverages = {
    punctuality: 0,
    courtesy: 0,
    quality: 0,
    cleanliness: 0,
    professionalism: 0,
  };

  Object.keys(criteriaAverages).forEach((criterion) => {
    const total = evaluations.reduce(
      (sum, eval) => sum + (eval.ratings[criterion] || 0),
      0
    );
    criteriaAverages[criterion] = total / evaluations.length;
  });

  // Distribution des notes
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  evaluations.forEach((eval) => {
    const roundedScore = Math.round(eval.weightedScore);
    if (roundedScore >= 1 && roundedScore <= 5) {
      distribution[roundedScore]++;
    }
  });

  return {
    averageScore: parseFloat(averageScore.toFixed(2)),
    totalEvaluations: evaluations.length,
    criteriaAverages,
    distribution,
  };
}

// Fonction helper pour mettre à jour les scores du worker
async function updateWorkerScores(workerId) {
  try {
    const stats = await calculateWorkerEvaluationStats(workerId);

    // Mettre à jour le User rating
    await User.findByIdAndUpdate(workerId, {
      rating: stats.averageScore,
    });

    // Mettre à jour les scores dans WorkerProfile
    const profile = await WorkerProfile.findOne({ userId: workerId });
    if (profile) {
      // Mise à jour des scores de performance
      profile.performanceScores = {
        qualityScore: Math.round(stats.criteriaAverages.quality * 20), // Sur 100
        reliabilityScore: Math.round(stats.criteriaAverages.professionalism * 20),
        speedScore: profile.performanceScores?.speedScore || 80, // À calculer autrement
        communicationScore: Math.round(stats.criteriaAverages.courtesy * 20),
        punctualityScore: Math.round(stats.criteriaAverages.punctuality * 20),
      };

      await profile.save();
      console.log('✅ Scores worker mis à jour:', workerId);
    }
  } catch (error) {
    console.error('❌ Erreur updateWorkerScores:', error);
  }
}

module.exports = {
  createEvaluation: exports.createEvaluation,
  getWorkerEvaluations: exports.getWorkerEvaluations,
  getEvaluation: exports.getEvaluation,
  updateEvaluation: exports.updateEvaluation,
};
