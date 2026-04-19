const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Worksite = require('../models/Worksite');

// Mots-clés par catégorie (français) - clés en minuscules sans accents
const CATEGORY_KEYWORDS = {
  plomberie: [
    'fuite', 'robinet', 'tuyau', 'eau', 'évier', 'lavabo', 'douche', 'wc',
    'toilette', 'chauffe-eau', 'chaudière', 'plombier', 'canalisation',
    'déboucher', 'bouché', 'goutte', 'inondation', 'baignoire',
  ],
  electricite: [
    'électricien', 'électrique', 'panne', 'courant', 'lumière', 'interrupteur',
    'prise', 'tableau', 'disjoncteur', 'fusible', 'câble', 'fil', 'lampe',
    'ampoule', 'installation', 'court-circuit', 'électricité', 'rallonge',
  ],
  menuiserie: [
    'bois', 'porte', 'fenêtre', 'menuisier', 'meuble', 'placard', 'étagère',
    'parquet', 'armoire', 'verrou', 'serrure', 'cadre', 'volet', 'charnière',
    'sciure', 'poncer', 'vernir', 'assemblage',
  ],
  maconnerie: [
    'mur', 'béton', 'ciment', 'brique', 'maçon', 'construction', 'fissure',
    'crépi', 'enduit', 'pierre', 'fondation', 'dalle', 'carrelage', 'joint',
    'mortier', 'parpaing', 'plâtre', 'cloison',
  ],
  peinture: [
    'peindre', 'peinture', 'peintre', 'mur', 'plafond', 'rouleau', 'pinceau',
    'couleur', 'blanc', 'repeindre', 'retouche', 'lessive', 'apprêt', 'lasure',
    'vernis', 'décoration', 'façade',
  ],
  jardinage: [
    'jardin', 'pelouse', 'gazon', 'tonte', 'tondeuse', 'haie', 'tailler',
    'arbre', 'plante', 'fleur', 'jardiner', 'entretien', 'arrosage', 'élagage',
    'débroussaillage', 'terre', 'potager', 'feuille',
  ],
  nettoyage: [
    'nettoyer', 'nettoyage', 'propre', 'sale', 'laver', 'ménage', 'poussière',
    'balayer', 'aspirer', 'désinfecter', 'vitre', 'sol', 'serpillière', 'produit',
    'détergent', 'récurer', 'dégraisser', 'entretien',
  ],
  mecanique: [
    'voiture', 'auto', 'mécanique', 'mécanicien', 'moteur', 'panne', 'réparation',
    'huile', 'vidange', 'frein', 'pneu', 'roue', 'batterie', 'démarrer', 'révision',
    'garage', 'carrosserie', 'entretien',
  ],
  carrelage: [
    'carrelage', 'carreau', 'carreleur', 'joint', 'faïence', 'céramique', 'poser',
    'salle de bain', 'cuisine', 'sol', 'mur', 'colle', 'croisillon', 'niveau',
  ],
  demenagement: [
    'déménagement', 'déménager', 'carton', 'meuble', 'transporter', 'camion',
    'emballage', 'charger', 'décharger', 'porter', 'emballer', 'déplacer',
  ],
  reparation: [
    'réparer', 'réparation', 'casser', 'cassé', 'abîmé', 'défectueux', 'panne',
    'dysfonctionnement', 'fixer', 'remplacer', 'changer',
  ],
  installation: [
    'installer', 'installation', 'montage', 'monter', 'poser', 'fixer', 'brancher',
    'raccorder', 'assembler', 'mettre en place', 'configurer',
  ],
  climatisation: [
    'climatisation', 'clim', 'climatiseur', 'ventilation', 'air', 'froid', 'chaud',
    'température', 'filtre', 'gaz', 'compresseur', 'entretien', 'rafraîchir',
  ],
};

// Mots indiquant l'urgence
const URGENCY_KEYWORDS = {
  high: ['urgent', 'urgence', 'rapidement', 'vite', 'immédiat', 'aujourd\'hui', 'maintenant', 'tout de suite', 'panne'],
  medium: ['bientôt', 'prochainement', 'semaine', 'semaines'],
  low: ['quand vous pouvez', 'pas urgent', 'prévoir', 'planifier'],
};

/**
 * Analyse un texte en langage naturel et extrait les informations pertinentes
 */
function analyzeNaturalLanguage(text) {
  const normalizedText = text.toLowerCase();
  const analysis = {
    categories: [],
    categoryScores: {},
    urgency: 'medium',
    keywords: [],
    estimatedComplexity: 'medium',
  };

  // 1. Détection des catégories
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    const matchedKeywords = [];

    keywords.forEach(keyword => {
      // Recherche du mot-clé (entier ou partie)
      const regex = new RegExp(`\\b${keyword}`, 'i');
      if (regex.test(normalizedText)) {
        score += 1;
        matchedKeywords.push(keyword);
      }
    });

    if (score > 0) {
      analysis.categoryScores[category] = score;
      analysis.keywords.push(...matchedKeywords);
    }
  }

  // Trier les catégories par score
  const sortedCategories = Object.entries(analysis.categoryScores)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  analysis.categories = sortedCategories;

  // 2. Détection de l'urgence
  for (const [level, keywords] of Object.entries(URGENCY_KEYWORDS)) {
    if (keywords.some(keyword => normalizedText.includes(keyword))) {
      analysis.urgency = level;
      break;
    }
  }

  // 3. Estimation de la complexité
  const complexityIndicators = {
    simple: ['simple', 'petit', 'rapide', 'facile', 'basique'],
    medium: ['moyen', 'standard', 'normal'],
    complex: ['complexe', 'grand', 'important', 'gros', 'compliqué', 'difficile', 'plusieurs'],
  };

  for (const [level, indicators] of Object.entries(complexityIndicators)) {
    if (indicators.some(indicator => normalizedText.includes(indicator))) {
      analysis.estimatedComplexity = level;
      break;
    }
  }

  return analysis;
}

/**
 * Recherche sémantique de workers basée sur une description en langage naturel
 */
async function semanticWorkerSearch(description, options = {}) {
  try {
    const {
      latitude,
      longitude,
      maxDistance = 50000,
      limit = 10,
      aiAnalysis, // Analyse IA pré-calculée (optionnel)
    } = options;

    console.log('🧠 Analyse NLP de la description:', description);

    // Utiliser l'analyse IA si disponible, sinon fallback sur keywords
    let analysis;
    if (aiAnalysis && aiAnalysis.success) {
      console.log('✅ Utilisation de l\'analyse IA:', aiAnalysis.method);
      // Convertir le format de l'analyse IA au format attendu
      analysis = {
        categories: aiAnalysis.categories || [],
        categoryScores: aiAnalysis.categoryScores || {},
        urgency: aiAnalysis.urgency || 'medium',
        keywords: [], // L'IA ne fournit pas de keywords individuels
        estimatedComplexity: aiAnalysis.complexity || 'medium',
      };
    } else {
      console.log('🔄 Utilisation de l\'analyse keywords (fallback)');
      // Analyser avec le système de keywords
      analysis = analyzeNaturalLanguage(description);
    }

    console.log('✅ Analyse finale:', {
      categories: analysis.categories,
      urgency: analysis.urgency,
      complexity: analysis.estimatedComplexity,
      method: aiAnalysis ? aiAnalysis.method : 'keywords',
    });

    // Si aucune catégorie détectée, retourner une erreur informative
    if (analysis.categories.length === 0) {
      return {
        success: false,
        message: 'Impossible de déterminer le type de travail. Pouvez-vous être plus précis ?',
        suggestions: [
          'Décrivez le problème (ex: "fuite d\'eau au robinet")',
          'Mentionnez le type de travail (plomberie, électricité, etc.)',
          'Précisez la nature du problème',
        ],
        analysis,
      };
    }

    // Chercher les workers des catégories détectées (case-insensitive)
    // Ne pas filtrer par isAvailable — un plombier disponible=false reste visible
    const workerProfiles = await WorkerProfile.find({
      $or: analysis.categories.map(cat => ({
        categories: { $regex: new RegExp(`^${cat}$`, 'i') }
      }))
    }).lean();

    const workerIds = workerProfiles.map(p => p.userId);

    const workers = await User.find({
      userType: 'worker',
      _id: { $in: workerIds },
    })
      .select('fullName phoneNumber photoURL rating reviewCount location')
      .lean();

    console.log(`✅ ${workers.length} workers trouvés pour les catégories:`, analysis.categories);

    // Filtrer par distance si position fournie
    // Les workers sans coordonnées GPS sont exclus quand une position est fournie
    let filteredWorkers = workers;
    if (latitude && longitude && maxDistance) {
      filteredWorkers = workers.filter(worker => {
        if (!worker.location?.coordinates) {
          return false; // Exclure si pas de localisation quand l'utilisateur a partagé sa position
        }
        const distance = calculateDistance(
          latitude,
          longitude,
          worker.location.coordinates[1],
          worker.location.coordinates[0]
        );
        return distance <= maxDistance;
      });
      console.log(`📍 ${filteredWorkers.length} workers dans le rayon de ${maxDistance/1000}km`);
    }

    // Calculer le score de pertinence pour chaque worker
    const scoredWorkers = await Promise.all(
      filteredWorkers.map(async (worker) => {
        const profile = workerProfiles.find(p => p.userId.toString() === worker._id.toString());

        if (!profile) {
          return null;
        }

        // Calculer distance pour affichage
        let distance = null;
        if (latitude && longitude && worker.location?.coordinates) {
          distance = calculateDistance(
            latitude,
            longitude,
            worker.location.coordinates[1],
            worker.location.coordinates[0]
          );
        }

        // Calculer le score de pertinence sémantique
        const relevanceScore = calculateSemanticRelevance(
          worker,
          profile,
          analysis,
          latitude,
          longitude
        );

        return {
          ...worker,
          profile,
          distance: distance ? Math.round(distance / 1000 * 10) / 10 : null, // distance en km
          semanticScore: relevanceScore.total,
          scoreBreakdown: relevanceScore.breakdown,
          matchedCategories: profile.categories.filter(cat =>
            analysis.categories.includes(cat)
          ),
        };
      })
    );

    // Filtrer les null et trier par score
    const validWorkers = scoredWorkers
      .filter(w => w !== null)
      .sort((a, b) => b.semanticScore - a.semanticScore)
      .slice(0, parseInt(limit));

    return {
      success: true,
      analysis: {
        detectedCategories: analysis.categories,
        urgency: analysis.urgency,
        complexity: analysis.estimatedComplexity,
        mainKeywords: analysis.keywords.slice(0, 10),
      },
      recommendation: generateRecommendationText(analysis, validWorkers),
      workers: validWorkers,
      count: validWorkers.length,
    };
  } catch (error) {
    console.error('❌ Erreur semanticWorkerSearch:', error);
    throw error;
  }
}

/**
 * Calcule le score de pertinence sémantique d'un worker
 */
function calculateSemanticRelevance(worker, profile, analysis, latitude, longitude) {
  let totalScore = 0;
  const breakdown = {};

  // 1. Score de catégorie (40%) - Le plus important pour la pertinence
  const primaryCategory = analysis.categories[0];
  const categoryMatch = profile.categories.includes(primaryCategory);
  let categoryScore = 0;

  if (categoryMatch) {
    categoryScore = 40; // Catégorie principale correspond
    // Bonus si plusieurs catégories correspondent
    const additionalMatches = analysis.categories.slice(1).filter(cat =>
      profile.categories.includes(cat)
    ).length;
    categoryScore += Math.min(additionalMatches * 5, 10); // Max +10 points
  }

  breakdown.category = categoryScore;
  totalScore += categoryScore;

  // 2. Score de notation (25%)
  const ratingScore = (worker.rating || 0) * 5; // 0-25 points
  breakdown.rating = ratingScore;
  totalScore += ratingScore;

  // 3. Score d'expérience (15%)
  const reviewCount = worker.reviewCount || 0;
  const experienceScore = Math.min(reviewCount * 1.5, 15); // Max 15 points
  breakdown.experience = experienceScore;
  totalScore += experienceScore;

  // 4. Score de proximité (15%)
  let proximityScore = 0;
  if (latitude && longitude && worker.location?.coordinates) {
    const distance = calculateDistance(
      latitude,
      longitude,
      worker.location.coordinates[1],
      worker.location.coordinates[0]
    );
    proximityScore = Math.max(0, 15 - (distance / 3333)); // -1 point par 3.33km
  }
  breakdown.proximity = proximityScore;
  totalScore += proximityScore;

  // 5. Score d'urgence/disponibilité (5%)
  // TODO: Intégrer la disponibilité réelle du worker
  const availabilityScore = 5; // Par défaut, on suppose disponible
  breakdown.availability = availabilityScore;
  totalScore += availabilityScore;

  return {
    total: Math.round(totalScore * 10) / 10,
    breakdown,
  };
}

/**
 * Génère un texte de recommandation personnalisé
 */
function generateRecommendationText(analysis, workers) {
  const categoryText = analysis.categories[0] || 'ce type de travail';
  const urgencyText = {
    high: 'urgent',
    medium: 'dans les prochains jours',
    low: 'quand vous le souhaitez',
  }[analysis.urgency] || '';

  if (workers.length === 0) {
    return `Désolé, nous n'avons pas trouvé de ${categoryText.toLowerCase()} disponible pour le moment. Essayez d'élargir votre zone de recherche.`;
  }

  const topWorker = workers[0];
  let text = `Pour votre besoin en ${categoryText.toLowerCase()}`;

  if (urgencyText) {
    text += ` ${urgencyText}`;
  }

  text += `, nous vous recommandons ${topWorker.fullName}`;

  if (topWorker.rating) {
    text += ` (note: ${topWorker.rating}/5)`;
  }

  if (workers.length > 1) {
    text += `. ${workers.length - 1} autre${workers.length > 2 ? 's' : ''} professionnel${workers.length > 2 ? 's' : ''} qualifié${workers.length > 2 ? 's' : ''} disponible${workers.length > 2 ? 's' : ''}.`;
  }

  return text;
}

// Fonction helper pour calculer la distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

module.exports = {
  analyzeNaturalLanguage,
  semanticWorkerSearch,
};
