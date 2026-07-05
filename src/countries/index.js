import bg from './bg.js'
import ro from './ro.js'

// Countries with full tax calculation
const FULL_TAX_COUNTRIES = [bg, ro]

// All European countries in the picker — full tax where supported, tracking-only elsewhere
export const ALL_COUNTRIES = [
  // Full tax support — shown first
  bg,
  ro,

  // Tracking-only — alphabetical
  { id: 'al', name: 'Albania',     nameLocal: 'Shqipëria',    flag: '🇦🇱', currency: 'ALL', currencyCode: 'ALL', supportsFullTax: false },
  { id: 'at', name: 'Austria',     nameLocal: 'Österreich',   flag: '🇦🇹', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'ba', name: 'Bosnia & Herzegovina', nameLocal: 'Bosna i Hercegovina', flag: '🇧🇦', currency: 'BAM', currencyCode: 'BAM', supportsFullTax: false },
  { id: 'be', name: 'Belgium',     nameLocal: 'België',       flag: '🇧🇪', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'ch', name: 'Switzerland', nameLocal: 'Schweiz',      flag: '🇨🇭', currency: 'CHF', currencyCode: 'CHF', supportsFullTax: false },
  { id: 'cy', name: 'Cyprus',      nameLocal: 'Κύπρος',       flag: '🇨🇾', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'cz', name: 'Czechia',     nameLocal: 'Česko',        flag: '🇨🇿', currency: 'CZK', currencyCode: 'CZK', supportsFullTax: false },
  { id: 'de', name: 'Germany',     nameLocal: 'Deutschland',  flag: '🇩🇪', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'dk', name: 'Denmark',     nameLocal: 'Danmark',      flag: '🇩🇰', currency: 'DKK', currencyCode: 'DKK', supportsFullTax: false },
  { id: 'ee', name: 'Estonia',     nameLocal: 'Eesti',        flag: '🇪🇪', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'es', name: 'Spain',       nameLocal: 'España',       flag: '🇪🇸', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'fi', name: 'Finland',     nameLocal: 'Suomi',        flag: '🇫🇮', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'fr', name: 'France',      nameLocal: 'France',       flag: '🇫🇷', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'gb', name: 'United Kingdom', nameLocal: 'United Kingdom', flag: '🇬🇧', currency: '£', currencyCode: 'GBP', supportsFullTax: false },
  { id: 'gr', name: 'Greece',      nameLocal: 'Ελλάδα',       flag: '🇬🇷', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'hr', name: 'Croatia',     nameLocal: 'Hrvatska',     flag: '🇭🇷', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'hu', name: 'Hungary',     nameLocal: 'Magyarország', flag: '🇭🇺', currency: 'HUF', currencyCode: 'HUF', supportsFullTax: false },
  { id: 'ie', name: 'Ireland',     nameLocal: 'Ireland',      flag: '🇮🇪', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'is', name: 'Iceland',     nameLocal: 'Ísland',       flag: '🇮🇸', currency: 'ISK', currencyCode: 'ISK', supportsFullTax: false },
  { id: 'it', name: 'Italy',       nameLocal: 'Italia',       flag: '🇮🇹', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'lt', name: 'Lithuania',   nameLocal: 'Lietuva',      flag: '🇱🇹', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'lu', name: 'Luxembourg',  nameLocal: 'Lëtzebuerg',   flag: '🇱🇺', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'lv', name: 'Latvia',      nameLocal: 'Latvija',      flag: '🇱🇻', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'me', name: 'Montenegro',  nameLocal: 'Crna Gora',    flag: '🇲🇪', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'mk', name: 'North Macedonia', nameLocal: 'Македонија', flag: '🇲🇰', currency: 'MKD', currencyCode: 'MKD', supportsFullTax: false },
  { id: 'mt', name: 'Malta',       nameLocal: 'Malta',        flag: '🇲🇹', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'nl', name: 'Netherlands', nameLocal: 'Nederland',    flag: '🇳🇱', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'no', name: 'Norway',      nameLocal: 'Norge',        flag: '🇳🇴', currency: 'NOK', currencyCode: 'NOK', supportsFullTax: false },
  { id: 'pl', name: 'Poland',      nameLocal: 'Polska',       flag: '🇵🇱', currency: 'PLN', currencyCode: 'PLN', supportsFullTax: false },
  { id: 'pt', name: 'Portugal',    nameLocal: 'Portugal',     flag: '🇵🇹', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'rs', name: 'Serbia',      nameLocal: 'Srbija',       flag: '🇷🇸', currency: 'RSD', currencyCode: 'RSD', supportsFullTax: false },
  { id: 'se', name: 'Sweden',      nameLocal: 'Sverige',      flag: '🇸🇪', currency: 'SEK', currencyCode: 'SEK', supportsFullTax: false },
  { id: 'si', name: 'Slovenia',    nameLocal: 'Slovenija',    flag: '🇸🇮', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'sk', name: 'Slovakia',    nameLocal: 'Slovensko',    flag: '🇸🇰', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
  { id: 'tr', name: 'Turkey',      nameLocal: 'Türkiye',      flag: '🇹🇷', currency: '₺',   currencyCode: 'TRY', supportsFullTax: false },
  { id: 'ua', name: 'Ukraine',     nameLocal: 'Україна',      flag: '🇺🇦', currency: '₴',   currencyCode: 'UAH', supportsFullTax: false },
  { id: 'xk', name: 'Kosovo',      nameLocal: 'Kosovë',       flag: '🇽🇰', currency: '€',   currencyCode: 'EUR', supportsFullTax: false },
]

export function getCountry(id) {
  return ALL_COUNTRIES.find(c => c.id === id) || bg
}

export function getDefaultLegalForm(countryId) {
  const c = getCountry(countryId)
  return c.legalForms?.[0]?.value || 'just_tracking'
}

// Tracking-only stub — used for countries without a full config
export function makeTrackingConfig(country) {
  return {
    ...country,
    legalForms: [
      { value: 'just_tracking', label: { en: 'Income tracking' }, sub: { en: '' }, desc: { en: '' } },
    ],
    calcTax: () => null,
    getInsuranceRate: () => null,
    getQuarterlyDeadlines: (year) => [],
    getInsuranceDueDay: () => 25,
  }
}

export { FULL_TAX_COUNTRIES }
export default { getCountry, ALL_COUNTRIES, FULL_TAX_COUNTRIES }
