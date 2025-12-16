const mongoose = require('mongoose');

// Valid service categories - must match frontend
const VALID_CATEGORIES = [
  'Plomberie',
  'Électricité',
  'Menuiserie',
  'Maçonnerie',
  'Peinture',
  'Jardinage',
  'Nettoyage',
  'Mécanique',
  'Carrelage',
  'Déménagement',
  'Réparation',
  'Installation',
  'Climatisation',
];

const ServiceRequestSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  clientName: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
  },
  categories: [
    {
      type: String,
      enum: VALID_CATEGORIES,
      required: true,
    },
  ],
  mode: {
    type: String,
    enum: ['direct', 'auction', 'direct_hire', 'private_auction'],
    default: 'auction',
  },
  // For direct hire (single worker)
  targetWorkerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // For private auction (1-3 specific workers)
  invitedWorkerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // For auction
  auctionDuration: {
    type: Number, // Duration in hours
    default: 48, // Default 48 hours
  },
  auctionEndsAt: {
    type: Date,
    default: null,
  },
  auctionExtended: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'assigned', 'inProgress', 'completed', 'cancelled'],
    default: 'pending',
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    },
    address: String,
  },
  estimatedBudget: {
    type: Number,
    default: null,
  },
  preferredDate: {
    type: Date,
    default: null,
  },
  photos: [
    {
      type: String, // URLs des photos
    },
  ],
  viewCount: {
    type: Number,
    default: 0,
  },
  quoteCount: {
    type: Number,
    default: 0,
  },
  assignedWorkerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  acceptedQuoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
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

// Index géospatial pour la recherche par proximité
ServiceRequestSchema.index({ location: '2dsphere' });

// Mise à jour automatique du champ updatedAt et auctionEndsAt
ServiceRequestSchema.pre('save', function() {
  this.updatedAt = Date.now();

  // Set auction end time if auction mode (public or private) and not already set
  if ((this.mode === 'auction' || this.mode === 'private_auction') && !this.auctionEndsAt && this.isNew) {
    const durationInMs = this.auctionDuration * 60 * 60 * 1000;
    this.auctionEndsAt = new Date(Date.now() + durationInMs);
  }
});

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
