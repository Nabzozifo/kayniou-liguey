const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequest,
  getAllRequests,
  updateRequest,
  updateStatus,
  assignWorker,
  deleteRequest,
  getRequestQuotes,
  getAvailableRequestsForWorker,
} = require('../controllers/serviceRequestController');
const { protect } = require('../middleware/authMiddleware');

// Routes publiques
router.get('/', getAllRequests); // Obtenir toutes les demandes (avec filtres)
router.get('/available-for-worker/:workerId', getAvailableRequestsForWorker); // Demandes filtrées par métiers du worker
router.get('/:id', getRequest); // Obtenir une demande spécifique
router.get('/:id/quotes', getRequestQuotes); // Obtenir les devis pour une demande

// Routes protégées
router.post('/', protect, createRequest); // Créer une demande (client uniquement)
router.put('/:id', protect, updateRequest); // Mettre à jour une demande (owner uniquement)
router.put('/:id/status', protect, updateStatus); // Changer le statut
router.put('/:id/assign', protect, assignWorker); // Assigner un travailleur (client owner uniquement)
router.delete('/:id', protect, deleteRequest); // Supprimer une demande (owner uniquement)

module.exports = router;
