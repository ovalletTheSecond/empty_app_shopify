/**
 * PDF Generation Service
 * Generates invoice PDFs using HTML templates
 */

import type { InvoicePdfData, InvoicePdfTheme } from '~/types/invoice.types';

/**
 * Generate HTML for invoice PDF
 */
export function generateInvoiceHtml(data: InvoicePdfData, theme: InvoicePdfTheme = 'Standard'): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatPercent = (rate: number) => {
    return `${rate.toFixed(2)}%`;
  };

  // Determine CSS based on theme
  const themeStyles = getThemeStyles(theme);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${data.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: ${themeStyles.fontSize};
      line-height: 1.6;
      color: #333;
      padding: ${themeStyles.padding};
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2c3e50;
    }
    
    .header-left h1 {
      font-size: ${themeStyles.h1Size};
      color: #2c3e50;
      margin-bottom: 5px;
    }
    
    .header-left .invoice-number {
      font-size: ${themeStyles.h2Size};
      color: #3498db;
      font-weight: bold;
    }
    
    .header-right {
      text-align: right;
      font-size: ${themeStyles.smallFontSize};
    }
    
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    
    .party {
      width: 48%;
    }
    
    .party h2 {
      font-size: ${themeStyles.h2Size};
      color: #2c3e50;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #ecf0f1;
    }
    
    .party-content {
      font-size: ${themeStyles.smallFontSize};
      line-height: 1.8;
    }
    
    .party-content strong {
      display: block;
      margin-top: 8px;
      color: #2c3e50;
    }
    
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: ${themeStyles.tableFontSize};
    }
    
    .invoice-table thead {
      background-color: #2c3e50;
      color: white;
    }
    
    .invoice-table th {
      padding: ${themeStyles.tablePadding};
      text-align: left;
      font-weight: bold;
    }
    
    .invoice-table th.number {
      text-align: right;
    }
    
    .invoice-table td {
      padding: ${themeStyles.tablePadding};
      border-bottom: 1px solid #ecf0f1;
    }
    
    .invoice-table td.number {
      text-align: right;
      font-family: 'Courier New', monospace;
    }
    
    .invoice-table tbody tr:hover {
      background-color: #f8f9fa;
    }
    
    .totals {
      float: right;
      width: 300px;
      margin-bottom: 30px;
    }
    
    .totals table {
      width: 100%;
      font-size: ${themeStyles.smallFontSize};
    }
    
    .totals td {
      padding: 8px;
      border-bottom: 1px solid #ecf0f1;
    }
    
    .totals td:last-child {
      text-align: right;
      font-family: 'Courier New', monospace;
    }
    
    .totals .total-row {
      font-weight: bold;
      font-size: ${themeStyles.fontSize};
      background-color: #2c3e50;
      color: white;
    }
    
    .clear {
      clear: both;
    }
    
    .legal-mentions {
      margin-top: 40px;
      padding: 20px;
      background-color: #f8f9fa;
      border-left: 4px solid #3498db;
      font-size: ${themeStyles.legalFontSize};
      line-height: 1.8;
    }
    
    .legal-mentions h3 {
      font-size: ${themeStyles.smallFontSize};
      color: #2c3e50;
      margin-bottom: 10px;
    }
    
    .legal-mentions p {
      margin-bottom: 10px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ecf0f1;
      text-align: center;
      font-size: ${themeStyles.legalFontSize};
      color: #7f8c8d;
    }
    
    .oss-badge {
      display: inline-block;
      background-color: #3498db;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: ${themeStyles.legalFontSize};
      margin: 10px 0;
    }
    
    .franchise-badge {
      display: inline-block;
      background-color: #e67e22;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: ${themeStyles.legalFontSize};
      margin: 10px 0;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .invoice-table tbody tr:hover {
        background-color: transparent;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <h1>FACTURE</h1>
        <div class="invoice-number">${data.invoiceNumber}</div>
      </div>
      <div class="header-right">
        <strong>Date d'émission</strong><br>
        ${formatDate(data.issuedAt)}
      </div>
    </div>
    
    <!-- Parties -->
    <div class="parties">
      <!-- Seller -->
      <div class="party">
        <h2>Vendeur</h2>
        <div class="party-content">
          <strong>${data.seller.name}</strong>
          ${data.seller.address ? `<div>${data.seller.address}</div>` : ''}
          ${data.seller.legalForm ? `<div>${data.seller.legalForm}</div>` : ''}
          ${data.seller.capital ? `<div>Capital social : ${data.seller.capital}</div>` : ''}
          ${data.seller.siren ? `<div>SIREN : ${data.seller.siren}</div>` : ''}
          ${data.seller.siret ? `<div>SIRET : ${data.seller.siret}</div>` : ''}
          ${data.seller.rcs ? `<div>${data.seller.rcs}</div>` : ''}
          ${data.seller.tvaIntracom ? `<div>TVA Intracommunautaire : ${data.seller.tvaIntracom}</div>` : ''}
        </div>
      </div>
      
      <!-- Customer -->
      <div class="party">
        <h2>Client</h2>
        <div class="party-content">
          <strong>${data.customer.name}</strong>
          ${data.customer.address ? `<div>${data.customer.address}</div>` : ''}
          ${data.customer.postalCode && data.customer.city ? 
            `<div>${data.customer.postalCode} ${data.customer.city}</div>` : ''}
          <div>${data.customer.country}</div>
        </div>
      </div>
    </div>
    
    <!-- OSS/Franchise badges -->
    ${data.ossApplied ? '<div class="oss-badge">Régime OSS</div>' : ''}
    ${data.franchiseEnBase ? '<div class="franchise-badge">Franchise en base</div>' : ''}
    
    <!-- Invoice Lines -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th>Référence</th>
          <th>Désignation</th>
          <th class="number">Qté</th>
          <th class="number">PU HT</th>
          <th class="number">Total HT</th>
          <th class="number">TVA</th>
          <th class="number">Total TTC</th>
        </tr>
      </thead>
      <tbody>
        ${data.lines.map(line => `
          <tr>
            <td>${line.sku || '-'}</td>
            <td>${line.description}</td>
            <td class="number">${line.quantity}</td>
            <td class="number">${formatCurrency(line.unitPriceHt)}</td>
            <td class="number">${formatCurrency(line.totalHt)}</td>
            <td class="number">${formatPercent(line.taxRate)}</td>
            <td class="number">${formatCurrency(line.totalTtc)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <!-- Totals -->
    <div class="totals">
      <table>
        <tr>
          <td>Total HT</td>
          <td>${formatCurrency(data.totals.totalHt)}</td>
        </tr>
        <tr>
          <td>Total TVA</td>
          <td>${formatCurrency(data.totals.totalTva)}</td>
        </tr>
        <tr class="total-row">
          <td>Total TTC</td>
          <td>${formatCurrency(data.totals.totalTtc)}</td>
        </tr>
      </table>
    </div>
    
    <div class="clear"></div>
    
    <!-- Legal Mentions -->
    <div class="legal-mentions">
      <h3>Mentions légales</h3>
      ${data.legalMentions ? 
        data.legalMentions.split('\n\n').map(p => `<p>${p}</p>`).join('') : 
        '<p>Aucune mention légale.</p>'}
      ${data.paymentTerms ? `<p><strong>Conditions de paiement :</strong> ${data.paymentTerms}</p>` : ''}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      ${data.seller.name} - Document généré le ${formatDate(new Date())}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get theme-specific styles
 */
function getThemeStyles(theme: InvoicePdfTheme) {
  switch (theme) {
    case 'Compact':
      return {
        fontSize: '10px',
        smallFontSize: '8px',
        h1Size: '20px',
        h2Size: '12px',
        tableFontSize: '9px',
        tablePadding: '6px 8px',
        legalFontSize: '7px',
        padding: '15mm',
      };
    case 'Detail':
      return {
        fontSize: '12px',
        smallFontSize: '11px',
        h1Size: '28px',
        h2Size: '16px',
        tableFontSize: '11px',
        tablePadding: '12px 15px',
        legalFontSize: '10px',
        padding: '25mm',
      };
    case 'Standard':
    default:
      return {
        fontSize: '11px',
        smallFontSize: '10px',
        h1Size: '24px',
        h2Size: '14px',
        tableFontSize: '10px',
        tablePadding: '10px 12px',
        legalFontSize: '9px',
        padding: '20mm',
      };
  }
}

/**
 * Generate PDF from HTML (placeholder - actual implementation would use Puppeteer)
 * For now, returns the HTML content
 */
export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  // In production, this would use Puppeteer:
  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  // await page.setContent(html);
  // const pdf = await page.pdf({ format: 'A4', printBackground: true });
  // await browser.close();
  // return pdf;
  
  // For now, return HTML as buffer (will be implemented fully later)
  return Buffer.from(html, 'utf-8');
}

/**
 * Save PDF to storage
 */
export async function savePdfToStorage(
  pdfBuffer: Buffer,
  fileName: string,
  storageProvider: string = 'local'
): Promise<{ path: string; url: string }> {
  if (storageProvider === 'local') {
    // Save to local storage
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const invoicesDir = path.join(process.cwd(), 'storage', 'invoices');
    await fs.mkdir(invoicesDir, { recursive: true });
    
    const filePath = path.join(invoicesDir, fileName);
    await fs.writeFile(filePath, pdfBuffer);
    
    return {
      path: filePath,
      url: `/api/invoices/pdf/${fileName}`,
    };
  }
  
  // S3 storage would be implemented here
  throw new Error(`Storage provider ${storageProvider} not implemented yet`);
}
