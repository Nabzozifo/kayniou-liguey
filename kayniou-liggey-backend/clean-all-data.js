/**
 * clean-all-data.js
 * Supprime toutes les données utilisateur de la base de données.
 * Usage: node clean-all-data.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const COLLECTIONS = [
  'users',
  'workerprofiles',
  'clientprofiles',
  'servicerequests',
  'quotes',
  'worksites',
  'worksiteactivities',
  'chats',
  'notifications',
  'pushtokens',
  'ratings',
  'reviews',
  'evaluations',
  'contracts',
  'blockreports',
];

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kayniou-liggey';
    await mongoose.connect(uri);
    console.log('✅ MongoDB connecté');

    const db = mongoose.connection.db;

    for (const name of COLLECTIONS) {
      try {
        const result = await db.collection(name).deleteMany({});
        console.log(`🗑️  ${name}: ${result.deletedCount} document(s) supprimé(s)`);
      } catch (err) {
        console.log(`⚠️  ${name}: collection introuvable ou erreur — ignorée`);
      }
    }

    console.log('\n✅ Nettoyage terminé.');
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();
