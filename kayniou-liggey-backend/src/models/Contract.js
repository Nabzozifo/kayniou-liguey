const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
  // References
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true,
    // Index defined below with ContractSchema.index({ requestId: 1 })
  },
  quoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Contract Type
  type: {
    type: String,
    enum: ['auction', 'direct_hire', 'invitation'],
    default: 'auction',
  },

  // Contract Details
  agreedPrice: {
    type: Number,
    required: true,
  },
  estimatedDuration: {
    type: Number, // in hours
    required: true,
  },
  startDate: Date,
  endDate: Date,

  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'pending',
    index: true,
  },

  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'refunded'],
    default: 'pending',
  },
  paymentAmount: Number,
  paymentDate: Date,

  // Cancellation
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  cancellationReason: String,
  cancelledAt: Date,

  // Completion
  completedAt: Date,
  clientConfirmedAt: Date,
  workerConfirmedAt: Date,

  // Terms & Conditions
  terms: String,
  specialConditions: String,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
ContractSchema.index({ clientId: 1, status: 1 });
ContractSchema.index({ workerId: 1, status: 1 });
ContractSchema.index({ requestId: 1 });

// Update timestamp on save
// IMPORTANT: Mongoose 6+ async hooks don't use next()
ContractSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Contract', ContractSchema);
