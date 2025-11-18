/**
 * Generate Invoice Page - Create invoice for a specific order
 */

import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  Banner,
  BlockStack,
  InlineStack,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({});
};

export default function GenerateInvoicePage() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!orderId.trim()) {
      setError("Veuillez entrer un ID de commande");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          `Facture ${data.invoice.invoiceNumber} générée avec succès !`
        );
        setTimeout(() => {
          navigate("/app/invoices");
        }, 2000);
      } else {
        setError(data.error || "Erreur lors de la génération de la facture");
      }
    } catch (err) {
      setError("Erreur réseau lors de la génération de la facture");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      backAction={{ content: "Factures", onAction: () => navigate("/app/invoices") }}
      title="Générer une facture"
    >
      <TitleBar title="Générer une facture" />
      <Layout>
        {error && (
          <Layout.Section>
            <Banner status="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        {success && (
          <Layout.Section>
            <Banner status="success" onDismiss={() => setSuccess(null)}>
              {success}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Informations de la commande
              </Text>

              <TextField
                label="ID de la commande Shopify"
                value={orderId}
                onChange={setOrderId}
                placeholder="gid://shopify/Order/123456789"
                helpText="Format: gid://shopify/Order/[numéro] ou simplement le numéro de commande"
                autoComplete="off"
              />

              <Banner>
                <Text as="p" variant="bodyMd">
                  <strong>Comment trouver l'ID d'une commande ?</strong>
                </Text>
                <Text as="p" variant="bodyMd">
                  1. Allez dans Shopify Admin &gt; Commandes
                </Text>
                <Text as="p" variant="bodyMd">
                  2. Cliquez sur la commande désirée
                </Text>
                <Text as="p" variant="bodyMd">
                  3. L'ID se trouve dans l'URL ou utilisez l'API GraphQL
                </Text>
              </Banner>

              <InlineStack align="end">
                <Button
                  variant="primary"
                  onClick={handleGenerate}
                  loading={loading}
                  disabled={!orderId.trim()}
                >
                  Générer la facture
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Processus de génération
              </Text>

              <Text as="p" variant="bodyMd">
                Lors de la génération, l'application :
              </Text>

              <Text as="p" variant="bodyMd">
                1. ✓ Récupère les détails de la commande depuis Shopify
              </Text>
              <Text as="p" variant="bodyMd">
                2. ✓ Calcule la TVA selon le pays client et le régime configuré
              </Text>
              <Text as="p" variant="bodyMd">
                3. ✓ Vérifie le seuil OSS si applicable
              </Text>
              <Text as="p" variant="bodyMd">
                4. ✓ Génère un numéro de facture unique et séquentiel
              </Text>
              <Text as="p" variant="bodyMd">
                5. ✓ Crée le PDF avec toutes les mentions légales
              </Text>
              <Text as="p" variant="bodyMd">
                6. ✓ Enregistre la facture et met à jour les statistiques OSS
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
