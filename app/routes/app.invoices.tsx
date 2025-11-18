/**
 * Invoices Dashboard - View and manage invoices
 */

import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Button,
  TextField,
  InlineStack,
  Text,
  Badge,
  EmptyState,
  BlockStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Get recent invoices
  const invoices = await prisma.invoice.findMany({
    where: { shop },
    orderBy: { issuedAt: 'desc' },
    take: 50,
    include: {
      lines: {
        take: 1,
      },
    },
  });

  // Get shop settings
  const settings = await prisma.shopSettings.findUnique({
    where: { shop },
  });

  return json({ invoices, settings });
};

export default function InvoicesPage() {
  const { invoices, settings } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.orderId.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const rows = filteredInvoices.map((invoice) => [
    invoice.invoiceNumber,
    formatDate(invoice.issuedAt),
    invoice.customerName,
    invoice.customerCountry,
    formatCurrency(invoice.totalTtc),
    invoice.ossApplied ? (
      <Badge tone="info">OSS</Badge>
    ) : invoice.franchiseEnBase ? (
      <Badge tone="warning">Franchise</Badge>
    ) : (
      <Badge>Standard</Badge>
    ),
    invoice.pdfGenerated ? (
      <Badge tone="success">Généré</Badge>
    ) : (
      <Badge tone="attention">En attente</Badge>
    ),
    invoice.pdfUrl ? (
      <Button
        size="slim"
        onClick={() => window.open(invoice.pdfUrl!, '_blank')}
      >
        Télécharger
      </Button>
    ) : (
      <Text as="span" tone="subdued">-</Text>
    ),
  ]);

  if (!settings) {
    return (
      <Page>
        <TitleBar title="Factures" />
        <Layout>
          <Layout.Section>
            <Card>
              <EmptyState
                heading="Configuration requise"
                action={{
                  content: "Configurer les paramètres",
                  onAction: () => navigate("/app/settings"),
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>
                  Veuillez configurer les paramètres de votre boutique avant de générer des factures.
                </p>
              </EmptyState>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar title="Factures" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Liste des factures ({filteredInvoices.length})
                </Text>
                <Button
                  variant="primary"
                  onClick={() => navigate("/app/invoices/generate")}
                >
                  Générer une facture
                </Button>
              </InlineStack>

              <TextField
                label="Rechercher"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Numéro de facture, client, commande..."
                autoComplete="off"
                clearButton
                onClearButtonClick={() => setSearchQuery("")}
              />

              {filteredInvoices.length > 0 ? (
                <DataTable
                  columnContentTypes={[
                    'text',
                    'text',
                    'text',
                    'text',
                    'numeric',
                    'text',
                    'text',
                    'text',
                  ]}
                  headings={[
                    'N° Facture',
                    'Date',
                    'Client',
                    'Pays',
                    'Montant TTC',
                    'Régime',
                    'Statut',
                    'Actions',
                  ]}
                  rows={rows}
                />
              ) : (
                <EmptyState
                  heading="Aucune facture trouvée"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>
                    {searchQuery
                      ? "Aucune facture ne correspond à votre recherche."
                      : "Vous n'avez pas encore généré de factures."}
                  </p>
                </EmptyState>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {settings.ossEnabled && (
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Seuil OSS
                </Text>
                <Text as="p" variant="bodyMd">
                  Le seuil OSS de 10 000 € s'applique aux ventes UE B2C.
                  Consultez le rapport OSS pour suivre vos ventes par pays.
                </Text>
                <Button
                  onClick={() => navigate("/app/reports/oss")}
                >
                  Voir le rapport OSS
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
