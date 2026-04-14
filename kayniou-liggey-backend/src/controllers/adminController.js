const jwt = require('jsonwebtoken');
const path = require('path');
const fs   = require('fs');
const Admin = require('../models/Admin');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const DeletedUser = require('../models/DeletedUser');
const DeletionRequest = require('../models/DeletionRequest');
const ServiceRequest = require('../models/ServiceRequest');
const Quote = require('../models/Quote');
const BlockReport = require('../models/BlockReport');
const { sendPushNotification } = require('../utils/pushNotificationSender');

// ─── AUTH ────────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username et mot de passe requis' });

    const admin = await Admin.findOne({ username }).select('+password');
    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });

    if (!admin.isActive)
      return res.status(401).json({ success: false, message: 'Compte désactivé' });

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, type: 'admin', role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      admin: { id: admin._id, username: admin.username, fullName: admin.fullName, role: admin.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.me = async (req, res) => {
  res.json({ success: true, admin: req.admin });
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalClients,
      totalWorkers,
      verifiedWorkers,
      premiumWorkers,
      pendingReports,
      totalRequests,
      totalQuotes,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ userType: 'client' }),
      User.countDocuments({ userType: 'worker' }),
      WorkerProfile.countDocuments({ isVerified: true }),
      User.countDocuments({ 'subscription.plan': 'premium', 'subscription.status': 'active' }),
      BlockReport.countDocuments({ type: 'report', status: 'pending' }),
      ServiceRequest.countDocuments(),
      Quote.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('fullName userType createdAt email'),
    ]);

    // Inscriptions par semaine (7 derniers jours)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      success: true,
      stats: {
        totalUsers, totalClients, totalWorkers, verifiedWorkers,
        premiumWorkers, pendingReports, totalRequests, totalQuotes,
        newUsersThisWeek,
      },
      recentUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── USERS ───────────────────────────────────────────────────────────────────

exports.getUsers = async (req, res) => {
  try {
    const rawPage  = Math.max(1, parseInt(req.query.page)  || 1);
    const rawLimit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { userType, search, sort = '-createdAt' } = req.query;

    const filter = {};
    if (userType && ['client', 'worker'].includes(userType)) filter.userType = userType;
    if (search) {
      // Escape regex special chars to prevent NoSQL injection
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);
      filter.$or = [
        { fullName:    { $regex: escaped, $options: 'i' } },
        { email:       { $regex: escaped, $options: 'i' } },
        { phoneNumber: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip((rawPage - 1) * rawLimit)
        .limit(rawLimit)
        .select('-password'),
      User.countDocuments(filter),
    ]);

    // Enrichir les workers avec leur profil de vérification
    const enriched = await Promise.all(
      users.map(async (u) => {
        const obj = u.toObject();
        if (u.userType === 'worker') {
          const wp = await WorkerProfile.findOne({ userId: u._id }).select('isVerified categories isAvailable');
          obj.workerProfile = wp;
        }
        return obj;
      })
    );

    res.json({ success: true, users: enriched, total, pages: Math.ceil(total / rawLimit), page: rawPage });
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });

    let workerProfile = null;
    if (user.userType === 'worker') {
      workerProfile = await WorkerProfile.findOne({ userId: user._id });
    }

    const requests = await ServiceRequest.countDocuments(
      user.userType === 'client' ? { clientId: user._id } : {}
    );
    const reports = await BlockReport.find({
      $or: [{ reporterId: user._id }, { targetId: user._id }],
      type: 'report',
    }).sort({ createdAt: -1 }).limit(5);

    res.json({ success: true, user, workerProfile, stats: { requests }, reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });

    // Archiver dans deleted_users avant suppression
    let isVerified = false;
    if (user.userType === 'worker') {
      const wp = await WorkerProfile.findOne({ userId: user._id }).select('isVerified');
      isVerified = wp?.isVerified || false;
    }
    await DeletedUser.create({
      originalId: user._id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      userType: user.userType,
      country: user.country,
      subscription: user.subscription,
      isVerified,
      createdAt_original: user.createdAt,
      deletedBy: 'admin',
    });

    await User.findByIdAndDelete(req.params.id);
    if (user.userType === 'worker') {
      await WorkerProfile.findOneAndDelete({ userId: req.params.id });
    }

    res.json({ success: true, message: 'Utilisateur supprimé et archivé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, isActive: user.isActive, message: user.isActive ? 'Utilisateur réactivé' : 'Utilisateur banni' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── VERIFICATION ─────────────────────────────────────────────────────────────

exports.getPendingVerifications = async (req, res) => {
  try {
    // Workers avec identityDocument rempli mais pas encore vérifiés
    const profiles = await WorkerProfile.find({
      'identityVerification.idNumber': { $exists: true, $ne: null },
      isVerified: false,
    }).lean();

    const enriched = await Promise.all(
      profiles.map(async (p) => {
        const user = await User.findById(p.userId).select('fullName email phoneNumber createdAt');
        return { ...p, user };
      })
    );

    res.json({ success: true, verifications: enriched, total: enriched.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.verifyWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { approve, notes } = req.body;

    const profile = await WorkerProfile.findOne({ userId: workerId });
    if (!profile) return res.status(404).json({ success: false, message: 'Profil non trouvé' });

    profile.isVerified = !!approve;
    profile.verificationDate = approve ? new Date() : null;
    profile.identityVerification = profile.identityVerification || {};
    profile.identityVerification.isVerified = !!approve;
    profile.identityVerification.verifiedAt = approve ? new Date() : null;
    if (notes) profile.identityVerification.rejectionReason = notes;
    await profile.save();

    // Send push notification to worker
    sendPushNotification(workerId, approve ? {
      title: 'Identité vérifiée ✓',
      body: 'Félicitations ! Votre identité a été validée. Votre badge bleu est maintenant actif.',
      data: { type: 'verification_approved' },
    } : {
      title: 'Vérification refusée',
      body: notes ? `Motif : ${notes}` : 'Votre dossier n\'a pas été accepté. Soumettez à nouveau avec les bons documents.',
      data: { type: 'verification_rejected' },
    }).catch(() => {}); // non-blocking

    res.json({
      success: true,
      message: approve ? 'Travailleur vérifié ✓' : 'Vérification refusée',
      isVerified: profile.isVerified,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.revokeVerification = async (req, res) => {
  try {
    const { workerId } = req.params;
    const profile = await WorkerProfile.findOne({ userId: workerId });
    if (!profile) return res.status(404).json({ success: false, message: 'Profil non trouvé' });

    profile.isVerified = false;
    profile.verificationDate = null;
    if (profile.identityVerification) {
      profile.identityVerification.isVerified = false;
      profile.identityVerification.verifiedAt = null;
      profile.identityVerification.rejectionReason = 'Vérification révoquée par l\'admin';
    }
    await profile.save();

    sendPushNotification(workerId, {
      title: 'Vérification révoquée',
      body: 'Votre badge de vérification a été révoqué. Contactez le support pour plus d\'informations.',
      data: { type: 'verification_rejected' },
    }).catch(() => {});

    res.json({ success: true, message: 'Vérification révoquée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── PREMIUM / SUBSCRIPTIONS ─────────────────────────────────────────────────

exports.getPremiumRequests = async (req, res) => {
  try {
    // Workers en plan basic qui ont fait une demande de premium
    // (subscription.status = 'pending' ou plan = 'basic' mais demande en attente)
    const workers = await User.find({
      userType: 'worker',
      'subscription.status': 'pending',
    }).select('-password').sort({ 'subscription.startDate': -1 });

    res.json({ success: true, requests: workers, total: workers.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.approvePremium = async (req, res) => {
  try {
    const { userId } = req.params;
    const { months = 1 } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + Number(months));

    user.subscription = {
      plan: 'premium',
      status: 'active',
      startDate,
      endDate,
      autoRenew: false,
    };
    await user.save();

    // Send push notification to worker
    sendPushNotification(userId, {
      title: 'Premium activé ! 🏆',
      body: `Votre abonnement Premium est actif pour ${months} mois. Profitez de tous vos avantages !`,
      data: { type: 'premium_approved' },
    }).catch(() => {}); // non-blocking

    res.json({ success: true, message: `Premium activé pour ${months} mois`, endDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.revokePremium = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });

    user.subscription = { plan: 'basic', status: 'active', startDate: null, endDate: null };
    await user.save();

    res.json({ success: true, message: 'Premium révoqué' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── REPORTS / PLAINTES ───────────────────────────────────────────────────────

exports.getReports = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const filter = { type: 'report' };
    if (status !== 'all') filter.status = status;

    const [reports, total] = await Promise.all([
      BlockReport.find(filter)
        .populate('reporterId', 'fullName email userType photoURL')
        .populate('targetId', 'fullName email userType photoURL')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      BlockReport.countDocuments(filter),
    ]);

    res.json({ success: true, reports, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.reviewReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, notes, actionTaken } = req.body;

    const report = await BlockReport.findById(reportId);
    if (!report) return res.status(404).json({ success: false, message: 'Signalement non trouvé' });

    report.status = status;
    report.reviewNotes = notes;
    report.actionTaken = actionTaken;
    report.reviewedBy = req.admin._id;
    report.reviewedAt = new Date();
    await report.save();

    res.json({ success: true, message: 'Signalement mis à jour' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── DELETION REQUESTS ────────────────────────────────────────────────────────

exports.getDeletionRequests = async (req, res) => {
  try {
    const requests = await DeletionRequest.find({ status: 'pending' })
      .populate('userId', 'fullName email phoneNumber userType createdAt')
      .sort({ requestedAt: -1 });
    res.json({ success: true, requests, total: requests.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.reviewDeletionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { approve, notes } = req.body;

    const request = await DeletionRequest.findById(requestId).populate('userId');
    if (!request) return res.status(404).json({ success: false, message: 'Demande introuvable' });

    request.status = approve ? 'approved' : 'rejected';
    request.reviewedAt = new Date();
    request.reviewedBy = req.admin._id;
    request.reviewNotes = notes || null;
    await request.save();

    if (approve && request.userId) {
      const user = request.userId;

      // Archiver dans deleted_users
      let isVerified = false;
      if (user.userType === 'worker') {
        const wp = await WorkerProfile.findOne({ userId: user._id }).select('isVerified');
        isVerified = wp?.isVerified || false;
      }
      await DeletedUser.create({
        originalId: user._id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
        country: user.country,
        subscription: user.subscription,
        isVerified,
        createdAt_original: user.createdAt,
        deletedBy: 'user_request',
        deletionReason: request.reason || null,
        requestedAt: request.requestedAt,
      });

      // Supprimer l'utilisateur et son profil
      await User.findByIdAndDelete(user._id);
      if (user.userType === 'worker') {
        await WorkerProfile.findOneAndDelete({ userId: user._id });
      }
    } else if (!approve) {
      // Notifier l'utilisateur du refus
      sendPushNotification(request.userId._id.toString(), {
        title: 'Demande de suppression',
        body: notes ? `Votre demande a été refusée : ${notes}` : 'Votre demande de suppression de compte a été refusée.',
        data: { type: 'deletion_rejected' },
      }).catch(() => {});
    }

    res.json({ success: true, message: approve ? 'Compte supprimé' : 'Demande refusée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── SEED ─────────────────────────────────────────────────────────────────────

exports.seedAdmin = async (req, res) => {
  // Only available in development environment
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ success: false, message: 'Non autorisé' });
  }
  try {
    const exists = await Admin.findOne({ username: 'admin' });
    if (exists) return res.json({ success: false, message: 'Admin déjà créé' });

    await Admin.create({
      username: 'admin',
      password: process.env.ADMIN_SEED_PASSWORD || 'kayniou2025!',
      fullName: 'Super Admin',
      role: 'super_admin',
    });

    // Never return credentials in response
    res.json({ success: true, message: 'Admin créé avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── PRIVATE DOCUMENTS ───────────────────────────────────────────────────────

exports.serveDocument = (req, res) => {
  // Auth via header OR query param (for <img> tags)
  const token =
    (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]) ||
    req.query.token;

  if (!token) return res.status(401).json({ success: false, message: 'Non autorisé' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'admin') return res.status(403).json({ success: false, message: 'Réservé aux admins' });
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalide' });
  }

  // Prevent path traversal
  const filename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, '../../private/id-docs', filename);

  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Fichier non trouvé' });

  res.sendFile(filePath);
};
