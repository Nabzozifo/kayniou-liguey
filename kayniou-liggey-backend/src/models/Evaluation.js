const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: [true, 'La mission est requise'],
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le worker est requis'],
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le client est requis'],
    },
    ratings: {
      // Ponctualité (25%)
      punctuality: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      // Courtoisie (15%)
      courtesy: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      // Qualité du travail (35%)
      quality: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      // Propreté (15%)
      cleanliness: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      // Professionnalisme (10%)
      professionalism: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
    },
    // Score pondéré final (calculé par le frontend)
    weightedScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    // Commentaire optionnel
    comment: {
      type: String,
      default: '',
      maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères'],
    },
  },
  {
    timestamps: true,
  }
);

// Index pour rechercher les évaluations d'un worker
evaluationSchema.index({ workerId: 1, createdAt: -1 });

// Index pour s'assurer qu'un client n'évalue qu'une seule fois une mission
evaluationSchema.index({ missionId: 1, clientId: 1 }, { unique: true });

// Méthode pour calculer le score pondéré (au cas où)
evaluationSchema.methods.calculateWeightedScore = function () {
  const weights = {
    punctuality: 0.25,
    courtesy: 0.15,
    quality: 0.35,
    cleanliness: 0.15,
    professionalism: 0.1,
  };

  let score = 0;
  Object.keys(weights).forEach((criterion) => {
    score += this.ratings[criterion] * weights[criterion];
  });

  return parseFloat(score.toFixed(2));
};

// Virtual pour vérifier si l'évaluation est récente (modifiable)
evaluationSchema.virtual('isModifiable').get(function () {
  const hoursSinceCreation = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  return hoursSinceCreation <= 24;
});

// Inclure virtuals dans JSON
evaluationSchema.set('toJSON', { virtuals: true });
evaluationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Evaluation', evaluationSchema);
