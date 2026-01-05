/**
 * Service de géolocalisation pour détecter le pays automatiquement
 * Utilise BigDataCloud API (100% gratuit, pas de clé API requise)
 */

const axios = require('axios');
const { WEST_AFRICAN_COUNTRIES } = require('../config/westAfricanCountries');

/**
 * Détecte le pays à partir des coordonnées GPS
 * Utilise BigDataCloud Reverse Geocoding API (gratuit, sans clé)
 *
 * @param {number} latitude - Latitude GPS
 * @param {number} longitude - Longitude GPS
 * @returns {object|null} Informations du pays ou null
 */
async function detectCountryFromCoordinates(latitude, longitude) {
  try {
    console.log(`🌍 Détection pays depuis GPS: ${latitude}, ${longitude}`);

    // BigDataCloud API - 100% gratuit, pas de clé requise
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client`;

    const response = await axios.get(url, {
      params: {
        latitude,
        longitude,
        localityLanguage: 'fr',
      },
      timeout: 5000,
    });

    const countryCode = response.data.countryCode; // ISO 2 lettres (ex: SN, CI)

    if (!countryCode) {
      console.warn('⚠️ Pas de code pays trouvé dans la réponse API');
      return null;
    }

    // Vérifier si le pays est supporté
    const country = WEST_AFRICAN_COUNTRIES[countryCode];

    if (country) {
      console.log(`✅ Pays détecté: ${country.name} (${country.code})`);
      return {
        code: country.code,
        name: country.name,
        dialCode: country.dialCode,
        currency: country.currency,
        flag: country.flag,
        city: response.data.city || response.data.locality,
        region: response.data.principalSubdivision,
      };
    } else {
      console.log(`⚠️ Pays ${countryCode} détecté mais non supporté (hors Afrique de l'Ouest)`);
      return {
        code: countryCode,
        name: response.data.countryName,
        supported: false,
        message: 'Ce pays n\'est pas encore supporté. Nous ciblons l\'Afrique de l\'Ouest francophone.',
      };
    }

  } catch (error) {
    console.error('❌ Erreur détection pays par GPS:', error.message);
    return null;
  }
}

/**
 * Détecte le pays par géolocalisation IP (fallback si pas de GPS)
 * Utilise ipapi.co (gratuit jusqu'à 1000 req/jour)
 *
 * @param {string} ipAddress - Adresse IP (optionnel, auto si non fourni)
 * @returns {object|null} Informations du pays ou null
 */
async function detectCountryFromIP(ipAddress = '') {
  try {
    console.log('🌐 Détection pays depuis IP...');

    // ipapi.co - gratuit, pas de clé requise
    const url = ipAddress
      ? `https://ipapi.co/${ipAddress}/json/`
      : 'https://ipapi.co/json/';

    const response = await axios.get(url, {
      timeout: 5000,
    });

    const countryCode = response.data.country_code;

    if (!countryCode) {
      console.warn('⚠️ Pas de code pays trouvé dans la réponse IP');
      return null;
    }

    const country = WEST_AFRICAN_COUNTRIES[countryCode];

    if (country) {
      console.log(`✅ Pays détecté par IP: ${country.name} (${country.code})`);
      return {
        code: country.code,
        name: country.name,
        dialCode: country.dialCode,
        currency: country.currency,
        flag: country.flag,
        city: response.data.city,
        region: response.data.region,
      };
    } else {
      console.log(`⚠️ Pays ${countryCode} détecté par IP mais non supporté`);
      return {
        code: countryCode,
        name: response.data.country_name,
        supported: false,
        message: 'Ce pays n\'est pas encore supporté.',
      };
    }

  } catch (error) {
    console.error('❌ Erreur détection pays par IP:', error.message);
    return null;
  }
}

/**
 * Détection multi-fallback (GPS > IP > Default)
 *
 * @param {object} options - Options de détection
 * @param {number} options.latitude - Latitude GPS (optionnel)
 * @param {number} options.longitude - Longitude GPS (optionnel)
 * @param {string} options.ipAddress - Adresse IP (optionnel)
 * @returns {object} Informations du pays
 */
async function detectCountryAuto(options = {}) {
  const { latitude, longitude, ipAddress } = options;

  // 1. Essayer GPS d'abord (plus précis)
  if (latitude && longitude) {
    const gpsResult = await detectCountryFromCoordinates(latitude, longitude);
    if (gpsResult && gpsResult.code) {
      return {
        ...gpsResult,
        detectionMethod: 'gps',
      };
    }
  }

  // 2. Fallback sur IP
  if (ipAddress) {
    const ipResult = await detectCountryFromIP(ipAddress);
    if (ipResult && ipResult.code) {
      return {
        ...ipResult,
        detectionMethod: 'ip',
      };
    }
  }

  // 3. Fallback sur défaut (Sénégal)
  console.log('⚠️ Utilisation pays par défaut: Sénégal');
  const defaultCountry = WEST_AFRICAN_COUNTRIES.SN;
  return {
    code: defaultCountry.code,
    name: defaultCountry.name,
    dialCode: defaultCountry.dialCode,
    currency: defaultCountry.currency,
    flag: defaultCountry.flag,
    detectionMethod: 'default',
  };
}

/**
 * Vérifie si un pays est dans notre zone de couverture
 *
 * @param {string} countryCode - Code ISO du pays
 * @returns {boolean}
 */
function isCountrySupported(countryCode) {
  return WEST_AFRICAN_COUNTRIES.hasOwnProperty(countryCode);
}

/**
 * Liste des pays supportés avec leurs zones géographiques approximatives
 * Utile pour affichage carte ou validation
 */
const COUNTRY_BOUNDARIES = {
  SN: { lat: 14.4974, lon: -14.4524, name: 'Sénégal' },
  CI: { lat: 7.5400, lon: -5.5471, name: 'Côte d\'Ivoire' },
  ML: { lat: 17.5707, lon: -3.9962, name: 'Mali' },
  BF: { lat: 12.2383, lon: -1.5616, name: 'Burkina Faso' },
  NE: { lat: 17.6078, lon: 8.0817, name: 'Niger' },
  TG: { lat: 8.6195, lon: 0.8248, name: 'Togo' },
  BJ: { lat: 9.3077, lon: 2.3158, name: 'Bénin' },
  GN: { lat: 9.9456, lon: -9.6966, name: 'Guinée' },
  CM: { lat: 7.3697, lon: 12.3547, name: 'Cameroun' },
  GA: { lat: 0.4162, lon: 9.4673, name: 'Gabon' },
  CG: { lat: -0.2280, lon: 15.8277, name: 'Congo-Brazzaville' },
  TD: { lat: 15.4542, lon: 18.7322, name: 'Tchad' },
  CF: { lat: 6.6111, lon: 20.9394, name: 'RCA' },
  GW: { lat: 11.8037, lon: -15.1804, name: 'Guinée-Bissau' },
};

module.exports = {
  detectCountryFromCoordinates,
  detectCountryFromIP,
  detectCountryAuto,
  isCountrySupported,
  COUNTRY_BOUNDARIES,
};
