/**
 * Configuration régionale - Importé depuis westAfricanCountries
 * Pour compatibilité avec le code existant
 */

import {
  WEST_AFRICAN_COUNTRIES,
  detectCountryFromPhone,
  formatPhoneNumber as formatPhone,
  formatCurrency as formatMoney,
  getSupportedCountries,
} from './westAfricanCountries';

// Région par défaut (Sénégal/FCFA - l'app est principalement pour l'Afrique de l'Ouest)
export const DEFAULT_REGION = 'SN';

// Export de la config complète pour compatibilité
export const REGIONAL_CONFIG = WEST_AFRICAN_COUNTRIES;

// Obtenir la configuration de la région actuelle
// Si phoneNumber fourni, détecte le pays automatiquement
// Sinon retourne le pays par défaut (Sénégal)
export const getCurrentRegion = (phoneNumber = null) => {
  if (phoneNumber) {
    const detectedCountry = detectCountryFromPhone(phoneNumber);
    if (detectedCountry) {
      return detectedCountry;
    }
  }
  return WEST_AFRICAN_COUNTRIES[DEFAULT_REGION];
};

// Formater un montant avec la devise de la région
export const formatCurrency = (amount, regionCode = DEFAULT_REGION) => {
  return formatMoney(amount, regionCode);
};

// Formater un numéro de téléphone
export const formatPhoneNumber = (phone, regionCode = null) => {
  return formatPhone(phone, regionCode);
};

// Valider un numéro de téléphone
export const validatePhoneNumber = (phone, regionCode = null) => {
  if (!phone) return false;

  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const country = regionCode
    ? WEST_AFRICAN_COUNTRIES[regionCode]
    : detectCountryFromPhone(cleanPhone);

  if (!country || !country.phoneRegex) return false;

  return country.phoneRegex.test(cleanPhone);
};

// Liste des régions disponibles pour le sélecteur
export const getAvailableRegions = () => {
  return getSupportedCountries();
};

// Détecter le pays automatiquement
export const detectCountry = (phoneNumber) => {
  return detectCountryFromPhone(phoneNumber);
};
