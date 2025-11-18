/**
 * Constants for French B2C Invoice System
 */

// EU country codes (excluding France for OSS purposes)
export const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
  'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
] as const;

// OSS threshold in EUR (€10,000 annual for EU distance sales)
export const OSS_THRESHOLD_EUR = 10000;

// Default French VAT rates
export const FRENCH_VAT_RATES = {
  STANDARD: 20.0,      // Taux normal
  REDUCED: 10.0,       // Taux réduit
  SUPER_REDUCED: 5.5,  // Taux réduit spécial
  SPECIAL: 2.1,        // Taux particulier
} as const;

// EU VAT rates by country (simplified - standard rates)
export const EU_VAT_RATES: Record<string, number> = {
  AT: 20.0, // Austria
  BE: 21.0, // Belgium
  BG: 20.0, // Bulgaria
  CY: 19.0, // Cyprus
  CZ: 21.0, // Czech Republic
  DE: 19.0, // Germany
  DK: 25.0, // Denmark
  EE: 22.0, // Estonia
  ES: 21.0, // Spain
  FI: 25.5, // Finland
  FR: 20.0, // France
  GR: 24.0, // Greece
  HR: 25.0, // Croatia
  HU: 27.0, // Hungary
  IE: 23.0, // Ireland
  IT: 22.0, // Italy
  LT: 21.0, // Lithuania
  LU: 17.0, // Luxembourg
  LV: 21.0, // Latvia
  MT: 18.0, // Malta
  NL: 21.0, // Netherlands
  PL: 23.0, // Poland
  PT: 23.0, // Portugal
  RO: 19.0, // Romania
  SE: 25.0, // Sweden
  SI: 22.0, // Slovenia
  SK: 20.0, // Slovakia
};

// Default legal mentions for French invoices
export const DEFAULT_LEGAL_MENTIONS = {
  FR: {
    STORAGE: "Facture à conserver 10 ans conformément à l'article L123-22 du Code de commerce.",
    WARRANTY: "Garantie légale de conformité de 2 ans pour les produits conformément aux articles L217-4 et suivants du Code de la consommation.",
    LATE_PAYMENT: "En cas de retard de paiement, des pénalités de retard seront appliquées ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement (articles L441-3 et L441-10 du Code de commerce).",
    FRANCHISE_EN_BASE: "TVA non applicable, art. 293 B du CGI",
    OSS: "TVA acquittée dans le cadre du régime de l'OSS (One Stop Shop)",
  },
  EN: {
    STORAGE: "Invoice to be kept for 10 years in accordance with Article L123-22 of the Commercial Code.",
    WARRANTY: "2-year legal warranty of conformity for products in accordance with Articles L217-4 et seq. of the Consumer Code.",
    LATE_PAYMENT: "In case of late payment, late payment penalties will be applied as well as a flat-rate compensation of €40 for collection costs (Articles L441-3 and L441-10 of the Commercial Code).",
    FRANCHISE_EN_BASE: "VAT not applicable, art. 293 B of the CGI",
    OSS: "VAT paid under the OSS (One Stop Shop) regime",
  },
} as const;

// Invoice number format placeholders
export const INVOICE_NUMBER_PLACEHOLDERS = {
  PREFIX: '{PREFIX}',
  YYYY: '{YYYY}',
  YY: '{YY}',
  MM: '{MM}',
  DD: '{DD}',
  NNNN: '{NNNN}',
  NNN: '{NNN}',
  NN: '{NN}',
} as const;

// Late payment default values
export const LATE_PAYMENT_DEFAULTS = {
  PENALTY_AMOUNT: '40', // €40 as per French law
  PENALTY_RATE: '3 fois le taux d\'intérêt légal',
} as const;

// Batch processing limits
export const BATCH_LIMITS = {
  MAX_ORDERS_PER_BATCH: 1000,
  MAX_PDF_PER_ZIP: 500,
} as const;

// Storage providers
export const STORAGE_PROVIDERS = {
  LOCAL: 'local',
  S3: 's3',
} as const;

// Invoice statuses
export const INVOICE_STATUSES = {
  DRAFT: 'draft',
  GENERATED: 'generated',
  SENT: 'sent',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const;

// Job statuses
export const JOB_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// OSS quarters
export const OSS_QUARTERS = [
  { quarter: 1, months: [1, 2, 3] },
  { quarter: 2, months: [4, 5, 6] },
  { quarter: 3, months: [7, 8, 9] },
  { quarter: 4, months: [10, 11, 12] },
] as const;

export function isEuCountry(countryCode: string): boolean {
  return EU_COUNTRIES.includes(countryCode as any) || countryCode === 'FR';
}

export function getVatRateForCountry(countryCode: string): number {
  return EU_VAT_RATES[countryCode] || FRENCH_VAT_RATES.STANDARD;
}

export function getQuarterFromMonth(month: number): number {
  if (month >= 1 && month <= 3) return 1;
  if (month >= 4 && month <= 6) return 2;
  if (month >= 7 && month <= 9) return 3;
  return 4;
}
