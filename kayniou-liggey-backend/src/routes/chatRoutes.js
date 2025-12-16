const express = require('express');
const router = express.Router();
const {
  createOrGetConversation,
  getUserConversations,
  getConversation,
  sendMessage,
  getMessages,
  markAsRead,
  deleteConversation,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Toutes les routes de chat nécessitent une authentification
router.use(protect);

// Routes de conversations
router.post('/conversations', createOrGetConversation); // Créer ou obtenir une conversation
router.get('/conversations', getUserConversations); // Obtenir les conversations d'un utilisateur
router.get('/conversations/:id', getConversation); // Obtenir une conversation spécifique
router.delete('/conversations/:id', deleteConversation); // Supprimer une conversation

// Routes de messages
router.post('/messages', sendMessage); // Envoyer un message
router.get('/conversations/:id/messages', getMessages); // Obtenir les messages d'une conversation
router.put('/conversations/:id/read', markAsRead); // Marquer les messages comme lus

module.exports = router;
