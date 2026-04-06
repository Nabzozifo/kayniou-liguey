const mongoose = require('mongoose');

const WorksiteActivitySchema = new mongoose.Schema({
  worksiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worksite',
    required: true,
    index: true,
  },

  // Activity Type
  type: {
    type: String,
    required: true,
    enum: [
      'created',
      'started',
      'paused',
      'resumed',
      'work_finished',   // worker declares work done, awaiting client validation
      'completed',
      'cancelled',
      'validated',
      'status_changed',
      'message_sent',
      'notification_sent',
      'worker_assigned',
      'deadline_updated',
      'price_updated',
    ],
  },

  // Actor (who performed this action)
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  actorType: {
    type: String,
    enum: ['client', 'worker', 'system', 'admin'],
  },
  actorName: String,

  // Activity Details
  description: {
    type: String,
    required: true,
  },

  // Metadata (flexible JSON for additional data)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Previous and New Values (for tracking changes)
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,

  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Index pour récupérer rapidement l'historique d'un chantier
WorksiteActivitySchema.index({ worksiteId: 1, createdAt: -1 });

module.exports = mongoose.model('WorksiteActivity', WorksiteActivitySchema);
