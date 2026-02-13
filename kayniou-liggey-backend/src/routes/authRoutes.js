const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  updateFCMToken,
  registerPushToken,
  verifyPhone,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Routes publiques
router.post('/register', register);
router.post('/login', login);

// Routes protégées
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/fcm-token', protect, updateFCMToken);
router.post('/register-push-token', protect, registerPushToken);
router.post('/verify-phone', protect, verifyPhone);

module.exports = router;
