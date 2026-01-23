const mongoose = require('mongoose');

// Valid service categories - must match frontend and ServiceRequest model
// IMPORTANT: Lowercase sans accents pour la base de données
const VALID_CATEGORIES = [
  'plomberie',
  'electricite',
  'menuiserie',
  'maconnerie',
  'peinture',
  'carrelage',
  'jardinage',
  'nettoyage',
  'mecanique',
  'demenagement',
  'reparation',
  'installation',
  'climatisation',
];

const SkillSchema = new mongoose.Schema({
  name: String,
  level: { type: String, enum: ['beginner', 'intermediate', 'expert'] },
});

const DiplomaSchema = new mongoose.Schema({
  title: String,
  institution: String,
  year: Number,
  photoURL: String,
  field: String, // Domaine d'étude
  level: { type: String, enum: ['bac', 'licence', 'master', 'doctorat', 'autre'] },
});

const CertificationSchema = new mongoose.Schema({
  name: String,
  issuingOrganization: String,
  issueDate: Date,
  expiryDate: Date,
  credentialId: String,
  credentialURL: String,
  photoURL: String,
});

const ExperienceSchema = new mongoose.Schema({
  company: String,
  position: String,
  startDate: Date,
  endDate: Date,
  isCurrent: Boolean,
  description: String,
});

const WorkerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  bio: {
    type: String,
    default: '',
  },
  categories: {
    type: [String],
    enum: VALID_CATEGORIES,
    default: [],
    validate: {
      validator: function(v) {
        // Allow empty array during registration, but if categories are provided, must be 1-3
        return v.length === 0 || (v.length >= 1 && v.length <= 3);
      },
      message: 'Un worker doit avoir entre 1 et 3 métiers/catégories (si renseigné)'
    },
  },
  skills: [SkillSchema],
  skillsText: {
    type: String,
    default: '',
  },
  diplomas: [DiplomaSchema],
  certifications: [CertificationSchema],
  experiences: [ExperienceSchema],

  // Informations professionnelles supplémentaires
  professionalSummary: {
    type: String,
    maxlength: 500,
    default: '',
  },
  yearsOfExperience: {
    type: Number,
    default: 0,
  },
  experienceLevel: {
    type: String,
    enum: ['< 1 an', '1-3 ans', '3-5 ans', '5+ ans'],
    default: '',
  },
  languages: [{
    language: String,
    proficiency: { type: String, enum: ['débutant', 'intermédiaire', 'courant', 'natif'] },
  }],

  // Assurance et documents
  insurance: {
    hasInsurance: { type: Boolean, default: false },
    provider: String,
    policyNumber: String,
    expiryDate: Date,
    coverageAmount: Number,
    documentURL: String,
  },

  // Équipements et outils
  equipment: [{
    name: String,
    category: String,
    purchaseDate: Date,
    condition: { type: String, enum: ['excellent', 'bon', 'acceptable', 'à remplacer'] },
  }],

  // Disponibilité hebdomadaire
  weeklyAvailability: {
    monday: { available: { type: Boolean, default: true }, hours: String },
    tuesday: { available: { type: Boolean, default: true }, hours: String },
    wednesday: { available: { type: Boolean, default: true }, hours: String },
    thursday: { available: { type: Boolean, default: true }, hours: String },
    friday: { available: { type: Boolean, default: true }, hours: String },
    saturday: { available: { type: Boolean, default: true }, hours: String },
    sunday: { available: { type: Boolean, default: false }, hours: String },
  },

  // Vérification d'identité
  identityVerification: {
    isVerified: { type: Boolean, default: false },
    idType: { type: String, enum: ['cin', 'passport', 'permis'] },
    idNumber: String,
    idPhotoURL: String,
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  portfolio: [
    {
      type: String, // URLs des photos
    },
  ],
  hourlyRate: {
    type: Number,
    default: 0,
  },
  fixedRates: {
    type: Map,
    of: Number,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
    address: String,
  },
  serviceRadius: {
    type: Number,
    default: 10, // km
  },
  totalJobs: {
    type: Number,
    default: 0,
  },
  completedJobs: {
    type: Number,
    default: 0,
  },
  cancelledJobs: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0.0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  averageResponseTime: {
    type: Number,
    default: 0, // en minutes
  },
  // Système de score
  performanceScore: {
    type: Number,
    default: 0, // Score calculé de 0 à 100
  },
  reliabilityScore: {
    type: Number,
    default: 0, // Score de fiabilité (0-100)
  },
  qualityScore: {
    type: Number,
    default: 0, // Score de qualité (0-100)
  },
  speedScore: {
    type: Number,
    default: 0, // Score de rapidité (0-100)
  },
  // Statistiques détaillées
  averageCompletionTime: {
    type: Number,
    default: 0, // Temps moyen pour terminer un travail (en heures)
  },
  onTimeCompletionRate: {
    type: Number,
    default: 0, // Pourcentage de travaux terminés à temps
  },
  customerSatisfactionRate: {
    type: Number,
    default: 0, // Pourcentage de clients satisfaits
  },
  repeatClientRate: {
    type: Number,
    default: 0, // Pourcentage de clients récurrents
  },
  // Badges et certifications
  badges: [
    {
      name: String,
      description: String,
      earnedAt: {
        type: Date,
        default: Date.now,
      },
      icon: String,
    },
  ],
  isVerified: {
    type: Boolean,
    default: false, // Profil vérifié par l'admin
  },
  verificationDate: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index géospatial pour la recherche par proximité
WorkerProfileSchema.index({ location: '2dsphere' });

// Mise à jour automatique du champ updatedAt
WorkerProfileSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('WorkerProfile', WorkerProfileSchema);
