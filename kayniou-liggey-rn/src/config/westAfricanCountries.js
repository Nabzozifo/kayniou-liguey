/**
 * Configuration des pays d'Afrique de l'Ouest francophone
 * Version Frontend (React Native)
 */

export const WEST_AFRICAN_COUNTRIES = {
  SN: {
    name: 'Sénégal',
    code: 'SN',
    dialCode: '+221',
    phoneFormat: 'XX XXX XX XX',
    phoneLength: 9,
    currency: { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA' },
    flag: '🇸🇳',
  },
  CI: {
    name: 'Côte d\'Ivoire',
    code: 'CI',
    dialCode: '+225',
    phoneFormat: 'XX XX XX XX XX',
    phoneLength: 10,
    currency: { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA' },
    flag: '🇨🇮',
  },
  ML: {
    name: 'Mali',
    code: 'ML',
    dialCode: '+223',
    phoneFormat: 'XX XX XX XX',
    phoneLength: 8,
    currency: { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA' },
    flag: '🇲🇱',
  },
  BF: {
    name: 'Burkina Faso',
    code: 'BF',
    dialCode: '+226',
    phoneFormat: 'XX XX XX XX',
    phoneLength: 8,
    currency: { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA' },
    flag: '🇧🇫',
  },
  NE: {
    name: 'Niger',
    code: 'NE',
    dialCode: '+227',
    phoneFormat: 'XX XX XX XX',
    phoneLength: 8,
    currency: { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA' },
    flag: '🇳🇪',
  },
  TG: {
    name: 'Togo',
    code: 'TG',
    dialCode: '+228',
    phoneFormat: 'XX XX XX XX',
    phoneLength: 8,
    currency: { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA' },
    flag: '🇹🇬',
  },
  BJ: {
    name: 'Bénin',
    code: 'BJ',
    dialCode: '+229',
    phoneFormat: 'XX XX XX XX',
    phoneLength: 8,
    currency: { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA' },
    flag: '🇧🇯',
  },
  GN: {
    name: 'Guinée',
    code: 'GN',
    dialCode: '+224',
    phoneFormat: 'XXX XX XX XX',
    phoneLength: 9,
    currency: { code: 'GNF', symbol: 'FG', name: 'Franc Guinéen' },
    flag: '🇬🇳',
  },
  CM: {
    name: 'Cameroun',
    code: 'CM',
    dialCode: '+237',
    phoneFormat: 'X XX XX XX XX',
    phoneLength: 9,
    currency: { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA (CEMAC)' },
    flag: '🇨🇲',
  },
  GA: {
    name: 'Gabon',
    code: 'GA',
    dialCode: '+241',
    phoneFormat: 'X XX XX XX',
    phoneLength: 8,
    currency: { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA (CEMAC)' },
    flag: '🇬🇦',
  },
  CG: {
    name: 'Congo-Brazzaville',
    code: 'CG',
    dialCode: '+242',
    phoneFormat: 'XX XXX XXXX',
    phoneLength: 9,
    currency: { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA (CEMAC)' },
    flag: '🇨🇬',
  },
  TD: {
    name: 'Tchad',
    code: 'TD',
    dialCode: '+235',
    phoneFormat: 'XX XX XX XX',
    phoneLength: 8,
    currency: { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA (CEMAC)' },
    flag: '🇹🇩',
  },
  CF: {
    name: 'République Centrafricaine',
    code: 'CF',
    dialCode: '+236',
    phoneFormat: 'XX XX XX XX',
    phoneLength: 8,
    currency: { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA (CEMAC)' },
    flag: '🇨🇫',
  },
  GW: {
    name: 'Guinée-Bissau',
    code: 'GW',
    dialCode: '+245',
    phoneFormat: 'XXX XXXX',
    phoneLength: 7,
    currency: { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA' },
    flag: '🇬🇼',
  },
};

/**
 * Détecte le pays à partir d'un numéro de téléphone
 */
export function detectCountryFromPhone(phoneNumber) {
  if (!phoneNumber) return WEST_AFRICAN_COUNTRIES.SN;

  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

  for (const country of Object.values(WEST_AFRICAN_COUNTRIES)) {
    if (cleanPhone.startsWith(country.dialCode) ||
        cleanPhone.startsWith(country.dialCode.replace('+', ''))) {
      return country;
    }
  }

  return WEST_AFRICAN_COUNTRIES.SN;
}

/**
 * Formatte un numéro de téléphone
 */
export function formatPhoneNumber(phoneNumber, countryCode = null) {
  if (!phoneNumber) return '';

  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
  const country = countryCode
    ? WEST_AFRICAN_COUNTRIES[countryCode]
    : detectCountryFromPhone(cleanPhone);

  if (!country) return phoneNumber;

  let localNumber = cleanPhone;

  if (cleanPhone.startsWith(country.dialCode)) {
    localNumber = cleanPhone.substring(country.dialCode.length);
  } else if (cleanPhone.startsWith(country.dialCode.replace('+', ''))) {
    localNumber = cleanPhone.substring(country.dialCode.length - 1);
  } else if (cleanPhone.startsWith('0')) {
    localNumber = cleanPhone.substring(1);
  }

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
 * Formatte une devise
 */
export function formatCurrency(amount, countryCode = 'SN') {
  const country = WEST_AFRICAN_COUNTRIES[countryCode] || WEST_AFRICAN_COUNTRIES.SN;

  if (!amount && amount !== 0) return `0 ${country.currency.symbol}`;

  const finalAmount = Math.round(amount);
  const formatted = finalAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return `${formatted} ${country.currency.symbol}`;
}

/**
 * Liste des pays pour sélection
 */
export function getSupportedCountries() {
  return Object.values(WEST_AFRICAN_COUNTRIES).map(country => ({
    code: country.code,
    name: country.name,
    dialCode: country.dialCode,
    currency: country.currency.code,
    flag: country.flag,
  }));
}
