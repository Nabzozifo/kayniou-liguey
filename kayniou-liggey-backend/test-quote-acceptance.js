const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/kayniou-liggey';

// Import all models
const User = require('./src/models/User');
const Worksite = require('./src/models/Worksite');
const Contract = require('./src/models/Contract');
const Quote = require('./src/models/Quote');
const ServiceRequest = require('./src/models/ServiceRequest');
const WorksiteActivity = require('./src/models/WorksiteActivity');
const Notification = require('./src/models/Notification');

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('\n🧪 Test d\'acceptation de devis...\n');

  try {
    // Trouver un devis pending
    const quote = await Quote.findOne({ status: 'pending' })
      .populate('requestId')
      .populate('workerId', 'fullName email phoneNumber photoURL');

    if (!quote) {
      console.log('❌ Aucun devis pending trouvé pour tester');
      process.exit(0);
    }

    console.log(`✅ Devis trouvé: ${quote._id}`);
    console.log(`   Titre: ${quote.requestId.title}`);
    console.log(`   Worker: ${quote.workerId.fullName}`);
    console.log(`   Prix: ${quote.price} FCFA`);

    // Étape 1: Accepter le devis
    console.log('\n📝 Étape 1: Mise à jour du statut du devis...');
    quote.status = 'accepted';
    await quote.save();
    console.log('✅ Devis accepté');

    // Étape 2: Refuser les autres devis
    console.log('\n📝 Étape 2: Refus des autres devis...');
    const rejectedCount = await Quote.updateMany(
      { requestId: quote.requestId._id, _id: { $ne: quote._id } },
      { status: 'rejected' }
    );
    console.log(`✅ ${rejectedCount.modifiedCount} autre(s) devis refusé(s)`);

    // Étape 3: Mettre à jour la ServiceRequest
    console.log('\n📝 Étape 3: Mise à jour de la demande de service...');
    const serviceRequest = await ServiceRequest.findById(quote.requestId._id);
    serviceRequest.status = 'assigned';
    serviceRequest.assignedWorkerId = quote.workerId;
    serviceRequest.acceptedQuoteId = quote._id;
    await serviceRequest.save();
    console.log('✅ ServiceRequest mise à jour');

    // Étape 4: Créer le contrat
    console.log('\n📝 Étape 4: Création du contrat...');
    const contract = await Contract.create({
      requestId: quote.requestId._id,
      quoteId: quote._id,
      clientId: quote.requestId.clientId,
      workerId: quote.workerId,
      agreedPrice: quote.price,
      estimatedDuration: quote.estimatedDuration,
      status: 'active',
    });
    console.log(`✅ Contrat créé: ${contract._id}`);

    // Étape 5: Récupérer les infos client/worker
    console.log('\n📝 Étape 5: Récupération des infos utilisateurs...');
    const client = await User.findById(quote.requestId.clientId);
    const worker = await User.findById(quote.workerId);
    console.log(`✅ Client: ${client.fullName}`);
    console.log(`✅ Worker: ${worker.fullName}`);

    // Étape 6: Créer le chantier
    console.log('\n📝 Étape 6: Création du chantier...');
    const worksite = await Worksite.create({
      contractId: contract._id,
      requestId: quote.requestId._id,
      quoteId: quote._id,
      clientId: quote.requestId.clientId,
      workerId: quote.workerId,
      title: quote.requestId.title,
      description: quote.requestId.description,
      category: quote.requestId.categories?.[0] || 'General',
      agreedPrice: quote.price,
      estimatedDuration: quote.estimatedDuration,
      location: quote.requestId.location,
      deadline: quote.requestId.preferredDate,
      servicesIncluded: quote.servicesIncluded || [],
      additionalNotes: quote.additionalNotes || '',
      clientInfo: {
        name: client?.fullName || '',
        phone: client?.phoneNumber || '',
        email: client?.email || '',
        photoURL: client?.photoURL || '',
      },
      workerInfo: {
        name: worker?.fullName || '',
        phone: worker?.phoneNumber || '',
        email: worker?.email || '',
        photoURL: worker?.photoURL || '',
      },
      status: 'pending',
    });
    console.log(`✅ Chantier créé: ${worksite._id}`);

    // Étape 7: Créer l'activité
    console.log('\n📝 Étape 7: Création de l\'activité...');
    const activity = await WorksiteActivity.create({
      worksiteId: worksite._id,
      type: 'created',
      actorId: client._id,
      actorType: 'client',
      actorName: client?.fullName || 'Client',
      description: 'Chantier créé suite à l\'acceptation du devis',
      metadata: {
        quoteId: quote._id,
        contractId: contract._id,
        price: quote.price,
      },
    });
    console.log(`✅ Activité créée: ${activity._id}`);

    // Étape 8: Créer la notification
    console.log('\n📝 Étape 8: Création de la notification...');
    const notification = await Notification.create({
      userId: quote.workerId,
      type: 'quote_accepted',
      title: 'Devis accepté !',
      message: `Votre devis pour "${quote.requestId.title}" a été accepté par le client.`,
      relatedResource: {
        type: 'worksite',
        id: worksite._id,
      },
      actionData: {
        screen: 'WorksiteDetails',
        params: { worksiteId: worksite._id },
      },
      priority: 'high',
    });
    console.log(`✅ Notification créée: ${notification._id}`);

    console.log('\n🎉 TEST RÉUSSI ! Tous les éléments ont été créés avec succès.');
    console.log('\n📋 Résumé:');
    console.log(`   - Devis accepté: ${quote._id}`);
    console.log(`   - Contrat créé: ${contract._id}`);
    console.log(`   - Chantier créé: ${worksite._id}`);
    console.log(`   - Notification envoyée au worker`);

  } catch (error) {
    console.error('\n❌ ERREUR lors du test:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }

  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur de connexion:', err);
  process.exit(1);
});
