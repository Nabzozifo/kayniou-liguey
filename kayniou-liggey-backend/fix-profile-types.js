const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const WorkerProfile = require('./src/models/WorkerProfile');
const ServiceRequest = require('./src/models/ServiceRequest');

async function fixProfileTypes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Fix nabyw - should be worker
    console.log('🔧 Correction des profileTypes...\n');

    const nabyw = await User.findOne({ email: 'nabyw@test.com' });
    const nabyww = await User.findOne({ email: 'nabyww@test.com' });
    const nabyc = await User.findOne({ email: 'nabyc@test.com' });

    if (nabyw) {
      // Check if has worker profile
      const hasWorkerProfile = await WorkerProfile.findOne({ userId: nabyw._id });
      if (hasWorkerProfile) {
        nabyw.userType = 'worker';
        await nabyw.save();
        console.log(`✅ nabyw@test.com → userType: worker`);
      } else {
        // Check if has service requests
        const hasRequests = await ServiceRequest.findOne({ clientId: nabyw._id });
        if (hasRequests) {
          nabyw.profileType = 'client';
          await nabyw.save();
          console.log(`✅ nabyw@test.com → profileType: client`);
        } else {
          console.log(`⚠️  nabyw@test.com → Pas de profil, impossible de déterminer le type`);
        }
      }
    }

    if (nabyww) {
      const hasWorkerProfile = await WorkerProfile.findOne({ userId: nabyww._id });
      if (hasWorkerProfile) {
        nabyww.profileType = 'worker';
        await nabyww.save();
        console.log(`✅ nabyww@test.com → profileType: worker`);
      } else {
        const hasRequests = await ServiceRequest.findOne({ clientId: nabyww._id });
        if (hasRequests) {
          nabyww.profileType = 'client';
          await nabyww.save();
          console.log(`✅ nabyww@test.com → profileType: client`);
        }
      }
    }

    if (nabyc) {
      const hasRequests = await ServiceRequest.findOne({ clientId: nabyc._id });
      if (hasRequests) {
        nabyc.profileType = 'client';
        await nabyc.save();
        console.log(`✅ nabyc@test.com → profileType: client`);
      } else {
        const hasWorkerProfile = await WorkerProfile.findOne({ userId: nabyc._id });
        if (hasWorkerProfile) {
          nabyc.profileType = 'worker';
          await nabyc.save();
          console.log(`✅ nabyc@test.com → profileType: worker`);
        }
      }
    }

    // Fix all users with undefined profileType
    console.log('\n🔧 Correction de TOUS les utilisateurs...\n');

    const usersWithoutType = await User.find({
      $or: [
        { profileType: { $exists: false } },
        { profileType: null },
        { profileType: undefined },
        { profileType: '' }
      ]
    });

    console.log(`📊 ${usersWithoutType.length} utilisateurs sans profileType trouvés\n`);

    for (const user of usersWithoutType) {
      // Check for worker profile
      const workerProfile = await WorkerProfile.findOne({ userId: user._id });
      if (workerProfile) {
        user.profileType = 'worker';
        await user.save();
        console.log(`✅ ${user.fullName} (${user.email}) → worker`);
        continue;
      }

      // Check for service requests
      const serviceRequests = await ServiceRequest.findOne({ clientId: user._id });
      if (serviceRequests) {
        user.profileType = 'client';
        await user.save();
        console.log(`✅ ${user.fullName} (${user.email}) → client`);
        continue;
      }

      console.log(`⚠️  ${user.fullName} (${user.email}) → Aucune activité détectée, défini comme 'client' par défaut`);
      user.profileType = 'client';
      await user.save();
    }

    // Verify nabyw has location
    console.log('\n\n📍 Vérification des localisations...\n');

    const workerUsers = await User.find({ profileType: 'worker' });
    for (const user of workerUsers) {
      const profile = await WorkerProfile.findOne({ userId: user._id });
      if (profile) {
        if (!profile.location || !profile.location.coordinates || profile.location.coordinates.length === 0) {
          console.log(`❌ ${user.fullName} (${user.email}) → PAS DE LOCALISATION`);
        } else {
          console.log(`✅ ${user.fullName} (${user.email}) → Location: [${profile.location.coordinates[0]}, ${profile.location.coordinates[1]}]`);
        }
      } else {
        console.log(`❌ ${user.fullName} (${user.email}) → PAS DE PROFIL WORKER`);
      }
    }

    // Test visibility for nabyc and nabyw
    console.log('\n\n🔍 Test de visibilité...\n');

    const nabywUser = await User.findOne({ email: 'nabyw@test.com' });
    const nabycUser = await User.findOne({ email: 'nabyc@test.com' });

    if (nabywUser && nabywUser.profileType === 'worker') {
      const nabywProfile = await WorkerProfile.findOne({ userId: nabywUser._id });
      if (nabywProfile && nabywProfile.location && nabywProfile.location.coordinates.length > 0) {
        console.log(`✅ Worker nabyw a une localisation: [${nabywProfile.location.coordinates[0]}, ${nabywProfile.location.coordinates[1]}]`);

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

        console.log(`   📋 Demandes visibles pour nabyw (rayon ${nabywProfile.serviceRadius}km): ${visibleRequests.length}`);
        for (const req of visibleRequests.slice(0, 5)) {
          const client = await User.findById(req.clientId);
          console.log(`      - ${req.title} (client: ${client?.fullName})`);
        }
      } else {
        console.log(`❌ Worker nabyw N'A PAS de localisation`);
      }
    }

    if (nabycUser && nabycUser.profileType === 'client') {
      const nabycRequests = await ServiceRequest.find({ clientId: nabycUser._id });
      console.log(`\n✅ Client nabyc a ${nabycRequests.length} demande(s)`);

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
        }).limit(5);

        console.log(`      👷 Workers disponibles: ${visibleWorkers.length}`);
        for (const wp of visibleWorkers) {
          const workerUser = await User.findById(wp.userId);
          console.log(`         - ${workerUser?.fullName} (${wp.categories.join(', ')})`);
        }
      }
    }

    console.log('\n✅ Terminé!');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
  }
}

fixProfileTypes();
