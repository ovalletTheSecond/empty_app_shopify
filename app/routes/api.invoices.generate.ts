/**
 * API Route: Generate Invoice
 * POST /api/invoices/generate
 */

import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { createInvoice } from "~/services/invoice.service";
import { fetchShopifyOrder, convertShopifyOrderToInvoiceInput } from "~/services/shopify.service";
import { generateInvoiceHtml, generatePdfFromHtml, savePdfToStorage } from "~/services/pdf.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;

    // Parse request body
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return json({ success: false, error: "order_id is required" }, { status: 400 });
    }

    // Fetch order from Shopify
    const shopifyOrder = await fetchShopifyOrder(admin, order_id);
    if (!shopifyOrder) {
      return json({ success: false, error: "Order not found in Shopify" }, { status: 404 });
    }

    // Convert to invoice input
    const invoiceInput = convertShopifyOrderToInvoiceInput(shopifyOrder, shop);

    // Create invoice in database
    const result = await createInvoice(invoiceInput);
    
    if (!result.success) {
      return json({ success: false, error: result.error }, { status: 400 });
    }

    // Get full invoice with lines
    const invoice = await prisma.invoice.findUnique({
      where: { id: result.invoice.id },
      include: { lines: true },
    });

    if (!invoice) {
      return json({ success: false, error: "Invoice not found after creation" }, { status: 500 });
    }

    // Get shop settings for PDF theme
    const settings = await prisma.shopSettings.findUnique({
      where: { shop },
    });

    // Generate PDF
    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      seller: {
        name: invoice.sellerName,
        address: invoice.sellerAddress || undefined,
        siren: invoice.sellerSiren || undefined,
        siret: invoice.sellerSiret || undefined,
        rcs: invoice.sellerRcs || undefined,
        tvaIntracom: invoice.sellerTvaIntracom || undefined,
        legalForm: invoice.sellerLegalForm || undefined,
        capital: invoice.sellerCapital || undefined,
      },
      customer: {
        name: invoice.customerName,
        address: invoice.customerAddress || undefined,
        postalCode: invoice.customerPostalCode || undefined,
        city: invoice.customerCity || undefined,
        country: invoice.customerCountry,
      },
      lines: invoice.lines.map(line => ({
        sku: line.sku || undefined,
        description: line.productTitle + (line.variantTitle ? ` - ${line.variantTitle}` : ''),
        quantity: line.quantity,
        unitPriceHt: line.unitPriceHt,
        taxRate: line.taxRate,
        taxAmount: line.taxAmount,
        totalHt: line.totalHt,
        totalTtc: line.totalTtc,
      })),
      totals: {
        totalHt: invoice.totalHt,
        totalTva: invoice.totalTva,
        totalTtc: invoice.totalTtc,
      },
      ossApplied: invoice.ossApplied,
      franchiseEnBase: invoice.franchiseEnBase,
      paymentTerms: invoice.paymentTerms || undefined,
      notes: invoice.notes || undefined,
      legalMentions: invoice.legalMentions || undefined,
    };

    const html = generateInvoiceHtml(pdfData, settings?.pdfTheme as any || 'Standard');
    const pdfBuffer = await generatePdfFromHtml(html);
    
    // Save PDF
    const fileName = `${invoice.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
    const { path, url } = await savePdfToStorage(pdfBuffer, fileName, settings?.storageProvider || 'local');

    // Update invoice with PDF info
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        pdfPath: path,
        pdfUrl: url,
        pdfGenerated: true,
      },
    });

    return json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        pdfUrl: url,
        totalTtc: invoice.totalTtc,
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};
