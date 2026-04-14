const express    = require('express');
const rateLimit  = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const router     = express.Router();
const { adminProtect, requireRole } = require('../middleware/adminAuth');
const ctrl = require('../controllers/adminController');

const superAdmin = requireRole('super_admin');
const staffOrUp  = requireRole('super_admin', 'moderator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array().map(e => e.msg) });
  next();
};

const mongoId = (field) => param(field).isMongoId().withMessage(`${field} invalide`);

const approveRules    = [body('months').isInt({ min: 1, max: 120 }).withMessage('Durée invalide (1–120 mois)')];
const verifyRules     = [body('approve').isBoolean().withMessage('approve doit être true/false')];
const reviewRules     = [body('status').isIn(['action_taken', 'reviewed', 'dismissed']).withMessage('Statut invalide')];
const deletionRules   = [body('approve').isBoolean().withMessage('approve doit être true/false')];
const usersQueryRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit invalide (1–100)'),
  query('userType').optional().isIn(['client', 'worker']).withMessage('userType invalide'),
  query('search').optional().isLength({ max: 100 }).withMessage('search : 100 chars max'),
];

// ── Seed initial admin (one-time, dev only) ──
router.get('/seed', ctrl.seedAdmin);

// ── Auth ──
router.post('/login', ctrl.login);
router.get('/me', adminProtect, ctrl.me);

// ── Dashboard ──
router.get('/dashboard', adminProtect, ctrl.getDashboard);

// ── Users ──
router.get('/users',        adminProtect, usersQueryRules, validate, ctrl.getUsers);
router.get('/users/:id',    adminProtect, [mongoId('id')], validate, ctrl.getUser);
router.delete('/users/:id', adminProtect, superAdmin, [mongoId('id')], validate, ctrl.deleteUser);
router.put('/users/:id/ban',adminProtect, staffOrUp, [mongoId('id')], validate, ctrl.toggleBanUser);

// ── Verification ──
router.get('/verifications',                  adminProtect, ctrl.getPendingVerifications);
router.put('/verifications/:workerId',         adminProtect, staffOrUp, [mongoId('workerId'), ...verifyRules], validate, ctrl.verifyWorker);
router.put('/verifications/:workerId/revoke',  adminProtect, staffOrUp, [mongoId('workerId')], validate, ctrl.revokeVerification);

// ── Premium ──
router.get('/premium-requests',          adminProtect, ctrl.getPremiumRequests);
router.put('/premium/:userId/approve',   adminProtect, staffOrUp, [mongoId('userId'), ...approveRules], validate, ctrl.approvePremium);
router.put('/premium/:userId/revoke',    adminProtect, staffOrUp, [mongoId('userId')], validate, ctrl.revokePremium);

// ── Reports ──
router.get('/reports',           adminProtect, ctrl.getReports);
router.put('/reports/:reportId', adminProtect, staffOrUp, [mongoId('reportId'), ...reviewRules], validate, ctrl.reviewReport);

// ── Deletion Requests ──
router.get('/deletion-requests',             adminProtect, ctrl.getDeletionRequests);
router.put('/deletion-requests/:requestId',  adminProtect, superAdmin, [mongoId('requestId'), ...deletionRules], validate, ctrl.reviewDeletionRequest);

// ── Private Documents (rate-limited, token via query param for <img> tags) ──
const docLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
router.get('/documents/:filename', docLimiter, ctrl.serveDocument);

module.exports = router;
