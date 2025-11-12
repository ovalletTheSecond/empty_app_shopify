import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  TextField,
  DataTable,
  Text,
  InlineStack,
  Banner,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  const promoConfigs = await prisma.promoCodeProduct.findMany({
    where: {
      shop: session.shop,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return json({ promoConfigs, shop: session.shop });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    if (action === "create") {
      const promoCode = formData.get("promoCode") as string;
      const productId = formData.get("productId") as string;
      const variantId = formData.get("variantId") as string | null;

      // Validate that the product exists
      const productResponse = await admin.graphql(
        `#graphql
          query getProduct($id: ID!) {
            product(id: $id) {
              id
              title
            }
          }`,
        {
          variables: {
            id: productId.startsWith("gid://") ? productId : `gid://shopify/Product/${productId}`,
          },
        }
      );

      const productData = await productResponse.json();
      
      if (!productData.data?.product) {
        return json({ error: "Product not found" }, { status: 400 });
      }

      await prisma.promoCodeProduct.create({
        data: {
          shop: session.shop,
          promoCode: promoCode.trim().toUpperCase(),
          productId: productId.startsWith("gid://") ? productId : `gid://shopify/Product/${productId}`,
          variantId: variantId && variantId.trim() ? variantId : null,
        },
      });

      return json({ success: true, message: "Promo code configuration created" });
    } else if (action === "delete") {
      const id = formData.get("id") as string;

      await prisma.promoCodeProduct.delete({
        where: {
          id,
          shop: session.shop,
        },
      });

      return json({ success: true, message: "Promo code configuration deleted" });
    } else if (action === "toggle") {
      const id = formData.get("id") as string;
      const isActive = formData.get("isActive") === "true";

      await prisma.promoCodeProduct.update({
        where: {
          id,
          shop: session.shop,
        },
        data: {
          isActive: !isActive,
        },
      });

      return json({ success: true, message: "Status updated" });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Action error:", error);
    return json({ error: error.message || "An error occurred" }, { status: 500 });
  }
};

export default function PromoConfig() {
  const { promoConfigs } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const shopify = useAppBridge();

  const [promoCode, setPromoCode] = useState("");
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async () => {
    if (!promoCode || !productId) {
      setMessage({ type: "error", text: "Promo code and Product ID are required" });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("action", "create");
    formData.append("promoCode", promoCode);
    formData.append("productId", productId);
    if (variantId) {
      formData.append("variantId", variantId);
    }

    submit(formData, { method: "POST" });
    
    setTimeout(() => {
      setPromoCode("");
      setProductId("");
      setVariantId("");
      setIsSubmitting(false);
      setMessage({ type: "success", text: "Configuration saved successfully" });
      setTimeout(() => setMessage(null), 3000);
    }, 500);
  };

  const handleDelete = (id: string) => {
    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("id", id);
    submit(formData, { method: "POST" });
    shopify.toast.show("Configuration deleted");
  };

  const handleToggle = (id: string, isActive: boolean) => {
    const formData = new FormData();
    formData.append("action", "toggle");
    formData.append("id", id);
    formData.append("isActive", String(isActive));
    submit(formData, { method: "POST" });
    shopify.toast.show(`Configuration ${isActive ? "disabled" : "enabled"}`);
  };

  const rows = promoConfigs.map((config) => [
    config.promoCode,
    config.productId.replace("gid://shopify/Product/", ""),
    config.variantId?.replace("gid://shopify/ProductVariant/", "") || "Any",
    config.isActive ? "Active" : "Inactive",
    <InlineStack gap="200" key={config.id}>
      <Button
        size="slim"
        onClick={() => handleToggle(config.id, config.isActive)}
      >
        {config.isActive ? "Disable" : "Enable"}
      </Button>
      <Button
        size="slim"
        variant="primary"
        tone="critical"
        onClick={() => handleDelete(config.id)}
      >
        Delete
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page>
      <TitleBar title="Promo Code Configuration" />
      <BlockStack gap="500">
        {message && (
          <Banner
            tone={message.type === "success" ? "success" : "critical"}
            onDismiss={() => setMessage(null)}
          >
            {message.text}
          </Banner>
        )}
        
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Add Product to Cart with Promo Code
                </Text>
                <Text variant="bodyMd" as="p">
                  Configure which product should be automatically added to the cart when a specific promo code is applied.
                </Text>
                
                <TextField
                  label="Promo Code"
                  value={promoCode}
                  onChange={setPromoCode}
                  placeholder="e.g., SUMMER2024"
                  autoComplete="off"
                  helpText="The discount code that triggers the product addition (case-insensitive)"
                />
                
                <TextField
                  label="Product ID"
                  value={productId}
                  onChange={setProductId}
                  placeholder="e.g., 1234567890 or gid://shopify/Product/1234567890"
                  autoComplete="off"
                  helpText="The Shopify product ID to add to cart"
                />
                
                <TextField
                  label="Variant ID (Optional)"
                  value={variantId}
                  onChange={setVariantId}
                  placeholder="e.g., 9876543210 or gid://shopify/ProductVariant/9876543210"
                  autoComplete="off"
                  helpText="Specific variant to add (leave empty for default variant)"
                />
                
                <InlineStack align="end">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                  >
                    Save Configuration
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Active Configurations
                </Text>
                {rows.length > 0 ? (
                  <DataTable
                    columnContentTypes={["text", "text", "text", "text", "text"]}
                    headings={["Promo Code", "Product ID", "Variant ID", "Status", "Actions"]}
                    rows={rows}
                  />
                ) : (
                  <Text variant="bodyMd" as="p" tone="subdued">
                    No configurations yet. Add your first promo code configuration above.
                  </Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
