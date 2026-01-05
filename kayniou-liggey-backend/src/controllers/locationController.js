/**
 * Contrôleur pour la détection de pays par géolocalisation
 */

const {
  detectCountryFromCoordinates,
  detectCountryFromIP,
  detectCountryAuto,
  isCountrySupported,
} = require('../services/geolocationService');

/**
 * Détecter le pays depuis les coordonnées GPS
 * POST /api/location/detect-country
 * Body: { latitude, longitude, ipAddress? }
 */
exports.detectCountry = async (req, res) => {
  try {
    const { latitude, longitude, ipAddress } = req.body;

    console.log('📍 Requête détection pays:', { latitude, longitude, ipAddress });

    // Utiliser la détection multi-fallback
    const result = await detectCountryAuto({
      latitude,
      longitude,
      ipAddress,
    });

    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Impossible de détecter le pays. Veuillez réessayer.',
      });
    }

    // Vérifier si le pays est supporté
    if (result.supported === false) {
      return res.status(200).json({
        success: true,
        supported: false,
        country: result,
        message: result.message,
      });
    }

    console.log(`✅ Pays détecté: ${result.name} (${result.code}) via ${result.detectionMethod}`);

    res.status(200).json({
      success: true,
      supported: true,
      country: result,
      detectionMethod: result.detectionMethod,
    });

  } catch (error) {
    console.error('❌ Erreur détection pays:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la détection du pays',
      error: error.message,
    });
  }
};

/**
 * Détecter le pays depuis les coordonnées GPS uniquement
 * POST /api/location/detect-country-gps
 * Body: { latitude, longitude }
 */
exports.detectCountryFromGPS = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises',
      });
    }

    console.log(`📍 Détection GPS: ${latitude}, ${longitude}`);

    const result = await detectCountryFromCoordinates(latitude, longitude);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Impossible de détecter le pays depuis ces coordonnées',
      });
    }

    res.status(200).json({
      success: true,
      supported: result.supported !== false,
      country: result,
      detectionMethod: 'gps',
    });

  } catch (error) {
    console.error('❌ Erreur détection GPS:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la détection GPS',
      error: error.message,
    });
  }
};

/**
 * Détecter le pays depuis l'adresse IP uniquement
 * POST /api/location/detect-country-ip
 * Body: { ipAddress? } (optionnel, auto-détecté si absent)
 */
exports.detectCountryFromIPAddress = async (req, res) => {
  try {
    const ipAddress = req.body.ipAddress || req.ip || req.connection.remoteAddress;

    console.log(`🌐 Détection IP: ${ipAddress}`);

    const result = await detectCountryFromIP(ipAddress);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Impossible de détecter le pays depuis cette IP',
      });
    }

    res.status(200).json({
      success: true,
      supported: result.supported !== false,
      country: result,
      detectionMethod: 'ip',
    });

  } catch (error) {
    console.error('❌ Erreur détection IP:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la détection IP',
      error: error.message,
    });
  }
};

/**
 * Vérifier si un pays est supporté
 * GET /api/location/country/:code/supported
 */
exports.checkCountrySupport = async (req, res) => {
  try {
    const { code } = req.params;
    const supported = isCountrySupported(code.toUpperCase());

    res.status(200).json({
      success: true,
      countryCode: code.toUpperCase(),
      supported,
      message: supported
        ? 'Ce pays est supporté'
        : 'Ce pays n\'est pas encore supporté. Nous ciblons l\'Afrique de l\'Ouest francophone.',
    });

  } catch (error) {
    console.error('❌ Erreur vérification pays:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
      error: error.message,
    });
  }
};
