const express = require('express');
const router = express.Router();
const { askQuestion, getFAQ, getSuggestions } = require('../controllers/chatbotController');

// Routes publiques
router.post('/ask', askQuestion);
router.get('/faq', getFAQ);
router.get('/suggestions', getSuggestions);

module.exports = router;
