// Configuration régionale pour la devise et les formats de téléphone

export const REGIONAL_CONFIG = {
  SN: { // Sénégal
    name: 'Sénégal',
    currency: 'FCFA',
    currencySymbol: 'F CFA',
    currencyPosition: 'after', // 'before' or 'after'
    phoneFormat: '+221 XX XXX XX XX',
    phonePrefix: '+221',
    phoneRegex: /^\+221[0-9]{9}$/,
    phoneLength: 9, // After prefix
    locale: 'fr-SN',
  },
  CI: { // Côte d'Ivoire
    name: 'Côte d\'Ivoire',
    currency: 'FCFA',
    currencySymbol: 'F CFA',
    currencyPosition: 'after',
    phoneFormat: '+225 XX XX XX XX XX',
    phonePrefix: '+225',
    phoneRegex: /^\+225[0-9]{10}$/,
    phoneLength: 10,
    locale: 'fr-CI',
  },
  ML: { // Mali
    name: 'Mali',
    currency: 'FCFA',
    currencySymbol: 'F CFA',
    currencyPosition: 'after',
    phoneFormat: '+223 XX XX XX XX',
    phonePrefix: '+223',
    phoneRegex: /^\+223[0-9]{8}$/,
    phoneLength: 8,
    locale: 'fr-ML',
  },
  FR: { // France
    name: 'France',
    currency: 'EUR',
    currencySymbol: '€',
    currencyPosition: 'after',
    phoneFormat: '+33 X XX XX XX XX',
    phonePrefix: '+33',
    phoneRegex: /^\+33[0-9]{9}$/,
    phoneLength: 9,
    locale: 'fr-FR',
  },
  US: { // États-Unis
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    currencyPosition: 'before',
    phoneFormat: '+1 (XXX) XXX-XXXX',
    phonePrefix: '+1',
    phoneRegex: /^\+1[0-9]{10}$/,
    phoneLength: 10,
    locale: 'en-US',
  },
  CA: { // Canada
    name: 'Canada',
    currency: 'CAD',
    currencySymbol: '$',
    currencyPosition: 'before',
    phoneFormat: '+1 (XXX) XXX-XXXX',
    phonePrefix: '+1',
    phoneRegex: /^\+1[0-9]{10}$/,
    phoneLength: 10,
    locale: 'fr-CA',
  },
};

// Région par défaut
export const DEFAULT_REGION = 'SN';

// Obtenir la configuration de la région actuelle
export const getCurrentRegion = () => {
  // Pour l'instant, retourne la région par défaut
  // Plus tard, on pourra détecter automatiquement ou laisser l'utilisateur choisir
  return REGIONAL_CONFIG[DEFAULT_REGION];
};

// Formater un montant avec la devise de la région
export const formatCurrency = (amount, regionCode = DEFAULT_REGION) => {
  const region = REGIONAL_CONFIG[regionCode] || REGIONAL_CONFIG[DEFAULT_REGION];
  const formattedAmount = new Intl.NumberFormat(region.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  if (region.currencyPosition === 'before') {
    return `${region.currencySymbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${region.currencySymbol}`;
  }
};

// Formater un numéro de téléphone
export const formatPhoneNumber = (phone, regionCode = DEFAULT_REGION) => {
  const region = REGIONAL_CONFIG[regionCode] || REGIONAL_CONFIG[DEFAULT_REGION];

  // Supprimer tous les caractères non numériques et le préfixe
  let cleaned = phone.replace(/\D/g, '');

  // Si le numéro commence par le préfixe du pays (sans le +), le supprimer
  const prefixDigits = region.phonePrefix.replace('+', '');
  if (cleaned.startsWith(prefixDigits)) {
    cleaned = cleaned.substring(prefixDigits.length);
  }

  // Ajouter le préfixe
  return `${region.phonePrefix} ${cleaned}`;
};

// Valider un numéro de téléphone
export const validatePhoneNumber = (phone, regionCode = DEFAULT_REGION) => {
  const region = REGIONAL_CONFIG[regionCode] || REGIONAL_CONFIG[DEFAULT_REGION];
  return region.phoneRegex.test(phone);
};

// Liste des régions disponibles pour le sélecteur
export const getAvailableRegions = () => {
  return Object.entries(REGIONAL_CONFIG).map(([code, config]) => ({
    code,
    name: config.name,
    currency: config.currency,
    currencySymbol: config.currencySymbol,
    phonePrefix: config.phonePrefix,
  }));
};
