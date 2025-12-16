const express = require('express');
const router = express.Router();
const { analyzeRequest, getCategories, analyzeAI } = require('../controllers/nlpController');
const { protect } = require('../middleware/authMiddleware');

// Routes publiques
router.get('/categories', getCategories);
router.post('/analyze-ai', analyzeAI); // Route pour tester l'IA

// Routes protégées
router.post('/analyze', protect, analyzeRequest);

module.exports = router;
