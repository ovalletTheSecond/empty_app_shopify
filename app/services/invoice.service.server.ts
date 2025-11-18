/**
 * Invoice Service - Core business logic for French B2C invoice generation
 * Handles VAT calculation, OSS threshold monitoring, and invoice numbering
 */

import { PrismaClient } from '@prisma/client';
import type {
  InvoiceInput,
  VatCalculation,
  OssThresholdStatus,
  InvoiceGenerationResult,
} from '~/types/invoice.types';
import {
  OSS_THRESHOLD_EUR,
  isEuCountry,
  getVatRateForCountry,
  FRENCH_VAT_RATES,
  DEFAULT_LEGAL_MENTIONS,
  getQuarterFromMonth,
} from '~/lib/constants';

const prisma = new PrismaClient();

/**
 * Generate the next invoice number based on shop settings
 */
export async function generateInvoiceNumber(shop: string): Promise<string> {
  const settings = await prisma.shopSettings.findUnique({
    where: { shop },
  });

  if (!settings) {
    throw new Error('Shop settings not found. Please configure your shop settings first.');
  }

  const currentYear = new Date().getFullYear();
  let sequence = settings.currentSequence;

  // Reset sequence if year changed
  if (settings.currentYear !== currentYear) {
    sequence = 0;
    await prisma.shopSettings.update({
      where: { shop },
      data: {
        currentYear,
        currentSequence: 0,
      },
    });
  }

  // Increment sequence
  sequence += 1;
  await prisma.shopSettings.update({
    where: { shop },
    data: {
      currentSequence: sequence,
    },
  });

  // Format invoice number
  let invoiceNumber = settings.invoiceFormat;
  invoiceNumber = invoiceNumber.replace('{PREFIX}', settings.invoicePrefix);
  invoiceNumber = invoiceNumber.replace('{YYYY}', currentYear.toString());
  invoiceNumber = invoiceNumber.replace('{YY}', currentYear.toString().slice(-2));
  invoiceNumber = invoiceNumber.replace('{MM}', String(new Date().getMonth() + 1).padStart(2, '0'));
  invoiceNumber = invoiceNumber.replace('{DD}', String(new Date().getDate()).padStart(2, '0'));
  invoiceNumber = invoiceNumber.replace('{NNNN}', String(sequence).padStart(4, '0'));
  invoiceNumber = invoiceNumber.replace('{NNN}', String(sequence).padStart(3, '0'));
  invoiceNumber = invoiceNumber.replace('{NN}', String(sequence).padStart(2, '0'));

  return invoiceNumber;
}

/**
 * Check OSS threshold status for a shop and country
 */
export async function checkOssThreshold(
  shop: string,
  customerCountry: string,
  year: number = new Date().getFullYear()
): Promise<OssThresholdStatus> {
  // Only check for EU countries (excluding France)
  if (!isEuCountry(customerCountry) || customerCountry === 'FR') {
    return {
      thresholdReached: false,
      currentTotal: 0,
      thresholdAmount: OSS_THRESHOLD_EUR,
      remainingAmount: OSS_THRESHOLD_EUR,
    };
  }

  // Get or create threshold record
  let thresholdRecord = await prisma.ossThreshold.findUnique({
    where: {
      shop_year_countryCode: {
        shop,
        year,
        countryCode: customerCountry,
      },
    },
  });

  if (!thresholdRecord) {
    thresholdRecord = await prisma.ossThreshold.create({
      data: {
        shop,
        year,
        countryCode: customerCountry,
        totalSalesHt: 0,
        totalSalesTtc: 0,
        orderCount: 0,
        thresholdReached: false,
      },
    });
  }

  const remainingAmount = Math.max(0, OSS_THRESHOLD_EUR - thresholdRecord.totalSalesTtc);

  return {
    thresholdReached: thresholdRecord.thresholdReached,
    currentTotal: thresholdRecord.totalSalesTtc,
    thresholdAmount: OSS_THRESHOLD_EUR,
    remainingAmount,
  };
}

/**
 * Update OSS threshold after creating an invoice
 */
export async function updateOssThreshold(
  shop: string,
  customerCountry: string,
  totalHt: number,
  totalTtc: number,
  year: number = new Date().getFullYear()
): Promise<void> {
  if (!isEuCountry(customerCountry) || customerCountry === 'FR') {
    return;
  }

  const threshold = await prisma.ossThreshold.findUnique({
    where: {
      shop_year_countryCode: {
        shop,
        year,
        countryCode: customerCountry,
      },
    },
  });

  if (!threshold) {
    await prisma.ossThreshold.create({
      data: {
        shop,
        year,
        countryCode: customerCountry,
        totalSalesHt: totalHt,
        totalSalesTtc: totalTtc,
        orderCount: 1,
        thresholdReached: totalTtc >= OSS_THRESHOLD_EUR,
        thresholdDate: totalTtc >= OSS_THRESHOLD_EUR ? new Date() : null,
      },
    });
  } else {
    const newTotalTtc = threshold.totalSalesTtc + totalTtc;
    const newTotalHt = threshold.totalSalesHt + totalHt;
    const wasThresholdReached = threshold.thresholdReached;
    const isNowReached = newTotalTtc >= OSS_THRESHOLD_EUR;

    await prisma.ossThreshold.update({
      where: {
        shop_year_countryCode: {
          shop,
          year,
          countryCode: customerCountry,
        },
      },
      data: {
        totalSalesHt: newTotalHt,
        totalSalesTtc: newTotalTtc,
        orderCount: threshold.orderCount + 1,
        thresholdReached: isNowReached,
        thresholdDate: !wasThresholdReached && isNowReached ? new Date() : threshold.thresholdDate,
        lastUpdated: new Date(),
      },
    });
  }
}

/**
 * Calculate VAT based on shop settings and customer location
 */
export async function calculateVat(
  shop: string,
  customerCountry: string,
  lines: Array<{
    quantity: number;
    unitPriceHt: number;
    taxRate?: number;
  }>
): Promise<VatCalculation> {
  const settings = await prisma.shopSettings.findUnique({
    where: { shop },
  });

  if (!settings) {
    throw new Error('Shop settings not found');
  }

  // Franchise en base - no VAT
  if (settings.franchiseEnBase) {
    const totalHt = lines.reduce((sum, line) => sum + line.quantity * line.unitPriceHt, 0);
    return {
      totalHt,
      totalTva: 0,
      totalTtc: totalHt,
      ossApplied: false,
      franchiseEnBase: true,
      lineCalculations: lines.map((line, index) => {
        const lineTotal = line.quantity * line.unitPriceHt;
        return {
          lineIndex: index,
          unitPriceHt: line.unitPriceHt,
          quantity: line.quantity,
          taxRate: 0,
          taxAmount: 0,
          totalHt: lineTotal,
          totalTtc: lineTotal,
        };
      }),
    };
  }

  // Determine if OSS should be applied
  let ossApplied = false;
  let vatRate = FRENCH_VAT_RATES.STANDARD;

  if (isEuCountry(customerCountry) && customerCountry !== 'FR') {
    // Check OSS threshold
    const ossStatus = await checkOssThreshold(shop, customerCountry);

    if (settings.ossEnabled && ossStatus.thresholdReached) {
      // Apply destination country VAT
      vatRate = getVatRateForCountry(customerCountry);
      ossApplied = true;
    } else {
      // Below threshold - apply seller's country VAT
      vatRate = FRENCH_VAT_RATES.STANDARD;
    }
  }

  // Calculate line by line
  const lineCalculations = lines.map((line, index) => {
    const effectiveVatRate = line.taxRate !== undefined ? line.taxRate : vatRate;
    const totalHt = line.quantity * line.unitPriceHt;
    const taxAmount = totalHt * (effectiveVatRate / 100);
    const totalTtc = totalHt + taxAmount;

    return {
      lineIndex: index,
      unitPriceHt: line.unitPriceHt,
      quantity: line.quantity,
      taxRate: effectiveVatRate,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalHt: Math.round(totalHt * 100) / 100,
      totalTtc: Math.round(totalTtc * 100) / 100,
    };
  });

  // Calculate totals
  const totalHt = lineCalculations.reduce((sum, calc) => sum + calc.totalHt, 0);
  const totalTva = lineCalculations.reduce((sum, calc) => sum + calc.taxAmount, 0);
  const totalTtc = lineCalculations.reduce((sum, calc) => sum + calc.totalTtc, 0);

  return {
    totalHt: Math.round(totalHt * 100) / 100,
    totalTva: Math.round(totalTva * 100) / 100,
    totalTtc: Math.round(totalTtc * 100) / 100,
    ossApplied,
    franchiseEnBase: false,
    lineCalculations,
  };
}

/**
 * Validate invoice data before generation
 */
export async function validateInvoiceData(shop: string): Promise<{ valid: boolean; errors: string[] }> {
  const settings = await prisma.shopSettings.findUnique({
    where: { shop },
  });

  if (!settings) {
    return {
      valid: false,
      errors: ['Shop settings not found. Please configure your shop first.'],
    };
  }

  const errors: string[] = [];

  // Mandatory fields for French invoices
  if (!settings.companyName) errors.push('Company name (Dénomination) is required');
  if (!settings.address) errors.push('Company address is required');
  if (!settings.siren) errors.push('SIREN number is required');

  // Conditional requirements
  if (!settings.franchiseEnBase) {
    if (!settings.tvaIntracom) errors.push('TVA intracommunautaire is required (unless franchise en base)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate legal mentions for an invoice
 */
export function generateLegalMentions(
  ossApplied: boolean,
  franchiseEnBase: boolean,
  language: string = 'FR'
): string {
  const mentions: string[] = [];
  const lang = language.toUpperCase() === 'FR' ? 'FR' : 'EN';

  // Storage requirement
  mentions.push(DEFAULT_LEGAL_MENTIONS[lang].STORAGE);

  // Warranty
  mentions.push(DEFAULT_LEGAL_MENTIONS[lang].WARRANTY);

  // Payment terms
  mentions.push(DEFAULT_LEGAL_MENTIONS[lang].LATE_PAYMENT);

  // VAT regime
  if (franchiseEnBase) {
    mentions.push(DEFAULT_LEGAL_MENTIONS[lang].FRANCHISE_EN_BASE);
  } else if (ossApplied) {
    mentions.push(DEFAULT_LEGAL_MENTIONS[lang].OSS);
  }

  return mentions.join('\n\n');
}

/**
 * Create an invoice in the database
 */
export async function createInvoice(input: InvoiceInput): Promise<InvoiceGenerationResult> {
  try {
    // Validate shop settings
    const validation = await validateInvoiceData(input.shop);
    if (!validation.valid) {
      return {
        invoice: { id: '', invoiceNumber: '' },
        success: false,
        error: validation.errors.join('; '),
      };
    }

    // Check for duplicate
    const existingInvoice = await prisma.invoice.findUnique({
      where: { orderId: input.orderId },
    });

    if (existingInvoice) {
      return {
        invoice: {
          id: existingInvoice.id,
          invoiceNumber: existingInvoice.invoiceNumber,
          pdfUrl: existingInvoice.pdfUrl || undefined,
        },
        success: true,
      };
    }

    // Get shop settings
    const settings = await prisma.shopSettings.findUniqueOrThrow({
      where: { shop: input.shop },
    });

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(input.shop);

    // Calculate VAT
    const vatCalc = await calculateVat(input.shop, input.customerCountry, input.lines);

    // Generate legal mentions
    const legalMentions = generateLegalMentions(
      vatCalc.ossApplied,
      vatCalc.franchiseEnBase,
      settings.defaultLanguage
    );

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        shop: input.shop,
        invoiceNumber,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        orderName: input.orderName,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerAddress: input.customerAddress,
        customerPostalCode: input.customerPostalCode,
        customerCity: input.customerCity,
        customerCountry: input.customerCountry,
        sellerName: settings.companyName || '',
        sellerAddress: settings.address || undefined,
        sellerSiren: settings.siren || undefined,
        sellerSiret: settings.siret || undefined,
        sellerRcs: settings.rcs || undefined,
        sellerTvaIntracom: settings.tvaIntracom || undefined,
        sellerLegalForm: settings.legalForm || undefined,
        sellerCapital: settings.shareCapital || undefined,
        totalHt: vatCalc.totalHt,
        totalTva: vatCalc.totalTva,
        totalTtc: vatCalc.totalTtc,
        ossApplied: vatCalc.ossApplied,
        franchiseEnBase: vatCalc.franchiseEnBase,
        paymentTerms: settings.paymentTerms || undefined,
        paymentStatus: input.paymentStatus,
        paidAt: input.paidAt,
        legalMentions,
        lines: {
          create: input.lines.map((line, index) => {
            const calc = vatCalc.lineCalculations[index];
            return {
              sku: line.sku,
              productTitle: line.productTitle,
              variantTitle: line.variantTitle,
              description: line.description,
              quantity: line.quantity,
              unitPriceHt: calc.unitPriceHt,
              taxRate: calc.taxRate,
              taxAmount: calc.taxAmount,
              totalHt: calc.totalHt,
              totalTtc: calc.totalTtc,
              lineOrder: index,
            };
          }),
        },
      },
      include: {
        lines: true,
      },
    });

    // Update OSS threshold if applicable
    if (isEuCountry(input.customerCountry) && input.customerCountry !== 'FR') {
      await updateOssThreshold(
        input.shop,
        input.customerCountry,
        vatCalc.totalHt,
        vatCalc.totalTtc
      );
    }

    // Create OSS sale record if OSS was applied
    if (vatCalc.ossApplied) {
      const invoiceDate = new Date();
      await prisma.ossSale.create({
        data: {
          shop: input.shop,
          year: invoiceDate.getFullYear(),
          quarter: getQuarterFromMonth(invoiceDate.getMonth() + 1),
          month: invoiceDate.getMonth() + 1,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerCountry: input.customerCountry,
          baseHt: vatCalc.totalHt,
          taxRate: vatCalc.lineCalculations[0]?.taxRate || 0,
          taxAmount: vatCalc.totalTva,
          totalTtc: vatCalc.totalTtc,
          saleDate: invoiceDate,
        },
      });
    }

    return {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      },
      success: true,
    };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return {
      invoice: { id: '', invoiceNumber: '' },
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
