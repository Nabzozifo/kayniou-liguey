const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour protéger les routes
exports.protect = async (req, res, next) => {
  let token;

  // Vérifier si le token est présent dans les headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Vérifier si le token existe
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé - Token manquant',
    });
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ajouter l'utilisateur à la requête
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé - Token invalide',
    });
  }
};

// Middleware pour vérifier le type d'utilisateur
exports.restrictTo = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Cette action est réservée aux ${userTypes.join(', ')}`,
      });
    }
    next();
  };
};
