require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./src/config/database');

// Créer l'application Express
const app = express();

// Créer le serveur HTTP
const server = http.createServer(app);

// Configurer Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8081',
    methods: ['GET', 'POST'],
  },
});

// Connecter à MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  next();
});

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/client-profile', require('./src/routes/clientProfileRoutes'));
app.use('/api/worker-profile', require('./src/routes/workerProfileRoutes'));
app.use('/api/service-requests', require('./src/routes/serviceRequestRoutes'));
app.use('/api/quotes', require('./src/routes/quoteRoutes'));
app.use('/api/chat', require('./src/routes/chatRoutes'));
app.use('/api/evaluations', require('./src/routes/evaluationRoutes'));
app.use('/api/nlp', require('./src/routes/nlpRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/worksites', require('./src/routes/worksiteRoutes'));
app.use('/api/block-report', require('./src/routes/blockReportRoutes'));
app.use('/api/ratings', require('./src/routes/ratingRoutes'));
app.use('/api/worker-recommendations', require('./src/routes/workerRecommendationRoutes'));
app.use('/api/chatbot', require('./src/routes/chatbotRoutes'));
app.use('/api/location', require('./src/routes/locationRoutes'));

// Route de test
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Kayniou Liggey API est en ligne !',
    version: '1.0.0',
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  console.log(`❌ 404 - Route non trouvée: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.path}`,
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur',
    error: err.message,
  });
});

// Socket.IO pour le chat en temps réel
io.on('connection', (socket) => {
  console.log('✅ Nouveau client connecté:', socket.id);

  // Rejoindre une conversation
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`📩 Client ${socket.id} a rejoint la conversation ${conversationId}`);
  });

  // Envoyer un message
  socket.on('sendMessage', (message) => {
    io.to(message.conversationId).emit('newMessage', message);
  });

  // Marquer comme lu
  socket.on('markAsRead', ({ conversationId, userId }) => {
    io.to(conversationId).emit('messagesRead', { userId });
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log('❌ Client déconnecté:', socket.id);
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 Socket.IO prêt pour le chat en temps réel`);
});
