const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

// Tokens Expo à restaurer (remplacer par les vrais tokens)
const tokensToRestore = [
  {
    email: 'nabyc@test.com',
    expoPushToken: 'ExponentPushToken[Sawb5QE4qE-zTUYqHTQaPT]'
  },
  // Ajouter d'autres utilisateurs si nécessaire
];

async function restoreExpoPushTokens() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    for (const userToken of tokensToRestore) {
      const result = await User.updateOne(
        { email: userToken.email },
        { $set: { expoPushToken: userToken.expoPushToken } }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Token Expo restauré pour: ${userToken.email}`);
      } else {
        console.log(`⚠️  Utilisateur non trouvé ou token déjà présent: ${userToken.email}`);
      }
    }

    console.log('✅ Restauration terminée');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

restoreExpoPushTokens();
