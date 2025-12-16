const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  // Référence au chantier
  worksiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worksite',
    required: true,
  },

  // Qui note qui
  reviewerType: {
    type: String,
    enum: ['client', 'worker'],
    required: true,
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewerName: {
    type: String,
    required: true,
  },
  reviewedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewedName: {
    type: String,
    required: true,
  },

  // Note globale
  overallRating: {
    type: Number,
    required: [true, 'La note globale est requise'],
    min: 1,
    max: 5,
  },

  // Commentaire
  comment: {
    type: String,
    required: [true, 'Le commentaire est requis'],
    minlength: 10,
    maxlength: 500,
  },

  // Notes détaillées (optionnelles)
  detailedRatings: {
    quality: {
      type: Number,
      min: 1,
      max: 5,
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
    },
  },

  // Recommandation
  wouldRecommend: {
    type: Boolean,
    default: true,
  },

  // Réponse (optionnelle)
  response: {
    type: String,
    maxlength: 500,
  },
  respondedAt: {
    type: Date,
  },

  // Métadonnées
  isPublic: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: true, // Automatiquement vérifié car basé sur un chantier réel
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index pour éviter les doublons
RatingSchema.index({ worksiteId: 1, reviewerType: 1 }, { unique: true });

// Index pour rechercher les notes d'un utilisateur
RatingSchema.index({ reviewedId: 1, isPublic: 1 });
RatingSchema.index({ reviewerId: 1 });

// Mise à jour automatique du champ updatedAt
RatingSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Rating', RatingSchema);
