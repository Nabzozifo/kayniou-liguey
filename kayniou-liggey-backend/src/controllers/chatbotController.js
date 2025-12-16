const { askChatbot } = require('../services/chatbotService');

// @desc    Poser une question au chatbot d'aide
// @route   POST /api/chatbot/ask
// @access  Public
exports.askQuestion = async (req, res) => {
  try {
    const { question, conversationHistory } = req.body;

    if (!question || question.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'La question doit contenir au moins 3 caractères',
      });
    }

    console.log('💬 Chatbot - Question:', question.substring(0, 100));

    const result = await askChatbot(question, conversationHistory || []);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('❌ Erreur askQuestion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement de votre question',
      error: error.message,
    });
  }
};

// @desc    Obtenir les questions fréquentes
// @route   GET /api/chatbot/faq
// @access  Public
exports.getFAQ = async (req, res) => {
  try {
    const faq = [
      {
        category: 'Démarrage',
        icon: 'rocket-outline',
        questions: [
          {
            q: 'Comment créer une demande de service ?',
            a: 'Allez sur l\'écran d\'accueil, appuyez sur "+", choisissez la catégorie, décrivez votre besoin, et validez !',
          },
          {
            q: 'Comment trouver un worker qualifié ?',
            a: 'Utilisez la recherche IA en décrivant votre problème, ou parcourez les workers par catégorie et filtrez par note et proximité.',
          },
        ],
      },
      {
        category: 'Devis & Prix',
        icon: 'cash-outline',
        questions: [
          {
            q: 'Comment obtenir le meilleur prix ?',
            a: 'Utilisez les enchères publiques pour maximiser la concurrence entre workers. Comparez plusieurs devis avant de choisir.',
          },
          {
            q: 'Puis-je négocier le prix ?',
            a: 'Oui ! Utilisez le chat intégré pour discuter avec le worker avant d\'accepter son devis.',
          },
        ],
      },
      {
        category: 'Chantiers',
        icon: 'construct-outline',
        questions: [
          {
            q: 'Comment suivre l\'avancement de mon chantier ?',
            a: 'Allez dans "Mes chantiers", sélectionnez votre chantier actif. Vous pouvez voir le statut, chatter avec le worker, et voir les photos.',
          },
          {
            q: 'Que faire si le worker ne se présente pas ?',
            a: 'Contactez-le via le chat. Si aucune réponse après 24h, vous pouvez signaler et annuler la mission.',
          },
        ],
      },
      {
        category: 'Évaluations',
        icon: 'star-outline',
        questions: [
          {
            q: 'Comment évaluer un worker ?',
            a: 'Après un chantier terminé, allez dans le détail du chantier et appuyez sur "Évaluer". Donnez une note et un commentaire.',
          },
          {
            q: 'Les workers peuvent-ils m\'évaluer aussi ?',
            a: 'Oui, le système est bidirectionnel. Les workers peuvent vous évaluer en tant que client (ponctualité, respect, etc.).',
          },
        ],
      },
    ];

    res.json({
      success: true,
      faq,
    });
  } catch (error) {
    console.error('❌ Erreur getFAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la FAQ',
    });
  }
};

// @desc    Obtenir des suggestions de questions
// @route   GET /api/chatbot/suggestions
// @access  Public
exports.getSuggestions = async (req, res) => {
  try {
    const suggestions = [
      'Comment créer une demande de service ?',
      'Comment choisir le meilleur worker ?',
      'Quelle est la différence entre enchères publiques et privées ?',
      'Comment utiliser la recherche IA ?',
      'Comment évaluer un worker ?',
      'Comment obtenir de meilleurs prix ?',
      'Que faire si le worker ne répond pas ?',
      'Comment annuler une demande ?',
    ];

    res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('❌ Erreur getSuggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des suggestions',
    });
  }
};

module.exports = {
  askQuestion: exports.askQuestion,
  getFAQ: exports.getFAQ,
  getSuggestions: exports.getSuggestions,
};
