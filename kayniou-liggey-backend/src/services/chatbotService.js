/**
 * Service de Chatbot d'aide pour l'application
 * Utilise plusieurs providers IA GRATUITS en fallback
 *
 * OPTIONS GRATUITES:
 * 1. Groq API (Ultra rapide, 100% gratuit, limite: 14400 req/jour)
 * 2. Together AI (Gratuit, modèles open source)
 * 3. Local Pattern Matching (instantané, pas d'IA)
 */

const axios = require('axios');

// Configuration des providers
const GROQ_API_KEY = process.env.GROQ_API_KEY || ''; // Optionnel mais recommandé
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Contexte de l'application pour le chatbot
 */
const APP_CONTEXT = `Tu es un assistant virtuel pour l'application "Kayniou Liggey", une plateforme de mise en relation entre clients et travailleurs au Sénégal.

FONCTIONNALITÉS DE L'APP:
- Les CLIENTS peuvent créer des demandes de service dans 13 catégories (plomberie, électricité, menuiserie, etc.)
- Les WORKERS (travailleurs) peuvent consulter les demandes et soumettre des devis
- Système d'enchères (publique ou privée) pour obtenir les meilleurs prix
- Embauche directe possible
- Chat en temps réel entre clients et workers
- Système d'évaluation bidirectionnel (client ↔ worker)
- Recherche IA par description en langage naturel
- Localisation géographique pour trouver des workers à proximité

MODES DE DEMANDE:
1. **Enchères publiques**: Tous les workers voient la demande et peuvent proposer
2. **Enchères privées**: Seuls 1-10 workers invités peuvent proposer
3. **Embauche directe**: Engager un worker spécifique directement

PROCESS STANDARD:
1. Client crée une demande
2. Workers soumettent des devis
3. Client choisit un devis
4. Chantier créé automatiquement
5. Communication via chat intégré
6. Finalisation et évaluation mutuelle

AIDE L'UTILISATEUR à:
- Comprendre comment utiliser l'app
- Résoudre des problèmes courants
- Trouver les bonnes fonctionnalités
- Optimiser son expérience (meilleurs prix, workers qualifiés, etc.)

Réponds en FRANÇAIS, de manière CONCISE et AMICALE.
Si tu ne sais pas, dis-le franchement et suggère de contacter le support.`;

/**
 * FAQ pré-configurée (pattern matching rapide sans IA)
 */
const FAQ_PATTERNS = {
  'comment créer une demande': {
    keywords: ['créer', 'demande', 'service', 'nouvelle', 'ajouter', 'poster', 'publier'],
    answer: `Pour créer une demande de service :
1. Allez sur l'écran d'accueil
2. Appuyez sur le bouton "+" ou "Nouvelle demande"
3. Choisissez la catégorie (plomberie, électricité, etc.)
4. Décrivez votre besoin en détail
5. Ajoutez des photos si nécessaire
6. Indiquez votre localisation
7. Choisissez le mode (enchères publiques, privées, ou embauche directe)
8. Validez !

Vous recevrez des notifications quand des workers proposent des devis.`,
  },
  'comment trouver un worker': {
    keywords: ['comment', 'trouver', 'chercher', 'worker', 'travailleur', 'rechercher', 'localiser'],
    answer: `Pour TROUVER des workers :

🔍 **3 méthodes disponibles** :

1️⃣ **Recherche par carte** :
- Ouvrez la carte sur l'écran d'accueil
- Sélectionnez une catégorie (plomberie, électricité, etc.)
- Les workers à proximité s'affichent avec leur note
- Cliquez pour voir leur profil complet

2️⃣ **Recherche intelligente (IA)** :
- Décrivez votre besoin en langage naturel
- Ex: "Je cherche un plombier pour réparer un robinet qui fuit"
- L'IA trouve les meilleurs workers selon vos critères

3️⃣ **Créer une demande** :
- Publiez votre demande en enchères publiques
- Les workers vous trouvent et proposent des devis
- Vous recevez 5-10 propositions en quelques heures

💡 **Astuce** : Créer une demande attire souvent plus de workers !`,
  },
  'comment choisir bon worker': {
    keywords: ['choisir', 'sélectionner', 'meilleur', 'bon', 'qualifié', 'worker', 'travailleur', 'critères'],
    answer: `Pour choisir le MEILLEUR worker :

✅ **Critères à vérifier** :
- ⭐ Note globale (minimum 4/5 recommandé)
- 💬 Avis des autres clients (lisez les commentaires)
- 💰 Prix proposé (comparez plusieurs devis)
- ✔️ Missions terminées (plus = plus d'expérience)
- 📍 Proximité (regardez la distance)
- 📊 Taux de complétion des missions

💡 **Astuces** :
- Utilisez le chat pour poser des questions AVANT d'accepter
- Demandez des photos de travaux précédents
- Vérifiez s'il a travaillé dans votre quartier
- Comparez au moins 3 profils

Notre IA vous classe automatiquement les workers par score de recommandation !`,
  },
  'prix trop élevé': {
    keywords: ['cher', 'prix', 'coût', 'tarif', 'élevé', 'trop'],
    answer: `Pour obtenir de meilleurs prix :
- Utilisez les ENCHÈRES PUBLIQUES : plus de workers = concurrence = meilleurs prix
- Attendez plusieurs devis avant de choisir
- Soyez précis dans votre description pour éviter les surcoûts
- Comparez les devis détaillés
- Négociez via le chat avant d'accepter

Astuce : Les demandes avec photos claires reçoivent souvent de meilleurs prix !`,
  },
  'worker ne répond pas': {
    keywords: ['répond', 'pas', 'message', 'chat', 'contact'],
    answer: `Si un worker ne répond pas :
1. Vérifiez qu'il a bien accepté votre demande
2. Attendez 24h (ils peuvent être occupés)
3. Envoyez un rappel poli dans le chat
4. Si toujours pas de réponse après 48h, vous pouvez :
   - Signaler le worker
   - Choisir un autre worker
   - Annuler la mission

Nous prenons la réactivité très au sérieux !`,
  },
  'comment évaluer': {
    keywords: ['évaluer', 'noter', 'avis', 'étoiles', 'rating'],
    answer: `Pour évaluer un chantier terminé :
1. Allez dans "Mes chantiers"
2. Sélectionnez le chantier terminé
3. Appuyez sur "Évaluer"
4. Donnez une note globale (1-5 étoiles)
5. Notez 4 critères détaillés : qualité, ponctualité, communication, professionnalisme
6. Ajoutez un commentaire (min 10 caractères)
7. Indiquez si vous recommanderiez ce worker

Les évaluations aident toute la communauté !`,
  },
  'recherche ia': {
    keywords: ['recherche', 'ia', 'intelligence', 'trouver', 'worker', 'intelligent'],
    answer: `Notre recherche IA intelligente :
1. Décrivez votre problème en langage naturel
   Exemple : "J'ai une fuite d'eau urgente sous l'évier"
2. L'IA comprend automatiquement :
   - La catégorie (plomberie)
   - L'urgence (haute)
   - La complexité (moyenne)
3. Vous obtenez les workers les plus pertinents, classés par score

C'est plus rapide et précis que de chercher manuellement !`,
  },
  'inscription compte': {
    keywords: ['inscription', 'compte', 'inscrire', 'enregistrer', 'créer compte', 's\'inscrire'],
    answer: `Pour créer votre compte :

📱 **Si vous êtes CLIENT** :
1. Téléchargez l'app Kayniou Liggey
2. Appuyez sur "S'inscrire"
3. Choisissez "Client"
4. Entrez : nom, téléphone, localisation
5. Créez un mot de passe
6. Validez !

👷 **Si vous êtes WORKER** :
1. Même processus mais choisissez "Worker"
2. Ajoutez vos compétences (catégories)
3. Indiquez votre expérience
4. Ajoutez des photos de vos travaux
5. Définissez vos tarifs

C'est GRATUIT et prend 2 minutes !`,
  },
  'comment fonctionne app': {
    keywords: ['fonctionne', 'marche', 'utilise', 'fonctionnement', 'comment ça marche'],
    answer: `Comment fonctionne Kayniou Liggey :

👤 **POUR LES CLIENTS** :
1. Créez une demande de service
2. Recevez des devis de workers
3. Comparez et choisissez le meilleur
4. Communiquez via chat intégré
5. Le worker effectue le travail
6. Évaluez mutuellement

👷 **POUR LES WORKERS** :
1. Consultez les demandes disponibles
2. Soumettez vos devis
3. Si accepté, réalisez la mission
4. Recevez votre paiement
5. Construisez votre réputation

💰 C'est une plateforme de mise en relation, pas d'intermédiaire sur les paiements !`,
  },
  'paiement argent': {
    keywords: ['paiement', 'payer', 'argent', 'money', 'prix', 'combien'],
    answer: `💰 **Système de paiement** :

📱 **L'app est GRATUITE** :
- Pas de frais d'inscription
- Pas de commission sur les transactions
- Pas d'abonnement

💵 **Le paiement se fait** :
- Directement entre client et worker
- En cash, mobile money, ou virement
- Selon accord entre les deux parties

⚠️ **Important** :
- Nous NE gérons PAS les paiements
- Négociez les modalités avec le worker
- Payez après validation du travail

Notre rôle : faciliter la mise en relation !`,
  },
  'annuler demande': {
    keywords: ['annuler', 'supprimer', 'retirer', 'annulation', 'cancel'],
    answer: `Pour annuler une demande :

❌ **AVANT qu'un devis soit accepté** :
1. Allez dans "Mes demandes"
2. Sélectionnez la demande
3. Menu (3 points) > "Annuler"
4. Confirmez
→ Annulation GRATUITE

⚠️ **APRÈS acceptation d'un devis** :
1. Contactez d'abord le worker par chat
2. Expliquez la situation
3. Si accord mutuel, vous pouvez annuler
4. Sinon, des pénalités peuvent s'appliquer selon les conditions

💡 **Conseil** : Annulez uniquement si vraiment nécessaire pour préserver votre réputation !`,
  },
  'securite confiance': {
    keywords: ['sécurité', 'sûr', 'confiance', 'arnaque', 'fiable', 'sécurisé'],
    answer: `🛡️ **Votre sécurité est notre priorité** :

✅ **Vérifications** :
- Système d'évaluation bidirectionnel
- Historique des missions visibles
- Signalement des comportements inappropriés
- Blocage possible des utilisateurs problématiques

💡 **Conseils de sécurité** :
- Vérifiez toujours les avis avant de choisir
- Utilisez le chat intégré (traçable)
- Ne payez jamais avant le début des travaux
- Demandez une visite préliminaire si nécessaire
- Signalez tout comportement suspect

📞 **Support** : Disponible 7j/7 pour toute question !`,
  },
  'probleme bug': {
    keywords: ['problème', 'bug', 'erreur', 'marche pas', 'fonctionne pas', 'crash'],
    answer: `😓 Désolé pour le problème !

🔧 **Solutions rapides** :
1. Fermez et relancez l'application
2. Vérifiez votre connexion internet
3. Mettez à jour l'app (Play Store/App Store)
4. Redémarrez votre téléphone
5. Réinstallez l'app si nécessaire

📧 **Si ça persiste** :
Contactez notre support avec :
- Description du problème
- Captures d'écran si possible
- Modèle de votre téléphone
- Version de l'app

Nous résolvons 90% des bugs en moins de 24h !`,
  },
  'mode enchères': {
    keywords: ['enchère', 'auction', 'publique', 'privée', 'mode'],
    answer: `3 modes disponibles :

📢 **Enchères PUBLIQUES** : Tous les workers voient votre demande et peuvent proposer. Maximum de concurrence = meilleurs prix !

🔒 **Enchères PRIVÉES** : Seulement 1-10 workers de votre choix reçoivent l'invitation. Plus discret, workers de confiance.

⚡ **Embauche DIRECTE** : Engagez un worker spécifique immédiatement, sans attendre d'autres devis. Plus rapide !

Recommandation : Enchères publiques pour le meilleur prix, privées pour la qualité.`,
  },
};

/**
 * Analyse une question utilisateur avec pattern matching amélioré
 * Prend en compte: ordre des mots, position, mots-clés exacts, et contexte
 */
function matchFAQ(question) {
  const normalizedQuestion = question.toLowerCase().trim();
  const questionWords = normalizedQuestion.split(/\s+/);
  let bestMatch = null;
  let bestScore = 0;

  for (const [category, faq] of Object.entries(FAQ_PATTERNS)) {
    let score = 0;
    let matchedKeywords = 0;

    faq.keywords.forEach((keyword, index) => {
      if (normalizedQuestion.includes(keyword)) {
        matchedKeywords++;

        // 1. Score de base: keyword trouvé
        let keywordScore = 1;

        // 2. Bonus si mot exact (pas juste contenu)
        const isExactWord = questionWords.includes(keyword);
        if (isExactWord) {
          keywordScore += 0.5;
        }

        // 3. Bonus pour position dans la question (début = plus important)
        const position = normalizedQuestion.indexOf(keyword);
        const positionBonus = (1 - position / normalizedQuestion.length) * 0.3;
        keywordScore += positionBonus;

        // 4. Bonus pour ordre séquentiel des keywords
        if (index > 0 && normalizedQuestion.includes(faq.keywords[index - 1])) {
          const prevPosition = normalizedQuestion.indexOf(faq.keywords[index - 1]);
          if (position > prevPosition) {
            keywordScore += 0.4; // Ordre correct
          }
        }

        score += keywordScore;
      }
    });

    // Score final normalisé avec pondération
    const normalizedScore = (score / faq.keywords.length) * (matchedKeywords / faq.keywords.length);

    // Garder le meilleur match
    if (matchedKeywords > 0 && normalizedScore > bestScore) {
      bestScore = normalizedScore;
      bestMatch = {
        found: true,
        answer: faq.answer,
        category,
        confidence: normalizedScore,
        method: 'faq-matching-improved',
        matchCount: matchedKeywords,
        totalKeywords: faq.keywords.length,
      };
    }
  }

  // Seuil plus élevé pour éviter les faux positifs (25% au lieu de 12.5%)
  if (bestMatch && bestScore >= 0.25) {
    console.log(`✅ FAQ Match: "${question}" → ${bestMatch.category} (score: ${bestScore.toFixed(2)})`);
    return bestMatch;
  }

  console.log(`❌ FAQ No Match: "${question}" (best score: ${bestScore.toFixed(2)})`);
  return {
    found: false,
    method: 'faq-matching-improved',
  };
}

/**
 * Réponse avec Groq AI (ULTRA RAPIDE et GRATUIT)
 * Modèle: llama-3.3-70b-versatile
 */
async function askGroq(question, conversationHistory = []) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY non configurée');
  }

  const messages = [
    { role: 'system', content: APP_CONTEXT },
    ...conversationHistory,
    { role: 'user', content: question },
  ];

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.3-70b-versatile', // Modèle le plus récent et rapide
        messages,
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return {
      success: true,
      answer: response.data.choices[0].message.content,
      method: 'groq-ai',
      model: 'llama-3.3-70b-versatile',
    };
  } catch (error) {
    const statusCode = error.response?.status;
    if (statusCode === 401) {
      console.error('❌ Erreur Groq AI: Clé API invalide ou expirée (401)');
      console.log('💡 Solution: Générer une nouvelle clé sur https://console.groq.com/keys');
    } else {
      console.error('❌ Erreur Groq AI:', error.message);
    }
    throw error;
  }
}

/**
 * Fonction principale du chatbot avec fallback intelligent
 */
async function askChatbot(question, conversationHistory = []) {
  console.log('💬 Question utilisateur:', question);

  // 1. Essayer la FAQ d'abord (instantané)
  const faqMatch = matchFAQ(question);

  if (faqMatch.found) {
    console.log(`✅ Réponse trouvée dans la FAQ (${faqMatch.matchCount} mots-clés)`);
    return {
      success: true,
      answer: faqMatch.answer,
      method: 'faq-matching',
      confidence: faqMatch.confidence,
      category: faqMatch.category,
    };
  }

  // 2. Essayer Groq AI si clé disponible
  if (GROQ_API_KEY) {
    try {
      console.log('🤖 Utilisation de Groq AI...');
      const groqResult = await askGroq(question, conversationHistory);
      return groqResult;
    } catch (error) {
      console.log('🔄 Groq AI échoué, fallback sur FAQ générique');
    }
  }

  // 3. Fallback : Réponse générique
  return {
    success: true,
    answer: `Je n'ai pas trouvé de réponse précise à votre question. Voici quelques ressources utiles :

📚 **Aide générale** : Consultez notre guide d'utilisation dans les paramètres
💬 **Support** : Contactez notre équipe support via le chat
🎥 **Tutoriels** : Regardez nos vidéos explicatives

Pouvez-vous reformuler votre question ou être plus précis ?`,
    method: 'fallback-generic',
    confidence: 0.1,
  };
}

module.exports = {
  askChatbot,
  matchFAQ,
  askGroq,
};
