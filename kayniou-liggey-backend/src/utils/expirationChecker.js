const ServiceRequest = require('../models/ServiceRequest');
const Quote = require('../models/Quote');

/**
 * Vérifie et expire les demandes dont auctionEndsAt est passé
 * Expire également tous les devis associés à ces demandes
 */
const checkAndExpireRequests = async () => {
  try {
    const now = new Date();

    // Trouver toutes les demandes dont l'enchère est terminée mais pas encore expirées
    const expiredRequests = await ServiceRequest.find({
      auctionEndsAt: { $lt: now },
      status: { $in: ['pending', 'active'] },
      mode: { $in: ['auction', 'private_auction'] }
    });

    if (expiredRequests.length === 0) {
      return { expiredRequests: 0, expiredQuotes: 0 };
    }

    console.log(`⏰ Trouvé ${expiredRequests.length} demande(s) à expirer`);

    const requestIds = expiredRequests.map(r => r._id);

    // Mettre à jour le statut des demandes à 'expired'
    await ServiceRequest.updateMany(
      { _id: { $in: requestIds } },
      { $set: { status: 'expired', updatedAt: now } }
    );

    // Expirer tous les devis 'pending' de ces demandes
    const quoteResult = await Quote.updateMany(
      {
        requestId: { $in: requestIds },
        status: 'pending'
      },
      { $set: { status: 'expired' } }
    );

    console.log(`✅ Expiré ${expiredRequests.length} demande(s) et ${quoteResult.modifiedCount} devis`);

    return {
      expiredRequests: expiredRequests.length,
      expiredQuotes: quoteResult.modifiedCount
    };
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des expirations:', error);
    throw error;
  }
};

/**
 * Démarre un intervalle pour vérifier les expirations périodiquement
 * @param {number} intervalMinutes - Intervalle en minutes (défaut: 5 minutes)
 */
const startExpirationChecker = (intervalMinutes = 5) => {
  // Vérifier immédiatement au démarrage
  checkAndExpireRequests()
    .then(result => {
      if (result.expiredRequests > 0 || result.expiredQuotes > 0) {
        console.log(`🔄 Vérification initiale: ${result.expiredRequests} demande(s), ${result.expiredQuotes} devis expiré(s)`);
      }
    })
    .catch(err => console.error('Erreur vérification initiale:', err));

  // Puis vérifier périodiquement
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(async () => {
    try {
      const result = await checkAndExpireRequests();
      if (result.expiredRequests > 0 || result.expiredQuotes > 0) {
        console.log(`🔄 Vérification périodique: ${result.expiredRequests} demande(s), ${result.expiredQuotes} devis expiré(s)`);
      }
    } catch (error) {
      console.error('Erreur vérification périodique:', error);
    }
  }, intervalMs);

  console.log(`⏰ Vérification d'expiration démarrée (toutes les ${intervalMinutes} minutes)`);
};

module.exports = {
  checkAndExpireRequests,
  startExpirationChecker
};
