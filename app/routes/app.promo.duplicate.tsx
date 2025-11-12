import { useState, useCallback, useEffect } from "react";
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
  Select,
  Banner,
  DataTable,
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

interface GeneratedCode {
  code: string;
  parent: string;
  prefix: string;
  description: string;
  discountValue: string;
}

export default function PromoDuplicate() {
  const shopify = useAppBridge();
  const [parentCodes, setParentCodes] = useState<ParentCode[]>([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [numberOfCodes, setNumberOfCodes] = useState("10");
  const [prefix, setPrefix] = useState("");
  const [codeLength, setCodeLength] = useState("8");
  const [description, setDescription] = useState("");
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load parent codes from localStorage
    const codes = JSON.parse(localStorage.getItem("parentCodes") || "[]");
    setParentCodes(codes);
  }, []);

  const handleParentChange = useCallback(
    (value: string) => setSelectedParentId(value),
    []
  );
  const handleNumberChange = useCallback(
    (value: string) => setNumberOfCodes(value),
    []
  );
  const handlePrefixChange = useCallback(
    (value: string) => setPrefix(value),
    []
  );
  const handleLengthChange = useCallback(
    (value: string) => setCodeLength(value),
    []
  );
  const handleDescriptionChange = useCallback(
    (value: string) => setDescription(value),
    []
  );

  const generateRandomString = (length: number): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerate = useCallback(() => {
    if (!selectedParentId || !numberOfCodes || !codeLength) {
      shopify.toast.show("Please fill in all required fields", {
        isError: true,
      });
      return;
    }

    const parent = parentCodes.find((p) => p.id === selectedParentId);
    if (!parent) {
      shopify.toast.show("Parent code not found", { isError: true });
      return;
    }

    const count = parseInt(numberOfCodes);
    const length = parseInt(codeLength);
    const codes: GeneratedCode[] = [];
    const usedCodes = new Set<string>();

    // Generate unique codes
    for (let i = 0; i < count; i++) {
      let code;
      do {
        code = (prefix || "") + generateRandomString(length);
      } while (usedCodes.has(code));

      usedCodes.add(code);
      codes.push({
        code,
        parent: parent.code,
        prefix: prefix || "NONE",
        description: description || parent.description,
        discountValue: parent.discountValue,
      });
    }

    setGeneratedCodes(codes);
    setShowSuccess(true);
    shopify.toast.show(`${count} codes generated successfully!`);
  }, [
    selectedParentId,
    numberOfCodes,
    prefix,
    codeLength,
    description,
    parentCodes,
    shopify,
  ]);

  const handleExportCSV = useCallback(() => {
    if (generatedCodes.length === 0) {
      shopify.toast.show("No codes to export", { isError: true });
      return;
    }

    const headers = [
      "Code",
      "Parent Code",
      "Prefix",
      "Description",
      "Discount Value (%)",
    ];
    const rows = generatedCodes.map((c) => [
      c.code,
      c.parent,
      c.prefix,
      c.description,
      c.discountValue,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `promo_codes_${new Date().getTime()}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    shopify.toast.show("CSV exported successfully!");
  }, [generatedCodes, shopify]);

  const parentOptions = [
    { label: "Select a parent code", value: "" },
    ...parentCodes.map((p) => ({
      label: `${p.code} (${p.discountValue}%)`,
      value: p.id,
    })),
  ];

  const tableRows = generatedCodes.map((c) => [
    c.code,
    c.parent,
    c.prefix,
    c.description,
    `${c.discountValue}%`,
  ]);

  return (
    <Page>
      <TitleBar title="Duplicate Codes" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Generate multiple promo codes
              </Text>
              <Text as="p" variant="bodyMd">
                Select a parent code and generate multiple unique variations.
              </Text>

              {showSuccess && (
                <Banner
                  title="Codes Generated!"
                  tone="success"
                  onDismiss={() => setShowSuccess(false)}
                >
                  Your codes have been generated. Export them as CSV below.
                </Banner>
              )}

              <Select
                label="Select Parent Code"
                options={parentOptions}
                onChange={handleParentChange}
                value={selectedParentId}
                requiredIndicator
              />

              <TextField
                label="Number of Codes"
                value={numberOfCodes}
                onChange={handleNumberChange}
                type="number"
                autoComplete="off"
                requiredIndicator
              />

              <TextField
                label="Prefix (optional)"
                value={prefix}
                onChange={handlePrefixChange}
                placeholder="e.g., SALE"
                autoComplete="off"
              />

              <TextField
                label="Code Length"
                value={codeLength}
                onChange={handleLengthChange}
                type="number"
                autoComplete="off"
                requiredIndicator
                helpText="Length of random characters (excluding prefix)"
              />

              <TextField
                label="Description (optional)"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Override parent description"
                autoComplete="off"
                multiline={2}
              />

              <InlineStack gap="300">
                <Button variant="primary" onClick={handleGenerate}>
                  Generate Codes
                </Button>
                {generatedCodes.length > 0 && (
                  <Button onClick={handleExportCSV}>Export as CSV</Button>
                )}
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {generatedCodes.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Generated Codes ({generatedCodes.length})
                </Text>
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
                    "Parent",
                    "Prefix",
                    "Description",
                    "Discount",
                  ]}
                  rows={tableRows}
                  truncate
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
