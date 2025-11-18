import { useState, useCallback, useEffect } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate, useSearchParams } from "@remix-run/react";
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

interface ParentCode {
  id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: string;
  currency: string;
  minPurchaseAmount: string;
  maxUses: string;
  usageLimit: string;
  appliesOncePerCustomer: boolean;
  combineWithProductDiscounts: boolean;
  combineWithShippingDiscounts: boolean;
  combineWithOrderDiscounts: boolean;
  startsAt: string;
  endsAt: string;
  customerEligibility: string;
  specificCustomerEmail?: string;
  customerSegment?: string;
  channels: string[];
  createdAt: string;
}

export default function PromoCreate() {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [code, setCode] = useState("");
  const [createdCodeUrl, setCreatedCodeUrl] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minPurchaseAmount, setMinPurchaseAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [combineWithProductDiscounts, setCombineWithProductDiscounts] = useState(true);
  const [combineWithShippingDiscounts, setCombineWithShippingDiscounts] = useState(true);
  const [combineWithOrderDiscounts, setCombineWithOrderDiscounts] = useState(true);
  const [currency, setCurrency] = useState("USD");
  
  // Set default dates: now and +6 months
  const now = new Date().toISOString().slice(0, 16);
  const sixMonthsLater = new Date();
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  const defaultEndDate = sixMonthsLater.toISOString().slice(0, 16);
  
  const [startsAt, setStartsAt] = useState(now);
  const [endsAt, setEndsAt] = useState(defaultEndDate);
  const [appliesOncePerCustomer, setAppliesOncePerCustomer] = useState(false);
  const [customerEligibility, setCustomerEligibility] = useState("all");
  const [specificCustomerEmail, setSpecificCustomerEmail] = useState("");
  const [customerSegment, setCustomerSegment] = useState("");
  const [channels, setChannels] = useState<string[]>(["online_store"]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [discountValueError, setDiscountValueError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [rawRequest, setRawRequest] = useState<any>(null);
  const [searchParams] = useSearchParams();

  // Load data from URL params if duplicating
  useEffect(() => {
    const duplicateId = searchParams.get("duplicate");
    if (duplicateId) {
      const existingCodes = JSON.parse(localStorage.getItem("parentCodes") || "[]");
      const parentToDuplicate = existingCodes.find((c: ParentCode) => c.id === duplicateId);
      if (parentToDuplicate) {
        setIsDuplicating(true);
        setCode(parentToDuplicate.code + "_COPY");
        setDescription(parentToDuplicate.description || "");
        setDiscountType(parentToDuplicate.discountType || "percentage");
        setDiscountValue(parentToDuplicate.discountValue || "");
        setCurrency(parentToDuplicate.currency || "USD");
        setMinPurchaseAmount(parentToDuplicate.minPurchaseAmount || "");
        setMaxUses(parentToDuplicate.maxUses || "");
        setUsageLimit(parentToDuplicate.usageLimit || "");
        setAppliesOncePerCustomer(parentToDuplicate.appliesOncePerCustomer || false);
        setCombineWithProductDiscounts(parentToDuplicate.combineWithProductDiscounts ?? true);
        setCombineWithShippingDiscounts(parentToDuplicate.combineWithShippingDiscounts ?? true);
        setCombineWithOrderDiscounts(parentToDuplicate.combineWithOrderDiscounts ?? true);
        setStartsAt(parentToDuplicate.startsAt || now);
        setEndsAt(parentToDuplicate.endsAt || defaultEndDate);
        setCustomerEligibility(parentToDuplicate.customerEligibility || "all");
        setSpecificCustomerEmail(parentToDuplicate.specificCustomerEmail || "");
        setCustomerSegment(parentToDuplicate.customerSegment || "");
        setChannels(parentToDuplicate.channels || ["online_store"]);
      }
    }
  }, [searchParams]);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
    if (value) setCodeError(false);
  }, []);
  const handleDescriptionChange = useCallback(
    (value: string) => setDescription(value),
    []
  );
  const handleDiscountTypeChange = useCallback(
    (value: string) => setDiscountType(value),
    []
  );
  const handleDiscountValueChange = useCallback(
    (value: string) => {
      setDiscountValue(value);
      if (value) setDiscountValueError(false);
    },
    []
  );
  const handleMinPurchaseChange = useCallback(
    (value: string) => setMinPurchaseAmount(value),
    []
  );
  const handleMaxUsesChange = useCallback(
    (value: string) => setMaxUses(value),
    []
  );
  const handleUsageLimitChange = useCallback(
    (value: string) => setUsageLimit(value),
    []
  );

  const handleSubmit = useCallback(async () => {
    // Reset errors
    setCodeError(false);
    setDiscountValueError(false);
    
    // Validate required fields
    let hasError = false;
    if (!code) {
      setCodeError(true);
      hasError = true;
    }
    if (!discountValue) {
      setDiscountValueError(true);
      hasError = true;
    }
    
    if (hasError) {
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
      currency,
      minPurchaseAmount,
      maxUses,
      usageLimit,
      appliesOncePerCustomer,
      combineWithProductDiscounts,
      combineWithShippingDiscounts,
      combineWithOrderDiscounts,
      startsAt: startsAt || new Date().toISOString(),
      endsAt,
      customerEligibility,
      specificCustomerEmail: customerEligibility === "specific" ? specificCustomerEmail : undefined,
      customerSegment: customerEligibility === "segments" ? customerSegment : undefined,
      channels,
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage
    const existingCodes = JSON.parse(
      localStorage.getItem("parentCodes") || "[]"
    );
    existingCodes.push(parentCode);
    localStorage.setItem("parentCodes", JSON.stringify(existingCodes));

    shopify.toast.show("Creating discount in Shopify...");

    const requestPayload = {
      code,
      discountType,
      discountValue,
      startsAt: startsAt || new Date().toISOString(),
      endsAt,
      usageLimit,
      appliesOncePerCustomer,
      combineWithProductDiscounts,
      combineWithShippingDiscounts,
      combineWithOrderDiscounts,
      minPurchaseAmount,
      customerEligibility,
    };

    // Store raw request for debugging
    setRawRequest({
      endpoint: "/api/discount/create",
      method: "POST",
      payload: requestPayload,
      timestamp: new Date().toISOString(),
    });

    try {
      // Create actual discount in Shopify via GraphQL
      const response = await fetch("/api/discount/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      const result = await response.json();

      // Generate Shopify admin URL for discount
      let discountUrl = "";
      if (result.success && result.discount?.id) {
        const discountId = result.discount.id.split("/").pop();
        discountUrl = `https://admin.shopify.com/store/${window.shopify?.config?.shop?.split('.')[0] || 'YOUR-STORE'}/discounts/${discountId}`;
        setCreatedCodeUrl(discountUrl);
      }

      // Set debug info
      setDebugInfo({
        action: "CREATE_DISCOUNT_VIA_GRAPHQL",
        timestamp: new Date().toISOString(),
        parentCode: parentCode,
        localStorageCount: existingCodes.length,
        requestPayload: requestPayload,
        apiResponse: result,
        rawApiResponse: result.data || result,
        discountUrl,
        graphqlSuccess: result.success,
        errors: result.errors || null,
        alreadyExists: result.alreadyExists || false,
      });

      if (result.success) {
        shopify.toast.show("Discount created successfully in Shopify!");
        setShowSuccess(true);
      } else {
        shopify.toast.show(`Error: ${result.errors?.[0]?.message || result.error || "Failed to create discount"}`, {
          isError: true,
          duration: 5000,
        });
        setShowSuccess(true); // Still show success banner with debug info
      }
    } catch (error: any) {
      shopify.toast.show(`Error creating discount: ${error.message}`, {
        isError: true,
      });
      setDebugInfo({
        action: "CREATE_DISCOUNT_ERROR",
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
      });
      setShowSuccess(true);
    }

    // Reset form
    setTimeout(() => {
      setCode("");
      setDescription("");
      setDiscountValue("");
      setMinPurchaseAmount("");
      setMaxUses("");
      setUsageLimit("");
      setCombineWithProductDiscounts(true);
      setCombineWithShippingDiscounts(true);
      setCombineWithOrderDiscounts(true);
      setShowSuccess(false);
      setCreatedCodeUrl("");
    }, 5000);
  }, [code, description, discountType, discountValue, minPurchaseAmount, maxUses, usageLimit, combineWithProductDiscounts, combineWithShippingDiscounts, combineWithOrderDiscounts, shopify]);

  return (
    <Page>
      <TitleBar title="Create Parent Code" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Create a parent promo code
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Create a base promo code that you can duplicate later into
                    multiple unique codes.
                  </Text>
                </BlockStack>
                <Button onClick={() => navigate("/app/promo/duplicate")}>
                  Go to Duplicate Child
                </Button>
              </InlineStack>

              {isDuplicating && (
                <Banner tone="warning">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" fontWeight="bold">
                      ⚠️ Duplicating from Existing Code
                    </Text>
                    <Text as="p" variant="bodySm">
                      You're creating a new parent code based on an existing one. If the original code was created by a dedicated app or has special features, some functionality may not be fully replicated here.
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      💡 Review all fields carefully before saving.
                    </Text>
                  </BlockStack>
                </Banner>
              )}

              {showSuccess && (
                <BlockStack gap="300">
                  <Banner
                    title="Success! 🎉"
                    tone="success"
                    onDismiss={() => {
                      setShowSuccess(false);
                      setCreatedCodeUrl("");
                      setDebugInfo(null);
                    }}
                  >
                    <BlockStack gap="200">
                      <Text as="p">
                        Parent code has been created and saved successfully!
                      </Text>
                      {createdCodeUrl && (
                        <>
                          <Text as="p" variant="bodySm" fontWeight="bold">
                            📍 Code URL:
                          </Text>
                          <Text as="p" variant="bodySm" fontWeight="bold">
                            <a href={createdCodeUrl} target="_blank" rel="noopener noreferrer" style={{color: "#008060", textDecoration: "underline"}}>
                              {createdCodeUrl}
                            </a>
                          </Text>
                          <Text as="p" variant="bodySm" fontWeight="bold">
                            📍 To create the actual discount in Shopify:
                          </Text>
                          <Text as="p" variant="bodySm">
                            Go to Shopify Admin → Discounts → Create Discount → Use code: <strong>{code}</strong>
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            💡 Tip: Apply the same settings you configured here (discount value, requirements, etc.)
                          </Text>
                        </>
                      )}
                    </BlockStack>
                  </Banner>
                </BlockStack>
              )}

              <TextField
                label="Code"
                value={code}
                onChange={handleCodeChange}
                placeholder="e.g., SUMMER2024"
                autoComplete="off"
                requiredIndicator
                error={codeError ? "Code is required" : undefined}
              />

              <TextField
                label="Description"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="e.g., Summer sale discount"
                autoComplete="off"
                multiline={3}
              />

              <InlineStack gap="400" blockAlign="start">
                <Box width="200px">
                  <Select
                    label="Discount Type"
                    options={[
                      { label: "Percentage", value: "percentage" },
                      { label: "Fixed Amount", value: "fixed" },
                    ]}
                    onChange={handleDiscountTypeChange}
                    value={discountType}
                  />
                </Box>
                <Box minWidth="300px">
                  <TextField
                    label={discountType === "percentage" ? "Discount Value (%)" : "Discount Amount"}
                    value={discountValue}
                    onChange={handleDiscountValueChange}
                    placeholder={discountType === "percentage" ? "e.g., 20" : "e.g., 10.00"}
                    type="number"
                    autoComplete="off"
                    requiredIndicator
                    error={discountValueError ? "Discount value is required" : undefined}
                  />
                </Box>
                <Box width="150px">
                  <Select
                    label="Currency"
                    options={[
                      { label: "USD $", value: "USD" },
                      { label: "EUR €", value: "EUR" },
                      { label: "GBP £", value: "GBP" },
                      { label: "CAD $", value: "CAD" },
                      { label: "AUD $", value: "AUD" },
                    ]}
                    onChange={setCurrency}
                    value={currency}
                  />
                </Box>
              </InlineStack>

              <Box paddingBlockStart="400">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    📅 Schedule
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Set when this discount will be active
                  </Text>
                </BlockStack>
              </Box>

              <InlineStack gap="400" blockAlign="start">
                <Box minWidth="300px">
                  <BlockStack gap="200">
                    <TextField
                      label="Start Date & Time"
                      type="datetime-local"
                      value={startsAt}
                      onChange={setStartsAt}
                      autoComplete="off"
                      helpText="Leave empty to start immediately"
                    />
                    <InlineStack gap="200">
                      <Button
                        size="slim"
                        variant={startsAt.slice(0, 10) === new Date().toISOString().slice(0, 10) ? "primary" : undefined}
                        tone={startsAt.slice(0, 10) === new Date().toISOString().slice(0, 10) ? "success" : undefined}
                        onClick={() => setStartsAt(new Date().toISOString().slice(0, 16))}
                      >
                        Now
                      </Button>
                      <Button
                        size="slim"
                        variant={(() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 3);
                          return startsAt.slice(0, 10) === date.toISOString().slice(0, 10) ? "primary" : undefined;
                        })()}
                        tone={(() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 3);
                          return startsAt.slice(0, 10) === date.toISOString().slice(0, 10) ? "success" : undefined;
                        })()}
                        onClick={() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 3);
                          setStartsAt(date.toISOString().slice(0, 16));
                        }}
                      >
                        +3 Months
                      </Button>
                      <Button
                        size="slim"
                        variant={(() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 6);
                          return startsAt.slice(0, 10) === date.toISOString().slice(0, 10) ? "primary" : undefined;
                        })()}
                        tone={(() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 6);
                          return startsAt.slice(0, 10) === date.toISOString().slice(0, 10) ? "success" : undefined;
                        })()}
                        onClick={() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 6);
                          setStartsAt(date.toISOString().slice(0, 16));
                        }}
                      >
                        +6 Months
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </Box>
                <Box minWidth="300px">
                  <BlockStack gap="200">
                    <TextField
                      label="End Date & Time"
                      type="datetime-local"
                      value={endsAt}
                      onChange={setEndsAt}
                      autoComplete="off"
                      helpText="Leave empty for no expiration"
                    />
                    <InlineStack gap="200">
                      <Button
                        size="slim"
                        variant={(() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 6);
                          return endsAt.slice(0, 10) === date.toISOString().slice(0, 10) ? "primary" : undefined;
                        })()}
                        tone={(() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 6);
                          return endsAt.slice(0, 10) === date.toISOString().slice(0, 10) ? "success" : undefined;
                        })()}
                        onClick={() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 6);
                          setEndsAt(date.toISOString().slice(0, 16));
                        }}
                      >
                        +6 Months
                      </Button>
                      <Button
                        size="slim"
                        variant={(() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 12);
                          return endsAt.slice(0, 10) === date.toISOString().slice(0, 10) ? "primary" : undefined;
                        })()}
                        tone={(() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 12);
                          return endsAt.slice(0, 10) === date.toISOString().slice(0, 10) ? "success" : undefined;
                        })()}
                        onClick={() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 12);
                          setEndsAt(date.toISOString().slice(0, 16));
                        }}
                      >
                        +12 Months
                      </Button>
                      <Button
                        size="slim"
                        variant={(() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 18);
                          return endsAt.slice(0, 10) === date.toISOString().slice(0, 10) ? "primary" : undefined;
                        })()}
                        tone={(() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 18);
                          return endsAt.slice(0, 10) === date.toISOString().slice(0, 10) ? "success" : undefined;
                        })()}
                        onClick={() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 18);
                          setEndsAt(date.toISOString().slice(0, 16));
                        }}
                      >
                        +18 Months
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </Box>
              </InlineStack>

              <Box paddingBlockStart="400">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    👥 Customer Eligibility
                  </Text>
                  <Select
                    label="Who can use this discount?"
                    options={[
                      { label: "All customers", value: "all" },
                      { label: "Specific customers", value: "specific" },
                      { label: "Customer segments", value: "segments" },
                    ]}
                    onChange={setCustomerEligibility}
                    value={customerEligibility}
                  />
                  {customerEligibility === "specific" && (
                    <BlockStack gap="300">
                      <Banner tone="warning">
                        <BlockStack gap="200">
                          <Text as="p" variant="bodySm" fontWeight="bold">
                            ⚠️ One Email Per Parent Code
                          </Text>
                          <Text as="p" variant="bodySm">
                            You can only assign ONE customer email to this parent code. If you need multiple emails, you must create separate parent codes for each customer.
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            💡 The duplicate page cannot assign codes to multiple emails from the same parent.
                          </Text>
                        </BlockStack>
                      </Banner>
                      <TextField
                        label="Customer Email"
                        value={specificCustomerEmail}
                        onChange={setSpecificCustomerEmail}
                        placeholder="customer@example.com"
                        type="email"
                        autoComplete="off"
                        helpText="This discount will only be available to this specific email address"
                      />
                    </BlockStack>
                  )}
                  {customerEligibility === "segments" && (
                    <TextField
                      label="Customer Segment"
                      value={customerSegment}
                      onChange={setCustomerSegment}
                      placeholder="e.g., VIP Customers, Returning Customers"
                      autoComplete="off"
                      helpText="Enter the name of the customer segment this discount applies to"
                    />
                  )}
                  <Checkbox
                    label="Limit to one use per customer"
                    checked={appliesOncePerCustomer}
                    onChange={setAppliesOncePerCustomer}
                  />
                </BlockStack>
              </Box>

              <Box paddingBlockStart="400">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    🛍️ Sales Channels
                  </Text>
                  <ChoiceList
                    title=""
                    choices={[
                      { label: "Online Store", value: "online_store" },
                      { label: "Point of Sale", value: "pos" },
                      { label: "Mobile App", value: "mobile" },
                    ]}
                    selected={channels}
                    onChange={setChannels}
                    allowMultiple
                  />
                </BlockStack>
              </Box>

              <Box paddingBlockStart="400">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    💰 Purchase Requirements
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Set optional purchase conditions for this discount code
                  </Text>
                </BlockStack>
              </Box>

              <InlineStack gap="400">
                <Box minWidth="300px">
                  <TextField
                    label="Minimum Purchase Amount ($)"
                    value={minPurchaseAmount}
                    onChange={handleMinPurchaseChange}
                    placeholder="e.g., 50.00"
                    type="number"
                    autoComplete="off"
                    helpText="Optional minimum order value"
                  />
                </Box>
                <Box minWidth="300px">
                  <TextField
                    label="Usage Limit per Customer"
                    value={usageLimit}
                    onChange={handleUsageLimitChange}
                    placeholder="e.g., 1"
                    type="number"
                    autoComplete="off"
                    helpText="Times each customer can use"
                  />
                </Box>
              </InlineStack>

              <TextField
                label="Maximum Total Uses"
                value={maxUses}
                onChange={handleMaxUsesChange}
                placeholder="e.g., 100"
                type="number"
                autoComplete="off"
                helpText="Total times this code can be used"
              />

              <Box paddingBlockStart="400">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    🔗 Compatibility
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Choose which other discounts can be combined with this code
                  </Text>
                </BlockStack>
              </Box>

              <BlockStack gap="300">
                <Checkbox
                  label="Combine with product discounts"
                  checked={combineWithProductDiscounts}
                  onChange={setCombineWithProductDiscounts}
                />
                <Checkbox
                  label="Combine with shipping discounts"
                  checked={combineWithShippingDiscounts}
                  onChange={setCombineWithShippingDiscounts}
                />
                <Checkbox
                  label="Combine with order discounts"
                  checked={combineWithOrderDiscounts}
                  onChange={setCombineWithOrderDiscounts}
                />
              </BlockStack>

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
