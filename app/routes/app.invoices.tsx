import { useState, useCallback } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  TextField,
  Button,
  DataTable,
  InlineStack,
  Select,
  Text,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { generateInvoiceCSV, generateInvoiceFilename, type OrderData } from "../utils/invoice.server";

interface LoaderData {
  orders: OrderData[];
  error?: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("search") || "";
  const statusFilter = url.searchParams.get("status") || "any";
  const limit = url.searchParams.get("limit") || "50";
  
  try {
    // Build the query filter
    let queryString = "";
    if (statusFilter !== "any") {
      queryString += `status:${statusFilter}`;
    }
    if (searchQuery) {
      queryString += (queryString ? " AND " : "") + `name:${searchQuery}*`;
    }
    
    const response = await admin.graphql(
      `#graphql
        query getOrders($first: Int!, $query: String) {
          orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
            edges {
              node {
                id
                name
                createdAt
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                customer {
                  firstName
                  lastName
                  email
                }
                lineItems(first: 50) {
                  edges {
                    node {
                      title
                      quantity
                      originalUnitPriceSet {
                        shopMoney {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
                shippingAddress {
                  address1
                  address2
                  city
                  province
                  zip
                  country
                }
              }
            }
          }
        }`,
      {
        variables: {
          first: parseInt(limit),
          query: queryString || null,
        },
      }
    );
    
    const data = await response.json();
    const orders = data.data?.orders?.edges?.map((edge: any) => edge.node) || [];
    
    return json<LoaderData>({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return json<LoaderData>({ 
      orders: [], 
      error: "Erreur lors du chargement des commandes / Error loading orders" 
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const orderIds = formData.get("orderIds")?.toString().split(",") || [];
  
  if (orderIds.length === 0) {
    return json({ error: "Aucune commande sélectionnée / No orders selected" }, { status: 400 });
  }
  
  try {
    // Fetch selected orders
    const response = await admin.graphql(
      `#graphql
        query getOrdersForInvoice($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Order {
              id
              name
              createdAt
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customer {
                firstName
                lastName
                email
              }
              lineItems(first: 50) {
                edges {
                  node {
                    title
                    quantity
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
              shippingAddress {
                address1
                address2
                city
                province
                zip
                country
              }
            }
          }
        }`,
      {
        variables: {
          ids: orderIds,
        },
      }
    );
    
    const data = await response.json();
    const orders = data.data?.nodes?.filter((node: any) => node !== null) || [];
    
    // Generate CSV for all orders
    let combinedCSV = "";
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      combinedCSV += generateInvoiceCSV(order);
      if (i < orders.length - 1) {
        combinedCSV += "\n\n" + "=".repeat(80) + "\n\n";
      }
    }
    
    const filename = orders.length === 1 
      ? generateInvoiceFilename(orders[0].name)
      : `invoices_${new Date().toISOString().split("T")[0]}.csv`;
    
    return new Response(combinedCSV, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoices:", error);
    return json({ error: "Erreur lors de la génération des factures / Error generating invoices" }, { status: 500 });
  }
};

export default function InvoicesPage() {
  const { orders, error } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("any");
  const [limitFilter, setLimitFilter] = useState("50");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);
  
  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);
  
  const handleLimitChange = useCallback((value: string) => {
    setLimitFilter(value);
  }, []);
  
  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    if (statusFilter !== "any") params.set("status", statusFilter);
    if (limitFilter) params.set("limit", limitFilter);
    
    submit(params, { method: "get" });
  }, [searchValue, statusFilter, limitFilter, submit]);
  
  const toggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);
  
  const selectAllOrders = useCallback(() => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(order => order.id)));
    }
  }, [orders, selectedOrders.size]);
  
  const handleGenerateInvoices = useCallback(() => {
    if (selectedOrders.size === 0) return;
    
    const formData = new FormData();
    formData.append("orderIds", Array.from(selectedOrders).join(","));
    
    submit(formData, { method: "post" });
  }, [selectedOrders, submit]);
  
  // Prepare table rows
  const rows = orders.map(order => {
    const isSelected = selectedOrders.has(order.id);
    const customerName = order.customer
      ? [order.customer.firstName, order.customer.lastName].filter(Boolean).join(" ")
      : "N/A";
    
    return [
      <input
        key={order.id}
        type="checkbox"
        checked={isSelected}
        onChange={() => toggleOrderSelection(order.id)}
      />,
      order.name,
      new Date(order.createdAt).toLocaleDateString(),
      customerName,
      `${parseFloat(order.totalPriceSet.shopMoney.amount).toFixed(2)} ${order.totalPriceSet.shopMoney.currencyCode}`,
    ];
  });
  
  const statusOptions = [
    { label: "Tous / All", value: "any" },
    { label: "Ouvert / Open", value: "open" },
    { label: "Fermé / Closed", value: "closed" },
    { label: "Annulé / Cancelled", value: "cancelled" },
  ];
  
  const limitOptions = [
    { label: "25", value: "25" },
    { label: "50", value: "50" },
    { label: "100", value: "100" },
    { label: "250", value: "250" },
  ];
  
  return (
    <Page>
      <TitleBar title="Gestionnaire de factures / Invoice Manager" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            {error && (
              <Banner tone="critical">
                <p>{error}</p>
              </Banner>
            )}
            
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Filtres de recherche / Search Filters
                </Text>
                
                <InlineStack gap="400">
                  <div style={{ flex: 1 }}>
                    <TextField
                      label="Numéro de commande / Order Number"
                      value={searchValue}
                      onChange={handleSearchChange}
                      placeholder="#1001"
                      autoComplete="off"
                    />
                  </div>
                  <div style={{ minWidth: "200px" }}>
                    <Select
                      label="Statut / Status"
                      options={statusOptions}
                      value={statusFilter}
                      onChange={handleStatusChange}
                    />
                  </div>
                  <div style={{ minWidth: "150px" }}>
                    <Select
                      label="Limite / Limit"
                      options={limitOptions}
                      value={limitFilter}
                      onChange={handleLimitChange}
                    />
                  </div>
                </InlineStack>
                
                <InlineStack gap="300">
                  <Button onClick={handleSearch}>
                    Rechercher / Search
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
            
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Commandes ({orders.length})
                  </Text>
                  <InlineStack gap="300">
                    <Button onClick={selectAllOrders}>
                      {selectedOrders.size === orders.length 
                        ? "Tout désélectionner / Deselect All" 
                        : "Tout sélectionner / Select All"}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleGenerateInvoices}
                      disabled={selectedOrders.size === 0}
                    >
                      Générer {selectedOrders.size} facture(s) / Generate {selectedOrders.size} Invoice(s)
                    </Button>
                  </InlineStack>
                </InlineStack>
                
                {orders.length > 0 ? (
                  <DataTable
                    columnContentTypes={["text", "text", "text", "text", "text"]}
                    headings={[
                      <input
                        key="select-all"
                        type="checkbox"
                        checked={selectedOrders.size === orders.length && orders.length > 0}
                        onChange={selectAllOrders}
                      />,
                      "N° Commande / Order #",
                      "Date",
                      "Client / Customer",
                      "Total",
                    ]}
                    rows={rows}
                  />
                ) : (
                  <Text as="p" tone="subdued">
                    Aucune commande trouvée / No orders found
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
