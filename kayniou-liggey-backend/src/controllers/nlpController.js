const { analyzeRequestAndSuggestWorkers } = require('../services/nlpService');
const { analyzeFast } = require('../services/aiNlpService');

// @desc    Analyser une demande et suggérer des workers
// @route   POST /api/nlp/analyze
// @access  Private
exports.analyzeRequest = async (req, res) => {
  try {
    const { description, location } = req.body;

    console.log('📝 Requête NLP reçue');

    // Validation
    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description trop courte. Veuillez décrire votre problème en quelques mots.',
      });
    }

    // Analyser et suggérer
    const result = await analyzeRequestAndSuggestWorkers(description, location);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Formater la réponse
    const formattedSuggestions = result.suggestions.map((suggestion) => ({
      workerId: suggestion.worker.userId._id,
      workerName: suggestion.worker.userId.fullName,
      workerPhoto: suggestion.worker.userId.photoURL,
      workerRating: suggestion.worker.userId.rating,
      matchScore: suggestion.matchScore,
      reasons: suggestion.reasons,
      services: suggestion.worker.services,
      hourlyRate: suggestion.worker.hourlyRate,
      completedMissions: suggestion.worker.completedMissions,
      isAvailable: suggestion.worker.isAvailable,
    }));

    res.json({
      success: true,
      analysis: {
        detectedCategories: result.keywords.map((k) => ({
          category: k.category,
          relevance: k.relevanceScore,
          matchedKeywords: k.primaryMatches,
        })),
        urgency: result.urgency,
      },
      suggestions: formattedSuggestions,
      count: formattedSuggestions.length,
    });
  } catch (error) {
    console.error('❌ Erreur analyzeRequest:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse de la demande',
      error: error.message,
    });
  }
};

// @desc    Obtenir les catégories disponibles avec exemples
// @route   GET /api/nlp/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      {
        id: 'plomberie',
        label: 'Plomberie',
        icon: 'water-outline',
        examples: [
          'Ma chaudière fait du bruit',
          'Fuite d\'eau sous l\'évier',
          'Mon robinet goutte',
        ],
      },
      {
        id: 'electricite',
        label: 'Électricité',
        icon: 'flash-outline',
        examples: [
          'Panne de courant dans une pièce',
          'Interrupteur ne fonctionne pas',
          'Installation prise électrique',
        ],
      },
      {
        id: 'menuiserie',
        label: 'Menuiserie',
        icon: 'hammer-outline',
        examples: [
          'Porte qui grince',
          'Fabrication meuble sur mesure',
          'Réparation fenêtre',
        ],
      },
      {
        id: 'peinture',
        label: 'Peinture',
        icon: 'brush-outline',
        examples: [
          'Repeindre une chambre',
          'Rafraîchir la façade',
          'Peinture décorative',
        ],
      },
      {
        id: 'jardinage',
        label: 'Jardinage',
        icon: 'leaf-outline',
        examples: [
          'Tonte de pelouse',
          'Taille de haies',
          'Entretien du jardin',
        ],
      },
      {
        id: 'nettoyage',
        label: 'Nettoyage',
        icon: 'sparkles-outline',
        examples: [
          'Ménage complet appartement',
          'Nettoyage après travaux',
          'Entretien régulier',
        ],
      },
      {
        id: 'demenagement',
        label: 'Déménagement',
        icon: 'cube-outline',
        examples: [
          'Déménagement appartement',
          'Transport de meubles',
          'Aide au chargement',
        ],
      },
    ];

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('❌ Erreur getCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
    });
  }
};

// @desc    Tester l'analyse IA sur un texte
// @route   POST /api/nlp/analyze-ai
// @access  Public
exports.analyzeAI = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Le texte doit contenir au moins 10 caractères',
      });
    }

    console.log('🤖 Test analyse IA:', text.substring(0, 100));

    const result = await analyzeFast(text);

    res.json({
      success: true,
      analysis: result,
    });
  } catch (error) {
    console.error('❌ Erreur analyzeAI:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse IA',
      error: error.message,
    });
  }
};

module.exports = {
  analyzeRequest: exports.analyzeRequest,
  getCategories: exports.getCategories,
  analyzeAI: exports.analyzeAI,
};
