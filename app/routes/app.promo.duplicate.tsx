import { useState, useCallback, useEffect } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
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
  DataTable,
  Box,
  Autocomplete,
  Icon,
  ProgressBar,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
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
  currency?: string;
  minPurchaseAmount?: string;
  maxUses?: string;
  usageLimit?: string;
  appliesOncePerCustomer?: boolean;
  combineWithProductDiscounts?: boolean;
  combineWithShippingDiscounts?: boolean;
  combineWithOrderDiscounts?: boolean;
  startsAt?: string;
  endsAt?: string;
  customerEligibility?: string;
  specificCustomerEmail?: string;
  customerSegment?: string;
  channels?: string[];
  createdAt: string;
}

interface GeneratedCode {
  code: string;
  parent: string;
  prefix: string;
  description: string;
  discountValue: string;
}

const MAX_CODES = 1000;

export default function PromoDuplicate() {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const [parentCodes, setParentCodes] = useState<ParentCode[]>([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [numberOfCodes, setNumberOfCodes] = useState("10");
  const [prefix, setPrefix] = useState("");
  const [codeLength, setCodeLength] = useState("8");
  const [description, setDescription] = useState("");
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewCode, setPreviewCode] = useState("");
  const [parentSearchQuery, setParentSearchQuery] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [parentError, setParentError] = useState(false);
  const [numberOfCodesError, setNumberOfCodesError] = useState(false);
  const [codeLengthError, setCodeLengthError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [rawRequest, setRawRequest] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });

  useEffect(() => {
    // Load parent codes from localStorage
    const codes = JSON.parse(localStorage.getItem("parentCodes") || "[]");
    setParentCodes(codes);
  }, []);

  const handleParentChange = useCallback(
    (value: string) => {
      setSelectedParentId(value);
      const parent = parentCodes.find((p) => p.id === value);
      setSelectedOptions(parent ? [parent.id] : []);
      setParentSearchQuery(parent ? parent.code : "");
      if (value) setParentError(false);
    },
    [parentCodes]
  );
  const handleNumberChange = useCallback(
    (value: string) => {
      setNumberOfCodes(value);
      if (value) setNumberOfCodesError(false);
    },
    []
  );
  const handlePrefixChange = useCallback(
    (value: string) => setPrefix(value),
    []
  );
  const handleLengthChange = useCallback(
    (value: string) => {
      setCodeLength(value);
      if (value) setCodeLengthError(false);
    },
    []
  );
  const handleDescriptionChange = useCallback(
    (value: string) => setDescription(value),
    []
  );
  const handleSearchChange = useCallback(
    (value: string) => setSearchQuery(value),
    []
  );
  const handleParentSearchChange = useCallback(
    (value: string) => setParentSearchQuery(value),
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

  // Update preview when inputs change
  useEffect(() => {
    if (codeLength && parseInt(codeLength) > 0) {
      const length = parseInt(codeLength);
      const sample = (prefix || "") + generateRandomString(length);
      setPreviewCode(sample);
    } else {
      setPreviewCode("");
    }
  }, [prefix, codeLength]);

  const handleGenerate = useCallback(async () => {
    // Reset errors
    setParentError(false);
    setNumberOfCodesError(false);
    setCodeLengthError(false);
    
    // Validate required fields
    let hasError = false;
    if (!selectedParentId) {
      setParentError(true);
      hasError = true;
    }
    if (!numberOfCodes) {
      setNumberOfCodesError(true);
      hasError = true;
    }
    if (!codeLength) {
      setCodeLengthError(true);
      hasError = true;
    }
    
    if (hasError) {
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

    // Block generation for specific customer codes
    if (parent.customerEligibility === "specific") {
      shopify.toast.show("Cannot duplicate codes for specific customers. Create separate parent codes for each email.", {
        isError: true,
      });
      return;
    }

    const count = parseInt(numberOfCodes);
    
    if (count > MAX_CODES) {
      shopify.toast.show(`Maximum ${MAX_CODES} codes can be generated at once`, {
        isError: true,
      });
      return;
    }

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
    setIsCreating(true);
    setProgress({ current: 0, total: count, percentage: 0 });

    const batchSize = 50;
    const totalBatches = Math.ceil(count / batchSize);
    const allCodes = codes.map(c => c.code);
    
    const requestPayload = {
      parentCode: parent.code,
      codes: allCodes,
      discountType: parent.discountType,
      discountValue: parent.discountValue,
      startsAt: parent.startsAt || new Date().toISOString(),
      endsAt: parent.endsAt,
      usageLimit: parent.usageLimit,
      appliesOncePerCustomer: parent.appliesOncePerCustomer,
      combineWithProductDiscounts: parent.combineWithProductDiscounts,
      combineWithShippingDiscounts: parent.combineWithShippingDiscounts,
      combineWithOrderDiscounts: parent.combineWithOrderDiscounts,
      minPurchaseAmount: parent.minPurchaseAmount,
    };

    // Store raw request for debugging
    setRawRequest({
      endpoint: "/api/discount/bulk-create",
      method: "POST",
      basePayload: requestPayload,
      totalCodes: count,
      batchSize,
      totalBatches,
      timestamp: new Date().toISOString(),
    });
    
    let totalCreated = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    const allResults: any[] = [];
    const allErrors: any[] = [];
    const allSkipped: any[] = [];

    try {
      // Process all batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        shopify.toast.show(`Creating batch ${batchIndex + 1} of ${totalBatches}...`);

        const response = await fetch("/api/discount/bulk-create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...requestPayload,
            minPurchaseAmount: parent.minPurchaseAmount,
            batchIndex,
            batchSize,
          }),
        });

        const result = await response.json();

        if (result.success) {
          totalCreated += result.created || 0;
          totalFailed += result.failed || 0;
          totalSkipped += result.skipped || 0;
          allResults.push(...(result.results || []));
          allErrors.push(...(result.errors || []));
          allSkipped.push(...(result.skippedCodes || []));

          // Update progress
          const processedCodes = result.batchInfo?.processedCodes || (batchIndex + 1) * batchSize;
          const percentage = Math.min(Math.round((processedCodes / count) * 100), 100);
          setProgress({ 
            current: processedCodes, 
            total: count, 
            percentage 
          });
        } else {
          throw new Error(result.error || "Batch failed");
        }
      }

      // Set final debug info
      const codeUrls = codes.slice(0, 5).map(c => 
        `https://admin.shopify.com/store/${window.shopify?.config?.shop?.split('.')[0] || 'YOUR-STORE'}/discounts/${encodeURIComponent(c.code)}`
      );
      
      setDebugInfo({
        action: "BULK_CREATE_DISCOUNTS_VIA_GRAPHQL",
        timestamp: new Date().toISOString(),
        parentCode: parent.code,
        totalRequested: count,
        totalCreated,
        totalFailed,
        totalSkipped,
        totalBatches,
        sampleCodes: codes.slice(0, 5).map(c => c.code),
        sampleUrls: codeUrls,
        allErrors: allErrors.length > 0 ? allErrors : undefined,
        allSkipped: allSkipped.length > 0 ? allSkipped.slice(0, 10) : undefined,
        note: `Processed in ${totalBatches} batch(es). Created: ${totalCreated}, Failed: ${totalFailed}, Skipped (already exist): ${totalSkipped}`
      });

      setIsCreating(false);
      setShowSuccess(true);
      
      if (totalFailed > 0) {
        shopify.toast.show(`Created ${totalCreated} discounts. ${totalFailed} failed, ${totalSkipped} skipped (already exist).`, {
          duration: 5000,
        });
      } else {
        shopify.toast.show(`Successfully created ${totalCreated} discounts! ${totalSkipped} were skipped (already exist).`);
      }
    } catch (error: any) {
      setIsCreating(false);
      shopify.toast.show(`Error creating discounts: ${error.message}`, {
        isError: true,
      });
      setDebugInfo({
        action: "BULK_CREATE_ERROR",
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        partialResults: {
          created: totalCreated,
          failed: totalFailed,
          skipped: totalSkipped,
        },
      });
      setShowSuccess(true);
    }
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

  // Filter parent codes based on search
  const filteredParentCodes = parentCodes.filter((p) => {
    if (!parentSearchQuery) return true;
    return (
      p.code.toLowerCase().includes(parentSearchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(parentSearchQuery.toLowerCase())
    );
  });

  const parentOptions = filteredParentCodes.map((p) => ({
    label: `${p.code} (${p.discountValue}${p.discountType === 'percentage' ? '%' : '$'})`,
    value: p.id,
  }));

  // Filter codes based on search query
  const filteredCodes = generatedCodes.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.parent.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.prefix.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tableRows = filteredCodes.map((c) => [
    c.code,
    c.parent,
    c.prefix,
    c.description,
    `${c.discountValue}%`,
  ]);

  return (
    <Page>
      <TitleBar title="Create Child Discount Codes" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Create Child Discount Codes
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Select a parent discount code and generate multiple child codes that inherit its settings. Each child code will be created in Shopify as a separate discount linked to the parent.
                  </Text>
                </BlockStack>
                <Button onClick={() => navigate("/app/promo/create")}>
                  Create Parent
                </Button>
              </InlineStack>

              {isCreating && (
                <Card>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">
                      Creating Discounts in Shopify...
                    </Text>
                    <ProgressBar progress={progress.percentage} size="small" />
                    <Text as="p" variant="bodySm" tone="subdued">
                      Progress: {progress.current} of {progress.total} codes ({progress.percentage}%)
                    </Text>
                  </BlockStack>
                </Card>
              )}

              {showSuccess && (
                <BlockStack gap="300">
                  <Banner
                    title="Child Codes Created! 🎊"
                    tone="success"
                    onDismiss={() => {
                      setShowSuccess(false);
                      setDebugInfo(null);
                    }}
                  >
                    <BlockStack gap="200">
                      <Text as="p">
                        Your child discount codes have been created successfully in Shopify. Scroll down to view and export them as CSV.
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        💡 These child codes are linked to the parent code: <strong>{parentCodes.find(p => p.id === selectedParentId)?.code}</strong>
                      </Text>
                    </BlockStack>
                  </Banner>
                </BlockStack>
              )}

              {selectedParentId && parentCodes.find((p) => p.id === selectedParentId) && (
                <>
                  {parentCodes.find((p) => p.id === selectedParentId)?.customerEligibility === "specific" && (
                    <Banner tone="critical">
                      <BlockStack gap="200">
                        <Text as="p" variant="bodySm" fontWeight="bold">
                          ⚠️ Cannot Duplicate for Specific Customer Codes
                        </Text>
                        <Text as="p" variant="bodySm">
                          This parent code is assigned to a specific customer email: <strong>{parentCodes.find((p) => p.id === selectedParentId)?.specificCustomerEmail}</strong>
                        </Text>
                        <Text as="p" variant="bodySm">
                          You cannot create multiple codes from this parent because each generated code would still be restricted to the same email. To create codes for different customers, you must create separate parent codes for each email address.
                        </Text>
                      </BlockStack>
                    </Banner>
                  )}
                  <Card background="bg-surface-info">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" fontWeight="bold">
                        📋 Parent Code Information:
                      </Text>
                      <Text as="p" variant="bodyMd">
                        <strong>Code:</strong> {parentCodes.find((p) => p.id === selectedParentId)?.code}
                      </Text>
                      <Text as="p" variant="bodyMd">
                        <strong>Discount:</strong> {parentCodes.find((p) => p.id === selectedParentId)?.discountValue}
                        {parentCodes.find((p) => p.id === selectedParentId)?.discountType === 'percentage' ? '%' : '$'} off
                      </Text>
                      {parentCodes.find((p) => p.id === selectedParentId)?.description && (
                        <Text as="p" variant="bodySm" tone="subdued">
                          {parentCodes.find((p) => p.id === selectedParentId)?.description}
                        </Text>
                      )}
                      {parentCodes.find((p) => p.id === selectedParentId)?.customerEligibility === "specific" && (
                        <Text as="p" variant="bodySm">
                          <strong>Customer Email:</strong> {parentCodes.find((p) => p.id === selectedParentId)?.specificCustomerEmail}
                        </Text>
                      )}
                      {parentCodes.find((p) => p.id === selectedParentId)?.customerEligibility === "segments" && (
                        <Text as="p" variant="bodySm">
                          <strong>Customer Segment:</strong> {parentCodes.find((p) => p.id === selectedParentId)?.customerSegment}
                        </Text>
                      )}
                      <Text as="p" variant="bodySm" tone="subdued">
                        💡 All generated codes will inherit these discount settings
                      </Text>
                    </BlockStack>
                  </Card>
                </>
              )}

              <Autocomplete
                options={parentOptions}
                selected={selectedOptions}
                onSelect={(selected) => {
                  setSelectedOptions(selected);
                  if (selected.length > 0) {
                    handleParentChange(selected[0]);
                  }
                }}
                textField={
                  <Autocomplete.TextField
                    label="Select Parent Discount Code"
                    value={parentSearchQuery}
                    onChange={handleParentSearchChange}
                    placeholder="Type to search..."
                    autoComplete="off"
                    prefix={<Icon source={SearchIcon} />}
                    clearButton
                    onClearButtonClick={() => {
                      setParentSearchQuery("");
                      setSelectedParentId("");
                      setSelectedOptions([]);
                    }}
                    requiredIndicator
                    helpText={`Child codes will inherit settings from the parent. ${filteredParentCodes.length} of ${parentCodes.length} parent code(s) shown`}
                    error={parentError ? "Please select a parent code" : undefined}
                  />
                }
                listTitle="Parent Codes"
                allowMultiple={false}
              />

              <InlineStack gap="400" blockAlign="start">
                <Box minWidth="200px">
                  <TextField
                    label="Number of Codes"
                    value={numberOfCodes}
                    onChange={handleNumberChange}
                    type="number"
                    autoComplete="off"
                    requiredIndicator
                    helpText={`Max ${MAX_CODES} codes`}
                    error={numberOfCodesError ? "Number of codes is required" : undefined}
                  />
                </Box>
                <Box minWidth="200px">
                  <TextField
                    label="Prefix (optional)"
                    value={prefix}
                    onChange={handlePrefixChange}
                    placeholder="e.g., SALE"
                    autoComplete="off"
                  />
                </Box>
                <Box minWidth="200px">
                  <TextField
                    label="Code Length"
                    value={codeLength}
                    onChange={handleLengthChange}
                    type="number"
                    autoComplete="off"
                    requiredIndicator
                    helpText="Random chars"
                    error={codeLengthError ? "Code length is required" : undefined}
                  />
                </Box>
              </InlineStack>

              {previewCode && (
                <Card background="bg-surface-success">
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="p" variant="bodySm" tone="success">
                        👁️ Preview:
                      </Text>
                    </InlineStack>
                    <Text as="p" variant="headingLg" fontWeight="bold">
                      {previewCode}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      This is an example of how your generated codes will look
                    </Text>
                  </BlockStack>
                </Card>
              )}

              <TextField
                label="Description (optional)"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Override parent description"
                autoComplete="off"
                multiline={2}
              />

              <InlineStack gap="300">
                <Button 
                  variant="primary" 
                  onClick={handleGenerate}
                  disabled={isCreating}
                  loading={isCreating}
                >
                  {isCreating ? "Creating..." : "Generate Child Codes"}
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {generatedCodes.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Generated Codes ({generatedCodes.length})
                  </Text>
                  <Button onClick={handleExportCSV}>
                    Download CSV
                  </Button>
                </InlineStack>
                
                <TextField
                  label="Search codes"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by code, parent, or prefix..."
                  autoComplete="off"
                  clearButton
                  onClearButtonClick={() => setSearchQuery("")}
                />

                {filteredCodes.length > 0 ? (
                  <>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Showing {filteredCodes.length} of {generatedCodes.length} codes
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
                  </>
                ) : (
                  <Banner tone="info">
                    No codes match your search query.
                  </Banner>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
