import { useState, useCallback, useEffect } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  DataTable,
  Button,
  InlineStack,
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

export default function PromoManage() {
  const shopify = useAppBridge();
  const [parentCodes, setParentCodes] = useState<ParentCode[]>([]);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const loadParentCodes = useCallback(() => {
    const codes = JSON.parse(localStorage.getItem("parentCodes") || "[]");
    setParentCodes(codes);
  }, []);

  useEffect(() => {
    loadParentCodes();
  }, [loadParentCodes]);

  const handleDelete = useCallback(
    (id: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this parent code?"
      );
      if (!confirmed) return;

      const updatedCodes = parentCodes.filter((code) => code.id !== id);
      localStorage.setItem("parentCodes", JSON.stringify(updatedCodes));
      setParentCodes(updatedCodes);
      setShowDeleteSuccess(true);
      shopify.toast.show("Parent code deleted successfully!");

      setTimeout(() => {
        setShowDeleteSuccess(false);
      }, 3000);
    },
    [parentCodes, shopify]
  );

  const handleClearAll = useCallback(() => {
    const confirmed = window.confirm(
      "Are you sure you want to delete ALL parent codes? This action cannot be undone."
    );
    if (!confirmed) return;

    localStorage.setItem("parentCodes", "[]");
    setParentCodes([]);
    shopify.toast.show("All parent codes deleted!");
  }, [shopify]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const tableRows = parentCodes.map((code) => [
    code.code,
    code.description || "—",
    `${code.discountValue}%`,
    formatDate(code.createdAt),
    <Button
      key={code.id}
      onClick={() => handleDelete(code.id)}
      tone="critical"
      size="slim"
    >
      Delete
    </Button>,
  ]);

  return (
    <Page>
      <TitleBar title="Manage Parent Codes" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Parent Promo Codes ({parentCodes.length})
                </Text>
                {parentCodes.length > 0 && (
                  <Button onClick={handleClearAll} tone="critical">
                    Clear All
                  </Button>
                )}
              </InlineStack>

              {showDeleteSuccess && (
                <Banner
                  title="Deleted!"
                  tone="success"
                  onDismiss={() => setShowDeleteSuccess(false)}
                >
                  Parent code has been removed.
                </Banner>
              )}

              {parentCodes.length === 0 ? (
                <Banner title="No parent codes yet">
                  <Text as="p" variant="bodyMd">
                    Create a parent code to get started. Parent codes can be
                    duplicated into multiple unique promo codes.
                  </Text>
                </Banner>
              ) : (
                <DataTable
                  columnContentTypes={[
                    "text",
                    "text",
                    "text",
                    "text",
                    "text",
                  ]}
                  headings={[
                    "Code",
                    "Description",
                    "Discount",
                    "Created",
                    "Actions",
                  ]}
                  rows={tableRows}
                  truncate
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
