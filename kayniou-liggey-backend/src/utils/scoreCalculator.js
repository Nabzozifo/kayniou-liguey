/**
 * Utilitaire pour calculer les scores de performance des travailleurs
 */

/**
 * Calcule le score de qualité basé sur les évaluations
 * @param {number} averageRating - Note moyenne (0-5)
 * @param {number} totalReviews - Nombre total d'avis
 * @returns {number} Score de qualité (0-100)
 */
const calculateQualityScore = (averageRating, totalReviews) => {
  if (totalReviews === 0) return 0;

  // Score de base sur 100
  const baseScore = (averageRating / 5) * 100;

  // Bonus de confiance basé sur le nombre d'avis
  // Plus il y a d'avis, plus le score est fiable
  let confidenceMultiplier = 1;
  if (totalReviews >= 50) confidenceMultiplier = 1.0;
  else if (totalReviews >= 20) confidenceMultiplier = 0.95;
  else if (totalReviews >= 10) confidenceMultiplier = 0.90;
  else if (totalReviews >= 5) confidenceMultiplier = 0.85;
  else confidenceMultiplier = 0.80;

  return Math.min(100, baseScore * confidenceMultiplier);
};

/**
 * Calcule le score de fiabilité
 * @param {number} completedJobs - Travaux terminés
 * @param {number} cancelledJobs - Travaux annulés
 * @param {number} onTimeRate - Taux de complétion à temps (0-100)
 * @returns {number} Score de fiabilité (0-100)
 */
const calculateReliabilityScore = (completedJobs, cancelledJobs, onTimeRate) => {
  const totalJobs = completedJobs + cancelledJobs;

  if (totalJobs === 0) return 0;

  // Taux de complétion (poids: 50%)
  const completionRate = (completedJobs / totalJobs) * 100;
  const completionScore = completionRate * 0.5;

  // Taux de ponctualité (poids: 50%)
  const punctualityScore = onTimeRate * 0.5;

  return Math.round(completionScore + punctualityScore);
};

/**
 * Calcule le score de rapidité
 * @param {number} averageResponseTime - Temps de réponse moyen en minutes
 * @param {number} averageCompletionTime - Temps de complétion moyen en heures
 * @returns {number} Score de rapidité (0-100)
 */
const calculateSpeedScore = (averageResponseTime, averageCompletionTime) => {
  // Score de réponse (poids: 40%)
  // Excellent: < 30 min, Bon: 30-60 min, Moyen: 60-120 min, Faible: > 120 min
  let responseScore = 0;
  if (averageResponseTime === 0) responseScore = 50; // Pas encore de données
  else if (averageResponseTime < 30) responseScore = 100;
  else if (averageResponseTime < 60) responseScore = 80;
  else if (averageResponseTime < 120) responseScore = 60;
  else if (averageResponseTime < 240) responseScore = 40;
  else responseScore = 20;

  // Score de complétion (poids: 60%)
  // Dépend du type de travail, mais on considère une moyenne
  // Excellent: < 4h, Bon: 4-8h, Moyen: 8-16h, Faible: > 16h
  let completionScore = 0;
  if (averageCompletionTime === 0) completionScore = 50; // Pas encore de données
  else if (averageCompletionTime < 4) completionScore = 100;
  else if (averageCompletionTime < 8) completionScore = 80;
  else if (averageCompletionTime < 16) completionScore = 60;
  else if (averageCompletionTime < 24) completionScore = 40;
  else completionScore = 20;

  return Math.round(responseScore * 0.4 + completionScore * 0.6);
};

/**
 * Calcule le score global de performance
 * @param {Object} workerProfile - Profil du travailleur
 * @returns {number} Score global (0-100)
 */
const calculatePerformanceScore = (workerProfile) => {
  // Calculer chaque score
  const qualityScore = calculateQualityScore(
    workerProfile.averageRating,
    workerProfile.totalReviews
  );

  const reliabilityScore = calculateReliabilityScore(
    workerProfile.completedJobs,
    workerProfile.cancelledJobs,
    workerProfile.onTimeCompletionRate
  );

  const speedScore = calculateSpeedScore(
    workerProfile.averageResponseTime,
    workerProfile.averageCompletionTime
  );

  // Pondération:
  // Qualité: 40%
  // Fiabilité: 35%
  // Rapidité: 25%
  const performanceScore = Math.round(
    qualityScore * 0.40 +
    reliabilityScore * 0.35 +
    speedScore * 0.25
  );

  return {
    performanceScore,
    qualityScore,
    reliabilityScore,
    speedScore,
  };
};

/**
 * Attribue des badges basés sur les performances
 * @param {Object} workerProfile - Profil du travailleur
 * @returns {Array} Liste des badges gagnés
 */
const calculateBadges = (workerProfile) => {
  const badges = [];

  // Badge "Étoile montante" - 10+ travaux terminés avec 4.5+ de moyenne
  if (workerProfile.completedJobs >= 10 && workerProfile.averageRating >= 4.5) {
    badges.push({
      name: 'Étoile montante',
      description: '10+ travaux avec excellentes évaluations',
      icon: 'star',
    });
  }

  // Badge "Professionnel certifié" - 50+ travaux terminés
  if (workerProfile.completedJobs >= 50) {
    badges.push({
      name: 'Professionnel certifié',
      description: '50+ travaux terminés avec succès',
      icon: 'shield-checkmark',
    });
  }

  // Badge "Expert" - 100+ travaux terminés
  if (workerProfile.completedJobs >= 100) {
    badges.push({
      name: 'Expert',
      description: '100+ travaux terminés',
      icon: 'trophy',
    });
  }

  // Badge "Rapide comme l'éclair" - Temps de réponse < 15 min
  if (workerProfile.averageResponseTime < 15 && workerProfile.totalJobs >= 10) {
    badges.push({
      name: 'Rapide comme l\'éclair',
      description: 'Répond en moins de 15 minutes',
      icon: 'flash',
    });
  }

  // Badge "Toujours à l'heure" - 90%+ de travaux à temps
  if (workerProfile.onTimeCompletionRate >= 90 && workerProfile.completedJobs >= 20) {
    badges.push({
      name: 'Toujours à l\'heure',
      description: '90%+ de travaux terminés à temps',
      icon: 'time',
    });
  }

  // Badge "Favori des clients" - 80%+ de clients récurrents
  if (workerProfile.repeatClientRate >= 80 && workerProfile.completedJobs >= 15) {
    badges.push({
      name: 'Favori des clients',
      description: '80%+ de clients reviennent',
      icon: 'heart',
    });
  }

  // Badge "5 étoiles" - Note moyenne 5.0
  if (workerProfile.averageRating === 5.0 && workerProfile.totalReviews >= 20) {
    badges.push({
      name: '5 étoiles',
      description: 'Note parfaite de 5.0',
      icon: 'star-outline',
    });
  }

  // Badge "Satisfaction garantie" - 95%+ de satisfaction client
  if (workerProfile.customerSatisfactionRate >= 95 && workerProfile.completedJobs >= 25) {
    badges.push({
      name: 'Satisfaction garantie',
      description: '95%+ de clients satisfaits',
      icon: 'happy',
    });
  }

  return badges;
};

/**
 * Met à jour tous les scores et badges d'un travailleur
 * @param {Object} workerProfile - Profil du travailleur (modèle Mongoose)
 * @returns {Object} Profil mis à jour
 */
const updateWorkerScores = async (workerProfile) => {
  // Calculer les scores
  const scores = calculatePerformanceScore(workerProfile);

  // Mettre à jour les scores
  workerProfile.performanceScore = scores.performanceScore;
  workerProfile.qualityScore = scores.qualityScore;
  workerProfile.reliabilityScore = scores.reliabilityScore;
  workerProfile.speedScore = scores.speedScore;

  // Calculer et attribuer les badges
  const newBadges = calculateBadges(workerProfile);

  // Ne garder que les badges qui ne sont pas déjà présents
  const existingBadgeNames = workerProfile.badges.map(b => b.name);
  const badgesToAdd = newBadges.filter(b => !existingBadgeNames.includes(b.name));

  workerProfile.badges.push(...badgesToAdd);

  // Sauvegarder
  await workerProfile.save();

  return workerProfile;
};

module.exports = {
  calculateQualityScore,
  calculateReliabilityScore,
  calculateSpeedScore,
  calculatePerformanceScore,
  calculateBadges,
  updateWorkerScores,
};
