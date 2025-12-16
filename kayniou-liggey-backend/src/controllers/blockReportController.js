const BlockReport = require('../models/BlockReport');
const User = require('../models/User');

// @desc    Block a user
// @route   POST /api/block-report/block
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    const { targetId } = req.body;
    const reporterId = req.user.id;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'ID de l\'utilisateur à bloquer requis',
      });
    }

    // Cannot block yourself
    if (reporterId === targetId) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas vous bloquer vous-même',
      });
    }

    // Verify target user exists
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Check if already blocked
    const existingBlock = await BlockReport.findOne({
      reporterId,
      targetId,
      type: 'block',
    });

    if (existingBlock) {
      return res.status(400).json({
        success: false,
        message: 'Utilisateur déjà bloqué',
      });
    }

    // Create block
    const block = await BlockReport.create({
      reporterId,
      targetId,
      type: 'block',
    });

    console.log(`🚫 User ${reporterId} blocked ${targetId}`);

    res.json({
      success: true,
      message: 'Utilisateur bloqué avec succès',
      block,
    });
  } catch (error) {
    console.error('❌ Error blockUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du blocage',
      error: error.message,
    });
  }
};

// @desc    Unblock a user
// @route   DELETE /api/block-report/block/:targetId
// @access  Private
exports.unblockUser = async (req, res) => {
  try {
    const { targetId } = req.params;
    const reporterId = req.user.id;

    const block = await BlockReport.findOneAndDelete({
      reporterId,
      targetId,
      type: 'block',
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Blocage non trouvé',
      });
    }

    console.log(`✅ User ${reporterId} unblocked ${targetId}`);

    res.json({
      success: true,
      message: 'Utilisateur débloqué avec succès',
    });
  } catch (error) {
    console.error('❌ Error unblockUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du déblocage',
      error: error.message,
    });
  }
};

// @desc    Get blocked users
// @route   GET /api/block-report/blocked
// @access  Private
exports.getBlockedUsers = async (req, res) => {
  try {
    const reporterId = req.user.id;

    const blocks = await BlockReport.find({
      reporterId,
      type: 'block',
    }).populate('targetId', 'fullName photoURL userType');

    res.json({
      success: true,
      count: blocks.length,
      blocks,
    });
  } catch (error) {
    console.error('❌ Error getBlockedUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs bloqués',
      error: error.message,
    });
  }
};

// @desc    Report a user
// @route   POST /api/block-report/report
// @access  Private
exports.reportUser = async (req, res) => {
  try {
    const {
      targetId,
      reason,
      description,
      relatedResource,
      evidence,
    } = req.body;
    const reporterId = req.user.id;

    if (!targetId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur et raison requis',
      });
    }

    // Cannot report yourself
    if (reporterId === targetId) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas vous signaler vous-même',
      });
    }

    // Verify target user exists
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Create report
    const report = await BlockReport.create({
      reporterId,
      targetId,
      type: 'report',
      reason,
      description,
      relatedResource,
      evidence: evidence || [],
      status: 'pending',
    });

    console.log(`⚠️ User ${reporterId} reported ${targetId} for ${reason}`);

    // TODO: Send notification to admin

    res.json({
      success: true,
      message: 'Signalement envoyé avec succès. Notre équipe examinera votre rapport.',
      report,
    });
  } catch (error) {
    console.error('❌ Error reportUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du signalement',
      error: error.message,
    });
  }
};

// @desc    Get user's reports
// @route   GET /api/block-report/my-reports
// @access  Private
exports.getMyReports = async (req, res) => {
  try {
    const reporterId = req.user.id;

    const reports = await BlockReport.find({
      reporterId,
      type: 'report',
    })
      .populate('targetId', 'fullName photoURL userType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error('❌ Error getMyReports:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des signalements',
      error: error.message,
    });
  }
};

// @desc    Check if user is blocked
// @route   GET /api/block-report/is-blocked/:targetId
// @access  Private
exports.isBlocked = async (req, res) => {
  try {
    const { targetId } = req.params;
    const reporterId = req.user.id;

    const blocked = await BlockReport.isBlocked(reporterId, targetId);
    const blockedBy = await BlockReport.isBlockedBy(targetId, reporterId);

    res.json({
      success: true,
      blocked, // You blocked this user
      blockedBy, // This user blocked you
    });
  } catch (error) {
    console.error('❌ Error isBlocked:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
      error: error.message,
    });
  }
};

// ============= ADMIN ROUTES =============

// @desc    Get all reports (Admin only)
// @route   GET /api/block-report/admin/reports
// @access  Private (Admin)
exports.getAllReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { type: 'report' };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await BlockReport.find(query)
      .populate('reporterId', 'fullName photoURL userType')
      .populate('targetId', 'fullName photoURL userType')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BlockReport.countDocuments(query);

    res.json({
      success: true,
      count: reports.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      reports,
    });
  } catch (error) {
    console.error('❌ Error getAllReports:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des signalements',
      error: error.message,
    });
  }
};

// @desc    Review a report (Admin only)
// @route   PUT /api/block-report/admin/reports/:id
// @access  Private (Admin)
exports.reviewReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes, actionTaken } = req.body;
    const adminId = req.user.id;

    const report = await BlockReport.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Signalement non trouvé',
      });
    }

    report.status = status || report.status;
    report.reviewedBy = adminId;
    report.reviewedAt = new Date();
    report.reviewNotes = reviewNotes || report.reviewNotes;
    report.actionTaken = actionTaken || report.actionTaken;

    await report.save();

    console.log(`✅ Admin ${adminId} reviewed report ${id}: ${status}`);

    res.json({
      success: true,
      message: 'Signalement traité avec succès',
      report,
    });
  } catch (error) {
    console.error('❌ Error reviewReport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement du signalement',
      error: error.message,
    });
  }
};

module.exports = exports;
