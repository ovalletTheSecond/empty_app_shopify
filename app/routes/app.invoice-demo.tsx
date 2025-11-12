import { useState, useCallback } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  TextField,
  Button,
  Text,
  Banner,
  Link,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({});
};

export default function InvoiceDemoPage() {
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  
  const handleOrderIdChange = useCallback((value: string) => {
    setOrderId(value);
    setError("");
  }, []);
  
  const handleGenerateInvoice = useCallback(() => {
    if (!orderId.trim()) {
      setError("Veuillez entrer un ID de commande / Please enter an order ID");
      return;
    }
    
    // Extract numeric ID if gid format is provided
    const numericId = orderId.includes("gid://shopify/Order/") 
      ? orderId.split("/").pop() 
      : orderId.replace(/[^0-9]/g, "");
    
    if (!numericId) {
      setError("ID de commande invalide / Invalid order ID");
      return;
    }
    
    // Open the invoice generation endpoint
    window.open(`/api/invoice/${numericId}`, "_blank");
  }, [orderId]);
  
  return (
    <Page>
      <TitleBar title="Test de génération de facture / Invoice Generation Test" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Banner tone="info">
              <p>
                Cette page est pour tester la génération de factures individuelles. 
                Pour générer plusieurs factures à la fois, utilisez la page{" "}
                <Link url="/app/invoices" removeUnderline>
                  Gestionnaire de factures
                </Link>.
              </p>
              <p>
                This page is for testing individual invoice generation. 
                To generate multiple invoices at once, use the{" "}
                <Link url="/app/invoices" removeUnderline>
                  Invoice Manager
                </Link>{" "}
                page.
              </p>
            </Banner>
            
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Générer une facture / Generate an Invoice
                </Text>
                
                <Text as="p" variant="bodyMd" tone="subdued">
                  Entrez l'ID d'une commande pour générer sa facture en format CSV.
                  Vous pouvez utiliser l'ID numérique (ex: 5678901234) ou le format GID complet.
                </Text>
                
                <Text as="p" variant="bodyMd" tone="subdued">
                  Enter an order ID to generate its invoice in CSV format.
                  You can use the numeric ID (e.g., 5678901234) or the full GID format.
                </Text>
                
                <TextField
                  label="ID de commande / Order ID"
                  value={orderId}
                  onChange={handleOrderIdChange}
                  placeholder="5678901234 or gid://shopify/Order/5678901234"
                  autoComplete="off"
                  error={error}
                />
                
                <Button onClick={handleGenerateInvoice} variant="primary">
                  Générer la facture / Generate Invoice
                </Button>
              </BlockStack>
            </Card>
            
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Comment utiliser / How to Use
                </Text>
                
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Pour une facture unique / For a single invoice:
                  </Text>
                  <ol style={{ marginLeft: "20px" }}>
                    <li>Allez sur la page de détails d'une commande dans l'admin Shopify</li>
                    <li>Copiez l'ID de la commande depuis l'URL ou les détails</li>
                    <li>Collez l'ID dans le champ ci-dessus</li>
                    <li>Cliquez sur "Générer la facture"</li>
                  </ol>
                  <ol style={{ marginLeft: "20px" }}>
                    <li>Go to an order details page in Shopify admin</li>
                    <li>Copy the order ID from the URL or details</li>
                    <li>Paste the ID in the field above</li>
                    <li>Click "Generate Invoice"</li>
                  </ol>
                </BlockStack>
                
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Pour plusieurs factures / For multiple invoices:
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Utilisez la page{" "}
                    <Link url="/app/invoices" removeUnderline>
                      Gestionnaire de factures
                    </Link>{" "}
                    pour filtrer et sélectionner plusieurs commandes, puis générer leurs factures en une seule fois.
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Use the{" "}
                    <Link url="/app/invoices" removeUnderline>
                      Invoice Manager
                    </Link>{" "}
                    page to filter and select multiple orders, then generate their invoices all at once.
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
