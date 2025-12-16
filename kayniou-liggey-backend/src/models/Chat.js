const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderName: {
    type: String,
    default: '',
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'location', 'system'],
    default: 'text',
  },
  content: {
    type: String,
    required: true,
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent',
  },
  readAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ConversationSchema = new mongoose.Schema({
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
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  clientUnreadCount: {
    type: Number,
    default: 0,
  },
  workerUnreadCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
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
ConversationSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
const Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = { ChatMessage, Conversation };
