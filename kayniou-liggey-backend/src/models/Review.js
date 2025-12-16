const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  clientName: {
    type: String,
    default: '',
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  overallRating: {
    type: Number,
    required: [true, 'La note globale est requise'],
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: [true, 'Le commentaire est requis'],
    minlength: 10,
  },
  photos: [
    {
      type: String, // URLs des photos
    },
  ],
  qualityRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  punctualityRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  communicationRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  professionalismRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  wouldRecommend: {
    type: Boolean,
    default: true,
  },
  workerResponse: {
    type: String,
    default: null,
  },
  workerRespondedAt: {
    type: Date,
    default: null,
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
ReviewSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Review', ReviewSchema);
