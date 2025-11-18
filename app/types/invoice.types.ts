/**
 * Type definitions for French B2C Invoice Generation System
 */

export interface ShopifyOrder {
  id: string;
  name: string;
  orderNumber: number;
  createdAt: string;
  customer: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    zip?: string;
    countryCode?: string;
    province?: string;
  };
  billingAddress?: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    zip?: string;
    countryCode?: string;
    province?: string;
  };
  lineItems: {
    nodes: Array<{
      id: string;
      title: string;
      variantTitle?: string;
      sku?: string;
      quantity: number;
      originalUnitPriceSet: {
        shopMoney: {
          amount: string;
          currencyCode: string;
        };
      };
      taxLines: Array<{
        rate: number;
        title: string;
      }>;
    }>;
  };
  totalPriceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  totalTaxSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  financialStatus: string;
}

export interface InvoiceLineInput {
  sku?: string;
  productTitle: string;
  variantTitle?: string;
  description?: string;
  quantity: number;
  unitPriceHt: number;
  taxRate: number;
}

export interface InvoiceInput {
  shop: string;
  orderId: string;
  orderNumber?: string;
  orderName?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerPostalCode?: string;
  customerCity?: string;
  customerCountry: string;
  lines: InvoiceLineInput[];
  paymentStatus?: string;
  paidAt?: Date;
}

export interface VatCalculation {
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  ossApplied: boolean;
  franchiseEnBase: boolean;
  lineCalculations: Array<{
    lineIndex: number;
    unitPriceHt: number;
    quantity: number;
    taxRate: number;
    taxAmount: number;
    totalHt: number;
    totalTtc: number;
  }>;
}

export interface OssThresholdStatus {
  thresholdReached: boolean;
  currentTotal: number;
  thresholdAmount: number;
  remainingAmount: number;
}

export interface InvoiceGenerationResult {
  invoice: {
    id: string;
    invoiceNumber: string;
    pdfUrl?: string;
  };
  success: boolean;
  error?: string;
}

export interface BatchJobInput {
  shop: string;
  jobType: 'invoice_generation' | 'oss_report';
  orderIds?: string[];
  filters?: {
    startDate?: string;
    endDate?: string;
    paymentStatus?: string;
    orderRange?: {
      start: number;
      end: number;
    };
  };
}

export interface OssReportEntry {
  order_id: string;
  invoice_number: string;
  date: string;
  country: string;
  base_ht: number;
  tax_rate: number;
  tax_amount: number;
  total_ttc: number;
}

export interface OssReportSummary {
  period: {
    year: number;
    quarter: number;
  };
  entries: OssReportEntry[];
  summary: {
    [country: string]: {
      totalHt: number;
      totalTva: number;
      totalTtc: number;
      orderCount: number;
    };
  };
}

export type InvoicePdfTheme = 'Compact' | 'Standard' | 'Detail';

export interface InvoicePdfData {
  invoiceNumber: string;
  issuedAt: Date;
  seller: {
    name: string;
    address?: string;
    siren?: string;
    siret?: string;
    rcs?: string;
    tvaIntracom?: string;
    legalForm?: string;
    capital?: string;
  };
  customer: {
    name: string;
    address?: string;
    postalCode?: string;
    city?: string;
    country: string;
  };
  lines: Array<{
    sku?: string;
    description: string;
    quantity: number;
    unitPriceHt: number;
    taxRate: number;
    taxAmount: number;
    totalHt: number;
    totalTtc: number;
  }>;
  totals: {
    totalHt: number;
    totalTva: number;
    totalTtc: number;
  };
  ossApplied: boolean;
  franchiseEnBase: boolean;
  paymentTerms?: string;
  notes?: string;
  legalMentions?: string;
}
