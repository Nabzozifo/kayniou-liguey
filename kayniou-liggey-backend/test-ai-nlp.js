const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Tests pour l'analyse IA
const testCases = [
  {
    description: "J'ai une fuite d'eau sous l'évier de ma cuisine qui goutte depuis hier",
    expectedCategories: ['Plomberie'],
  },
  {
    description: 'Mon disjoncteur saute tout le temps et les lumières ne fonctionnent plus dans le salon',
    expectedCategories: ['Électricité'],
  },
  {
    description: 'Ma porte grince beaucoup et je voudrais aussi faire réparer une fenêtre qui ferme mal',
    expectedCategories: ['Menuiserie'],
  },
  {
    description: 'Besoin de repeindre toute ma maison rapidement, c\'est urgent',
    expectedCategories: ['Peinture'],
  },
  {
    description: 'Je dois déménager mon appartement ce week-end',
    expectedCategories: ['Déménagement'],
  },
];

async function testAiAnalysis() {
  console.log('🧪 Test de l\'analyse IA NLP\n');
  console.log('=' .repeat(80));

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📝 Test ${i + 1}/${testCases.length}`);
    console.log(`Description: "${testCase.description}"`);
    console.log(`Catégories attendues: ${testCase.expectedCategories.join(', ')}`);

    try {
      const startTime = Date.now();

      const response = await axios.post(`${API_URL}/nlp/analyze-ai`, {
        text: testCase.description,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response.data.success) {
        const analysis = response.data.analysis;
        console.log(`✅ Analyse réussie (${duration}ms)`);
        console.log(`   Méthode: ${analysis.method}`);
        console.log(`   Catégories détectées: ${analysis.categories.join(', ')}`);
        console.log(`   Confiance: ${(analysis.confidence * 100).toFixed(1)}%`);
        console.log(`   Urgence: ${analysis.urgency}`);
        console.log(`   Complexité: ${analysis.complexity}`);

        // Vérifier si au moins une catégorie attendue est détectée
        const hasMatch = testCase.expectedCategories.some(cat =>
          analysis.categories.includes(cat)
        );
        if (hasMatch) {
          console.log(`   ✓ Catégorie correctement détectée !`);
        } else {
          console.log(`   ⚠️  Catégorie attendue non détectée`);
        }
      } else {
        console.log(`❌ Erreur: ${response.data.message}`);
      }
    } catch (error) {
      console.log(`❌ Erreur de requête: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Tests terminés\n');
}

async function testSemanticSearch() {
  console.log('\n🔍 Test de la recherche sémantique avec IA\n');
  console.log('=' .repeat(80));

  const searchQuery = "J'ai une urgence ! Mon robinet fuit partout et il y a de l'eau sur le sol";
  console.log(`\n📝 Requête: "${searchQuery}"`);

  try {
    const startTime = Date.now();

    const response = await axios.post(`${API_URL}/worker-recommendations/semantic-search`, {
      description: searchQuery,
      limit: 5,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response.data.success) {
      console.log(`✅ Recherche réussie (${duration}ms)`);
      console.log(`\n📊 Analyse:`);
      console.log(`   Catégories: ${response.data.analysis.detectedCategories.join(', ')}`);
      console.log(`   Urgence: ${response.data.analysis.urgency}`);
      console.log(`   Complexité: ${response.data.analysis.complexity}`);

      console.log(`\n👷 Workers trouvés: ${response.data.count}`);

      if (response.data.count > 0) {
        console.log('\n🏆 Top 3 workers:');
        response.data.workers.slice(0, 3).forEach((worker, index) => {
          console.log(`\n   ${index + 1}. ${worker.fullName}`);
          console.log(`      Score: ${worker.semanticScore}/100`);
          console.log(`      Rating: ${worker.rating || 'N/A'}/5`);
          console.log(`      Catégories: ${worker.matchedCategories.join(', ')}`);
          if (worker.scoreBreakdown) {
            console.log(`      Breakdown:`);
            Object.entries(worker.scoreBreakdown).forEach(([key, value]) => {
              console.log(`         ${key}: ${value.toFixed(1)}`);
            });
          }
        });
      }

      if (response.data.recommendation) {
        console.log(`\n💬 Recommandation: ${response.data.recommendation}`);
      }
    } else {
      console.log(`❌ Erreur: ${response.data.message}`);
    }
  } catch (error) {
    console.log(`❌ Erreur de requête: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

// Exécuter les tests
async function runAllTests() {
  try {
    await testAiAnalysis();
    await testSemanticSearch();

    console.log('\n🎉 Tous les tests sont terminés !');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

runAllTests();
