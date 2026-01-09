const ClientProfile = require('../models/ClientProfile');
const User = require('../models/User');

// @desc    Obtenir le profil d'un client
// @route   GET /api/client-profile/:userId
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const profile = await ClientProfile.findOne({ userId: req.params.userId })
      .populate('userId', 'fullName email phoneNumber photoURL');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil client non trouvé',
      });
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message,
    });
  }
};

// @desc    Mettre à jour le profil client
// @route   PUT /api/client-profile/:userId
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { address, city, country } = req.body;

    const profile = await ClientProfile.findOneAndUpdate(
      { userId: req.params.userId },
      { address, city, country },
      { new: true, runValidators: true }
    ).populate('userId', 'fullName email phoneNumber photoURL');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil client non trouvé',
      });
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message,
    });
  }
};

// @desc    Obtenir les demandes d'un client
// @route   GET /api/client-profile/:userId/requests
// @access  Private
exports.getClientRequests = async (req, res) => {
  try {
    const ServiceRequest = require('../models/ServiceRequest');

    const requests = await ServiceRequest.find({ clientId: req.params.userId })
      .populate('assignedWorkerId', 'fullName phoneNumber photoURL')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des demandes',
      error: error.message,
    });
  }
};

// @desc    Obtenir les statistiques du client
// @route   GET /api/client-profile/:userId/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const profile = await ClientProfile.findOne({ userId: req.params.userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil client non trouvé',
      });
    }

    res.json({
      success: true,
      stats: {
        totalRequests: profile.totalRequests,
        completedRequests: profile.completedRequests,
        cancelledRequests: profile.cancelledRequests,
        averageRating: profile.averageRating,
        totalReviews: profile.totalReviews,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message,
    });
  }
};

// @desc    Mettre à jour la localisation du client
// @route   PUT /api/client-profile/:userId/location
// @access  Private
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude sont requis',
      });
    }

    const profile = await ClientProfile.findOneAndUpdate(
      { userId: req.params.userId },
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      },
      { new: true, upsert: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil client non trouvé',
      });
    }

    res.json({
      success: true,
      message: 'Localisation mise à jour',
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la localisation',
      error: error.message,
    });
  }
};
