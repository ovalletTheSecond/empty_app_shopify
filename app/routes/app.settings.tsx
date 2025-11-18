import { useState, useCallback, useEffect } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Button,
  InlineStack,
  Text,
  Banner,
  Select,
  Checkbox,
  Box,
  ChoiceList,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

interface AppSettings {
  defaultCurrency: string;
  defaultDiscountType: string;
  defaultCombineWithProduct: boolean;
  defaultCombineWithShipping: boolean;
  defaultCombineWithOrder: boolean;
  defaultCustomerEligibility: string;
  defaultChannels: string[];
  defaultAppliesOncePerCustomer: boolean;
}

export default function Settings() {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  
  const [currency, setCurrency] = useState("USD");
  const [discountType, setDiscountType] = useState("percentage");
  const [combineWithProduct, setCombineWithProduct] = useState(true);
  const [combineWithShipping, setCombineWithShipping] = useState(true);
  const [combineWithOrder, setCombineWithOrder] = useState(true);
  const [customerEligibility, setCustomerEligibility] = useState("all");
  const [channels, setChannels] = useState<string[]>(["online_store"]);
  const [appliesOncePerCustomer, setAppliesOncePerCustomer] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      const settings: AppSettings = JSON.parse(savedSettings);
      setCurrency(settings.defaultCurrency);
      setDiscountType(settings.defaultDiscountType);
      setCombineWithProduct(settings.defaultCombineWithProduct);
      setCombineWithShipping(settings.defaultCombineWithShipping);
      setCombineWithOrder(settings.defaultCombineWithOrder);
      setCustomerEligibility(settings.defaultCustomerEligibility);
      setChannels(settings.defaultChannels);
      setAppliesOncePerCustomer(settings.defaultAppliesOncePerCustomer);
    }
  }, []);

  const handleSave = useCallback(() => {
    const settings: AppSettings = {
      defaultCurrency: currency,
      defaultDiscountType: discountType,
      defaultCombineWithProduct: combineWithProduct,
      defaultCombineWithShipping: combineWithShipping,
      defaultCombineWithOrder: combineWithOrder,
      defaultCustomerEligibility: customerEligibility,
      defaultChannels: channels,
      defaultAppliesOncePerCustomer: appliesOncePerCustomer,
    };

    localStorage.setItem("appSettings", JSON.stringify(settings));
    shopify.toast.show("Settings saved successfully!");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  }, [currency, discountType, combineWithProduct, combineWithShipping, combineWithOrder, customerEligibility, channels, appliesOncePerCustomer, shopify]);

  const handleReset = useCallback(() => {
    localStorage.removeItem("appSettings");
    setCurrency("USD");
    setDiscountType("percentage");
    setCombineWithProduct(true);
    setCombineWithShipping(true);
    setCombineWithOrder(true);
    setCustomerEligibility("all");
    setChannels(["online_store"]);
    setAppliesOncePerCustomer(false);
    shopify.toast.show("Settings reset to defaults");
  }, [shopify]);

  return (
    <Page>
      <TitleBar title="Settings" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  ⚙️ Default Configuration
                </Text>
                <Text as="p" variant="bodyMd">
                  Set default values that will be pre-filled when creating new parent codes. This helps you work faster by reducing repetitive inputs.
                </Text>
              </BlockStack>

              {showSuccess && (
                <Banner
                  title="Settings Saved! ✅"
                  tone="success"
                  onDismiss={() => setShowSuccess(false)}
                >
                  Your default preferences have been saved and will be applied to new parent codes.
                </Banner>
              )}

              <Box paddingBlockStart="200">
                <BlockStack gap="400">
                  <Text as="h3" variant="headingSm">
                    💵 Currency & Discount Defaults
                  </Text>
                  
                  <InlineStack gap="400" blockAlign="start">
                    <Box minWidth="200px">
                      <Select
                        label="Default Currency"
                        options={[
                          { label: "USD $", value: "USD" },
                          { label: "EUR €", value: "EUR" },
                          { label: "GBP £", value: "GBP" },
                          { label: "CAD $", value: "CAD" },
                          { label: "AUD $", value: "AUD" },
                          { label: "JPY ¥", value: "JPY" },
                          { label: "CHF", value: "CHF" },
                          { label: "CNY ¥", value: "CNY" },
                        ]}
                        onChange={setCurrency}
                        value={currency}
                      />
                    </Box>
                    <Box minWidth="200px">
                      <Select
                        label="Default Discount Type"
                        options={[
                          { label: "Percentage", value: "percentage" },
                          { label: "Fixed Amount", value: "fixed" },
                        ]}
                        onChange={setDiscountType}
                        value={discountType}
                      />
                    </Box>
                  </InlineStack>
                </BlockStack>
              </Box>

              <Box paddingBlockStart="400">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    👥 Default Customer Eligibility
                  </Text>
                  <Select
                    label="Who can use discounts by default?"
                    options={[
                      { label: "All customers", value: "all" },
                      { label: "Specific customers", value: "specific" },
                      { label: "Customer segments", value: "segments" },
                    ]}
                    onChange={setCustomerEligibility}
                    value={customerEligibility}
                  />
                  <Checkbox
                    label="Limit to one use per customer by default"
                    checked={appliesOncePerCustomer}
                    onChange={setAppliesOncePerCustomer}
                  />
                </BlockStack>
              </Box>

              <Box paddingBlockStart="400">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    🔗 Default Compatibility
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Set which other discounts can be combined by default
                  </Text>
                  <Checkbox
                    label="Combine with product discounts"
                    checked={combineWithProduct}
                    onChange={setCombineWithProduct}
                  />
                  <Checkbox
                    label="Combine with shipping discounts"
                    checked={combineWithShipping}
                    onChange={setCombineWithShipping}
                  />
                  <Checkbox
                    label="Combine with order discounts"
                    checked={combineWithOrder}
                    onChange={setCombineWithOrder}
                  />
                </BlockStack>
              </Box>

              <Box paddingBlockStart="400">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    🛍️ Default Sales Channels
                  </Text>
                  <ChoiceList
                    title=""
                    choices={[
                      { label: "Online Store", value: "online_store" },
                      { label: "Point of Sale", value: "pos" },
                      { label: "Mobile App", value: "mobile" },
                      { label: "Facebook & Instagram", value: "social" },
                    ]}
                    selected={channels}
                    onChange={setChannels}
                    allowMultiple
                  />
                </BlockStack>
              </Box>

              <InlineStack gap="300">
                <Button variant="primary" onClick={handleSave}>
                  Save Settings
                </Button>
                <Button onClick={handleReset}>
                  Reset to Defaults
                </Button>
                <Button onClick={() => navigate("/app")}>
                  Back to Home
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                💡 About Settings
              </Text>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  These settings control the default values when creating new parent codes.
                </Text>
                <Text as="p" variant="bodyMd">
                  You can always override these values for individual parent codes.
                </Text>
                <Text as="p" variant="bodyMd">
                  Settings are saved locally in your browser.
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
