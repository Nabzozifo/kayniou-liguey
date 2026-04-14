const express = require('express');
const router = express.Router();
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

// Routes publiques
router.get('/nearby', getNearbyWorkers); // Chercher des travailleurs à proximité
router.get('/top-rated', getTopRatedWorkers); // Obtenir les workers les mieux notés (pour enchère privée)
router.get('/:userId', getProfile); // Obtenir le profil d'un travailleur
router.get('/:userId/dashboard', getDashboardStats); // Obtenir les stats du dashboard

// Routes protégées
router.put('/:userId', protect, updateProfile); // Mettre à jour le profil
router.put('/:userId/availability', protect, updateAvailability); // Mettre à jour la disponibilité
router.put('/:userId/location', protect, updateLocation); // Mettre à jour la localisation
router.post('/:userId/portfolio', protect, addPortfolioPhoto); // Ajouter une photo au portfolio
router.delete('/:userId/portfolio/:photoId', protect, deletePortfolioPhoto); // Supprimer une photo du portfolio
router.post('/:userId/upload-doc', protect, uploadDocMiddleware.single('doc'), verifyMagicBytes, uploadDoc); // Upload doc d'identité

module.exports = router;
