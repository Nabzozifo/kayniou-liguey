const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { detectCountryFromPhone } = require('../config/westAfricanCountries');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Mot de passe est requis'],
    minlength: 6,
    select: false, // Ne pas retourner le mot de passe par défaut
  },
  fullName: {
    type: String,
    required: [true, 'Nom complet est requis'],
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: [true, 'Numéro de téléphone est requis'],
    trim: true,
  },
  country: {
    type: String,
    enum: ['SN', 'CI', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GN', 'CM', 'GA', 'CG', 'TD', 'CF', 'GW', 'MA', 'FR'],
    default: 'SN', // Détecté automatiquement depuis phoneNumber
  },
  photoURL: {
    type: String,
    default: null,
  },
  userType: {
    type: String,
    enum: ['client', 'worker'],
    required: [true, 'Type d\'utilisateur est requis'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'premium'],
      default: 'basic',
    },
    startDate: Date,
    endDate: Date,
    autoRenew: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
  },
  fcmToken: {
    type: String,
    default: null,
  },
  expoPushToken: {
    type: String,
    default: null,
  },
  deviceInfo: {
    platform: String,
    brand: String,
    model: String,
    osVersion: String,
    lastUpdated: Date,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  // Paramètres de recherche pour les clients
  searchRadius: {
    type: Number,
    default: 50, // 50km par défaut
    min: 1,
    max: 100, // Maximum 100km
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

// Hash du mot de passe avant sauvegarde ET mise à jour de updatedAt
// IMPORTANT: Mongoose 6+ async hooks don't use next()
UserSchema.pre('save', async function () {
  // Mise à jour automatique du champ updatedAt
  this.updatedAt = Date.now();

  // Détecter automatiquement le pays depuis le numéro de téléphone
  if (this.isModified('phoneNumber') || this.isNew) {
    const detectedCountry = detectCountryFromPhone(this.phoneNumber);
    if (detectedCountry && !this.country) {
      this.country = detectedCountry.code;
      console.log(`✅ Pays détecté automatiquement: ${detectedCountry.name} (${detectedCountry.code})`);
    }
  }

  // Hash du mot de passe seulement s'il a été modifié
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
