const axios = require('axios');

const API_URL = 'http://localhost:5000/api/chatbot';

// Questions de test
const testQuestions = [
  'Comment créer une demande de service ?',
  'Comment choisir un bon worker ?',
  'Les prix sont trop élevés, que faire ?',
  'Le worker ne répond pas à mes messages',
  'Comment évaluer le travail d\'un worker ?',
  'C\'est quoi la différence entre enchères publiques et privées ?',
  'Comment fonctionne la recherche IA ?',
];

async function testChatbot() {
  console.log('🤖 Test du Chatbot d\'aide\n');
  console.log('='.repeat(80));

  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i];
    console.log(`\n📝 Question ${i + 1}/${testQuestions.length}`);
    console.log(`"${question}"`);

    try {
      const startTime = Date.now();

      const response = await axios.post(`${API_URL}/ask`, {
        question,
        conversationHistory: [],
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response.data.success) {
        console.log(`\n✅ Réponse (${duration}ms)`);
        console.log(`Méthode: ${response.data.method}`);
        if (response.data.confidence) {
          console.log(`Confiance: ${(response.data.confidence * 100).toFixed(1)}%`);
        }
        console.log(`\n💬 Réponse:\n${response.data.answer}`);
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

    console.log('\n' + '-'.repeat(80));
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Tests terminés\n');
}

async function testFAQ() {
  console.log('📚 Test de la FAQ\n');
  console.log('='.repeat(80));

  try {
    const response = await axios.get(`${API_URL}/faq`);

    if (response.data.success) {
      console.log(`\n✅ ${response.data.faq.length} catégories de FAQ récupérées:\n`);

      response.data.faq.forEach(category => {
        console.log(`\n📂 ${category.category} (${category.icon})`);
        category.questions.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.q}`);
          console.log(`      → ${item.a.substring(0, 80)}...`);
        });
      });
    } else {
      console.log(`❌ Erreur: ${response.data.message}`);
    }
  } catch (error) {
    console.log(`❌ Erreur de requête: ${error.message}`);
  }

  console.log('\n' + '='.repeat(80));
}

async function testSuggestions() {
  console.log('\n💡 Test des Suggestions\n');
  console.log('='.repeat(80));

  try {
    const response = await axios.get(`${API_URL}/suggestions`);

    if (response.data.success) {
      console.log(`\n✅ ${response.data.suggestions.length} suggestions disponibles:\n`);

      response.data.suggestions.forEach((suggestion, index) => {
        console.log(`   ${index + 1}. ${suggestion}`);
      });
    } else {
      console.log(`❌ Erreur: ${response.data.message}`);
    }
  } catch (error) {
    console.log(`❌ Erreur de requête: ${error.message}`);
  }

  console.log('\n' + '='.repeat(80));
}

// Exécuter tous les tests
async function runAllTests() {
  try {
    await testChatbot();
    await testFAQ();
    await testSuggestions();

    console.log('\n🎉 Tous les tests du chatbot sont terminés !');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

runAllTests();
