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
    });

    // Créer le profil selon le type d'utilisateur
    if (userType === 'client') {
      await ClientProfile.create({ userId: user._id });
    } else if (userType === 'worker') {
      await WorkerProfile.create({ userId: user._id });
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
    const { fullName, phoneNumber, photoURL } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phoneNumber, photoURL },
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
