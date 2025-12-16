const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const ClientProfile = require('../models/ClientProfile');
const ServiceRequest = require('../models/ServiceRequest');
const Quote = require('../models/Quote');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kayniou-liggey');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Début du seed de la base de données...\n');

    // Nettoyer la base de données
    await User.deleteMany({});
    await WorkerProfile.deleteMany({});
    await ClientProfile.deleteMany({});
    await ServiceRequest.deleteMany({});
    await Quote.deleteMany({});
    console.log('✅ Base de données nettoyée\n');

    // Créer des utilisateurs clients
    const clientUsers = [
      {
        email: 'client1@test.com',
        password: 'password123',
        fullName: 'Amadou Diallo',
        phoneNumber: '+221771234567',
        userType: 'client',
      },
      {
        email: 'client2@test.com',
        password: 'password123',
        fullName: 'Fatou Sall',
        phoneNumber: '+221772345678',
        userType: 'client',
      },
      {
        email: 'client3@test.com',
        password: 'password123',
        fullName: 'Moussa Gueye',
        phoneNumber: '+221773456789',
        userType: 'client',
      },
      {
        email: 'client4@test.com',
        password: 'password123',
        fullName: 'Aissatou Cissé',
        phoneNumber: '+221774567890',
        userType: 'client',
      },
      {
        email: 'client5@test.com',
        password: 'password123',
        fullName: 'Seydou Niang',
        phoneNumber: '+221775678901',
        userType: 'client',
      },
    ];

    const createdClients = await User.create(clientUsers);
    console.log(`✅ ${createdClients.length} clients créés\n`);

    // Créer des profils clients
    for (const client of createdClients) {
      await ClientProfile.create({
        userId: client._id,
        city: 'Dakar',
        country: 'Senegal',
      });
    }
    console.log('✅ Profils clients créés\n');

    // Créer des utilisateurs workers
    const workerUsers = [
      {
        email: 'plombier1@test.com',
        password: 'password123',
        fullName: 'Mamadou Ba',
        phoneNumber: '+221773456789',
        userType: 'worker',
      },
      {
        email: 'electricien1@test.com',
        password: 'password123',
        fullName: 'Ibrahima Ndiaye',
        phoneNumber: '+221774567890',
        userType: 'worker',
      },
      {
        email: 'menuisier1@test.com',
        password: 'password123',
        fullName: 'Ousmane Sarr',
        phoneNumber: '+221775678901',
        userType: 'worker',
      },
      {
        email: 'maçon1@test.com',
        password: 'password123',
        fullName: 'Cheikh Fall',
        phoneNumber: '+221776789012',
        userType: 'worker',
      },
      {
        email: 'peintre1@test.com',
        password: 'password123',
        fullName: 'Moussa Diop',
        phoneNumber: '+221777890123',
        userType: 'worker',
      },
      {
        email: 'jardinier1@test.com',
        password: 'password123',
        fullName: 'Abdoulaye Thiam',
        phoneNumber: '+221778901234',
        userType: 'worker',
      },
      {
        email: 'nettoyage1@test.com',
        password: 'password123',
        fullName: 'Mariama Diagne',
        phoneNumber: '+221779012345',
        userType: 'worker',
      },
      {
        email: 'carreleur1@test.com',
        password: 'password123',
        fullName: 'Lamine Sy',
        phoneNumber: '+221770123456',
        userType: 'worker',
      },
      {
        email: 'plombier2@test.com',
        password: 'password123',
        fullName: 'Babacar Sow',
        phoneNumber: '+221771345679',
        userType: 'worker',
      },
      {
        email: 'electricien2@test.com',
        password: 'password123',
        fullName: 'Pape Kane',
        phoneNumber: '+221772456780',
        userType: 'worker',
      },
    ];

    const createdWorkers = await User.create(workerUsers);
    console.log(`✅ ${createdWorkers.length} workers créés\n`);

    // Créer des profils workers avec localisations à Benguerir, Maroc
    const workerProfiles = [
      {
        userId: createdWorkers[0]._id,
        bio: 'Plombier professionnel avec 10 ans d\'expérience. Interventions rapides et garanties.',
        categories: ['Plomberie'],
        skills: [
          { name: 'Réparation de fuites', level: 'expert' },
          { name: 'Installation sanitaire', level: 'expert' },
          { name: 'Débouchage', level: 'intermediate' },
        ],
        hourlyRate: 5000,
        serviceRadius: 15,
        rating: 4.5,
        totalReviews: 23,
        completedJobs: 45,
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [-7.9500, 32.2350], // Benguerir centre
        },
      },
      {
        userId: createdWorkers[1]._id,
        bio: 'Électricien certifié. Installation et dépannage électrique.',
        categories: ['Électricité'],
        skills: [
          { name: 'Installation électrique', level: 'expert' },
          { name: 'Dépannage', level: 'expert' },
          { name: 'Mise aux normes', level: 'expert' },
        ],
        hourlyRate: 6000,
        serviceRadius: 20,
        rating: 4.8,
        totalReviews: 34,
        completedJobs: 67,
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [-7.9450, 32.2380], // Quartier Université
        },
      },
      {
        userId: createdWorkers[2]._id,
        bio: 'Menuisier artisan. Fabrication et réparation de meubles sur mesure.',
        categories: ['Menuiserie'],
        skills: [
          { name: 'Fabrication meubles', level: 'expert' },
          { name: 'Réparation', level: 'intermediate' },
          { name: 'Installation', level: 'expert' },
        ],
        hourlyRate: 4500,
        serviceRadius: 10,
        rating: 4.3,
        totalReviews: 18,
        completedJobs: 32,
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [-7.9550, 32.2320], // Quartier Médina
        },
      },
      {
        userId: createdWorkers[3]._id,
        bio: 'Maçon expérimenté. Construction et rénovation.',
        categories: ['Maçonnerie'],
        skills: [
          { name: 'Construction', level: 'expert' },
          { name: 'Rénovation', level: 'expert' },
          { name: 'Carrelage', level: 'intermediate' },
        ],
        hourlyRate: 7000,
        serviceRadius: 25,
        rating: 4.6,
        totalReviews: 41,
        completedJobs: 89,
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [-7.9480, 32.2400], // Zone Industrielle
        },
      },
      {
        userId: createdWorkers[4]._id,
        bio: 'Peintre professionnel. Peinture intérieure et extérieure.',
        categories: ['Peinture'],
        skills: [
          { name: 'Peinture intérieure', level: 'expert' },
          { name: 'Peinture extérieure', level: 'expert' },
          { name: 'Décoration', level: 'intermediate' },
        ],
        hourlyRate: 4000,
        serviceRadius: 12,
        rating: 4.4,
        totalReviews: 27,
        completedJobs: 53,
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [-7.9520, 32.2330], // Centre-ville
        },
      },
      {
        userId: createdWorkers[5]._id,
        bio: 'Jardinier paysagiste. Entretien d\'espaces verts et création de jardins.',
        categories: ['Jardinage'],
        skills: [
          { name: 'Taille de haies', level: 'expert' },
          { name: 'Plantation', level: 'expert' },
          { name: 'Entretien pelouse', level: 'expert' },
          { name: 'Aménagement paysager', level: 'intermediate' },
        ],
        hourlyRate: 3500,
        serviceRadius: 18,
        rating: 4.7,
        totalReviews: 31,
        completedJobs: 58,
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [-7.9420, 32.2370], // Quartier Résidentiel
        },
      },
      {
        userId: createdWorkers[6]._id,
        bio: 'Agent de nettoyage professionnel. Nettoyage résidentiel et bureaux.',
        categories: ['Nettoyage'],
        skills: [
          { name: 'Nettoyage résidentiel', level: 'expert' },
          { name: 'Nettoyage de bureaux', level: 'expert' },
          { name: 'Nettoyage après travaux', level: 'intermediate' },
        ],
        hourlyRate: 3000,
        serviceRadius: 20,
        rating: 4.9,
        totalReviews: 56,
        completedJobs: 112,
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [-7.9470, 32.2360], // Hay Mohammadi
        },
      },
      {
        userId: createdWorkers[7]._id,
        bio: 'Carreleur expert. Pose et rénovation de carrelage.',
        categories: ['Maçonnerie'],
        skills: [
          { name: 'Pose de carrelage', level: 'expert' },
          { name: 'Rénovation carrelage', level: 'expert' },
          { name: 'Faïence salle de bain', level: 'expert' },
        ],
        hourlyRate: 5500,
        serviceRadius: 15,
        rating: 4.6,
        totalReviews: 29,
        completedJobs: 64,
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [-7.9530, 32.2340], // Quartier Commercial
        },
      },
      {
        userId: createdWorkers[8]._id,
        bio: 'Plombier sanitaire. Spécialiste en installation de chauffe-eau et climatisation.',
        categories: ['Plomberie'],
        skills: [
          { name: 'Installation chauffe-eau', level: 'expert' },
          { name: 'Climatisation', level: 'intermediate' },
          { name: 'Réparation robinetterie', level: 'expert' },
        ],
        hourlyRate: 5500,
        serviceRadius: 12,
        rating: 4.2,
        totalReviews: 15,
        completedJobs: 28,
        isAvailable: false,
        location: {
          type: 'Point',
          coordinates: [-7.9510, 32.2310], // Hay Salam
        },
      },
      {
        userId: createdWorkers[9]._id,
        bio: 'Électricien domotique. Installation systèmes électriques modernes.',
        categories: ['Électricité'],
        skills: [
          { name: 'Domotique', level: 'expert' },
          { name: 'Panneaux solaires', level: 'intermediate' },
          { name: 'Installation électrique', level: 'expert' },
        ],
        hourlyRate: 8000,
        serviceRadius: 25,
        rating: 5.0,
        totalReviews: 12,
        completedJobs: 19,
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [-7.9440, 32.2390], // UM6P Campus
        },
      },
    ];

    await WorkerProfile.create(workerProfiles);
    console.log('✅ Profils workers créés avec localisations\n');

    // Créer des demandes de service
    const serviceRequests = [
      {
        clientId: createdClients[0]._id,
        clientName: createdClients[0].fullName,
        title: 'Réparation de fuite d\'eau',
        description: 'Fuite d\'eau au niveau de la cuisine. Besoin d\'intervention rapide.',
        categories: ['Plomberie'],
        mode: 'direct',
        status: 'pending',
        urgency: 'high',
        location: {
          type: 'Point',
          coordinates: [-7.9500, 32.2350],
          address: 'Centre-ville, Benguerir',
        },
        estimatedBudget: 25000,
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[1]._id,
        clientName: createdClients[1].fullName,
        title: 'Installation électrique',
        description: 'Besoin d\'installer des prises électriques supplémentaires dans 3 pièces.',
        categories: ['Électricité'],
        mode: 'auction',
        status: 'pending',
        urgency: 'medium',
        location: {
          type: 'Point',
          coordinates: [-7.9450, 32.2380],
          address: 'Quartier Université, Benguerir',
        },
        estimatedBudget: 50000,
        preferredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[0]._id,
        clientName: createdClients[0].fullName,
        title: 'Fabrication de placard',
        description: 'Besoin d\'un placard sur mesure pour la chambre (2m x 2.5m).',
        categories: ['Menuiserie'],
        mode: 'auction',
        status: 'pending',
        urgency: 'low',
        location: {
          type: 'Point',
          coordinates: [-7.9550, 32.2320],
          address: 'Quartier Médina, Benguerir',
        },
        estimatedBudget: 150000,
        preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[2]._id,
        clientName: createdClients[2].fullName,
        title: 'Entretien jardin',
        description: 'Taille des haies, tonte de pelouse et plantation de fleurs.',
        categories: ['Jardinage'],
        mode: 'auction',
        status: 'pending',
        urgency: 'low',
        location: {
          type: 'Point',
          coordinates: [-7.9420, 32.2370],
          address: 'Quartier Résidentiel, Benguerir',
        },
        estimatedBudget: 40000,
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[3]._id,
        clientName: createdClients[3].fullName,
        title: 'Nettoyage après déménagement',
        description: 'Nettoyage complet d\'un appartement de 4 pièces après déménagement.',
        categories: ['Nettoyage'],
        mode: 'direct',
        status: 'pending',
        urgency: 'high',
        location: {
          type: 'Point',
          coordinates: [-7.9470, 32.2360],
          address: 'Hay Mohammadi, Benguerir',
        },
        estimatedBudget: 35000,
        preferredDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[1]._id,
        clientName: createdClients[1].fullName,
        title: 'Pose de carrelage salle de bain',
        description: 'Pose de carrelage mural et sol pour salle de bain (12m²).',
        categories: ['Maçonnerie'],
        mode: 'auction',
        status: 'pending',
        urgency: 'medium',
        location: {
          type: 'Point',
          coordinates: [-7.9530, 32.2340],
          address: 'Quartier Commercial, Benguerir',
        },
        estimatedBudget: 180000,
        preferredDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[4]._id,
        clientName: createdClients[4].fullName,
        title: 'Peinture salon et chambres',
        description: 'Peinture complète de 3 chambres et 1 salon (environ 80m²).',
        categories: ['Peinture'],
        mode: 'auction',
        status: 'pending',
        urgency: 'low',
        location: {
          type: 'Point',
          coordinates: [-7.9510, 32.2310],
          address: 'Hay Salam, Benguerir',
        },
        estimatedBudget: 120000,
        preferredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[2]._id,
        clientName: createdClients[2].fullName,
        title: 'Installation climatisation',
        description: 'Installation de 2 climatiseurs split dans les chambres.',
        categories: ['Plomberie'],
        mode: 'direct',
        status: 'pending',
        urgency: 'high',
        location: {
          type: 'Point',
          coordinates: [-7.9440, 32.2390],
          address: 'UM6P Campus, Benguerir',
        },
        estimatedBudget: 200000,
        preferredDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[0]._id,
        clientName: createdClients[0].fullName,
        title: 'Installation panneaux solaires',
        description: 'Installation système solaire pour alimentation partielle de la maison.',
        categories: ['Électricité'],
        mode: 'auction',
        status: 'pending',
        urgency: 'medium',
        location: {
          type: 'Point',
          coordinates: [-7.9480, 32.2400],
          address: 'Zone Industrielle, Benguerir',
        },
        estimatedBudget: 500000,
        preferredDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[3]._id,
        clientName: createdClients[3].fullName,
        title: 'Fabrication et installation cuisine',
        description: 'Fabrication sur mesure d\'une cuisine complète avec plan de travail.',
        categories: ['Menuiserie'],
        mode: 'auction',
        status: 'pending',
        urgency: 'medium',
        location: {
          type: 'Point',
          coordinates: [-7.9550, 32.2320],
          address: 'Quartier Médina, Benguerir',
        },
        estimatedBudget: 350000,
        preferredDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[4]._id,
        clientName: createdClients[4].fullName,
        title: 'Construction mur de clôture',
        description: 'Construction d\'un mur de clôture de 25 mètres linéaires.',
        categories: ['Maçonnerie'],
        mode: 'auction',
        status: 'pending',
        urgency: 'low',
        location: {
          type: 'Point',
          coordinates: [-7.9520, 32.2330],
          address: 'Centre-ville, Benguerir',
        },
        estimatedBudget: 750000,
        preferredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[1]._id,
        clientName: createdClients[1].fullName,
        title: 'Débouchage canalisation',
        description: 'Débouchage urgent de canalisation WC bouchée.',
        categories: ['Plomberie'],
        mode: 'direct',
        status: 'pending',
        urgency: 'high',
        location: {
          type: 'Point',
          coordinates: [-7.9500, 32.2350],
          address: 'Centre-ville, Benguerir',
        },
        estimatedBudget: 15000,
        preferredDate: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[2]._id,
        clientName: createdClients[2].fullName,
        title: 'Nettoyage de bureaux hebdomadaire',
        description: 'Contrat de nettoyage hebdomadaire pour bureaux de 150m².',
        categories: ['Nettoyage'],
        mode: 'auction',
        status: 'pending',
        urgency: 'medium',
        location: {
          type: 'Point',
          coordinates: [-7.9480, 32.2400],
          address: 'Zone Industrielle, Benguerir',
        },
        estimatedBudget: 80000,
        preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[4]._id,
        clientName: createdClients[4].fullName,
        title: 'Aménagement paysager jardin',
        description: 'Création d\'un jardin avec pelouse, arbustes et système d\'arrosage.',
        categories: ['Jardinage'],
        mode: 'auction',
        status: 'pending',
        urgency: 'low',
        location: {
          type: 'Point',
          coordinates: [-7.9420, 32.2370],
          address: 'Quartier Résidentiel, Benguerir',
        },
        estimatedBudget: 280000,
        preferredDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[0]._id,
        clientName: createdClients[0].fullName,
        title: 'Réparation porte en bois',
        description: 'Réparation de gonds et ajustement d\'une porte en bois massif.',
        categories: ['Menuiserie'],
        mode: 'direct',
        status: 'pending',
        urgency: 'medium',
        location: {
          type: 'Point',
          coordinates: [-7.9500, 32.2350],
          address: 'Centre-ville, Benguerir',
        },
        estimatedBudget: 20000,
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[3]._id,
        clientName: createdClients[3].fullName,
        title: 'Installation tableau électrique',
        description: 'Remplacement ancien tableau et mise aux normes électriques.',
        categories: ['Électricité'],
        mode: 'direct',
        status: 'pending',
        urgency: 'high',
        location: {
          type: 'Point',
          coordinates: [-7.9480, 32.2400],
          address: 'Zone Industrielle, Benguerir',
        },
        estimatedBudget: 95000,
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[1]._id,
        clientName: createdClients[1].fullName,
        title: 'Peinture façade extérieure',
        description: 'Ravalement et peinture de façade d\'une maison R+1.',
        categories: ['Peinture'],
        mode: 'auction',
        status: 'pending',
        urgency: 'low',
        location: {
          type: 'Point',
          coordinates: [-7.9510, 32.2310],
          address: 'Hay Salam, Benguerir',
        },
        estimatedBudget: 220000,
        preferredDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[2]._id,
        clientName: createdClients[2].fullName,
        title: 'Rénovation salle de bain complète',
        description: 'Rénovation complète salle de bain: carrelage, plomberie, peinture.',
        categories: ['Maçonnerie', 'Plomberie', 'Peinture'],
        mode: 'auction',
        status: 'pending',
        urgency: 'medium',
        location: {
          type: 'Point',
          coordinates: [-7.9550, 32.2320],
          address: 'Quartier Médina, Benguerir',
        },
        estimatedBudget: 450000,
        preferredDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[4]._id,
        clientName: createdClients[4].fullName,
        title: 'Installation chauffe-eau solaire',
        description: 'Installation d\'un chauffe-eau solaire 200L avec accessoires.',
        categories: ['Plomberie'],
        mode: 'auction',
        status: 'pending',
        urgency: 'medium',
        location: {
          type: 'Point',
          coordinates: [-17.4270, 14.6760],
          address: 'Fann, Dakar',
        },
        estimatedBudget: 175000,
        preferredDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: createdClients[0]._id,
        clientName: createdClients[0].fullName,
        title: 'Nettoyage vitres immeuble',
        description: 'Nettoyage des vitres d\'un immeuble de 3 étages (façade complète).',
        categories: ['Nettoyage'],
        mode: 'direct',
        status: 'pending',
        urgency: 'low',
        location: {
          type: 'Point',
          coordinates: [-17.4530, 14.7010],
          address: 'Mermoz, Dakar',
        },
        estimatedBudget: 45000,
        preferredDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      },
    ];

    const createdRequests = await ServiceRequest.create(serviceRequests);
    console.log(`✅ ${createdRequests.length} demandes de service créées\n`);

    // Créer des devis pour certaines demandes
    const quotes = [
      // Quotes pour "Installation électrique" (createdRequests[1])
      {
        requestId: createdRequests[1]._id,
        workerId: createdWorkers[1]._id,
        workerName: createdWorkers[1].fullName,
        price: 48000,
        description: 'Installation de 6 prises électriques dans 3 pièces. Matériel inclus (prises, fils, disjoncteurs). Durée: 1 journée.',
        estimatedDuration: 1,
        status: 'pending',
      },
      {
        requestId: createdRequests[1]._id,
        workerId: createdWorkers[9]._id,
        workerName: createdWorkers[9].fullName,
        price: 55000,
        description: 'Installation professionnelle avec prises de qualité supérieure et test complet de l\'installation.',
        estimatedDuration: 1,
        status: 'pending',
      },
      // Quotes pour "Fabrication de placard" (createdRequests[2])
      {
        requestId: createdRequests[2]._id,
        workerId: createdWorkers[2]._id,
        workerName: createdWorkers[2].fullName,
        price: 145000,
        description: 'Placard sur mesure en bois contreplaqué avec portes coulissantes. Finition vernis. Délai: 7 jours.',
        estimatedDuration: 7,
        status: 'pending',
      },
      // Quote pour "Entretien jardin" (createdRequests[3])
      {
        requestId: createdRequests[3]._id,
        workerId: createdWorkers[5]._id,
        workerName: createdWorkers[5].fullName,
        price: 38000,
        description: 'Taille de haies, tonte pelouse, plantation de 10 plants de fleurs avec terreau. Durée: 1 jour.',
        estimatedDuration: 1,
        status: 'accepted',
      },
      // Quotes pour "Pose de carrelage salle de bain" (createdRequests[5])
      {
        requestId: createdRequests[5]._id,
        workerId: createdWorkers[7]._id,
        workerName: createdWorkers[7].fullName,
        price: 175000,
        description: 'Pose carrelage 12m² mural et sol. Fourniture de colle et joints. Carrelage non inclus. Délai: 3 jours.',
        estimatedDuration: 3,
        status: 'pending',
      },
      {
        requestId: createdRequests[5]._id,
        workerId: createdWorkers[3]._id,
        workerName: createdWorkers[3].fullName,
        price: 190000,
        description: 'Pose professionnelle avec préparation surface, étanchéité complète et garantie 2 ans.',
        estimatedDuration: 4,
        status: 'pending',
      },
      // Quotes pour "Peinture salon et chambres" (createdRequests[6])
      {
        requestId: createdRequests[6]._id,
        workerId: createdWorkers[4]._id,
        workerName: createdWorkers[4].fullName,
        price: 115000,
        description: 'Peinture 80m² avec 2 couches de peinture acrylique qualité standard. Préparation murs incluse.',
        estimatedDuration: 5,
        status: 'pending',
      },
      // Quote pour "Installation panneaux solaires" (createdRequests[8])
      {
        requestId: createdRequests[8]._id,
        workerId: createdWorkers[9]._id,
        workerName: createdWorkers[9].fullName,
        price: 485000,
        description: 'Installation système solaire 3kWc avec onduleur, batteries et câblage. Garantie 5 ans.',
        estimatedDuration: 3,
        status: 'pending',
      },
      // Quotes pour "Fabrication et installation cuisine" (createdRequests[9])
      {
        requestId: createdRequests[9]._id,
        workerId: createdWorkers[2]._id,
        workerName: createdWorkers[2].fullName,
        price: 340000,
        description: 'Cuisine complète sur mesure en bois avec plan de travail granite. Meubles bas et hauts. Délai: 15 jours.',
        estimatedDuration: 15,
        status: 'pending',
      },
      // Quotes pour "Construction mur de clôture" (createdRequests[10])
      {
        requestId: createdRequests[10]._id,
        workerId: createdWorkers[3]._id,
        workerName: createdWorkers[3].fullName,
        price: 720000,
        description: 'Construction mur 25m x 2m en parpaings avec fondation, enduit et crépi. Délai: 20 jours.',
        estimatedDuration: 20,
        status: 'pending',
      },
      // Quote pour "Nettoyage de bureaux hebdomadaire" (createdRequests[12])
      {
        requestId: createdRequests[12]._id,
        workerId: createdWorkers[6]._id,
        workerName: createdWorkers[6].fullName,
        price: 75000,
        description: 'Nettoyage hebdomadaire 150m² de bureaux. Produits inclus. Contrat mensuel renouvelable.',
        estimatedDuration: 4,
        status: 'pending',
      },
      // Quote pour "Aménagement paysager jardin" (createdRequests[13])
      {
        requestId: createdRequests[13]._id,
        workerId: createdWorkers[5]._id,
        workerName: createdWorkers[5].fullName,
        price: 270000,
        description: 'Aménagement complet: préparation terrain, plantation pelouse, 15 arbustes, système arrosage automatique.',
        estimatedDuration: 10,
        status: 'pending',
      },
      // Quote pour "Peinture façade extérieure" (createdRequests[15])
      {
        requestId: createdRequests[15]._id,
        workerId: createdWorkers[4]._id,
        workerName: createdWorkers[4].fullName,
        price: 210000,
        description: 'Ravalement et peinture façade R+1. Nettoyage haute pression, enduit fissures, 2 couches peinture extérieure.',
        estimatedDuration: 8,
        status: 'pending',
      },
      // Quotes pour "Rénovation salle de bain complète" (createdRequests[16])
      {
        requestId: createdRequests[16]._id,
        workerId: createdWorkers[3]._id,
        workerName: createdWorkers[3].fullName,
        price: 430000,
        description: 'Rénovation complète: démolition ancien carrelage, nouvelle plomberie, carrelage mural/sol, peinture plafond.',
        estimatedDuration: 12,
        status: 'pending',
      },
      {
        requestId: createdRequests[16]._id,
        workerId: createdWorkers[0]._id,
        workerName: createdWorkers[0].fullName,
        price: 395000,
        description: 'Rénovation avec focus qualité plomberie. Collaboration avec carreleur partenaire. Délai: 14 jours.',
        estimatedDuration: 14,
        status: 'pending',
      },
    ];

    await Quote.create(quotes);
    console.log(`✅ ${quotes.length} devis créés\n`);

    console.log('🎉 Seed terminé avec succès!\n');
    console.log('📊 Récapitulatif:');
    console.log(`   - ${createdClients.length} clients`);
    console.log(`   - ${createdWorkers.length} travailleurs`);
    console.log(`   - ${createdRequests.length} demandes de service`);
    console.log(`   - ${quotes.length} devis\n`);
    console.log('📝 Identifiants de test:');
    console.log('   Clients:');
    console.log('     - client1@test.com / password123 (Amadou Diallo)');
    console.log('     - client2@test.com / password123 (Fatou Sall)');
    console.log('   Workers:');
    console.log('     - plombier1@test.com / password123 (Mamadou Ba)');
    console.log('     - electricien1@test.com / password123 (Ibrahima Ndiaye)');
    console.log('     - jardinier1@test.com / password123 (Abdoulaye Thiam)');
    console.log('     - nettoyage1@test.com / password123 (Mariama Diagne)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
};

connectDB().then(() => seedDatabase());
