const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/kayniou-liggey';

// Import all models
const User = require('./src/models/User');
const Worksite = require('./src/models/Worksite');
const Contract = require('./src/models/Contract');
const Quote = require('./src/models/Quote');
const ServiceRequest = require('./src/models/ServiceRequest');

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('\n🔍 Vérification des chantiers et contrats...\n');

  // Trouver les devis acceptés
  const acceptedQuotes = await Quote.find({ status: 'accepted' })
    .populate('workerId', 'fullName email')
    .populate('requestId', 'title clientId')
    .sort('-updatedAt')
    .limit(5);

  console.log('📋 Devis acceptés récents:', acceptedQuotes.length);

  for (const quote of acceptedQuotes) {
    console.log(`\n✅ Devis accepté: ${quote._id}`);
    console.log(`   Titre: ${quote.requestId?.title}`);
    console.log(`   Worker: ${quote.workerId?.fullName}`);
    console.log(`   Date: ${quote.updatedAt}`);

    // Chercher le contrat
    const contract = await Contract.findOne({ quoteId: quote._id });
    if (contract) {
      console.log(`   ✅ Contrat trouvé: ${contract._id}`);
    } else {
      console.log(`   ❌ AUCUN contrat trouvé`);
    }

    // Chercher le chantier
    const worksite = await Worksite.findOne({ quoteId: quote._id });
    if (worksite) {
      console.log(`   ✅ Chantier trouvé: ${worksite._id}`);
      console.log(`      Status: ${worksite.status}`);
    } else {
      console.log(`   ❌ AUCUN chantier trouvé`);
    }
  }

  // Compter tous les chantiers
  const totalWorksites = await Worksite.countDocuments();
  const totalContracts = await Contract.countDocuments();
  const totalAcceptedQuotes = await Quote.countDocuments({ status: 'accepted' });

  console.log(`\n📊 Total devis acceptés: ${totalAcceptedQuotes}`);
  console.log(`📊 Total contrats: ${totalContracts}`);
  console.log(`📊 Total chantiers: ${totalWorksites}`);

  // Lister tous les chantiers
  if (totalWorksites > 0) {
    console.log('\n📋 Liste de tous les chantiers:\n');
    const allWorksites = await Worksite.find()
      .populate('clientId', 'fullName')
      .populate('workerId', 'fullName')
      .sort('-createdAt');

    for (const ws of allWorksites) {
      console.log(`   🏗️  ${ws._id}`);
      console.log(`      Titre: ${ws.title}`);
      console.log(`      Client: ${ws.clientId?.fullName || ws.clientInfo?.name}`);
      console.log(`      Worker: ${ws.workerId?.fullName || ws.workerInfo?.name}`);
      console.log(`      Status: ${ws.status}`);
      console.log(`      Créé: ${ws.createdAt}`);
      console.log('');
    }
  }

  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
