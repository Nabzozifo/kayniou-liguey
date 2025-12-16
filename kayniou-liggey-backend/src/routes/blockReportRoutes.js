const express = require('express');
const router = express.Router();
const {
  blockUser,
  unblockUser,
  getBlockedUsers,
  reportUser,
  getMyReports,
  isBlocked,
  getAllReports,
  reviewReport,
} = require('../controllers/blockReportController');
const { protect } = require('../middleware/authMiddleware');

// User routes
router.post('/block', protect, blockUser);
router.delete('/block/:targetId', protect, unblockUser);
router.get('/blocked', protect, getBlockedUsers);
router.post('/report', protect, reportUser);
router.get('/my-reports', protect, getMyReports);
router.get('/is-blocked/:targetId', protect, isBlocked);

// Admin routes (TODO: Add admin middleware)
router.get('/admin/reports', protect, getAllReports);
router.put('/admin/reports/:id', protect, reviewReport);

module.exports = router;
