const express = require('express');
const router = express.Router();
const {
  createRating,
  getUserRatings,
  getRating,
  canRateWorksite,
  respondToRating,
} = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');

// Routes publiques
router.get('/user/:userId', getUserRatings); // Obtenir les notations d'un utilisateur
router.get('/:id', getRating); // Obtenir une notation spécifique

// Routes protégées
router.post('/', protect, createRating); // Créer une notation
router.get('/can-rate/:worksiteId', protect, canRateWorksite); // Vérifier si on peut noter
router.put('/:id/respond', protect, respondToRating); // Répondre à une notation

module.exports = router;
