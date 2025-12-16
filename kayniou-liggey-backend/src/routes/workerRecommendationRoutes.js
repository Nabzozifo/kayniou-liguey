const express = require('express');
const router = express.Router();
const {
  getRecommendedWorkers,
  semanticSearch,
} = require('../controllers/workerRecommendationController');

// Routes publiques
router.get('/', getRecommendedWorkers);
router.post('/semantic-search', semanticSearch);

module.exports = router;
