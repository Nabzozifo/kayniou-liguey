const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const WorkerProfile = require('./src/models/WorkerProfile');
const ServiceRequest = require('./src/models/ServiceRequest');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Find nabyc and nabyw
    console.log('🔍 Recherche des utilisateurs nabyc et nabyw...\n');

    const users = await User.find({
      $or: [
        { email: { $regex: /nabyc/i } },
        { email: { $regex: /nabyw/i } },
        { fullName: { $regex: /nabyc/i } },
        { fullName: { $regex: /nabyw/i } }
      ]
    });

    console.log(`📊 ${users.length} utilisateur(s) trouvé(s)\n`);

    for (const user of users) {
      console.log(`👤 ${user.fullName} (${user.email})`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Type: ${user.profileType}`);
      console.log(`   Téléphone: ${user.phoneNumber}`);
      console.log(`   Vérifié: ${user.isVerified}`);

      if (user.profileType === 'worker') {
        const profile = await WorkerProfile.findOne({ userId: user._id });
        if (profile) {
          console.log(`   ✅ Profil Worker:`);
          console.log(`      - Métiers: ${profile.categories.join(', ')}`);
          console.log(`      - Expérience: ${profile.experience}`);
          console.log(`      - Location: ${profile.location ? `[${profile.location.coordinates[0]}, ${profile.location.coordinates[1]}]` : '❌ NON DÉFINIE'}`);
          console.log(`      - Rayon: ${profile.serviceRadius}km`);
          console.log(`      - Disponible: ${profile.isAvailable}`);
        } else {
          console.log(`   ❌ Profil Worker MANQUANT`);
        }
      }

      if (user.profileType === 'client') {
        const requests = await ServiceRequest.find({ clientId: user._id });
        console.log(`   📋 ${requests.length} demande(s)`);
        for (const req of requests) {
          console.log(`      - ${req.title}`);
          console.log(`        Métiers: ${req.categories.join(', ')}`);
          console.log(`        Location: [${req.location.coordinates[0]}, ${req.location.coordinates[1]}]`);
          console.log(`        Status: ${req.status}`);
        }
      }

      console.log('');
    }

    // Check all workers with location
    console.log('\n📍 Tous les workers avec localisation:');
    const workersWithLocation = await WorkerProfile.find({
      'location.coordinates': { $exists: true, $ne: [] }
    }).populate('userId', 'fullName email');

    console.log(`   Total: ${workersWithLocation.length}\n`);
    for (const profile of workersWithLocation) {
      console.log(`   👷 ${profile.userId?.fullName || 'Unknown'} (${profile.userId?.email})`);
      console.log(`      Location: [${profile.location.coordinates[0]}, ${profile.location.coordinates[1]}]`);
      console.log(`      Métiers: ${profile.categories.join(', ')}`);
      console.log(`      Rayon: ${profile.serviceRadius}km`);
      console.log('');
    }

    // Check all pending requests
    console.log('\n📋 Toutes les demandes en attente:');
    const pendingRequests = await ServiceRequest.find({ status: 'pending' });
    console.log(`   Total: ${pendingRequests.length}\n`);

    for (const req of pendingRequests) {
      const client = await User.findById(req.clientId);
      console.log(`   📄 ${req.title}`);
      console.log(`      Client: ${client?.fullName}`);
      console.log(`      Métiers: ${req.categories.join(', ')}`);
      console.log(`      Location: [${req.location.coordinates[0]}, ${req.location.coordinates[1]}]`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkUsers();
