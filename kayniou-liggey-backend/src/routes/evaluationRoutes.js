const express = require('express');
const router = express.Router();
const {
  createEvaluation,
  getWorkerEvaluations,
  getEvaluation,
  updateEvaluation,
} = require('../controllers/evaluationController');
const { protect } = require('../middleware/authMiddleware');

// Routes publiques
router.get('/worker/:workerId', getWorkerEvaluations);
router.get('/:id', getEvaluation);

// Routes protégées
router.post('/', protect, createEvaluation);
router.put('/:id', protect, updateEvaluation);

module.exports = router;
