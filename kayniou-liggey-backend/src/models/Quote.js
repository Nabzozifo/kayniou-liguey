const mongoose = require('mongoose');

const QuoteSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true,
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  workerName: {
    type: String,
    default: '',
  },
  workerPhoto: {
    type: String,
    default: null,
  },
  workerRating: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
  },
  estimatedDuration: {
    type: Number, // en heures
    required: [true, 'La durée estimée est requise'],
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
  },
  servicesIncluded: [
    {
      type: String,
    },
  ],
  // Date et heure où le travailleur propose d'intervenir
  // Obligatoire si la demande n'a pas de preferredDate
  availableDate: {
    type: Date,
    default: null,
  },
  availableTime: {
    type: String, // "HH:MM"
    default: null,
  },
  additionalNotes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending',
  },
  score: {
    type: Number,
    default: 0,
  },
  // Intelligent Auction System - Score pondéré
  auctionScore: {
    type: Number,
    default: 0,
  },
  // Détails du calcul du score pour transparence
  scoreBreakdown: {
    priceScore: { type: Number, default: 0 }, // 30%
    qualityScore: { type: Number, default: 0 }, // 25%
    reliabilityScore: { type: Number, default: 0 }, // 20%
    speedScore: { type: Number, default: 0 }, // 15%
    experienceScore: { type: Number, default: 0 }, // 5%
    completionScore: { type: Number, default: 0 }, // 5%
  },
  // Badge meilleure offre
  isBestOffer: {
    type: Boolean,
    default: false,
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

// Mise à jour automatique du champ updatedAt
QuoteSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Quote', QuoteSchema);
