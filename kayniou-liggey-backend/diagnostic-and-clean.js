const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const WorkerProfile = require('./src/models/WorkerProfile');
const ServiceRequest = require('./src/models/ServiceRequest');
const Quote = require('./src/models/Quote');
const Contract = require('./src/models/Contract');
const Worksite = require('./src/models/Worksite');
const Notification = require('./src/models/Notification');

const BENQUERIR_COORDS = {
  latitude: 32.2333,
  longitude: -7.9528
};

async function diagnosticAndClean() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Check specific users
    console.log('\n📊 === DIAGNOSTIC DES UTILISATEURS ===');
    const nabyc = await User.findOne({ email: { $regex: /nabyc/i } });
    const nabyw = await User.findOne({ email: { $regex: /nabyw/i } });

    if (nabyc) {
      console.log(`\n👤 Client nabyc trouvé: ${nabyc.email}`);
      console.log(`   ID: ${nabyc._id}`);
      console.log(`   Nom: ${nabyc.fullName}`);
      console.log(`   Type: ${nabyc.profileType}`);
    } else {
      console.log('\n❌ Client nabyc NON trouvé');
    }

    if (nabyw) {
      console.log(`\n👷 Worker nabyw trouvé: ${nabyw.email}`);
      console.log(`   ID: ${nabyw._id}`);
      console.log(`   Nom: ${nabyw.fullName}`);
      console.log(`   Type: ${nabyw.profileType}`);

      // Check worker profile
      const workerProfile = await WorkerProfile.findOne({ userId: nabyw._id });
      if (workerProfile) {
        console.log(`\n   ✅ Profil Worker existe:`);
        console.log(`      Categories: ${workerProfile.categories.join(', ')}`);
        console.log(`      Experience: ${workerProfile.experience}`);
        console.log(`      Description: ${workerProfile.description?.substring(0, 50)}...`);
        console.log(`      Location: ${workerProfile.location ? JSON.stringify(workerProfile.location.coordinates) : 'NON DÉFINIE ❌'}`);
        console.log(`      Service Radius: ${workerProfile.serviceRadius}km`);
        console.log(`      Available: ${workerProfile.isAvailable}`);
      } else {
        console.log(`\n   ❌ Profil Worker N'EXISTE PAS`);
      }
    } else {
      console.log('\n❌ Worker nabyw NON trouvé');
    }

    // 2. Check service requests from nabyc
    if (nabyc) {
      console.log('\n\n📋 === DEMANDES DE nabyc ===');
      const requests = await ServiceRequest.find({ clientId: nabyc._id });
      console.log(`   Nombre de demandes: ${requests.length}`);

      for (const req of requests) {
        console.log(`\n   📄 ${req.title}`);
        console.log(`      ID: ${req._id}`);
        console.log(`      Categories: ${req.categories.join(', ')}`);
        console.log(`      Status: ${req.status}`);
        console.log(`      Budget: ${req.estimatedBudget} FCFA`);
        console.log(`      Location: ${JSON.stringify(req.location.coordinates)}`);
        console.log(`      Created: ${req.createdAt}`);
      }
    }

    // 3. Check all worker profiles with location
    console.log('\n\n👷 === TOUS LES WORKERS AVEC LOCALISATION ===');
    const allWorkers = await WorkerProfile.find({ 'location.coordinates': { $exists: true, $ne: [] } });
    console.log(`   Total workers avec location: ${allWorkers.length}`);

    for (const profile of allWorkers) {
      const user = await User.findById(profile.userId);
      console.log(`\n   👤 ${user?.fullName || 'Unknown'} (${user?.email})`);
      console.log(`      Categories: ${profile.categories.join(', ')}`);
      console.log(`      Location: ${JSON.stringify(profile.location.coordinates)}`);
      console.log(`      Radius: ${profile.serviceRadius}km`);
      console.log(`      Available: ${profile.isAvailable}`);
    }

    // 4. Prompt for deletion
    console.log('\n\n❓ === NETTOYAGE DE LA BASE DE DONNÉES ===');
    console.log('Voulez-vous supprimer TOUTES les données de test?');
    console.log('Appuyez sur Ctrl+C pour annuler ou attendez 5 secondes pour continuer...');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🗑️  Suppression de toutes les données...');

    // Delete all data
    await Promise.all([
      Notification.deleteMany({}),
      Worksite.deleteMany({}),
      Contract.deleteMany({}),
      Quote.deleteMany({}),
      ServiceRequest.deleteMany({}),
      WorkerProfile.deleteMany({}),
      User.deleteMany({})
    ]);

    console.log('✅ Toutes les données ont été supprimées');

    // 5. Create fresh test users
    console.log('\n\n👥 === CRÉATION DES UTILISATEURS DE TEST ===');

    // Create client nabyc
    const clientUser = new User({
      email: 'nabyc@test.com',
      password: '$2a$10$YourHashedPasswordHere', // You'll need to hash this properly
      fullName: 'Naby Client',
      phoneNumber: '+221770000001',
      profileType: 'client',
      isVerified: true
    });
    await clientUser.save();
    console.log(`✅ Client créé: ${clientUser.email} (ID: ${clientUser._id})`);

    // Create worker nabyw
    const workerUser = new User({
      email: 'nabyw@test.com',
      password: '$2a$10$YourHashedPasswordHere', // You'll need to hash this properly
      fullName: 'Naby Worker',
      phoneNumber: '+221770000002',
      profileType: 'worker',
      isVerified: true
    });
    await workerUser.save();
    console.log(`✅ Worker créé: ${workerUser.email} (ID: ${workerUser._id})`);

    // Create worker profile with Benguérir location
    const workerProfile = new WorkerProfile({
      userId: workerUser._id,
      categories: ['Plomberie', 'Électricité'],
      experience: '3-5 ans',
      description: 'Professionnel expérimenté basé à Benguérir. Je propose des services de plomberie et électricité de qualité.',
      bio: 'Professionnel expérimenté basé à Benguérir',
      skills: 'Installation, Réparation, Maintenance',
      hourlyRate: 5000,
      serviceRadius: 20,
      availability: 'full_time',
      isAvailable: true,
      location: {
        type: 'Point',
        coordinates: [BENQUERIR_COORDS.longitude, BENQUERIR_COORDS.latitude] // [lng, lat]
      }
    });
    await workerProfile.save();
    console.log(`✅ Profil worker créé avec localisation Benguérir: [${BENQUERIR_COORDS.longitude}, ${BENQUERIR_COORDS.latitude}]`);

    // Create service request from client in Benguérir
    const serviceRequest = new ServiceRequest({
      clientId: clientUser._id,
      title: 'Réparation fuite d\'eau',
      description: 'J\'ai une fuite d\'eau dans ma cuisine qui nécessite une intervention urgente. La fuite se situe sous l\'évier.',
      categories: ['Plomberie'],
      estimatedBudget: 8000,
      urgency: 'high',
      preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
      address: 'Benguérir, Maroc',
      location: {
        type: 'Point',
        coordinates: [BENQUERIR_COORDS.longitude, BENQUERIR_COORDS.latitude]
      },
      status: 'pending',
      quoteCount: 0
    });
    await serviceRequest.save();
    console.log(`✅ Demande créée à Benguérir: ${serviceRequest.title} (ID: ${serviceRequest._id})`);

    // Verify visibility
    console.log('\n\n🔍 === VÉRIFICATION DE LA VISIBILITÉ ===');

    // Check if worker is visible for client
    const nearbyWorkers = await WorkerProfile.find({
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [BENQUERIR_COORDS.longitude, BENQUERIR_COORDS.latitude]
          },
          $maxDistance: 50000 // 50km
        }
      }
    });
    console.log(`\n📍 Workers visibles depuis Benguérir (rayon 50km): ${nearbyWorkers.length}`);
    for (const wp of nearbyWorkers) {
      const u = await User.findById(wp.userId);
      console.log(`   ✅ ${u.fullName} - ${wp.categories.join(', ')}`);
    }

    // Check if request is visible for worker
    const availableRequests = await ServiceRequest.find({
      status: 'pending',
      categories: { $in: workerProfile.categories },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [BENQUERIR_COORDS.longitude, BENQUERIR_COORDS.latitude]
          },
          $maxDistance: workerProfile.serviceRadius * 1000
        }
      }
    });
    console.log(`\n📋 Demandes visibles pour worker (rayon ${workerProfile.serviceRadius}km): ${availableRequests.length}`);
    for (const req of availableRequests) {
      console.log(`   ✅ ${req.title} - ${req.categories.join(', ')}`);
    }

    console.log('\n\n🎉 === TERMINÉ ===');
    console.log('Vous pouvez maintenant tester avec:');
    console.log('   Email Client: nabyc@test.com');
    console.log('   Email Worker: nabyw@test.com');
    console.log('   Password: (vous devez définir un mot de passe)');
    console.log('\nNOTE: Vous devez hasher les mots de passe. Utilisez bcrypt pour générer les hashes.');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connexion fermée');
  }
}

diagnosticAndClean();
