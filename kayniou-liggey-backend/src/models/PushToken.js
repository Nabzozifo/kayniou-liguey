const mongoose = require('mongoose');

const pushTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pushToken: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour recherche rapide
pushTokenSchema.index({ userId: 1, isActive: 1 });
pushTokenSchema.index({ pushToken: 1 }, { unique: true });

module.exports = mongoose.model('PushToken', pushTokenSchema);
