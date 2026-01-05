const express = require('express');
const router = express.Router();
const {
  detectCountry,
  detectCountryFromGPS,
  detectCountryFromIPAddress,
  checkCountrySupport,
} = require('../controllers/locationController');

/**
 * Routes de géolocalisation et détection de pays
 * Pas besoin d'authentification pour ces routes (utilisées avant/pendant inscription)
 */

// Détection multi-fallback (GPS > IP > Default)
router.post('/detect-country', detectCountry);

// Détection GPS uniquement
router.post('/detect-country-gps', detectCountryFromGPS);

// Détection IP uniquement
router.post('/detect-country-ip', detectCountryFromIPAddress);

// Vérifier si un pays est supporté
router.get('/country/:code/supported', checkCountrySupport);

module.exports = router;
