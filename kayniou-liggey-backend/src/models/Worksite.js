const mongoose = require('mongoose');

const WorksiteSchema = new mongoose.Schema({
  // References
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true,
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true,
  },
  quoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Job Details
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  agreedPrice: {
    type: Number,
    required: true,
  },
  estimatedDuration: {
    type: Number, // hours
    required: true,
  },

  // Location
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
    city: String,
  },

  // Deadline
  deadline: {
    type: Date,
  },

  // Status Workflow
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'archived'],
    default: 'pending',
  },

  // Worker Real-time Status Tracking
  workerStatus: {
    type: String,
    enum: ['assigned', 'en_route', 'arrived', 'work_started', 'work_completed', 'left'],
    default: 'assigned',
  },

  // Worker Status History (for transparency and tracking)
  statusHistory: [{
    status: {
      type: String,
      enum: ['assigned', 'en_route', 'arrived', 'work_started', 'work_completed', 'left'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: [Number], // [longitude, latitude]
    },
    note: String, // Optional note from worker
  }],

  // Current Worker Location (for real-time tracking)
  workerCurrentLocation: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: [Number], // [longitude, latitude]
    lastUpdated: Date,
  },

  // Time Tracking
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  actualDuration: {
    type: Number, // hours (calculated from start/end)
  },

  // Additional Info
  servicesIncluded: [String],
  additionalNotes: String,

  // Client Info (denormalized for quick access)
  clientInfo: {
    name: String,
    phone: String,
    email: String,
    photoURL: String,
  },

  // Worker Info (denormalized for quick access)
  workerInfo: {
    name: String,
    phone: String,
    email: String,
    photoURL: String,
  },

  // Completion Validation
  workerCompletedAt: Date,
  clientValidatedAt: Date,
  isValidatedByClient: {
    type: Boolean,
    default: false,
  },

  // Cancellation
  cancelledBy: {
    type: String,
    enum: ['client', 'worker', 'admin'],
  },
  cancellationReason: String,
  cancelledAt: Date,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index pour recherche par client/worker
WorksiteSchema.index({ clientId: 1, status: 1 });
WorksiteSchema.index({ workerId: 1, status: 1 });
WorksiteSchema.index({ contractId: 1 });

// Mise à jour automatique du champ updatedAt
WorksiteSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Calculer la durée réelle si start et end existent
WorksiteSchema.pre('save', function() {
  if (this.startTime && this.endTime) {
    const durationMs = this.endTime - this.startTime;
    this.actualDuration = durationMs / (1000 * 60 * 60); // Convert to hours
  }
});

module.exports = mongoose.model('Worksite', WorksiteSchema);
