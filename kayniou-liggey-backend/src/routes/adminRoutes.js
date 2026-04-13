const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/adminAuth');
const ctrl = require('../controllers/adminController');

// ── Seed initial admin (one-time) ──
router.get('/seed', ctrl.seedAdmin);

// ── Auth ──
router.post('/login', ctrl.login);
router.get('/me', adminProtect, ctrl.me);

// ── Dashboard ──
router.get('/dashboard', adminProtect, ctrl.getDashboard);

// ── Users ──
router.get('/users', adminProtect, ctrl.getUsers);
router.get('/users/:id', adminProtect, ctrl.getUser);
router.delete('/users/:id', adminProtect, ctrl.deleteUser);
router.put('/users/:id/ban', adminProtect, ctrl.toggleBanUser);

// ── Verification ──
router.get('/verifications', adminProtect, ctrl.getPendingVerifications);
router.put('/verifications/:workerId', adminProtect, ctrl.verifyWorker);
router.put('/verifications/:workerId/revoke', adminProtect, ctrl.revokeVerification);

// ── Premium ──
router.get('/premium-requests', adminProtect, ctrl.getPremiumRequests);
router.put('/premium/:userId/approve', adminProtect, ctrl.approvePremium);
router.put('/premium/:userId/revoke', adminProtect, ctrl.revokePremium);

// ── Reports ──
router.get('/reports', adminProtect, ctrl.getReports);
router.put('/reports/:reportId', adminProtect, ctrl.reviewReport);

// ── Deletion Requests ──
router.get('/deletion-requests', adminProtect, ctrl.getDeletionRequests);
router.put('/deletion-requests/:requestId', adminProtect, ctrl.reviewDeletionRequest);

module.exports = router;
