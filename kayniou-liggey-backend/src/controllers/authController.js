const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ClientProfile = require('../models/ClientProfile');
const WorkerProfile = require('../models/WorkerProfile');

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Inscription
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, fullName, phoneNumber, userType } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Un compte existe déjà avec cet email',
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password,
      fullName,
      phoneNumber,
      userType,
      // Nouveaux champs pour l'identification
      isPhoneVerified: false, // Sera vérifié via l'endpoint verify-phone
    });

    // Créer le profil selon le type d'utilisateur
    if (userType === 'client') {
      await ClientProfile.create({
        userId: user._id,
        // Si l'adresse est fournie lors de l'inscription pour le client
        address: req.body.address || '',
        city: req.body.city || '',
      });
    } else if (userType === 'worker') {
      // Inscription simplifiée : dob et identityDocuments sont collectés
      // ultérieurement depuis le profil du travailleur, pas à l'inscription.
      const { dob, address, identityDocuments } = req.body;

      // Valider la date avant de la passer à Mongoose pour éviter "Invalid Date"
      let parsedDob;
      if (dob && typeof dob === 'string' && dob.trim()) {
        const d = new Date(dob.trim());
        parsedDob = isNaN(d.getTime()) ? undefined : d;
      }

      const workerProfileData = {
        userId: user._id,
        ...(parsedDob && { dob: parsedDob }),
        address: address || '',
        ...(identityDocuments && {
          identityVerification: { ...identityDocuments, isVerified: false }
        }),
      };

      await WorkerProfile.create(workerProfileData);
    }

    // Générer le token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error('❌ ERREUR INSCRIPTION:', error);
    console.error('❌ Message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message,
    });
  }
};

// @desc    Connexion
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si email et password sont fournis
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email et un mot de passe',
      });
    }

    // Chercher l'utilisateur avec le mot de passe
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Vérifier le mot de passe
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Générer le token
    const token = generateToken(user._id);

    let isVerified = false;
    if (user.userType === 'worker') {
      const wp = await WorkerProfile.findOne({ userId: user._id }).select('isVerified');
      isVerified = wp?.isVerified || false;
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
        photoURL: user.photoURL,
        country: user.country,
        searchRadius: user.searchRadius,
        subscription: user.subscription,
        isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message,
    });
  }
};

// @desc    Obtenir l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    let isVerified = false;
    if (user.userType === 'worker') {
      const wp = await WorkerProfile.findOne({ userId: user._id }).select('isVerified');
      isVerified = wp?.isVerified || false;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
        photoURL: user.photoURL,
        isActive: user.isActive,
        country: user.country,
        searchRadius: user.searchRadius,
        subscription: user.subscription,
        isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message,
    });
  }
};

// @desc    Mettre à jour le profil utilisateur
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, photoURL, searchRadius } = req.body;

    // N'inclure que les champs effectivement fournis (évite les erreurs de validation)
    const updateData = {};
    if (fullName    !== undefined) updateData.fullName    = fullName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (photoURL    !== undefined) updateData.photoURL    = photoURL;
    if (searchRadius !== undefined) updateData.searchRadius = Number(searchRadius);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
        photoURL: user.photoURL,
        searchRadius: user.searchRadius,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message,
    });
  }
};

// @desc    Mettre à jour le token FCM
// @route   PUT /api/auth/fcm-token
// @access  Private
exports.updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    await User.findByIdAndUpdate(req.user.id, { fcmToken });

    res.status(200).json({
      success: true,
      message: 'Token FCM mis à jour',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du token FCM',
      error: error.message,
    });
  }
};

// @desc    Vérifier le numéro de téléphone (après validation Firebase côté client)
// @route   POST /api/auth/verify-phone
// @access  Private
exports.verifyPhone = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    // NOTE: Dans une implémentation réelle, on vérifierait le token Firebase avec firebase-admin
    // Pour l'instant, on fait confiance au client qui a déjà validé le OTP via le SDK Firebase
    // et on marque simplement l'utilisateur comme vérifié.

    // TODO: Intégrer firebase-admin pour valider le token:
    // const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    // if (decodedToken.phone_number !== req.user.phoneNumber) ...

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isPhoneVerified: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Numéro de téléphone vérifié avec succès',
      user: {
        id: user._id,
        isPhoneVerified: user.isPhoneVerified
      }
    });
  } catch (error) {
    console.error('❌ Erreur verifyPhone:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du téléphone',
      error: error.message,
    });
  }
};

// @desc    Register Expo or FCM push token
// @route   POST /api/auth/register-push-token
// @access  Private
exports.registerPushToken = async (req, res) => {
  try {
    const { userId, pushToken, tokenType, platform, deviceInfo } = req.body;

    console.log('📱 Enregistrement push token:', { userId, pushToken: pushToken?.substring(0, 30) + '...', tokenType, platform });

    const user = await User.findById(userId || req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Mettre à jour le bon type de token
    if (tokenType === 'fcm') {
      user.fcmToken = pushToken;
      console.log('✅ Token FCM enregistré pour:', user.fullName);
    } else {
      // Par défaut, c'est un token Expo
      user.expoPushToken = pushToken;
      console.log('✅ Token Expo enregistré pour:', user.fullName);
    }

    // Mettre à jour les infos du device
    user.deviceInfo = {
      ...deviceInfo,
      platform,
      lastUpdated: new Date(),
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Push token enregistré avec succès',
      tokenType: tokenType || 'expo',
    });
  } catch (error) {
    console.error('❌ Erreur registerPushToken:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du push token',
      error: error.message,
    });
  }
};
