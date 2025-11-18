/**
 * API Route: Shop Settings
 * GET/POST /api/settings
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Retrieve settings
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    let settings = await prisma.shopSettings.findUnique({
      where: { shop },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.shopSettings.create({
        data: {
          shop,
          country: 'FR',
          defaultLanguage: 'FR',
          defaultCurrency: 'EUR',
          invoicePrefix: 'FAC',
          invoiceFormat: '{PREFIX}-{YYYY}-{NNNN}',
          currentYear: new Date().getFullYear(),
          currentSequence: 0,
          pdfTheme: 'Standard',
          storageProvider: 'local',
          ossEnabled: false,
          franchiseEnBase: false,
          autoGenerateOnPaid: false,
          latePenaltyAmount: '40',
          legalChecklistConfirmed: false,
        },
      });
    }

    return json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};

// POST - Update settings
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const body = await request.json();
    const { settings: newSettings } = body;

    if (!newSettings) {
      return json({ success: false, error: "settings object is required" }, { status: 400 });
    }

    // Check if settings exist
    const existingSettings = await prisma.shopSettings.findUnique({
      where: { shop },
    });

    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.shopSettings.update({
        where: { shop },
        data: {
          companyName: newSettings.companyName,
          address: newSettings.address,
          postalCode: newSettings.postalCode,
          city: newSettings.city,
          country: newSettings.country || 'FR',
          legalForm: newSettings.legalForm,
          shareCapital: newSettings.shareCapital,
          siren: newSettings.siren,
          siret: newSettings.siret,
          rcs: newSettings.rcs,
          tvaIntracom: newSettings.tvaIntracom,
          ossEnabled: newSettings.ossEnabled ?? false,
          ossNumber: newSettings.ossNumber,
          franchiseEnBase: newSettings.franchiseEnBase ?? false,
          invoicePrefix: newSettings.invoicePrefix || 'FAC',
          invoiceFormat: newSettings.invoiceFormat || '{PREFIX}-{YYYY}-{NNNN}',
          autoGenerateOnPaid: newSettings.autoGenerateOnPaid ?? false,
          defaultLanguage: newSettings.defaultLanguage || 'FR',
          defaultCurrency: newSettings.defaultCurrency || 'EUR',
          pdfTheme: newSettings.pdfTheme || 'Standard',
          storageProvider: newSettings.storageProvider || 'local',
          storageBucket: newSettings.storageBucket,
          storageRegion: newSettings.storageRegion,
          paymentTerms: newSettings.paymentTerms,
          latePenaltyRate: newSettings.latePenaltyRate,
          latePenaltyAmount: newSettings.latePenaltyAmount || '40',
          legalChecklistConfirmed: newSettings.legalChecklistConfirmed ?? false,
          legalChecklistDate: newSettings.legalChecklistConfirmed ? new Date() : null,
        },
      });
    } else {
      // Create new settings
      settings = await prisma.shopSettings.create({
        data: {
          shop,
          companyName: newSettings.companyName,
          address: newSettings.address,
          postalCode: newSettings.postalCode,
          city: newSettings.city,
          country: newSettings.country || 'FR',
          legalForm: newSettings.legalForm,
          shareCapital: newSettings.shareCapital,
          siren: newSettings.siren,
          siret: newSettings.siret,
          rcs: newSettings.rcs,
          tvaIntracom: newSettings.tvaIntracom,
          ossEnabled: newSettings.ossEnabled ?? false,
          ossNumber: newSettings.ossNumber,
          franchiseEnBase: newSettings.franchiseEnBase ?? false,
          invoicePrefix: newSettings.invoicePrefix || 'FAC',
          invoiceFormat: newSettings.invoiceFormat || '{PREFIX}-{YYYY}-{NNNN}',
          currentYear: new Date().getFullYear(),
          currentSequence: 0,
          autoGenerateOnPaid: newSettings.autoGenerateOnPaid ?? false,
          defaultLanguage: newSettings.defaultLanguage || 'FR',
          defaultCurrency: newSettings.defaultCurrency || 'EUR',
          pdfTheme: newSettings.pdfTheme || 'Standard',
          storageProvider: newSettings.storageProvider || 'local',
          storageBucket: newSettings.storageBucket,
          storageRegion: newSettings.storageRegion,
          paymentTerms: newSettings.paymentTerms,
          latePenaltyRate: newSettings.latePenaltyRate,
          latePenaltyAmount: newSettings.latePenaltyAmount || '40',
          legalChecklistConfirmed: newSettings.legalChecklistConfirmed ?? false,
          legalChecklistDate: newSettings.legalChecklistConfirmed ? new Date() : null,
        },
      });
    }

    return json({ success: true, settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};
