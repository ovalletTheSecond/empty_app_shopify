/**
 * Dashboard - Invoice Generation App Home
 */
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Get settings
  const settings = await prisma.shopSettings.findUnique({
    where: { shop },
  });

  // Get recent invoices
  const recentInvoices = await prisma.invoice.findMany({
    where: { shop },
    orderBy: { issuedAt: 'desc' },
    take: 5,
  });

  // Get invoice count
  const invoiceCount = await prisma.invoice.count({
    where: { shop },
  });

  // Get OSS status
  const currentYear = new Date().getFullYear();
  const ossThresholds = await prisma.ossThreshold.findMany({
    where: { shop, year: currentYear },
  });

  const totalEuSales = ossThresholds.reduce((sum, t) => sum + t.totalSalesTtc, 0);
  const ossThresholdReached = ossThresholds.some(t => t.thresholdReached);

  return json({
    settings,
    recentInvoices,
    invoiceCount,
    totalEuSales,
    ossThresholdReached,
    currentYear,
  });
};

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  if (!data.settings) {
    return (
      <Page>
        <TitleBar title="Tableau de bord - Factures" />
        <Layout>
          <Layout.Section>
            <Banner
              title="Configuration requise"
              action={{
                content: "Configurer maintenant",
                onAction: () => navigate("/app/settings"),
              }}
              status="warning"
            >
              <p>
                Veuillez configurer les paramètres de votre boutique (SIREN, SIRET, TVA, etc.) 
                avant de générer des factures.
              </p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const ossPercentage = (data.totalEuSales / 10000) * 100;

  return (
    <Page>
      <TitleBar title="Tableau de bord - Factures" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <InlineStack gap="400" wrap={false}>
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Factures générées
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {data.invoiceCount}
                  </Text>
                </BlockStack>
              </Card>

              {data.settings.ossEnabled && (
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      Ventes UE ({data.currentYear})
                    </Text>
                    <Text as="p" variant="heading2xl">
                      {formatCurrency(data.totalEuSales)}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Seuil OSS : {ossPercentage.toFixed(1)}% / 10 000€
                    </Text>
                  </BlockStack>
                </Card>
              )}
            </InlineStack>
          </BlockStack>
        </Layout.Section>

        {data.ossThresholdReached && data.settings.ossEnabled && (
          <Layout.Section>
            <Banner status="info">
              <p>
                Le seuil OSS de 10 000 € a été atteint pour l'année {data.currentYear}.
                Les factures suivantes appliquent la TVA du pays de destination.
              </p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Actions rapides
                </Text>
              </InlineStack>

              <InlineStack gap="300">
                <Button
                  variant="primary"
                  onClick={() => navigate("/app/invoices/generate")}
                >
                  Générer une facture
                </Button>
                <Button onClick={() => navigate("/app/invoices")}>
                  Voir toutes les factures
                </Button>
                {data.settings.ossEnabled && (
                  <Button onClick={() => navigate("/app/reports/oss")}>
                    Rapport OSS
                  </Button>
                )}
                <Button onClick={() => navigate("/app/settings")}>
                  Paramètres
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {data.recentInvoices.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Dernières factures
                </Text>

                <BlockStack gap="200">
                  {data.recentInvoices.map((invoice) => (
                    <InlineStack key={invoice.id} align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          {invoice.invoiceNumber}
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {invoice.customerName} • {formatDate(invoice.issuedAt)}
                        </Text>
                      </BlockStack>
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        {formatCurrency(invoice.totalTtc)}
                      </Text>
                    </InlineStack>
                  ))}
                </BlockStack>

                <InlineStack align="end">
                  <Button onClick={() => navigate("/app/invoices")}>
                    Voir toutes les factures
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                À propos de cette application
              </Text>

              <Text as="p" variant="bodyMd">
                Cette application génère des factures PDF conformes à la législation française 
                et européenne pour les ventes B2C (particuliers).
              </Text>

              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  <strong>Fonctionnalités :</strong>
                </Text>
                <Text as="p" variant="bodyMd">
                  • Génération automatique de factures PDF avec mentions légales
                </Text>
                <Text as="p" variant="bodyMd">
                  • Calcul automatique de la TVA (France, UE, OSS)
                </Text>
                <Text as="p" variant="bodyMd">
                  • Support du régime OSS (seuil 10 000€)
                </Text>
                <Text as="p" variant="bodyMd">
                  • Support de la franchise en base (Art. 293 B CGI)
                </Text>
                <Text as="p" variant="bodyMd">
                  • Reporting OSS trimestriel
                </Text>
              </BlockStack>

              <Banner status="warning">
                <p>
                  <strong>Avertissement légal :</strong> Cette application automatise la génération 
                  de factures mais ne remplace pas un conseil d'expert-comptable. Nous recommandons 
                  vivement la validation par un professionnel avant la première utilisation.
                </p>
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
