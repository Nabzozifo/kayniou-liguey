/**
 * Script de test pour vérifier la validité de la clé GROQ_API_KEY
 * Usage: node test-groq-key.js
 */

const axios = require('axios');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function testGroqKey() {
  console.log('\n🔑 Test de la clé Groq API...\n');

  // Vérifier si la clé existe
  if (!GROQ_API_KEY) {
    console.error('❌ ERREUR: GROQ_API_KEY non définie dans .env');
    console.log('\n📝 Solution:');
    console.log('1. Allez sur https://console.groq.com/keys');
    console.log('2. Créez une nouvelle clé API');
    console.log('3. Ajoutez-la dans kayniou-liggey-backend/.env:');
    console.log('   GROQ_API_KEY=gsk_votre_nouvelle_clé\n');
    process.exit(1);
  }

  // Vérifier le format de la clé
  if (!GROQ_API_KEY.startsWith('gsk_')) {
    console.warn('⚠️  ATTENTION: La clé ne commence pas par "gsk_"');
    console.log('   Les clés Groq valides commencent normalement par "gsk_"\n');
  }

  console.log(`✅ Clé trouvée: ${GROQ_API_KEY.substring(0, 10)}...${GROQ_API_KEY.slice(-4)}`);
  console.log('🔄 Test de connexion à l\'API Groq...\n');

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: 'Dis juste "OK" si tu me comprends.',
          },
        ],
        temperature: 0.5,
        max_tokens: 10,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const answer = response.data.choices[0].message.content;
    console.log('✅ SUCCESS! La clé Groq API est valide!\n');
    console.log(`🤖 Réponse de l'IA: "${answer}"\n`);
    console.log('📊 Modèle utilisé:', response.data.model);
    console.log('⏱️  Tokens utilisés:', response.data.usage?.total_tokens || 'N/A');
    console.log('\n✨ Le chatbot IA est prêt à être utilisé!\n');

  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || 'Erreur inconnue';

      console.error(`\n❌ ERREUR ${status}: ${message}\n`);

      if (status === 401) {
        console.log('🔒 La clé API est invalide ou expirée.');
        console.log('\n📝 Solution:');
        console.log('1. Allez sur https://console.groq.com/keys');
        console.log('2. Supprimez l\'ancienne clé (si elle existe)');
        console.log('3. Créez une NOUVELLE clé API');
        console.log('4. Remplacez dans .env:');
        console.log(`   GROQ_API_KEY=gsk_votre_nouvelle_clé`);
        console.log('\n💡 Note: Les clés peuvent expirer ou être révoquées\n');
      } else if (status === 429) {
        console.log('⏳ Limite de requêtes atteinte.');
        console.log('   Attendez quelques minutes et réessayez.\n');
      } else {
        console.log('⚠️  Erreur API inattendue.');
        console.log('   Vérifiez https://status.groq.com pour le statut du service\n');
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('\n❌ TIMEOUT: L\'API Groq ne répond pas.\n');
      console.log('📶 Vérifiez votre connexion internet\n');
    } else {
      console.error('\n❌ ERREUR:', error.message, '\n');
    }

    process.exit(1);
  }
}

// Exécuter le test
testGroqKey();
