const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const WorkerProfile = require('./src/models/WorkerProfile');
const ServiceRequest = require('./src/models/ServiceRequest');

async function fixUserTypes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Fix all users with undefined or missing userType
    console.log('🔧 Correction des userTypes...\n');

    const usersWithoutType = await User.find({
      $or: [
        { userType: { $exists: false } },
        { userType: null },
        { userType: '' }
      ]
    });

    console.log(`📊 ${usersWithoutType.length} utilisateurs sans userType trouvés\n`);

    for (const user of usersWithoutType) {
      // Check for worker profile
      const workerProfile = await WorkerProfile.findOne({ userId: user._id });
      if (workerProfile) {
        user.userType = 'worker';
        await user.save();
        console.log(`✅ ${user.fullName} (${user.email}) → worker`);
        continue;
      }

      // Check for service requests
      const serviceRequests = await ServiceRequest.findOne({ clientId: user._id });
      if (serviceRequests) {
        user.userType = 'client';
        await user.save();
        console.log(`✅ ${user.fullName} (${user.email}) → client`);
        continue;
      }

      console.log(`⚠️  ${user.fullName} (${user.email}) → Aucune activité détectée, défini comme 'client' par défaut`);
      user.userType = 'client';
      await user.save();
    }

    // Verify nabyw has location
    console.log('\n\n📍 Vérification des localisations...\n');

    const workerUsers = await User.find({ userType: 'worker' });
    let workersWithLocation = 0;
    let workersWithoutLocation = 0;

    for (const user of workerUsers) {
      const profile = await WorkerProfile.findOne({ userId: user._id });
      if (profile) {
        if (!profile.location || !profile.location.coordinates || profile.location.coordinates.length === 0) {
          console.log(`❌ ${user.fullName} (${user.email}) → PAS DE LOCALISATION`);
          workersWithoutLocation++;
        } else {
          console.log(`✅ ${user.fullName} (${user.email}) → Location: [${profile.location.coordinates[0]}, ${profile.location.coordinates[1]}]`);
          workersWithLocation++;
        }
      } else {
        console.log(`❌ ${user.fullName} (${user.email}) → PAS DE PROFIL WORKER`);
        workersWithoutLocation++;
      }
    }

    console.log(`\n📊 Résumé: ${workersWithLocation} avec location, ${workersWithoutLocation} sans location\n`);

    // Test visibility for nabyc and nabyw
    console.log('\n🔍 Test de visibilité nabyc ↔ nabyw...\n');

    const nabywUser = await User.findOne({ email: 'nabyw@test.com' });
    const nabycUser = await User.findOne({ email: 'nabyc@test.com' });

    if (nabywUser && nabywUser.userType === 'worker') {
      const nabywProfile = await WorkerProfile.findOne({ userId: nabywUser._id });
      if (nabywProfile && nabywProfile.location && nabywProfile.location.coordinates.length > 0) {
        console.log(`✅ Worker nabyw:`);
        console.log(`   Email: ${nabywUser.email}`);
        console.log(`   Location: [${nabywProfile.location.coordinates[0]}, ${nabywProfile.location.coordinates[1]}]`);
        console.log(`   Métiers: ${nabywProfile.categories.join(', ')}`);
        console.log(`   Rayon: ${nabywProfile.serviceRadius}km`);
        console.log(`   Disponible: ${nabywProfile.isAvailable}`);

        // Find requests visible to this worker
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

        console.log(`\n   📋 Demandes visibles: ${visibleRequests.length}`);
        for (const req of visibleRequests.slice(0, 10)) {
          const client = await User.findById(req.clientId);
          const distance = calculateDistance(
            nabywProfile.location.coordinates[1], nabywProfile.location.coordinates[0],
            req.location.coordinates[1], req.location.coordinates[0]
          );
          console.log(`      - ${req.title} (client: ${client?.fullName}, distance: ${distance.toFixed(2)}km)`);
        }
      } else {
        console.log(`❌ Worker nabyw N'A PAS de localisation`);
      }
    } else {
      console.log(`❌ nabyw n'est pas un worker ou n'existe pas`);
    }

    if (nabycUser && nabycUser.userType === 'client') {
      const nabycRequests = await ServiceRequest.find({ clientId: nabycUser._id });
      console.log(`\n✅ Client nabyc:`);
      console.log(`   Email: ${nabycUser.email}`);
      console.log(`   Demandes: ${nabycRequests.length}\n`);

      for (const req of nabycRequests) {
        console.log(`   📄 ${req.title}`);
        console.log(`      Location: [${req.location.coordinates[0]}, ${req.location.coordinates[1]}]`);
        console.log(`      Métiers: ${req.categories.join(', ')}`);

        // Find workers visible for this request
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
        }).limit(10);

        console.log(`      👷 Workers disponibles: ${visibleWorkers.length}`);
        for (const wp of visibleWorkers) {
          const workerUser = await User.findById(wp.userId);
          const distance = calculateDistance(
            req.location.coordinates[1], req.location.coordinates[0],
            wp.location.coordinates[1], wp.location.coordinates[0]
          );
          console.log(`         - ${workerUser?.fullName} (${wp.categories.join(', ')}, distance: ${distance.toFixed(2)}km)`);
        }
        console.log('');
      }
    } else {
      console.log(`❌ nabyc n'est pas un client ou n'existe pas`);
    }

    console.log('\n✅ Terminé!');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

fixUserTypes();
