const axios = require('axios');
const nlp = require('compromise');

/**
 * Service NLP utilisant Hugging Face Inference API (GRATUIT)
 * Modèle : camembert-base (modèle français)
 * Alternative : flaubert, barthez
 */

// API Hugging Face (gratuite, pas besoin de clé pour les modèles publics)
const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Modèles français légers et gratuits
const MODELS = {
  classification: 'cmarkea/distilcamembert-base-nli', // Classification de texte
  zeroShot: 'MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7', // Zero-shot multilingue (fonctionne en français)
  sentiment: 'nlptown/bert-base-multilingual-uncased-sentiment', // Analyse de sentiment
};

// Catégories de services - en minuscules sans accents pour correspondre au frontend
const SERVICE_CATEGORIES = [
  'plomberie',
  'electricite',
  'menuiserie',
  'maconnerie',
  'peinture',
  'jardinage',
  'nettoyage',
  'mecanique',
  'carrelage',
  'demenagement',
  'reparation',
  'installation',
  'climatisation',
];

// Mots-clés par catégorie (global pour réutilisation) - clés en minuscules sans accents
const KEYWORD_MAP = {
  plomberie: ['fuite', 'robinet', 'tuyau', 'eau', 'évier', 'wc', 'chauffe-eau'],
  electricite: ['électrique', 'courant', 'lumière', 'prise', 'disjoncteur'],
  menuiserie: ['bois', 'porte', 'fenêtre', 'meuble', 'placard'],
  maconnerie: ['mur', 'béton', 'ciment', 'brique', 'construction'],
  peinture: ['peindre', 'peinture', 'repeindre', 'mur'],
  jardinage: ['jardin', 'pelouse', 'tonte', 'arbre', 'plante'],
  nettoyage: ['nettoyer', 'propre', 'ménage', 'laver'],
  mecanique: ['voiture', 'auto', 'moteur', 'panne'],
  carrelage: ['carrelage', 'carreau', 'faïence'],
  demenagement: ['déménagement', 'déménager', 'carton'],
  reparation: ['réparer', 'casser', 'abîmé'],
  installation: ['installer', 'montage', 'poser'],
  climatisation: ['climatisation', 'clim', 'air'],
};

/**
 * Analyse un texte avec Zero-Shot Classification (GRATUIT et RAPIDE)
 * Pas besoin d'entraîner le modèle, il comprend directement
 */
async function analyzeWithAI(text) {
  try {
    console.log('🤖 Analyse IA du texte:', text.substring(0, 100));

    // Utiliser Zero-Shot Classification pour détecter la catégorie
    const response = await axios.post(
      `${HF_API_URL}/${MODELS.zeroShot}`,
      {
        inputs: text,
        parameters: {
          candidate_labels: SERVICE_CATEGORIES,
          multi_label: true,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 secondes max
      }
    );

    console.log('✅ Réponse IA:', response.data);

    // Extraire les catégories détectées avec leurs scores
    const categories = [];
    const scores = {};

    if (response.data.labels && response.data.scores) {
      response.data.labels.forEach((label, index) => {
        const score = response.data.scores[index];
        if (score > 0.3) { // Seuil de confiance à 30%
          categories.push(label);
          scores[label] = score;
        }
      });
    }

    // Analyser l'urgence avec des patterns simples (plus rapide)
    const urgency = detectUrgency(text);
    const complexity = detectComplexity(text);

    return {
      success: true,
      categories: categories.slice(0, 3), // Top 3 catégories
      categoryScores: scores,
      urgency,
      complexity,
      confidence: categories.length > 0 ? scores[categories[0]] : 0,
      method: 'ai-zero-shot',
    };
  } catch (error) {
    console.error('❌ Erreur IA:', error.message);

    // Fallback sur le système basé sur les mots-clés
    console.log('🔄 Fallback sur système keywords');
    return analyzeWithKeywords(text);
  }
}

/**
 * Analyse avec Compromise.js (NLP JavaScript pur, ultra rapide)
 */
function analyzeWithCompromise(text) {
  console.log('🔤 Analyse avec Compromise.js (NLP local)');

  const doc = nlp(text);

  // Extraire les entités et mots-clés
  const nouns = doc.nouns().out('array');
  const verbs = doc.verbs().out('array');
  const adjectives = doc.adjectives().out('array');

  // Combiner tous les termes pertinents
  const allTerms = [...nouns, ...verbs, ...adjectives].map(t => t.toLowerCase());

  // Mapper vers les catégories
  const categoryMatches = {};

  Object.entries(KEYWORD_MAP).forEach(([category, keywords]) => {
    const matches = keywords.filter(kw =>
      allTerms.some(term => term.includes(kw) || kw.includes(term))
    );
    if (matches.length > 0) {
      categoryMatches[category] = matches.length / keywords.length;
    }
  });

  const sortedCategories = Object.entries(categoryMatches)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  return {
    success: true,
    categories: sortedCategories.slice(0, 3),
    categoryScores: categoryMatches,
    urgency: detectUrgency(text),
    complexity: detectComplexity(text),
    confidence: sortedCategories.length > 0 ? categoryMatches[sortedCategories[0]] : 0,
    method: 'compromise-nlp',
  };
}

/**
 * Fallback : Système basé sur les mots-clés (rapide et fonctionne toujours)
 */
function analyzeWithKeywords(text) {
  console.log('🔑 Analyse avec keywords (fallback final)');
  const normalizedText = text.toLowerCase();

  const scores = {};
  Object.entries(KEYWORD_MAP).forEach(([category, keywords]) => {
    const matches = keywords.filter(kw => normalizedText.includes(kw));
    if (matches.length > 0) {
      scores[category] = matches.length / keywords.length;
    }
  });

  const sortedCategories = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  return {
    success: true,
    categories: sortedCategories.slice(0, 3),
    categoryScores: scores,
    urgency: detectUrgency(text),
    complexity: detectComplexity(text),
    confidence: sortedCategories.length > 0 ? scores[sortedCategories[0]] : 0,
    method: 'keywords-fallback',
  };
}

/**
 * Détection d'urgence (simple et rapide)
 */
function detectUrgency(text) {
  const normalizedText = text.toLowerCase();

  if (/urgent|urgence|rapidement|vite|immédiat|maintenant|tout de suite/i.test(normalizedText)) {
    return 'high';
  }
  if (/bientôt|prochainement|semaine/i.test(normalizedText)) {
    return 'medium';
  }
  return 'low';
}

/**
 * Détection de complexité
 */
function detectComplexity(text) {
  const normalizedText = text.toLowerCase();

  if (/complexe|grand|important|gros|compliqué|difficile|plusieurs/i.test(normalizedText)) {
    return 'complex';
  }
  if (/simple|petit|rapide|facile|basique/i.test(normalizedText)) {
    return 'simple';
  }
  return 'medium';
}

/**
 * Version hybride : IA + Keywords pour meilleure précision
 */
async function analyzeHybrid(text) {
  try {
    // Essayer l'IA d'abord
    const aiResult = await analyzeWithAI(text);

    if (aiResult.method === 'ai-zero-shot' && aiResult.confidence > 0.5) {
      // L'IA est confiante, utiliser son résultat
      return aiResult;
    }

    // L'IA n'est pas sûre, combiner avec keywords
    const keywordResult = analyzeWithKeywords(text);

    // Fusionner les résultats
    const combinedCategories = [...new Set([...aiResult.categories, ...keywordResult.categories])];

    return {
      success: true,
      categories: combinedCategories.slice(0, 3),
      urgency: aiResult.urgency || keywordResult.urgency,
      complexity: aiResult.complexity || keywordResult.complexity,
      confidence: Math.max(aiResult.confidence, keywordResult.confidence),
      method: 'hybrid-ai-keywords',
    };
  } catch (error) {
    console.error('❌ Erreur analyse hybride:', error);
    return analyzeWithKeywords(text);
  }
}

/**
 * Version optimisée pour mobile : Cache + Fallback rapide
 */
const analysisCache = new Map();
const CACHE_DURATION = 3600000; // 1 heure

async function analyzeFast(text) {
  // Vérifier le cache
  const cacheKey = text.toLowerCase().trim();
  const cached = analysisCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('📦 Résultat depuis le cache');
    return cached.result;
  }

  // Stratégie en cascade : IA > Compromise > Keywords

  // 1. Essayer l'IA d'abord (timeout 3 secondes)
  const aiPromise = Promise.race([
    analyzeWithAI(text),
    new Promise((resolve) =>
      setTimeout(() => resolve({ timeout: true }), 3000) // Max 3 secondes
    ),
  ]);

  let finalResult;

  try {
    const aiResult = await aiPromise;

    if (!aiResult.timeout && aiResult.method === 'ai-zero-shot' && aiResult.confidence > 0.3) {
      // L'IA a réussi avec bonne confiance
      finalResult = aiResult;
    } else {
      // L'IA a timeout ou faible confiance, essayer Compromise.js
      console.log('🔄 Fallback sur Compromise.js (NLP local ultra rapide)');
      const compromiseResult = analyzeWithCompromise(text);

      if (compromiseResult.confidence > 0.2) {
        // Compromise.js a trouvé quelque chose
        finalResult = compromiseResult;
      } else {
        // Dernier recours : keywords
        console.log('🔄 Fallback final sur keywords');
        finalResult = analyzeWithKeywords(text);
      }
    }
  } catch (error) {
    // Erreur complète, fallback sur Compromise puis keywords
    console.log('🔄 Erreur IA, fallback sur Compromise.js');
    const compromiseResult = analyzeWithCompromise(text);
    finalResult = compromiseResult.confidence > 0.2 ? compromiseResult : analyzeWithKeywords(text);
  }

  // Mettre en cache
  analysisCache.set(cacheKey, {
    result: finalResult,
    timestamp: Date.now(),
  });

  // Nettoyer le cache périodiquement
  if (analysisCache.size > 100) {
    const oldestKey = analysisCache.keys().next().value;
    analysisCache.delete(oldestKey);
  }

  return finalResult;
}

module.exports = {
  analyzeWithAI,
  analyzeWithKeywords,
  analyzeHybrid,
  analyzeFast, // ⚡ Recommandé pour mobile
};
