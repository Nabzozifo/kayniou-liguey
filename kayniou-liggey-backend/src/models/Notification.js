const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // Recipient
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Notification Type
  type: {
    type: String,
    required: true,
    enum: [
      // Worker Notifications
      'new_job_request',
      'outbid_in_auction',
      'quote_accepted',
      'quote_rejected',
      'job_invitation',
      'job_started_confirmation',
      'job_completed_confirmation',
      'new_message_worksite',
      'payment_received',
      'review_received',

      // Client Notifications
      'worker_accepted_invitation',
      'new_quote_submitted',
      'job_started',
      'job_completed',
      'new_message_from_worker',
      'action_required',
      'worker_assigned',

      // General
      'system_notification',
    ],
  },

  // Title and Message
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },

  // Related Resources
  relatedResource: {
    type: {
      type: String,
      enum: ['worksite', 'quote', 'request', 'contract', 'message', 'review'],
    },
    id: mongoose.Schema.Types.ObjectId,
  },

  // Action Data (for navigation)
  actionData: {
    screen: String, // Screen to navigate to
    params: mongoose.Schema.Types.Mixed, // Navigation params
  },

  // Status
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: Date,

  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },

  // Push Notification Status
  pushSent: {
    type: Boolean,
    default: false,
  },
  pushSentAt: Date,
  pushError: String,

  // Expo Push Token (for sending push notification)
  expoPushToken: String,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
});

// Index pour récupérer rapidement les notifications non lues
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// Index TTL pour supprimer automatiquement les vieilles notifications
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Méthode pour marquer comme lu
NotificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', NotificationSchema);
