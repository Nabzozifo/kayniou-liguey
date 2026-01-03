const express = require('express');
const router = express.Router();
const {
  getWorksites,
  getWorksite,
  getWorksiteActivity,
  startWork,
  finishWork,
  validateWork,
  cancelWorksite,
  updateWorkerStatus,
} = require('../controllers/worksiteController');
const { protect } = require('../middleware/authMiddleware');

// Toutes les routes sont protégées
router.use(protect);

// Routes principales
router.get('/', getWorksites); // Get all worksites for user
router.get('/:id', getWorksite); // Get single worksite
router.get('/:id/activity', getWorksiteActivity); // Get activity timeline

// Actions du worker
router.put('/:id/start', startWork); // Start work
router.put('/:id/finish', finishWork); // Finish work
router.put('/:id/worker-status', updateWorkerStatus); // Update worker real-time status

// Actions du client
router.put('/:id/validate', validateWork); // Validate completed work

// Actions communes
router.put('/:id/cancel', cancelWorksite); // Cancel worksite

module.exports = router;
