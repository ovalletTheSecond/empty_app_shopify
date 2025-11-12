import { useState, useCallback } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  TextField,
  Button,
  InlineStack,
  Text,
  Banner,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

interface ParentCode {
  id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: string;
  createdAt: string;
}

export default function PromoCreate() {
  const shopify = useAppBridge();
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCodeChange = useCallback((value: string) => setCode(value), []);
  const handleDescriptionChange = useCallback(
    (value: string) => setDescription(value),
    []
  );
  const handleDiscountValueChange = useCallback(
    (value: string) => setDiscountValue(value),
    []
  );

  const handleSubmit = useCallback(() => {
    if (!code || !discountValue) {
      shopify.toast.show("Please fill in all required fields", {
        isError: true,
      });
      return;
    }

    const parentCode: ParentCode = {
      id: Date.now().toString(),
      code,
      description,
      discountType,
      discountValue,
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage
    const existingCodes = JSON.parse(
      localStorage.getItem("parentCodes") || "[]"
    );
    existingCodes.push(parentCode);
    localStorage.setItem("parentCodes", JSON.stringify(existingCodes));

    shopify.toast.show("Parent code created successfully!");
    setShowSuccess(true);

    // Reset form
    setTimeout(() => {
      setCode("");
      setDescription("");
      setDiscountValue("");
      setShowSuccess(false);
    }, 2000);
  }, [code, description, discountType, discountValue, shopify]);

  return (
    <Page>
      <TitleBar title="Create Parent Code" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Create a parent promo code
              </Text>
              <Text as="p" variant="bodyMd">
                Create a base promo code that you can duplicate later into
                multiple unique codes.
              </Text>

              {showSuccess && (
                <Banner
                  title="Success!"
                  tone="success"
                  onDismiss={() => setShowSuccess(false)}
                >
                  Parent code has been created and saved.
                </Banner>
              )}

              <TextField
                label="Code"
                value={code}
                onChange={handleCodeChange}
                placeholder="e.g., SUMMER2024"
                autoComplete="off"
                requiredIndicator
              />

              <TextField
                label="Description"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="e.g., Summer sale discount"
                autoComplete="off"
                multiline={3}
              />

              <TextField
                label="Discount Value (%)"
                value={discountValue}
                onChange={handleDiscountValueChange}
                placeholder="e.g., 20"
                type="number"
                autoComplete="off"
                requiredIndicator
              />

              <InlineStack gap="300">
                <Button variant="primary" onClick={handleSubmit}>
                  Create Parent Code
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
