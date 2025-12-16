const express = require('express');
const router = express.Router();
const {
  registerPushToken,
  sendPushNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  unregisterPushToken,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Routes protégées
router.post('/register-token', protect, registerPushToken);
router.post('/unregister-token', protect, unregisterPushToken);
router.post('/send', protect, sendPushNotification);
router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/:id/read', protect, markAsRead);
router.put('/mark-all-read', protect, markAllAsRead);

module.exports = router;
