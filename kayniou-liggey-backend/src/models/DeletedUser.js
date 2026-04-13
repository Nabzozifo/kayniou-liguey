const mongoose = require('mongoose');

const DeletedUserSchema = new mongoose.Schema({
  // Données originales de l'utilisateur archivées au moment de la suppression
  originalId: { type: mongoose.Schema.Types.ObjectId, required: true },
  email: { type: String, required: true },
  fullName: { type: String },
  phoneNumber: { type: String },
  userType: { type: String, enum: ['client', 'worker'] },
  country: { type: String },
  subscription: { type: Object },
  isVerified: { type: Boolean, default: false },
  createdAt_original: { type: Date }, // date de création du compte d'origine

  // Métadonnées de suppression
  deletedAt: { type: Date, default: Date.now },
  deletedBy: {
    type: String,
    enum: ['admin', 'user_request'],
    default: 'admin',
  },
  deletionReason: { type: String, default: null },
  requestedAt: { type: Date, default: null }, // date de la demande si workflow utilisateur
});

module.exports = mongoose.model('DeletedUser', DeletedUserSchema);
