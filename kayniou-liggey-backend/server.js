require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const http    = require('http');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const socketIo  = require('socket.io');
const jwt       = require('jsonwebtoken');
const connectDB = require('./src/config/database');
const { startExpirationChecker } = require('./src/utils/expirationChecker');

// ── App ──────────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── Socket.IO ────────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:8081';
const io = socketIo(server, {
  cors: { origin: ALLOWED_ORIGIN, methods: ['GET', 'POST'] },
});

// ── DB ───────────────────────────────────────────────────────────────────────
connectDB();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));

// ── CORS — restrict to known frontend origin ──────────────────────────────────
app.use(cors({
  origin: ALLOWED_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200,
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── Request logging (no sensitive fields) ────────────────────────────────────
const REDACTED_KEYS = new Set(['password', 'token', 'Authorization', 'authorization', 'secret']);
function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, REDACTED_KEYS.has(k) ? '[REDACTED]' : v])
  );
}
app.use((req, _res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  if (Object.keys(req.query).length) console.log('Query:', redact(req.query));
  next();
});

// ── Global rate limiter (all routes) ─────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes, réessayez dans 15 minutes.' },
});
app.use(globalLimiter);

// ── Auth rate limiter (login / register) ─────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de tentatives, réessayez dans 15 minutes.' },
});
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',                  require('./src/routes/authRoutes'));
app.use('/api/client-profile',        require('./src/routes/clientProfileRoutes'));
app.use('/api/worker-profile',        require('./src/routes/workerProfileRoutes'));
app.use('/api/service-requests',      require('./src/routes/serviceRequestRoutes'));
app.use('/api/quotes',                require('./src/routes/quoteRoutes'));
app.use('/api/chat',                  require('./src/routes/chatRoutes'));
app.use('/api/evaluations',           require('./src/routes/evaluationRoutes'));
app.use('/api/nlp',                   require('./src/routes/nlpRoutes'));
app.use('/api/notifications',         require('./src/routes/notificationRoutes'));
app.use('/api/worksites',             require('./src/routes/worksiteRoutes'));
app.use('/api/block-report',          require('./src/routes/blockReportRoutes'));
app.use('/api/ratings',               require('./src/routes/ratingRoutes'));
app.use('/api/worker-recommendations',require('./src/routes/workerRecommendationRoutes'));
app.use('/api/chatbot',               require('./src/routes/chatbotRoutes'));
app.use('/api/location',              require('./src/routes/locationRoutes'));
app.use('/api/subscription',          require('./src/routes/subscriptionRoutes'));
app.use('/api/admin',                 require('./src/routes/adminRoutes'));

// ── Admin panel ───────────────────────────────────────────────────────────────
app.get('/admin', (_req, res) => {
  res.sendFile(require('path').join(__dirname, 'public/admin/index.html'));
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({ success: true, message: '🚀 Kayniou Liggey API est en ligne !', version: '1.0.0' });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route non trouvée' });
});

// ── Global error handler (no stack traces to client) ─────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(err.status || 500).json({ success: false, message: 'Erreur serveur interne' });
});

// ── Socket.IO — JWT auth middleware ───────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) return next(new Error('Non autorisé'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Token invalide'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ Socket connecté: user ${socket.userId}`);

  socket.on('joinConversation', (conversationId) => {
    if (typeof conversationId !== 'string' || conversationId.length > 100) return;
    socket.join(conversationId);
  });

  socket.on('sendMessage', (message) => {
    if (!message?.conversationId) return;
    // Attach verified userId from token, not from client payload
    io.to(message.conversationId).emit('newMessage', { ...message, senderId: socket.userId });
  });

  socket.on('markAsRead', ({ conversationId }) => {
    if (!conversationId) return;
    io.to(conversationId).emit('messagesRead', { userId: socket.userId });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket déconnecté: user ${socket.userId}`);
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  startExpirationChecker(5);
});
