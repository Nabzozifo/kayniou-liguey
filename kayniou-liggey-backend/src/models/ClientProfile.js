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
ClientProfileSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('ClientProfile', ClientProfileSchema);
