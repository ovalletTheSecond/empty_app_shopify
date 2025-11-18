/**
 * OSS (One Stop Shop) Reporting Service
 * Handles quarterly OSS reports for EU VAT compliance
 */

import { PrismaClient } from '@prisma/client';
import { stringify } from 'csv-stringify/sync';
import type { OssReportEntry, OssReportSummary } from '~/types/invoice.types';

const prisma = new PrismaClient();

/**
 * Get OSS sales for a specific period
 */
export async function getOssSalesForPeriod(
  shop: string,
  year: number,
  quarter: number
): Promise<OssReportEntry[]> {
  const sales = await prisma.ossSale.findMany({
    where: {
      shop,
      year,
      quarter,
    },
    orderBy: {
      saleDate: 'asc',
    },
  });

  return sales.map(sale => ({
    order_id: sale.invoiceId,
    invoice_number: sale.invoiceNumber,
    date: sale.saleDate.toISOString().split('T')[0],
    country: sale.customerCountry,
    base_ht: sale.baseHt,
    tax_rate: sale.taxRate,
    tax_amount: sale.taxAmount,
    total_ttc: sale.totalTtc,
  }));
}

/**
 * Generate OSS report summary
 */
export async function generateOssReport(
  shop: string,
  year: number,
  quarter: number
): Promise<OssReportSummary> {
  const entries = await getOssSalesForPeriod(shop, year, quarter);

  // Calculate summary by country
  const summary: Record<string, {
    totalHt: number;
    totalTva: number;
    totalTtc: number;
    orderCount: number;
  }> = {};

  entries.forEach(entry => {
    if (!summary[entry.country]) {
      summary[entry.country] = {
        totalHt: 0,
        totalTva: 0,
        totalTtc: 0,
        orderCount: 0,
      };
    }
    
    summary[entry.country].totalHt += entry.base_ht;
    summary[entry.country].totalTva += entry.tax_amount;
    summary[entry.country].totalTtc += entry.total_ttc;
    summary[entry.country].orderCount += 1;
  });

  return {
    period: { year, quarter },
    entries,
    summary,
  };
}

/**
 * Export OSS report to CSV
 */
export function exportOssReportToCsv(report: OssReportSummary): string {
  const records = [
    // Header row
    ['OSS Report', `Q${report.period.quarter} ${report.period.year}`],
    [],
    // Detail header
    ['Order ID', 'Invoice Number', 'Date', 'Country', 'Base HT (€)', 'Tax Rate (%)', 'Tax Amount (€)', 'Total TTC (€)'],
    // Detail rows
    ...report.entries.map(entry => [
      entry.order_id,
      entry.invoice_number,
      entry.date,
      entry.country,
      entry.base_ht.toFixed(2),
      entry.tax_rate.toFixed(2),
      entry.tax_amount.toFixed(2),
      entry.total_ttc.toFixed(2),
    ]),
    [],
    // Summary header
    ['Summary by Country'],
    ['Country', 'Order Count', 'Total HT (€)', 'Total VAT (€)', 'Total TTC (€)'],
    // Summary rows
    ...Object.entries(report.summary).map(([country, data]) => [
      country,
      data.orderCount.toString(),
      data.totalHt.toFixed(2),
      data.totalTva.toFixed(2),
      data.totalTtc.toFixed(2),
    ]),
    [],
    // Grand total
    ['GRAND TOTAL', '', 
      Object.values(report.summary).reduce((sum, data) => sum + data.totalHt, 0).toFixed(2),
      Object.values(report.summary).reduce((sum, data) => sum + data.totalTva, 0).toFixed(2),
      Object.values(report.summary).reduce((sum, data) => sum + data.totalTtc, 0).toFixed(2),
    ],
  ];

  return stringify(records);
}

/**
 * Get OSS threshold warnings for all EU countries
 */
export async function getOssThresholdWarnings(
  shop: string,
  year: number = new Date().getFullYear()
): Promise<Array<{
  country: string;
  totalSales: number;
  percentage: number;
  thresholdReached: boolean;
}>> {
  const thresholds = await prisma.ossThreshold.findMany({
    where: {
      shop,
      year,
    },
    orderBy: {
      totalSalesTtc: 'desc',
    },
  });

  return thresholds.map(threshold => ({
    country: threshold.countryCode,
    totalSales: threshold.totalSalesTtc,
    percentage: (threshold.totalSalesTtc / 10000) * 100,
    thresholdReached: threshold.thresholdReached,
  }));
}

/**
 * Get total EU sales for OSS monitoring
 */
export async function getTotalEuSales(
  shop: string,
  year: number = new Date().getFullYear()
): Promise<{
  totalSales: number;
  byCountry: Record<string, number>;
  thresholdReached: boolean;
}> {
  const thresholds = await prisma.ossThreshold.findMany({
    where: {
      shop,
      year,
    },
  });

  const byCountry: Record<string, number> = {};
  let totalSales = 0;
  let thresholdReached = false;

  thresholds.forEach(threshold => {
    byCountry[threshold.countryCode] = threshold.totalSalesTtc;
    totalSales += threshold.totalSalesTtc;
    if (threshold.thresholdReached) {
      thresholdReached = true;
    }
  });

  return {
    totalSales,
    byCountry,
    thresholdReached,
  };
}
