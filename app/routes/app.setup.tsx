import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  List,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  const appUrl = process.env.SHOPIFY_APP_URL || "YOUR_APP_URL";
  const apiEndpoint = `${appUrl}/api/promo-config?shop=${session.shop}`;

  return json({ shop: session.shop, apiEndpoint });
};

export default function Setup() {
  const { shop, apiEndpoint } = useLoaderData<typeof loader>();

  const liquidCode = `<script>
(function() {
  const SHOP_DOMAIN = '${shop}';
  const API_ENDPOINT = '${apiEndpoint}';
  let promoConfigs = {};
  let currentPromoCode = null;
  let addedProductVariantId = null;

  async function loadPromoConfigs() {
    try {
      const response = await fetch(API_ENDPOINT);
      const data = await response.json();
      promoConfigs = data.configs || {};
    } catch (error) {
      console.error('Error loading promo configs:', error);
    }
  }

  async function getCart() {
    const response = await fetch('/cart.js');
    return await response.json();
  }

  async function addProductToCart(variantId) {
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: 1 })
    });
    document.dispatchEvent(new CustomEvent('cart:refresh'));
    return await response.json();
  }

  async function removeProductFromCart(lineItemKey) {
    const response = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lineItemKey, quantity: 0 })
    });
    document.dispatchEvent(new CustomEvent('cart:refresh'));
    return await response.json();
  }

  async function handlePromoCodeChange() {
    const cart = await getCart();
    if (!cart) return;

    let appliedPromoCode = null;
    if (cart.cart_level_discount_applications && cart.cart_level_discount_applications.length > 0) {
      appliedPromoCode = cart.cart_level_discount_applications[0].title.toUpperCase().trim();
    }

    if (appliedPromoCode === currentPromoCode) return;

    if (currentPromoCode && addedProductVariantId) {
      const lineItem = cart.items.find(item => item.variant_id.toString() === addedProductVariantId.toString());
      if (lineItem) await removeProductFromCart(lineItem.key);
      addedProductVariantId = null;
    }

    if (appliedPromoCode && promoConfigs[appliedPromoCode]) {
      const config = promoConfigs[appliedPromoCode];
      const variantId = config.variantId || config.productId;
      const result = await addProductToCart(variantId);
      if (result) addedProductVariantId = variantId;
    }

    currentPromoCode = appliedPromoCode;
  }

  loadPromoConfigs().then(() => {
    handlePromoCodeChange();
    document.addEventListener('cart:updated', handlePromoCodeChange);
    setInterval(handlePromoCodeChange, 3000);
  });
})();
</script>`;

  return (
    <Page>
      <TitleBar title="Setup Instructions" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Banner tone="info">
              <Text as="p" variant="bodyMd">
                Follow these instructions to integrate the Promo Cart Manager with your Shopify theme.
              </Text>
            </Banner>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Quick Setup Guide
                </Text>
                
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    Step 1: Configure Promo Codes
                  </Text>
                  <List type="number">
                    <List.Item>
                      Go to the <strong>Promo Code Config</strong> page in the app menu
                    </List.Item>
                    <List.Item>
                      Enter your promo code (e.g., "SUMMER2024")
                    </List.Item>
                    <List.Item>
                      Enter the Product ID of the product you want to add automatically
                    </List.Item>
                    <List.Item>
                      Optionally, specify a Variant ID if you want a specific variant
                    </List.Item>
                    <List.Item>
                      Click "Save Configuration"
                    </List.Item>
                  </List>
                </BlockStack>

                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    Step 2: Theme Integration (Choose One Method)
                  </Text>
                  
                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    Method A: Using Theme App Extension (Recommended)
                  </Text>
                  <List type="number">
                    <List.Item>
                      Go to your Shopify Admin → Online Store → Themes
                    </List.Item>
                    <List.Item>
                      Click "Customize" on your active theme
                    </List.Item>
                    <List.Item>
                      In the theme editor, look for "App embeds" in the left sidebar
                    </List.Item>
                    <List.Item>
                      Find "Promo Cart Manager" and toggle it ON
                    </List.Item>
                    <List.Item>
                      Save your theme
                    </List.Item>
                  </List>

                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    Method B: Manual Code Installation
                  </Text>
                  <List type="number">
                    <List.Item>
                      Go to Online Store → Themes → Actions → Edit code
                    </List.Item>
                    <List.Item>
                      Open the <code>theme.liquid</code> file
                    </List.Item>
                    <List.Item>
                      Scroll to the bottom and find the closing <code>&lt;/body&gt;</code> tag
                    </List.Item>
                    <List.Item>
                      Paste the code below just before <code>&lt;/body&gt;</code>
                    </List.Item>
                    <List.Item>
                      Click "Save"
                    </List.Item>
                  </List>
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Manual Integration Code
                </Text>
                <Text as="p" variant="bodyMd">
                  Copy and paste this code into your theme.liquid file:
                </Text>
                <div style={{ 
                  backgroundColor: '#f6f6f7', 
                  padding: '16px', 
                  borderRadius: '8px',
                  border: '1px solid #e1e3e5',
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {liquidCode}
                </div>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  How It Works
                </Text>
                <List>
                  <List.Item>
                    When a customer applies a discount code at checkout
                  </List.Item>
                  <List.Item>
                    The script checks if the code matches any configured promo codes
                  </List.Item>
                  <List.Item>
                    If it matches, the associated product is automatically added to the cart
                  </List.Item>
                  <List.Item>
                    If the customer removes or changes the discount code, the product is removed
                  </List.Item>
                </List>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Finding Product IDs
                </Text>
                <Text as="p" variant="bodyMd">
                  To find a product ID:
                </Text>
                <List type="number">
                  <List.Item>
                    Go to Products in your Shopify Admin
                  </List.Item>
                  <List.Item>
                    Click on the product you want to use
                  </List.Item>
                  <List.Item>
                    Look at the URL in your browser
                  </List.Item>
                  <List.Item>
                    The Product ID is the number at the end (e.g., /products/1234567890)
                  </List.Item>
                </List>
                <Text as="p" variant="bodyMd">
                  You can also use the full GID format: gid://shopify/Product/1234567890
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  API Endpoint
                </Text>
                <Text as="p" variant="bodyMd">
                  Your configuration API endpoint:
                </Text>
                <div style={{ 
                  backgroundColor: '#f6f6f7', 
                  padding: '12px', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}>
                  {apiEndpoint}
                </div>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
