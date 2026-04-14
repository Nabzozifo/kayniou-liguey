const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getClientRequests,
  getStats,
  updateLocation,
} = require('../controllers/clientProfileController');
const { protect } = require('../middleware/authMiddleware');

// Toutes les routes sont protégées
router.use(protect);

// Routes profil client
router.get('/:userId', getProfile);
router.put('/:userId', updateProfile);
router.put('/:userId/location', updateLocation); // Mettre à jour la localisation
router.get('/:userId/requests', getClientRequests);
router.get('/:userId/stats', getStats);

module.exports = router;
