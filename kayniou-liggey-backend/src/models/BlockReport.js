const mongoose = require('mongoose');

const BlockReportSchema = new mongoose.Schema({
  // User who is blocking/reporting
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // User being blocked/reported
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Type
  type: {
    type: String,
    enum: ['block', 'report'],
    required: true,
  },

  // Report Reason (if type is 'report')
  reason: {
    type: String,
    enum: [
      'inappropriate_behavior',
      'spam',
      'harassment',
      'fake_profile',
      'poor_quality_work',
      'unprofessional',
      'no_show',
      'payment_issues',
      'safety_concerns',
      'other',
    ],
  },

  // Additional details
  description: {
    type: String,
    maxlength: 1000,
  },

  // Related Resources (optional)
  relatedResource: {
    type: {
      type: String,
      enum: ['worksite', 'quote', 'request', 'contract', 'message'],
    },
    id: mongoose.Schema.Types.ObjectId,
  },

  // Evidence (screenshots, etc.)
  evidence: [
    {
      type: String, // URLs
    },
  ],

  // Status (for reports)
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
    default: 'pending',
  },

  // Admin Review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: Date,
  reviewNotes: String,
  actionTaken: String,

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

// Compound indexes
BlockReportSchema.index({ targetId: 1, type: 1, status: 1 });

// Prevent duplicate blocks
BlockReportSchema.index(
  { reporterId: 1, targetId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'block' } }
);

// Update timestamp on save
// IMPORTANT: Mongoose 6+ async hooks don't use next()
BlockReportSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Static method to check if user is blocked
BlockReportSchema.statics.isBlocked = async function(reporterId, targetId) {
  const block = await this.findOne({
    reporterId,
    targetId,
    type: 'block',
  });
  return !!block;
};

// Static method to check if blocked by
BlockReportSchema.statics.isBlockedBy = async function(targetId, reporterId) {
  const block = await this.findOne({
    reporterId,
    targetId,
    type: 'block',
  });
  return !!block;
};

module.exports = mongoose.model('BlockReport', BlockReportSchema);
