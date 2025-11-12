import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  List,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export default function Index() {

  return (
    <Page>
      <TitleBar title="Remix app template">
        <button variant="primary" onClick={generateProduct}>
          Generate a product
        </button>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Welcome to Promo Cart Manager! 🎉
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Automatically add products to customer carts when they apply specific promo codes. 
                    Boost your sales with smart cart management!
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Quick Start Guide
                  </Text>
                  <List>
                    <List.Item>
                      <Link url="/app/promo-config" removeUnderline>
                        Configure your promo codes
                      </Link>{" "}
                      - Set up which products to add for each discount code
                    </List.Item>
                    <List.Item>
                      <Link url="/app/setup" removeUnderline>
                        Follow setup instructions
                      </Link>{" "}
                      - Integrate with your theme
                    </List.Item>
                    <List.Item>
                      Test it out - Apply a promo code and watch products get added automatically!
                    </List.Item>
                  </List>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    How It Works
                  </Text>
                  <List>
                    <List.Item>
                      Customer applies a discount code at checkout
                    </List.Item>
                    <List.Item>
                      App checks if the code matches your configuration
                    </List.Item>
                    <List.Item>
                      Product is automatically added to their cart
                    </List.Item>
                    <List.Item>
                      Product is removed if they change or remove the code
                    </List.Item>
                  </List>
                </BlockStack>
                <InlineStack gap="300">
                  <Button url="/app/promo-config" variant="primary">
                    Configure Promo Codes
                  </Button>
                  <Button url="/app/setup">
                    View Setup Instructions
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    App template specs
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Framework
                      </Text>
                      <Link
                        url="https://remix.run"
                        target="_blank"
                        removeUnderline
                      >
                        Remix
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Database
                      </Text>
                      <Link
                        url="https://www.prisma.io/"
                        target="_blank"
                        removeUnderline
                      >
                        Prisma
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Interface
                      </Text>
                      <span>
                        <Link
                          url="https://polaris.shopify.com"
                          target="_blank"
                          removeUnderline
                        >
                          Polaris
                        </Link>
                        {", "}
                        <Link
                          url="https://shopify.dev/docs/apps/tools/app-bridge"
                          target="_blank"
                          removeUnderline
                        >
                          App Bridge
                        </Link>
                      </span>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        API
                      </Text>
                      <Link
                        url="https://shopify.dev/docs/api/admin-graphql"
                        target="_blank"
                        removeUnderline
                      >
                        GraphQL API
                      </Link>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Next steps
                  </Text>
                  <List>
                    <List.Item>
                      Build an{" "}
                      <Link
                        url="https://shopify.dev/docs/apps/getting-started/build-app-example"
                        target="_blank"
                        removeUnderline
                      >
                        {" "}
                        example app
                      </Link>{" "}
                      to get started
                    </List.Item>
                    <List.Item>
                      Explore Shopify’s API with{" "}
                      <Link
                        url="https://shopify.dev/docs/apps/tools/graphiql-admin-api"
                        target="_blank"
                        removeUnderline
                      >
                        GraphiQL
                      </Link>
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
