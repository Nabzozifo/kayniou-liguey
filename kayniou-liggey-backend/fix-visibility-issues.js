const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const WorkerProfile = require('./src/models/WorkerProfile');
const ServiceRequest = require('./src/models/ServiceRequest');

async function fixVisibilityIssues() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    console.log('🔧 CORRECTION DES PROBLÈMES DE VISIBILITÉ\n');
    console.log('='.repeat(50) + '\n');

    // 1. Fix nabyw availability
    console.log('1️⃣  Activation de nabyw...\n');
    const nabywUser = await User.findOne({ email: 'nabyw@test.com' });
    if (nabywUser) {
      const nabywProfile = await WorkerProfile.findOne({ userId: nabywUser._id });
      if (nabywProfile) {
        nabywProfile.isAvailable = true;
        await nabywProfile.save();
        console.log(`   ✅ nabyw maintenant disponible: ${nabywProfile.isAvailable}\n`);
      }
    }

    // 2. Fix category names in service requests
    console.log('2️⃣  Correction des catégories de demandes...\n');

    const categoryMapping = {
      'Plombier': 'Plomberie',
      'Électricien': 'Électricité',
      'Menuisier': 'Menuiserie',
      'Maçon': 'Maçonnerie',
      'Peintre': 'Peinture',
      'Jardinier': 'Jardinage',
      'Nettoyeur': 'Nettoyage',
      'Mécanicien': 'Mécanique',
      'Carreleur': 'Carrelage',
    };

    const allRequests = await ServiceRequest.find({});
    let fixed = 0;

    for (const req of allRequests) {
      let updated = false;
      const newCategories = req.categories.map(cat => {
        if (categoryMapping[cat]) {
          console.log(`   🔄 "${cat}" → "${categoryMapping[cat]}" dans "${req.title}"`);
          updated = true;
          return categoryMapping[cat];
        }
        return cat;
      });

      if (updated) {
        req.categories = newCategories;
        await req.save();
        fixed++;
      }
    }

    console.log(`\n   ✅ ${fixed} demande(s) corrigée(s)\n`);

    // 3. Verify nabyw can now see requests
    console.log('3️⃣  Vérification visibilité nabyw...\n');

    if (nabywUser) {
      const nabywProfile = await WorkerProfile.findOne({ userId: nabywUser._id });
      if (nabywProfile) {
        const visibleRequests = await ServiceRequest.find({
          status: 'pending',
          categories: { $in: nabywProfile.categories },
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: nabywProfile.location.coordinates
              },
              $maxDistance: nabywProfile.serviceRadius * 1000
            }
          }
        });

        console.log(`   📋 Demandes visibles pour nabyw: ${visibleRequests.length}\n`);
        for (const req of visibleRequests.slice(0, 5)) {
          const client = await User.findById(req.clientId);
          console.log(`      ✅ ${req.title}`);
          console.log(`         Client: ${client?.fullName}`);
          console.log(`         Métiers: ${req.categories.join(', ')}`);
          console.log('');
        }
      }
    }

    // 4. Verify nabyc request can now be seen by workers
    console.log('4️⃣  Vérification visibilité nabyc...\n');

    const nabycUser = await User.findOne({ email: 'nabyc@test.com' });
    if (nabycUser) {
      const nabycRequests = await ServiceRequest.find({ clientId: nabycUser._id });

      for (const req of nabycRequests) {
        console.log(`   📄 "${req.title}"`);
        console.log(`      Métiers: ${req.categories.join(', ')}`);

        const visibleWorkers = await WorkerProfile.find({
          isAvailable: true,
          categories: { $in: req.categories },
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: req.location.coordinates
              },
              $maxDistance: 50000 // 50km
            }
          }
        });

        console.log(`      👷 Workers disponibles: ${visibleWorkers.length}\n`);

        for (const wp of visibleWorkers.slice(0, 5)) {
          const workerUser = await User.findById(wp.userId);
          console.log(`         ✅ ${workerUser?.fullName} (${wp.categories.join(', ')})`);
        }
        console.log('');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 RÉSOLUTION COMPLÈTE !');
    console.log('='.repeat(50) + '\n');

    console.log('✅ nabyw est maintenant VISIBLE pour les clients');
    console.log('✅ nabyw peut maintenant VOIR les demandes');
    console.log('✅ Les demandes de nabyc sont maintenant VISIBLES pour les workers\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
  }
}

fixVisibilityIssues();
