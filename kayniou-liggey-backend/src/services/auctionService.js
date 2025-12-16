const Quote = require('../models/Quote');
const WorkerProfile = require('../models/WorkerProfile');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');

/**
 * Système d'Enchères Intelligent
 *
 * Formule de Score:
 * Score Final = Prix (30%) + Qualité (25%) + Fiabilité (20%) +
 *               Rapidité (15%) + Expérience (5%) + Complétion (5%)
 *
 * Tous les scores sont normalisés sur 100
 */

const WEIGHTS = {
  price: 0.30,       // 30%
  quality: 0.25,     // 25%
  reliability: 0.20, // 20%
  speed: 0.15,       // 15%
  experience: 0.05,  // 5%
  completion: 0.05,  // 5%
};

/**
 * Calculer le score de prix (inversé car prix bas = meilleur score)
 * @param {Number} quotePrice - Prix du devis
 * @param {Number} minPrice - Prix minimum de tous les devis
 * @param {Number} maxPrice - Prix maximum de tous les devis
 * @returns {Number} Score sur 100
 */
function calculatePriceScore(quotePrice, minPrice, maxPrice) {
  if (maxPrice === minPrice) return 100;

  // Score inversé: prix bas = score élevé
  // Utiliser une courbe pour favoriser les prix moyens-bas
  const priceRatio = (quotePrice - minPrice) / (maxPrice - minPrice);
  const score = 100 * (1 - priceRatio);

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculer le score de qualité basé sur le rating et les évaluations
 * @param {Object} workerProfile - Profil du worker
 * @param {Number} workerRating - Note globale du worker
 * @returns {Number} Score sur 100
 */
function calculateQualityScore(workerProfile, workerRating) {
  // Rating sur 5 → score sur 100
  const ratingScore = (workerRating / 5) * 100;

  // Si profil existe, utiliser le qualityScore
  if (workerProfile && workerProfile.performanceScores) {
    const profileQuality = workerProfile.performanceScores.qualityScore || 0;
    // Moyenne pondérée: 60% profile, 40% rating général
    return (profileQuality * 0.6) + (ratingScore * 0.4);
  }

  return ratingScore;
}

/**
 * Calculer le score de fiabilité (professionnalisme, constance)
 * @param {Object} workerProfile - Profil du worker
 * @returns {Number} Score sur 100
 */
function calculateReliabilityScore(workerProfile) {
  if (!workerProfile || !workerProfile.performanceScores) {
    return 50; // Score neutre par défaut
  }

  const reliability = workerProfile.performanceScores.reliabilityScore || 50;
  const communication = workerProfile.performanceScores.communicationScore || 50;

  // 70% fiabilité, 30% communication
  return (reliability * 0.7) + (communication * 0.3);
}

/**
 * Calculer le score de rapidité (ponctualité + durée estimée)
 * @param {Object} workerProfile - Profil du worker
 * @param {Number} estimatedDuration - Durée estimée en heures
 * @param {Number} minDuration - Durée minimum de tous les devis
 * @param {Number} maxDuration - Durée maximum de tous les devis
 * @returns {Number} Score sur 100
 */
function calculateSpeedScore(workerProfile, estimatedDuration, minDuration, maxDuration) {
  // Score de ponctualité du profil
  let punctualityScore = 50;
  if (workerProfile && workerProfile.performanceScores) {
    punctualityScore = workerProfile.performanceScores.punctualityScore || 50;
  }

  // Score basé sur la durée estimée (durée courte = meilleur score)
  let durationScore = 50;
  if (maxDuration !== minDuration && estimatedDuration > 0) {
    const durationRatio = (estimatedDuration - minDuration) / (maxDuration - minDuration);
    durationScore = 100 * (1 - durationRatio);
  }

  // 60% ponctualité historique, 40% durée estimée
  return (punctualityScore * 0.6) + (durationScore * 0.4);
}

/**
 * Calculer le score d'expérience (nombre de missions, ancienneté)
 * @param {Object} workerProfile - Profil du worker
 * @returns {Number} Score sur 100
 */
function calculateExperienceScore(workerProfile) {
  if (!workerProfile) return 20; // Score bas par défaut pour nouveaux

  const completedMissions = workerProfile.completedMissions || 0;
  const yearsExperience = workerProfile.yearsExperience || 0;

  // Score basé sur nombre de missions (plateaux: 10, 50, 100+)
  let missionScore = 0;
  if (completedMissions >= 100) missionScore = 100;
  else if (completedMissions >= 50) missionScore = 80;
  else if (completedMissions >= 10) missionScore = 60;
  else missionScore = (completedMissions / 10) * 60;

  // Score basé sur années d'expérience (max à 10 ans)
  const yearScore = Math.min(yearsExperience / 10, 1) * 100;

  // 70% missions, 30% années
  return (missionScore * 0.7) + (yearScore * 0.3);
}

/**
 * Calculer le score de complétion (taux de missions terminées)
 * @param {Object} workerProfile - Profil du worker
 * @returns {Number} Score sur 100
 */
function calculateCompletionScore(workerProfile) {
  if (!workerProfile) return 50;

  const completedMissions = workerProfile.completedMissions || 0;
  const totalMissions = workerProfile.totalMissions || 0;

  if (totalMissions === 0) return 50; // Neutre pour nouveaux

  const completionRate = completedMissions / totalMissions;
  return completionRate * 100;
}

/**
 * Calculer le score d'enchère intelligent pour un devis
 * @param {Object} quote - Le devis
 * @param {Object} workerProfile - Profil du worker
 * @param {Array} allQuotes - Tous les devis pour cette demande
 * @returns {Object} { auctionScore, scoreBreakdown }
 */
async function calculateAuctionScore(quote, workerProfile, allQuotes) {
  try {
    // Extraire les min/max pour normalisation
    const prices = allQuotes.map(q => q.price);
    const durations = allQuotes.map(q => q.estimatedDuration).filter(d => d > 0);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minDuration = durations.length > 0 ? Math.min(...durations) : 1;
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 10;

    // Calculer chaque composante du score
    const priceScore = calculatePriceScore(quote.price, minPrice, maxPrice);
    const qualityScore = calculateQualityScore(workerProfile, quote.workerRating || 0);
    const reliabilityScore = calculateReliabilityScore(workerProfile);
    const speedScore = calculateSpeedScore(
      workerProfile,
      quote.estimatedDuration || 0,
      minDuration,
      maxDuration
    );
    const experienceScore = calculateExperienceScore(workerProfile);
    const completionScore = calculateCompletionScore(workerProfile);

    // Calculer le score final pondéré
    const auctionScore =
      (priceScore * WEIGHTS.price) +
      (qualityScore * WEIGHTS.quality) +
      (reliabilityScore * WEIGHTS.reliability) +
      (speedScore * WEIGHTS.speed) +
      (experienceScore * WEIGHTS.experience) +
      (completionScore * WEIGHTS.completion);

    const scoreBreakdown = {
      priceScore: Math.round(priceScore),
      qualityScore: Math.round(qualityScore),
      reliabilityScore: Math.round(reliabilityScore),
      speedScore: Math.round(speedScore),
      experienceScore: Math.round(experienceScore),
      completionScore: Math.round(completionScore),
    };

    return {
      auctionScore: Math.round(auctionScore),
      scoreBreakdown,
    };
  } catch (error) {
    console.error('❌ Erreur calculateAuctionScore:', error);
    return {
      auctionScore: 0,
      scoreBreakdown: {
        priceScore: 0,
        qualityScore: 0,
        reliabilityScore: 0,
        speedScore: 0,
        experienceScore: 0,
        completionScore: 0,
      },
    };
  }
}

/**
 * Recalculer les scores pour tous les devis d'une demande
 * @param {String} requestId - ID de la demande de service
 */
async function recalculateAuctionScores(requestId) {
  try {
    console.log('🔄 Recalcul scores enchères pour request:', requestId);

    // Récupérer tous les devis pending pour cette demande
    const quotes = await Quote.find({
      requestId,
      status: 'pending',
    }).populate('workerId');

    if (quotes.length === 0) {
      console.log('⚠️ Aucun devis à recalculer');
      return;
    }

    // Récupérer les profils des workers
    const workerIds = quotes.map(q => q.workerId._id);
    const workerProfiles = await WorkerProfile.find({
      userId: { $in: workerIds },
    });

    // Créer un map pour accès rapide
    const profileMap = {};
    workerProfiles.forEach(profile => {
      profileMap[profile.userId.toString()] = profile;
    });

    // Calculer le score pour chaque devis
    let maxScore = 0;
    let bestQuoteId = null;

    for (const quote of quotes) {
      const workerId = quote.workerId._id.toString();
      const workerProfile = profileMap[workerId];

      const { auctionScore, scoreBreakdown } = await calculateAuctionScore(
        quote,
        workerProfile,
        quotes
      );

      // Mettre à jour le devis
      quote.auctionScore = auctionScore;
      quote.scoreBreakdown = scoreBreakdown;
      quote.isBestOffer = false; // Réinitialiser

      await quote.save();

      // Tracker le meilleur score
      if (auctionScore > maxScore) {
        maxScore = auctionScore;
        bestQuoteId = quote._id;
      }
    }

    // Marquer le meilleur devis
    if (bestQuoteId) {
      await Quote.findByIdAndUpdate(bestQuoteId, {
        isBestOffer: true,
      });
      console.log('✅ Meilleur devis marqué:', bestQuoteId, 'Score:', maxScore);
    }

    console.log('✅ Scores recalculés pour', quotes.length, 'devis');
  } catch (error) {
    console.error('❌ Erreur recalculateAuctionScores:', error);
    throw error;
  }
}

/**
 * Hook appelé après création/mise à jour d'un devis
 * @param {String} requestId - ID de la demande
 */
async function onQuoteChange(requestId) {
  try {
    await recalculateAuctionScores(requestId);
  } catch (error) {
    console.error('❌ Erreur onQuoteChange:', error);
  }
}

module.exports = {
  calculateAuctionScore,
  recalculateAuctionScores,
  onQuoteChange,
  WEIGHTS,
};
