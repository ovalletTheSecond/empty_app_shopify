import type { LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Icon,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { PlusCircleIcon, DuplicateIcon, ListBulletedIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export default function Index() {
  const navigate = useNavigate();

  return (
    <Page>
      <TitleBar title="Multiple Promo Codes Manager" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Welcome to Multiple Promo Codes Manager 🎉
                  </Text>
                  <Text variant="bodyMd" as="p">
                    This app helps you create and manage multiple promo codes efficiently.
                    Create a parent code, then duplicate it into many unique variations.
                  </Text>
                </BlockStack>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    Quick Start
                  </Text>
                  <InlineStack gap="400" wrap={false}>
                    <Card>
                      <BlockStack gap="300">
                        <Icon source={PlusCircleIcon} tone="base" />
                        <Text as="h4" variant="headingSm">
                          1. Create Parent Code
                        </Text>
                        <Text as="p" variant="bodyMd">
                          Start by creating a base promo code with discount details.
                        </Text>
                        <Button onClick={() => navigate("/app/promo/create")}>
                          Create Code
                        </Button>
                      </BlockStack>
                    </Card>
                    <Card>
                      <BlockStack gap="300">
                        <Icon source={DuplicateIcon} tone="base" />
                        <Text as="h4" variant="headingSm">
                          2. Duplicate Codes
                        </Text>
                        <Text as="p" variant="bodyMd">
                          Generate multiple unique codes from your parent code.
                        </Text>
                        <Button onClick={() => navigate("/app/promo/duplicate")}>
                          Duplicate
                        </Button>
                      </BlockStack>
                    </Card>
                    <Card>
                      <BlockStack gap="300">
                        <Icon source={ListBulletedIcon} tone="base" />
                        <Text as="h4" variant="headingSm">
                          3. Manage Codes
                        </Text>
                        <Text as="p" variant="bodyMd">
                          View and manage all your parent codes in one place.
                        </Text>
                        <Button onClick={() => navigate("/app/promo/manage")}>
                          Manage
                        </Button>
                      </BlockStack>
                    </Card>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Features
                  </Text>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      ✓ Create parent promo codes
                    </Text>
                    <Text as="p" variant="bodyMd">
                      ✓ Generate multiple unique codes
                    </Text>
                    <Text as="p" variant="bodyMd">
                      ✓ Custom prefixes and lengths
                    </Text>
                    <Text as="p" variant="bodyMd">
                      ✓ Export to CSV
                    </Text>
                    <Text as="p" variant="bodyMd">
                      ✓ Client-side storage (no backend needed)
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
