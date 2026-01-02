const express = require('express');
const router = express.Router();
const {
  createQuote,
  getQuote,
  getWorkerQuotes,
  getQuotesByRequest,
  updateQuote,
  acceptQuote,
  rejectQuote,
  deleteQuote,
} = require('../controllers/quoteController');
const { protect } = require('../middleware/authMiddleware');

// Routes publiques
router.get('/worker/:workerId', getWorkerQuotes); // Obtenir les devis d'un travailleur (doit être avant /:id)
router.get('/request/:requestId', protect, getQuotesByRequest); // Obtenir les devis d'une demande avec logique d'enchère
router.get('/:id', getQuote); // Obtenir un devis spécifique

// Routes protégées
router.post('/', protect, createQuote); // Créer un devis (worker uniquement)
router.put('/:id', protect, updateQuote); // Mettre à jour un devis (owner uniquement)
router.put('/:id/accept', protect, acceptQuote); // Accepter un devis (client owner uniquement)
router.put('/:id/reject', protect, rejectQuote); // Refuser un devis (client owner uniquement)
router.delete('/:id', protect, deleteQuote); // Supprimer un devis (owner uniquement)

module.exports = router;
