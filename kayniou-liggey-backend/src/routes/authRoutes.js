const express = require('express');
const router  = express.Router();
const { body, query, validationResult } = require('express-validator');
const {
  register,
  login,
  checkEmail,
  getMe,
  updateProfile,
  updateFCMToken,
  registerPushToken,
  verifyPhone,
  requestDeletion,
  refresh,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ── Validation middleware ─────────────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array().map(e => e.msg) });
  }
  next();
};

const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe : 8 caractères minimum'),
  body('fullName').trim().notEmpty().isLength({ max: 100 }).withMessage('Nom requis (100 chars max)'),
  body('phoneNumber').trim().notEmpty().withMessage('Numéro de téléphone requis'),
  body('userType').isIn(['client', 'worker']).withMessage('Type utilisateur invalide'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
];

const checkEmailRules = [
  query('email').isEmail().normalizeEmail().withMessage('Email invalide'),
];

const deletionRules = [
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Raison : 500 chars max'),
];

// ── Routes publiques ──────────────────────────────────────────────────────────
router.post('/register', registerRules, validate, register);
router.post('/login',    loginRules,    validate, login);
router.get('/check-email', checkEmailRules, validate, checkEmail);
router.post('/refresh', refresh);
router.post('/logout',  logout);

// Routes protégées
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/fcm-token', protect, updateFCMToken);
router.post('/register-push-token', protect, registerPushToken);
router.post('/verify-phone', protect, verifyPhone);
router.post('/request-deletion', protect, deletionRules, validate, requestDeletion);

module.exports = router;
