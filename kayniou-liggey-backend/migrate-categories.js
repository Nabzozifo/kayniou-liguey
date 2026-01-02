const mongoose = require('mongoose');
require('dotenv').config();

// Mapping des catégories (ancien format → nouveau format)
const CATEGORY_MAPPING = {
  'Plomberie': 'plomberie',
  'plomberie': 'plomberie',
  'Électricité': 'electricite',
  'Electricité': 'electricite',
  'electricite': 'electricite',
  'Menuiserie': 'menuiserie',
  'menuiserie': 'menuiserie',
  'Maçonnerie': 'maconnerie',
  'Maconnerie': 'maconnerie',
  'maconnerie': 'maconnerie',
  'Peinture': 'peinture',
  'peinture': 'peinture',
  'Carrelage': 'carrelage',
  'carrelage': 'carrelage',
  'Jardinage': 'jardinage',
  'jardinage': 'jardinage',
  'Nettoyage': 'nettoyage',
  'nettoyage': 'nettoyage',
  'Mécanique': 'mecanique',
  'Mecanique': 'mecanique',
  'mecanique': 'mecanique',
  'Déménagement': 'demenagement',
  'Demenagement': 'demenagement',
  'demenagement': 'demenagement',
  'Réparation': 'reparation',
  'Reparation': 'reparation',
  'reparation': 'reparation',
  'Installation': 'installation',
  'installation': 'installation',
  'Climatisation': 'climatisation',
  'climatisation': 'climatisation',
};

async function migrateCategories() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Migrer WorkerProfile
    const WorkerProfile = mongoose.model('WorkerProfile', new mongoose.Schema({}, { strict: false }));
    const workerProfiles = await WorkerProfile.find({});

    console.log(`\n📊 Trouvé ${workerProfiles.length} profils workers`);

    let workerUpdated = 0;
    for (const profile of workerProfiles) {
      if (profile.categories && profile.categories.length > 0) {
        const oldCategories = [...profile.categories];
        const newCategories = profile.categories.map(cat => CATEGORY_MAPPING[cat] || cat.toLowerCase());

        if (JSON.stringify(oldCategories) !== JSON.stringify(newCategories)) {
          console.log(`  🔧 Worker ${profile.userId}: ${oldCategories.join(', ')} → ${newCategories.join(', ')}`);
          await WorkerProfile.updateOne(
            { _id: profile._id },
            { $set: { categories: newCategories } }
          );
          workerUpdated++;
        }
      }
    }
    console.log(`✅ ${workerUpdated} profils workers mis à jour\n`);

    // Migrer ServiceRequest
    const ServiceRequest = mongoose.model('ServiceRequest', new mongoose.Schema({}, { strict: false }));
    const serviceRequests = await ServiceRequest.find({});

    console.log(`📊 Trouvé ${serviceRequests.length} demandes de service`);

    let requestUpdated = 0;
    for (const request of serviceRequests) {
      if (request.categories && request.categories.length > 0) {
        const oldCategories = [...request.categories];
        const newCategories = request.categories.map(cat => CATEGORY_MAPPING[cat] || cat.toLowerCase());

        if (JSON.stringify(oldCategories) !== JSON.stringify(newCategories)) {
          console.log(`  🔧 Request ${request._id}: ${oldCategories.join(', ')} → ${newCategories.join(', ')}`);
          await ServiceRequest.updateOne(
            { _id: request._id },
            { $set: { categories: newCategories } }
          );
          requestUpdated++;
        }
      }
    }
    console.log(`✅ ${requestUpdated} demandes mises à jour\n`);

    console.log('🎉 Migration terminée avec succès!');
    console.log(`   - ${workerUpdated} profils workers normalisés`);
    console.log(`   - ${requestUpdated} demandes normalisées`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnexion de MongoDB');
    process.exit(0);
  }
}

// Exécuter la migration
migrateCategories();
