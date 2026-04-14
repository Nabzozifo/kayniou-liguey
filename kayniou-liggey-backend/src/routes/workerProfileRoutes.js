const express = require('express');
const router  = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const {
  getProfile,
  updateProfile,
  updateAvailability,
  updateLocation,
  getNearbyWorkers,
  addPortfolioPhoto,
  deletePortfolioPhoto,
  getDashboardStats,
  getTopRatedWorkers,
  uploadDoc,
} = require('../controllers/workerProfileController');
const { protect } = require('../middleware/authMiddleware');
const { upload: uploadDocMiddleware, verifyMagicBytes } = require('../middleware/uploadDoc');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array().map(e => e.msg) });
  next();
};

const updateProfileRules = [
  body('bio').optional().trim().isLength({ max: 1000 }).withMessage('Bio : 1000 chars max'),
  body('dob').optional().isISO8601().withMessage('Date de naissance invalide (AAAA-MM-JJ)'),
  body('address').optional().trim().isLength({ max: 300 }).withMessage('Adresse : 300 chars max'),
  body('hourlyRate').optional().isFloat({ min: 0, max: 1000000 }).withMessage('Tarif invalide'),
  body('serviceRadius').optional().isInt({ min: 1, max: 500 }).withMessage('Rayon invalide (1–500 km)'),
  body('identityDocuments.idType').optional().isIn(['cin', 'passport', 'permis', 'carte_sejour']).withMessage('Type de pièce invalide'),
  body('identityDocuments.idNumber').optional().trim().isLength({ max: 50 }).withMessage('Numéro de pièce : 50 chars max'),
];

const locationRules = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude invalide'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude invalide'),
];

const nearbyRules = [
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude invalide'),
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude invalide'),
  query('radius').optional().isInt({ min: 1, max: 500 }).withMessage('Rayon invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide'),
];

const uploadDocRules = [
  body('docType').isIn(['recto', 'verso', 'page']).withMessage('docType invalide'),
];

// Routes publiques
router.get('/nearby',    nearbyRules, validate, getNearbyWorkers);
router.get('/top-rated', getTopRatedWorkers);
router.get('/:userId',            getProfile);
router.get('/:userId/dashboard',  getDashboardStats);

// Routes protégées
router.put('/:userId',            protect, updateProfileRules, validate, updateProfile);
router.put('/:userId/availability', protect, updateAvailability);
router.put('/:userId/location',   protect, locationRules, validate, updateLocation);
router.post('/:userId/portfolio', protect, addPortfolioPhoto);
router.delete('/:userId/portfolio/:photoId', protect, deletePortfolioPhoto);
router.post('/:userId/upload-doc', protect, uploadDocMiddleware.single('doc'), verifyMagicBytes, uploadDocRules, validate, uploadDoc);

module.exports = router;
