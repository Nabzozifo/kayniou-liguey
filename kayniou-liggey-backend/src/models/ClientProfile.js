const mongoose = require('mongoose');

const ClientProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  address: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: '',
  },
  country: {
    type: String,
    default: 'Senegal',
  },
  totalRequests: {
    type: Number,
    default: 0,
  },
  completedRequests: {
    type: Number,
    default: 0,
  },
  cancelledRequests: {
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
ClientProfileSchema.index({ location: '2dsphere' });

// Mise à jour automatique du champ updatedAt
ClientProfileSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('ClientProfile', ClientProfileSchema);
