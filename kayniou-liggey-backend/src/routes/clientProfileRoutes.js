const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getClientRequests,
  getStats,
} = require('../controllers/clientProfileController');
const { protect } = require('../middleware/auth');

// Toutes les routes sont protégées
router.use(protect);

// Routes profil client
router.get('/:userId', getProfile);
router.put('/:userId', updateProfile);
router.get('/:userId/requests', getClientRequests);
router.get('/:userId/stats', getStats);

module.exports = router;
