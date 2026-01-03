const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Worksite = require('../models/Worksite');
const Rating = require('../models/Rating');
const { semanticWorkerSearch } = require('../services/nlpRecommendationService');
const { analyzeFast } = require('../services/aiNlpService');

// @desc    Obtenir une liste de workers recommandés triés par score
// @route   GET /api/worker-recommendations
// @access  Public
exports.getRecommendedWorkers = async (req, res) => {
  try {
    const {
      categories,
      latitude,
      longitude,
      maxDistance = 50000, // 50km par défaut
      limit = 20,
    } = req.query;

    console.log('🔍 Recherche de workers recommandés:', {
      categories,
      latitude,
      longitude,
      maxDistance,
    });

    // Construire la requête de base
    const query = {
      userType: 'worker',
    };

    // Filtrer par catégories si spécifiées
    if (categories) {
      const categoryArray = Array.isArray(categories)
        ? categories
        : categories.split(',');

      query['workerProfile.categories'] = { $in: categoryArray };
    }

    // Récupérer tous les workers avec leur profil
    let workers = await User.find(query)
      .select('fullName phoneNumber photoURL rating reviewCount location')
      .lean();

    console.log(`✅ ${workers.length} workers trouvés`);

    // Enrichir avec les profils worker (seulement ceux disponibles)
    const workerIds = workers.map(w => w._id);
    const workerProfiles = await WorkerProfile.find({
      userId: { $in: workerIds },
      isAvailable: true,
    })
      .lean();

    const profileMap = {};
    workerProfiles.forEach(profile => {
      profileMap[profile.userId.toString()] = profile;
    });

    // Calculer le score pour chaque worker
    const scoredWorkers = await Promise.all(
      workers.map(async (worker) => {
        const profile = profileMap[worker._id.toString()];

        if (!profile) {
          return null;
        }

        // Calculer le score de recommandation
        const score = await calculateWorkerScore(
          worker,
          profile,
          latitude,
          longitude,
          categories
        );

        return {
          ...worker,
          profile,
          recommendationScore: score.total,
          scoreBreakdown: score.breakdown,
        };
      })
    );

    // Filtrer les null et trier par score
    const validWorkers = scoredWorkers
      .filter(w => w !== null)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      count: validWorkers.length,
      workers: validWorkers,
    });
  } catch (error) {
    console.error('❌ Erreur getRecommendedWorkers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des workers recommandés',
      error: error.message,
    });
  }
};

// Fonction pour calculer le score de recommandation d'un worker
async function calculateWorkerScore(worker, profile, latitude, longitude, categories) {
  let totalScore = 0;
  const breakdown = {};

  // 1. Score de notation (35%)
  const ratingScore = (worker.rating || 0) * 7; // 0-35 points
  breakdown.rating = ratingScore;
  totalScore += ratingScore;

  // 2. Score d'expérience (20%)
  const completedJobs = await Worksite.countDocuments({
    workerId: worker._id,
    status: 'completed',
  });
  const experienceScore = Math.min(completedJobs * 2, 20); // Max 20 points
  breakdown.experience = experienceScore;
  totalScore += experienceScore;

  // 3. Score de fiabilité (15%)
  const totalJobs = await Worksite.countDocuments({
    workerId: worker._id,
  });
  const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  const reliabilityScore = (completionRate / 100) * 15; // 0-15 points
  breakdown.reliability = reliabilityScore;
  totalScore += reliabilityScore;

  // 4. Score de catégorie (15%)
  let categoryScore = 0;
  if (categories && profile.categories) {
    const requestedCategories = Array.isArray(categories)
      ? categories
      : categories.split(',');
    const matchingCategories = requestedCategories.filter(cat =>
      profile.categories.includes(cat)
    );
    categoryScore = (matchingCategories.length / requestedCategories.length) * 15;
  }
  breakdown.category = categoryScore;
  totalScore += categoryScore;

  // 5. Score de proximité (10%)
  let proximityScore = 0;
  if (latitude && longitude && worker.location?.coordinates) {
    const distance = calculateDistance(
      latitude,
      longitude,
      worker.location.coordinates[1], // latitude
      worker.location.coordinates[0]  // longitude
    );
    // Plus proche = meilleur score (max 10 points à 0km, 0 points à 50km+)
    proximityScore = Math.max(0, 10 - (distance / 5000)); // -1 point par 5km
  }
  breakdown.proximity = proximityScore;
  totalScore += proximityScore;

  // 6. Score de popularité (5%)
  const reviewCount = worker.reviewCount || 0;
  const popularityScore = Math.min(reviewCount / 2, 5); // Max 5 points
  breakdown.popularity = popularityScore;
  totalScore += popularityScore;

  return {
    total: Math.round(totalScore * 10) / 10, // Arrondi à 1 décimale
    breakdown,
  };
}

// Fonction helper pour calculer la distance entre deux points (formule de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
}

// @desc    Recherche sémantique de workers par description en langage naturel avec IA
// @route   POST /api/worker-recommendations/semantic-search
// @access  Public
exports.semanticSearch = async (req, res) => {
  try {
    const { description, latitude, longitude, maxDistance, limit } = req.body;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'La description doit contenir au moins 10 caractères',
      });
    }

    console.log('🧠 Recherche sémantique avec IA:', description.substring(0, 100));

    // Utiliser l'IA pour analyser la description (rapide avec cache)
    const aiAnalysis = await analyzeFast(description);

    console.log('✅ Analyse IA terminée:', {
      method: aiAnalysis.method,
      categories: aiAnalysis.categories,
      confidence: aiAnalysis.confidence,
    });

    // Utiliser les catégories détectées par l'IA pour chercher les workers
    const result = await semanticWorkerSearch(description, {
      latitude,
      longitude,
      maxDistance,
      limit,
      aiAnalysis, // Passer l'analyse IA au service
    });

    res.json(result);
  } catch (error) {
    console.error('❌ Erreur semanticSearch:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche sémantique',
      error: error.message,
    });
  }
};

module.exports = {
  getRecommendedWorkers: exports.getRecommendedWorkers,
  semanticSearch: exports.semanticSearch,
};
