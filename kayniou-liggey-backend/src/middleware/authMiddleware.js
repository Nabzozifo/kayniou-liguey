const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour protéger les routes (authentification requise)
exports.protect = async (req, res, next) => {
  let token;

  // Vérifier si le token est présent dans les headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extraire le token du header Authorization
      token = req.headers.authorization.split(' ')[1];

      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Ajouter l'utilisateur à la requête (sans le mot de passe)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé',
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Compte désactivé',
        });
      }

      next();
    } catch (error) {
      console.error('Erreur d\'authentification:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Non autorisé, token invalide',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé, pas de token',
    });
  }
};

// Middleware pour vérifier le type d'utilisateur
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `Le type d'utilisateur ${req.user.userType} n'est pas autorisé à accéder à cette route`,
      });
    }
    next();
  };
};
