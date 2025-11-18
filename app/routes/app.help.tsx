import type { LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  InlineStack,
  List,
  Box,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Help() {
  const navigate = useNavigate();

  return (
    <Page>
      <TitleBar title="How to Use Generate Code" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <BlockStack gap="300">
                <Text as="h2" variant="headingLg">
                  📖 How to Use Generate Code
                </Text>
                <Text as="p" variant="bodyMd">
                  Welcome! This guide will help you understand how to create and manage multiple promo codes efficiently.
                </Text>
              </BlockStack>

              <Divider />

              <BlockStack gap="400">
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h3" variant="headingMd">
                      🎯 Step 1: Create a Parent Code
                    </Text>
                  </InlineStack>
                  <Card background="bg-surface-secondary">
                    <BlockStack gap="300">
                      <Text as="p" variant="bodyMd">
                        A <strong>parent code</strong> is a template that defines the discount settings you want to use. Think of it as the "master" configuration.
                      </Text>
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        What you'll configure:
                      </Text>
                      <List type="bullet">
                        <List.Item>Code name (e.g., "SUMMER2024")</List.Item>
                        <List.Item>Discount type (percentage or fixed amount)</List.Item>
                        <List.Item>Discount value (e.g., 20% or $10)</List.Item>
                        <List.Item>Purchase requirements (minimum amount, usage limits)</List.Item>
                        <List.Item>Compatibility with other discounts</List.Item>
                      </List>
                      <Box paddingBlockStart="300">
                        <Button variant="primary" onClick={() => navigate("/app/promo/create")}>
                          Go to Create Parent
                        </Button>
                      </Box>
                    </BlockStack>
                  </Card>
                </BlockStack>

                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h3" variant="headingMd">
                      🔄 Step 2: Duplicate Child Codes
                    </Text>
                  </InlineStack>
                  <Card background="bg-surface-secondary">
                    <BlockStack gap="300">
                      <Text as="p" variant="bodyMd">
                        Once you have a parent code, you can generate <strong>multiple unique child codes</strong> based on it. Each child code will have the same discount settings but a unique code.
                      </Text>
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Customization options:
                      </Text>
                      <List type="bullet">
                        <List.Item>Number of codes to generate (max 1,000 at once)</List.Item>
                        <List.Item>Custom prefix (e.g., "SALE" → "SALE8X9Y2Z3A")</List.Item>
                        <List.Item>Code length (random characters after prefix)</List.Item>
                        <List.Item>Optional description override</List.Item>
                      </List>
                      <Box paddingBlockStart="300">
                        <Button variant="primary" onClick={() => navigate("/app/promo/duplicate")}>
                          Go to Duplicate Child
                        </Button>
                      </Box>
                    </BlockStack>
                  </Card>
                </BlockStack>

                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h3" variant="headingMd">
                      📥 Step 3: Export to CSV
                    </Text>
                  </InlineStack>
                  <Card background="bg-surface-secondary">
                    <BlockStack gap="300">
                      <Text as="p" variant="bodyMd">
                        After generating your codes, you can <strong>download them as a CSV file</strong> to:
                      </Text>
                      <List type="bullet">
                        <List.Item>Import into Shopify discount system</List.Item>
                        <List.Item>Share with your team</List.Item>
                        <List.Item>Keep records for tracking</List.Item>
                        <List.Item>Distribute to customers via email campaigns</List.Item>
                      </List>
                      <Text as="p" variant="bodyMd">
                        The CSV includes: Code, Parent Code, Prefix, Description, and Discount Value.
                      </Text>
                    </BlockStack>
                  </Card>
                </BlockStack>
              </BlockStack>

              <Divider />

              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  💡 Tips & Best Practices
                </Text>
                <Card background="bg-surface-tertiary">
                  <BlockStack gap="300">
                    <List type="bullet">
                      <List.Item>
                        <strong>Use descriptive parent codes:</strong> Name them clearly so you can easily identify them later (e.g., "BLACKFRIDAY2024")
                      </List.Item>
                      <List.Item>
                        <strong>Add prefixes for campaigns:</strong> Use prefixes like "VIP", "EARLY", or "FLASH" to categorize codes
                      </List.Item>
                      <List.Item>
                        <strong>Set usage limits:</strong> Control how many times codes can be used to prevent abuse
                      </List.Item>
                      <List.Item>
                        <strong>Start small:</strong> Generate a small batch first to test, then create more as needed
                      </List.Item>
                      <List.Item>
                        <strong>Keep the CSV safe:</strong> These are unique codes that should be distributed carefully
                      </List.Item>
                    </List>
                  </BlockStack>
                </Card>
              </BlockStack>

              <Divider />

              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  ❓ Example Use Case
                </Text>
                <Card background="bg-surface-info">
                  <BlockStack gap="300">
                    <Text as="p" variant="bodyMd" fontWeight="bold">
                      Scenario: Summer Sale Campaign
                    </Text>
                    <List type="number">
                      <List.Item>
                        Create a parent code called "SUMMER2024" with 20% discount
                      </List.Item>
                      <List.Item>
                        Generate 500 unique codes with prefix "SALE" (e.g., SALE7K8M9P2Q)
                      </List.Item>
                      <List.Item>
                        Export to CSV and distribute via email marketing
                      </List.Item>
                      <List.Item>
                        Track usage in Shopify admin to monitor campaign success
                      </List.Item>
                    </List>
                  </BlockStack>
                </Card>
              </BlockStack>

              <Box paddingBlockStart="400">
                <InlineStack gap="300" align="center">
                  <Button variant="primary" onClick={() => navigate("/app/promo/create")}>
                    Get Started - Create Parent
                  </Button>
                  <Button onClick={() => navigate("/app")}>
                    Back to Home
                  </Button>
                </InlineStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
