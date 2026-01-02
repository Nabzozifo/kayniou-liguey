const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');

/**
 * Service NLP / Analyse Sémantique
 *
 * Analyse la description du problème du client et suggère les meilleurs workers
 * basé sur:
 * - Extraction de mots-clés
 * - Matching avec compétences et catégories
 * - Score de pertinence
 */

// Dictionnaire de mots-clés par catégorie
const CATEGORY_KEYWORDS = {
  Plomberie: {
    primary: ['plombier', 'fuite', 'eau', 'chaudière', 'robinet', 'tuyau', 'évier', 'lavabo', 'douche', 'baignoire', 'wc', 'toilette', 'chauffe-eau', 'canalisation', 'évacuation', 'sanitaire'],
    secondary: ['réparer', 'installer', 'déboucher', 'remplacer', 'fuir', 'couler', 'chauffer'],
    synonyms: {
      'ne chauffe pas': ['chaudière', 'chauffe-eau', 'chauffage'],
      'fait du bruit': ['chaudière', 'tuyauterie', 'robinet'],
      'débordé': ['évier', 'toilette', 'lavabo'],
    },
  },
  Électricité: {
    primary: ['électricien', 'électricité', 'panne', 'courant', 'lumière', 'lampe', 'interrupteur', 'prise', 'tableau électrique', 'disjoncteur', 'câble', 'fil', 'court-circuit'],
    secondary: ['installer', 'réparer', 'brancher', 'sauter', 'griller', 'ne marche pas'],
    synonyms: {
      'ne fonctionne pas': ['prise', 'interrupteur', 'lampe'],
      'pas de courant': ['tableau électrique', 'disjoncteur'],
    },
  },
  Menuiserie: {
    primary: ['menuisier', 'porte', 'fenêtre', 'meuble', 'placard', 'parquet', 'escalier', 'bois', 'volet'],
    secondary: ['fabriquer', 'installer', 'réparer', 'poncer', 'vernir', 'peindre', 'bloquer'],
    synonyms: {
      'ne ferme pas': ['porte', 'fenêtre', 'volet'],
      'grincer': ['porte', 'parquet', 'escalier'],
    },
  },
  Peinture: {
    primary: ['peintre', 'peinture', 'mur', 'plafond', 'façade', 'rouleau', 'pinceau', 'couleur'],
    secondary: ['peindre', 'repeindre', 'rafraîchir', 'décorer'],
    synonyms: {
      'refaire': ['mur', 'plafond', 'pièce'],
    },
  },
  Jardinage: {
    primary: ['jardinier', 'jardin', 'pelouse', 'haie', 'arbre', 'plante', 'gazon', 'tonte', 'taille', 'arrosage'],
    secondary: ['tondre', 'tailler', 'planter', 'arroser', 'désherber', 'entretenir'],
    synonyms: {
      'trop haut': ['haie', 'arbre', 'herbe'],
    },
  },
  Nettoyage: {
    primary: ['nettoyage', 'ménage', 'nettoyer', 'laver', 'aspirer', 'balayer', 'essuyer', 'désinfecter'],
    secondary: ['sale', 'poussière', 'tache'],
    synonyms: {
      'faire le ménage': ['nettoyage', 'ménage'],
    },
  },
  Maçonnerie: {
    primary: ['maçon', 'mur', 'béton', 'ciment', 'brique', 'parpaing', 'dalle', 'fondation', 'enduit'],
    secondary: ['construire', 'monter', 'réparer', 'reboucher', 'fissure'],
    synonyms: {
      'fissure mur': ['maçonnerie', 'réparation'],
    },
  },
  Réparation: {
    primary: ['réparation', 'réparer', 'casser', 'abîmé', 'défectueux', 'panne', 'problème'],
    secondary: ['ne marche pas', 'ne fonctionne pas', 'en panne'],
    synonyms: {},
  },
};

// Mots d'urgence qui augmentent la priorité
const URGENCY_KEYWORDS = [
  'urgent', 'urgence', 'immédiatement', 'vite', 'rapidement', 'aujourd\'hui',
  'maintenant', 'dès que possible', 'fuite', 'inondation', 'danger',
];

/**
 * Normaliser le texte (minuscule, sans accents)
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Extraire les mots-clés d'un texte
 */
function extractKeywords(text) {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);

  const keywords = [];

  // Chercher les mots-clés dans chaque catégorie
  for (const [category, data] of Object.entries(CATEGORY_KEYWORDS)) {
    const primaryMatches = [];
    const secondaryMatches = [];
    const synonymMatches = [];

    // Primary keywords
    data.primary.forEach((keyword) => {
      if (normalized.includes(normalizeText(keyword))) {
        primaryMatches.push(keyword);
      }
    });

    // Secondary keywords
    data.secondary.forEach((keyword) => {
      if (normalized.includes(normalizeText(keyword))) {
        secondaryMatches.push(keyword);
      }
    });

    // Synonyms et expressions
    Object.entries(data.synonyms).forEach(([expression, relatedKeywords]) => {
      if (normalized.includes(normalizeText(expression))) {
        synonymMatches.push(...relatedKeywords);
      }
    });

    if (primaryMatches.length > 0 || synonymMatches.length > 0) {
      keywords.push({
        category,
        primaryMatches,
        secondaryMatches,
        synonymMatches,
        relevanceScore: calculateCategoryRelevance(
          primaryMatches.length,
          secondaryMatches.length,
          synonymMatches.length
        ),
      });
    }
  }

  // Trier par pertinence
  keywords.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return keywords;
}

/**
 * Calculer le score de pertinence d'une catégorie
 */
function calculateCategoryRelevance(primaryCount, secondaryCount, synonymCount) {
  return (primaryCount * 10) + (secondaryCount * 3) + (synonymCount * 7);
}

/**
 * Détecter l'urgence du problème
 */
function detectUrgency(text) {
  const normalized = normalizeText(text);
  let urgencyScore = 0;

  URGENCY_KEYWORDS.forEach((keyword) => {
    if (normalized.includes(normalizeText(keyword))) {
      urgencyScore += 10;
    }
  });

  // Limiter à 100
  urgencyScore = Math.min(urgencyScore, 100);

  if (urgencyScore >= 30) return 'urgent';
  if (urgencyScore >= 10) return 'medium';
  return 'flexible';
}

/**
 * Trouver les workers correspondants
 */
async function findMatchingWorkers(keywords, location, urgency) {
  try {
    if (keywords.length === 0) {
      return [];
    }

    // Catégories principales détectées
    const topCategories = keywords.slice(0, 2).map((k) => k.category);

    // Construire la requête
    const query = {
      isAvailable: true,
      // Chercher workers avec catégories correspondantes
      categories: { $in: topCategories },
    };

    // Si localisation fournie, filtrer par zone
    if (location && location.latitude && location.longitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
          },
          $maxDistance: 50000, // 50km
        },
      };
    }

    const workerProfiles = await WorkerProfile.find(query)
      .populate('userId', 'fullName phoneNumber photoURL rating')
      .limit(10);

    // Calculer le score de match pour chaque worker
    const workersWithScores = workerProfiles.map((profile) => {
      const matchScore = calculateWorkerMatchScore(profile, keywords, urgency);

      return {
        worker: profile,
        matchScore,
        reasons: generateMatchReasons(profile, keywords),
      };
    });

    // Trier par score de match
    workersWithScores.sort((a, b) => b.matchScore - a.matchScore);

    return workersWithScores;
  } catch (error) {
    console.error('❌ Erreur findMatchingWorkers:', error);
    throw error;
  }
}

/**
 * Calculer le score de match worker/problème
 */
function calculateWorkerMatchScore(profile, keywords, urgency) {
  let score = 0;

  // Score basé sur les catégories (0-40 points)
  const topCategories = keywords.slice(0, 2).map((k) => k.category);
  const workerCategories = profile.categories || [];

  topCategories.forEach((cat, index) => {
    if (workerCategories.includes(cat)) {
      score += index === 0 ? 40 : 20; // Première catégorie plus importante
    }
  });

  // Score basé sur le rating (0-20 points)
  if (profile.userId && profile.userId.rating) {
    score += (profile.userId.rating / 5) * 20;
  }

  // Score basé sur les missions complétées (0-15 points)
  const missionsScore = Math.min((profile.completedMissions / 50) * 15, 15);
  score += missionsScore;

  // Score basé sur la disponibilité (0-10 points)
  if (profile.isAvailable) {
    score += 10;
  }

  // Bonus urgence si worker rapide (0-15 points)
  if (urgency === 'urgent' && profile.performanceScores) {
    const punctualityBonus = (profile.performanceScores.punctualityScore / 100) * 15;
    score += punctualityBonus;
  }

  return Math.round(score);
}

/**
 * Générer les raisons du match
 */
function generateMatchReasons(profile, keywords) {
  const reasons = [];

  // Raison 1: Spécialiste de la catégorie
  const topCategory = keywords[0]?.category;
  const workerCategories = profile.services.map((s) => s.category);

  if (workerCategories.includes(topCategory)) {
    const categoryLabel = getCategoryLabel(topCategory);
    reasons.push(`Spécialiste ${categoryLabel}`);
  }

  // Raison 2: Expérience
  if (profile.completedMissions >= 50) {
    reasons.push(`Plus de ${profile.completedMissions} missions réalisées`);
  } else if (profile.completedMissions >= 10) {
    reasons.push(`${profile.completedMissions} missions complétées`);
  }

  // Raison 3: Note
  if (profile.userId && profile.userId.rating >= 4.5) {
    reasons.push(`Excellente note: ${profile.userId.rating.toFixed(1)}/5`);
  } else if (profile.userId && profile.userId.rating >= 4.0) {
    reasons.push(`Bien noté: ${profile.userId.rating.toFixed(1)}/5`);
  }

  // Raison 4: Disponibilité
  if (profile.isAvailable) {
    reasons.push('Disponible immédiatement');
  }

  // Raison 5: Ponctualité
  if (profile.performanceScores && profile.performanceScores.punctualityScore >= 85) {
    reasons.push('Très ponctuel');
  }

  return reasons.slice(0, 3); // Max 3 raisons
}

/**
 * Obtenir le label d'une catégorie
 */
function getCategoryLabel(category) {
  const labels = {
    plomberie: 'en plomberie',
    electricite: 'en électricité',
    menuiserie: 'en menuiserie',
    peinture: 'en peinture',
    jardinage: 'en jardinage',
    nettoyage: 'en nettoyage',
    demenagement: 'en déménagement',
    reparation: 'en réparation',
  };
  return labels[category] || category;
}

/**
 * Point d'entrée principal: analyser une demande et suggérer workers
 */
async function analyzeRequestAndSuggestWorkers(description, location = null) {
  try {
    console.log('🤖 Analyse NLP de:', description.substring(0, 100));

    // Extraire les mots-clés
    const keywords = extractKeywords(description);

    if (keywords.length === 0) {
      return {
        success: false,
        message: 'Impossible de comprendre la demande. Veuillez être plus précis.',
        keywords: [],
        suggestions: [],
      };
    }

    console.log('🔍 Catégories détectées:', keywords.map((k) => k.category));

    // Détecter l'urgence
    const urgency = detectUrgency(description);
    console.log('⏰ Urgence détectée:', urgency);

    // Trouver les workers correspondants
    const suggestions = await findMatchingWorkers(keywords, location, urgency);

    console.log('✅ Suggestions générées:', suggestions.length);

    return {
      success: true,
      keywords: keywords.slice(0, 3),
      urgency,
      suggestions: suggestions.slice(0, 5), // Top 5
    };
  } catch (error) {
    console.error('❌ Erreur analyzeRequestAndSuggestWorkers:', error);
    throw error;
  }
}

module.exports = {
  analyzeRequestAndSuggestWorkers,
  extractKeywords,
  detectUrgency,
  normalizeText,
};
