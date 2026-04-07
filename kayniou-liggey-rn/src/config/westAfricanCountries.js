/**
 * Configuration des pays d'Afrique de l'Ouest francophone
 * Détection automatique par indicatif téléphonique
 */

const WEST_AFRICAN_COUNTRIES = {
  // Maroc
  MA: {
    name: 'Maroc',
    code: 'MA',
    dialCode: '+212',
    phoneFormat: 'X XX XX XX XX', // 9 chiffres
    phoneRegex: /^(\+?212|0)?[5-7]\d{8}$/,
    phoneLength: 9,
    currency: {
      code: 'MAD',
      symbol: 'DH',
      name: 'Dirham marocain',
      symbolPosition: 'after', // "5000 DH"
      decimals: 2,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-MA',
    timezone: 'Africa/Casablanca',
    flag: '🇲🇦',
  },

  // Sénégal
  SN: {
    name: 'Sénégal',
    code: 'SN',
    dialCode: '+221',
    phoneFormat: 'XX XXX XX XX', // 9 chiffres
    phoneRegex: /^(\+?221|0)?[73][0678]\d{7}$/,
    phoneLength: 9,
    currency: {
      code: 'FCFA',
      symbol: 'FCFA',
      name: 'Franc CFA',
      symbolPosition: 'after', // "5000 FCFA"
      decimals: 0,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-SN',
    timezone: 'Africa/Dakar',
    flag: '🇸🇳',
  },

  // Côte d'Ivoire
  CI: {
    name: 'Côte d\'Ivoire',
    code: 'CI',
    dialCode: '+225',
    phoneFormat: 'XX XX XX XX XX', // 10 chiffres
    phoneRegex: /^(\+?225|0)?[0-9]{10}$/,
    phoneLength: 10,
    currency: {
      code: 'FCFA',
      symbol: 'FCFA',
      name: 'Franc CFA',
      symbolPosition: 'after',
      decimals: 0,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-CI',
    timezone: 'Africa/Abidjan',
    flag: '🇨🇮',
  },

  // Mali
  ML: {
    name: 'Mali',
    code: 'ML',
    dialCode: '+223',
    phoneFormat: 'XX XX XX XX', // 8 chiffres
    phoneRegex: /^(\+?223|0)?[6-9]\d{7}$/,
    phoneLength: 8,
    currency: {
      code: 'FCFA',
      symbol: 'FCFA',
      name: 'Franc CFA',
      symbolPosition: 'after',
      decimals: 0,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-ML',
    timezone: 'Africa/Bamako',
    flag: '🇲🇱',
  },

  // Burkina Faso
  BF: {
    name: 'Burkina Faso',
    code: 'BF',
    dialCode: '+226',
    phoneFormat: 'XX XX XX XX', // 8 chiffres
    phoneRegex: /^(\+?226|0)?[0-9]{8}$/,
    phoneLength: 8,
    currency: {
      code: 'FCFA',
      symbol: 'FCFA',
      name: 'Franc CFA',
      symbolPosition: 'after',
      decimals: 0,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-BF',
    timezone: 'Africa/Ouagadougou',
    flag: '🇧🇫',
  },

  // Niger
  NE: {
    name: 'Niger',
    code: 'NE',
    dialCode: '+227',
    phoneFormat: 'XX XX XX XX', // 8 chiffres
    phoneRegex: /^(\+?227|0)?[0-9]{8}$/,
    phoneLength: 8,
    currency: {
      code: 'FCFA',
      symbol: 'FCFA',
      name: 'Franc CFA',
      symbolPosition: 'after',
      decimals: 0,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-NE',
    timezone: 'Africa/Niamey',
    flag: '🇳🇪',
  },

  // Togo
  TG: {
    name: 'Togo',
    code: 'TG',
    dialCode: '+228',
    phoneFormat: 'XX XX XX XX', // 8 chiffres
    phoneRegex: /^(\+?228|0)?[0-9]{8}$/,
    phoneLength: 8,
    currency: {
      code: 'FCFA',
      symbol: 'FCFA',
      name: 'Franc CFA',
      symbolPosition: 'after',
      decimals: 0,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-TG',
    timezone: 'Africa/Lome',
    flag: '🇹🇬',
  },

  // Bénin
  BJ: {
    name: 'Bénin',
    code: 'BJ',
    dialCode: '+229',
    phoneFormat: 'XX XX XX XX', // 8 chiffres
    phoneRegex: /^(\+?229|0)?[0-9]{8}$/,
    phoneLength: 8,
    currency: {
      code: 'FCFA',
      symbol: 'FCFA',
      name: 'Franc CFA',
      symbolPosition: 'after',
      decimals: 0,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-BJ',
    timezone: 'Africa/Porto-Novo',
    flag: '🇧🇯',
  },

  // Guinée
  GN: {
    name: 'Guinée',
    code: 'GN',
    dialCode: '+224',
    phoneFormat: 'XXX XX XX XX', // 9 chiffres
    phoneRegex: /^(\+?224|0)?[6-7]\d{8}$/,
    phoneLength: 9,
    currency: {
      code: 'GNF',
      symbol: 'FG',
      name: 'Franc Guinéen',
      symbolPosition: 'after',
      decimals: 0,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-GN',
    timezone: 'Africa/Conakry',
    flag: '🇬🇳',
  },

  // Cameroun (partiellement francophone)
  CM: {
    name: 'Cameroun',
    code: 'CM',
    dialCode: '+237',
    phoneFormat: 'X XX XX XX XX', // 9 chiffres
    phoneRegex: /^(\+?237|0)?[6][0-9]{8}$/,
    phoneLength: 9,
    currency: {
      code: 'XAF',
      symbol: 'FCFA',
      name: 'Franc CFA (CEMAC)',
      symbolPosition: 'after',
      decimals: 0,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-CM',
    timezone: 'Africa/Douala',
    flag: '🇨🇲',
  },

  // Gabon
  GA: {
    name: 'Gabon',
    code: 'GA',
    dialCode: '+241',
    phoneFormat: 'X XX XX XX', // 7-8 chiffres
    phoneRegex: /^(\+?241|0)?[0-9]{7,8}$/,
    phoneLength: 8,
    currency: {
      code: 'XAF',
      symbol: 'FCFA',
      name: 'Franc CFA (CEMAC)',
      symbolPosition: 'after',
      decimals: 0,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-GA',
    timezone: 'Africa/Libreville',
    flag: '🇬🇦',
  },

  // Congo-Brazzaville
  CG: {
    name: 'Congo-Brazzaville',
    code: 'CG',
    dialCode: '+242',
    phoneFormat: 'XX XXX XXXX', // 9 chiffres
    phoneRegex: /^(\+?242|0)?[0-9]{9}$/,
    phoneLength: 9,
    currency: {
      code: 'XAF',
      symbol: 'FCFA',
      name: 'Franc CFA (CEMAC)',
      symbolPosition: 'after',
      decimals: 0,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-CG',
    timezone: 'Africa/Brazzaville',
    flag: '🇨🇬',
  },

  // Tchad
  TD: {
    name: 'Tchad',
    code: 'TD',
    dialCode: '+235',
    phoneFormat: 'XX XX XX XX', // 8 chiffres
    phoneRegex: /^(\+?235|0)?[6-9]\d{7}$/,
    phoneLength: 8,
    currency: {
      code: 'XAF',
      symbol: 'FCFA',
      name: 'Franc CFA (CEMAC)',
      symbolPosition: 'after',
      decimals: 0,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-TD',
    timezone: 'Africa/Ndjamena',
    flag: '🇹🇩',
  },

  // RCA (République Centrafricaine)
  CF: {
    name: 'République Centrafricaine',
    code: 'CF',
    dialCode: '+236',
    phoneFormat: 'XX XX XX XX', // 8 chiffres
    phoneRegex: /^(\+?236|0)?[0-9]{8}$/,
    phoneLength: 8,
    currency: {
      code: 'XAF',
      symbol: 'FCFA',
      name: 'Franc CFA (CEMAC)',
      symbolPosition: 'after',
      decimals: 0,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-CF',
    timezone: 'Africa/Bangui',
    flag: '🇨🇫',
  },

  // Guinée-Bissau
  GW: {
    name: 'Guinée-Bissau',
    code: 'GW',
    dialCode: '+245',
    phoneFormat: 'XXX XXXX', // 7 chiffres
    phoneRegex: /^(\+?245|0)?[0-9]{7}$/,
    phoneLength: 7,
    currency: {
      code: 'XOF',
      symbol: 'FCFA',
      name: 'Franc CFA',
      symbolPosition: 'after',
      decimals: 0,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'pt-GW', // Portugais mais proche géographiquement
    timezone: 'Africa/Bissau',
    flag: '🇬🇼',
  },

  // France
  FR: {
    name: 'France',
    code: 'FR',
    dialCode: '+33',
    phoneFormat: 'X XX XX XX XX', // 9 chiffres (sans le 0 initial)
    phoneRegex: /^(\+?33|0)?[1-9]\d{8}$/,
    phoneLength: 9,
    currency: {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      symbolPosition: 'after',
      decimals: 2,
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    flag: '🇫🇷',
  },

  // Canada
  CA: {
    name: 'Canada',
    code: 'CA',
    dialCode: '+1',
    phoneFormat: 'XXX XXX XXXX', // 10 chiffres
    phoneRegex: /^(\+?1)?[2-9]\d{9}$/,
    phoneLength: 10,
    currency: {
      code: 'CAD',
      symbol: '$',
      name: 'Dollar canadien',
      symbolPosition: 'before', // "$20"
      decimals: 2,
      thousandsSeparator: ',',
      decimalSeparator: '.',
    },
    locale: 'fr-CA',
    timezone: 'America/Toronto',
    flag: '🇨🇦',
  },
};

/**
 * Détecte le pays à partir d'un numéro de téléphone
 * @param {string} phoneNumber - Numéro avec ou sans indicatif
 * @returns {object|null} Configuration du pays ou null
 */
function detectCountryFromPhone(phoneNumber) {
  if (!phoneNumber) return null;

  // Nettoyer le numéro
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

  // Essayer de détecter par indicatif
  for (const [code, country] of Object.entries(WEST_AFRICAN_COUNTRIES)) {
    // Vérifier si commence par l'indicatif
    if (cleanPhone.startsWith(country.dialCode)) {
      return country;
    }

    // Vérifier si commence par l'indicatif sans '+'
    const dialCodeWithoutPlus = country.dialCode.replace('+', '');
    if (cleanPhone.startsWith(dialCodeWithoutPlus)) {
      return country;
    }

    // Vérifier avec regex
    if (country.phoneRegex.test(cleanPhone)) {
      return country;
    }
  }

  // Par défaut: Sénégal (pays d'origine de l'app)
  return WEST_AFRICAN_COUNTRIES.SN;
}

/**
 * Formatte un numéro de téléphone selon le pays
 * @param {string} phoneNumber - Numéro brut
 * @param {string} countryCode - Code pays (optionnel)
 * @returns {string} Numéro formaté
 */
function formatPhoneNumber(phoneNumber, countryCode = null) {
  if (!phoneNumber) return '';

  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

  // Détecter le pays si non fourni
  const country = countryCode
    ? WEST_AFRICAN_COUNTRIES[countryCode]
    : detectCountryFromPhone(cleanPhone);

  if (!country) return phoneNumber;

  // Extraire les chiffres locaux (sans indicatif)
  let localNumber = cleanPhone;

  if (cleanPhone.startsWith(country.dialCode)) {
    localNumber = cleanPhone.substring(country.dialCode.length);
  } else if (cleanPhone.startsWith(country.dialCode.replace('+', ''))) {
    localNumber = cleanPhone.substring(country.dialCode.length - 1);
  } else if (cleanPhone.startsWith('0')) {
    localNumber = cleanPhone.substring(1);
  }

  // Formatter selon le format du pays
  const format = country.phoneFormat;
  let formatted = '';
  let digitIndex = 0;

  for (let i = 0; i < format.length && digitIndex < localNumber.length; i++) {
    if (format[i] === 'X') {
      formatted += localNumber[digitIndex];
      digitIndex++;
    } else {
      formatted += format[i];
    }
  }

  return `${country.dialCode} ${formatted}`.trim();
}

/**
 * Formatte une devise selon le pays
 * @param {number} amount - Montant
 * @param {string} countryCode - Code pays (optionnel)
 * @returns {string} Montant formaté
 */
function formatCurrency(amount, countryCode = 'SN') {
  const country = WEST_AFRICAN_COUNTRIES[countryCode] || WEST_AFRICAN_COUNTRIES.SN;
  const currency = country.currency;

  if (!amount && amount !== 0) return `0 ${currency.symbol}`;

  // Arrondir si pas de décimales
  const finalAmount = currency.decimals === 0 ? Math.round(amount) : amount;

  // Formatter le nombre
  const parts = finalAmount.toFixed(currency.decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);

  let formatted = parts.join(currency.decimalSeparator);

  // Position du symbole
  if (currency.symbolPosition === 'before') {
    return `${currency.symbol}${formatted}`;
  } else {
    return `${formatted} ${currency.symbol}`;
  }
}

/**
 * Valide un numéro de téléphone pour un pays
 * @param {string} phoneNumber - Numéro à valider
 * @param {string} countryCode - Code pays (optionnel)
 * @returns {boolean} True si valide
 */
function validatePhoneNumber(phoneNumber, countryCode = null) {
  if (!phoneNumber) return false;

  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

  const country = countryCode
    ? WEST_AFRICAN_COUNTRIES[countryCode]
    : detectCountryFromPhone(cleanPhone);

  if (!country) return false;

  return country.phoneRegex.test(cleanPhone);
}

/**
 * Liste tous les pays supportés
 * @returns {array} Liste des pays
 */
function getSupportedCountries() {
  return Object.values(WEST_AFRICAN_COUNTRIES).map(country => ({
    code: country.code,
    name: country.name,
    dialCode: country.dialCode,
    currency: country.currency.code,
    flag: country.flag,
  }));
}

module.exports = {
  WEST_AFRICAN_COUNTRIES,
  detectCountryFromPhone,
  formatPhoneNumber,
  formatCurrency,
  validatePhoneNumber,
  getSupportedCountries,
};
