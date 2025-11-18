/**
 * Shopify Integration Service
 * Fetches order data from Shopify Admin API
 */

import type { ShopifyOrder } from '~/types/invoice.types';

/**
 * GraphQL query to fetch order details
 */
const ORDER_QUERY = `
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      name
      createdAt
      financialStatus
      customer {
        firstName
        lastName
        email
      }
      shippingAddress {
        firstName
        lastName
        address1
        address2
        city
        zip
        countryCode
        province
      }
      billingAddress {
        firstName
        lastName
        address1
        address2
        city
        zip
        countryCode
        province
      }
      lineItems(first: 100) {
        nodes {
          id
          title
          variantTitle
          sku
          quantity
          originalUnitPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          taxLines {
            rate
            title
          }
        }
      }
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalTaxSet {
        shopMoney {
          amount
          currencyCode
        }
      }
    }
  }
`;

/**
 * Fetch order from Shopify
 */
export async function fetchShopifyOrder(
  admin: any,
  orderId: string
): Promise<ShopifyOrder | null> {
  try {
    const response = await admin.graphql(ORDER_QUERY, {
      variables: {
        id: orderId,
      },
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('Shopify GraphQL errors:', data.errors);
      return null;
    }

    return data.data?.order || null;
  } catch (error) {
    console.error('Error fetching Shopify order:', error);
    return null;
  }
}

/**
 * Convert Shopify order to invoice input format
 */
export function convertShopifyOrderToInvoiceInput(
  order: ShopifyOrder,
  shop: string
) {
  // Determine customer address (prioritize shipping, fallback to billing)
  const address = order.shippingAddress || order.billingAddress;
  
  const customerName = address
    ? `${address.firstName || ''} ${address.lastName || ''}`.trim()
    : `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || 'Client';

  const customerAddress = address
    ? [address.address1, address.address2].filter(Boolean).join(', ')
    : undefined;

  const customerCountry = address?.countryCode || 'FR';

  // Extract line items
  const lines = order.lineItems.nodes.map(item => {
    const unitPriceStr = item.originalUnitPriceSet.shopMoney.amount;
    const unitPrice = parseFloat(unitPriceStr);
    
    // Get tax rate from first tax line (if any)
    const taxRate = item.taxLines?.[0]?.rate ? item.taxLines[0].rate * 100 : 20.0;
    
    // Calculate unit price HT (excluding VAT)
    const unitPriceHt = unitPrice / (1 + taxRate / 100);

    return {
      sku: item.sku,
      productTitle: item.title,
      variantTitle: item.variantTitle || undefined,
      description: [item.title, item.variantTitle].filter(Boolean).join(' - '),
      quantity: item.quantity,
      unitPriceHt,
      taxRate,
    };
  });

  return {
    shop,
    orderId: order.id,
    orderNumber: order.name,
    orderName: order.name,
    customerName,
    customerEmail: order.customer?.email,
    customerAddress,
    customerPostalCode: address?.zip,
    customerCity: address?.city,
    customerCountry,
    lines,
    paymentStatus: order.financialStatus?.toLowerCase(),
    paidAt: order.financialStatus === 'PAID' ? new Date(order.createdAt) : undefined,
  };
}

/**
 * Query multiple orders with filters
 */
export async function fetchShopifyOrders(
  admin: any,
  filters?: {
    startDate?: string;
    endDate?: string;
    financialStatus?: string;
    first?: number;
    after?: string;
  }
) {
  const query = `
    query GetOrders($first: Int!, $after: String, $query: String) {
      orders(first: $first, after: $after, query: $query) {
        edges {
          cursor
          node {
            id
            name
            createdAt
            financialStatus
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  // Build query string
  let queryString = '';
  if (filters?.startDate) {
    queryString += `created_at:>='${filters.startDate}' `;
  }
  if (filters?.endDate) {
    queryString += `created_at:<='${filters.endDate}' `;
  }
  if (filters?.financialStatus) {
    queryString += `financial_status:${filters.financialStatus} `;
  }

  try {
    const response = await admin.graphql(query, {
      variables: {
        first: filters?.first || 50,
        after: filters?.after,
        query: queryString.trim() || undefined,
      },
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('Shopify GraphQL errors:', data.errors);
      return { orders: [], hasNextPage: false, endCursor: null };
    }

    const orders = data.data?.orders?.edges?.map((edge: any) => edge.node) || [];
    const pageInfo = data.data?.orders?.pageInfo || { hasNextPage: false, endCursor: null };

    return {
      orders,
      hasNextPage: pageInfo.hasNextPage,
      endCursor: pageInfo.endCursor,
    };
  } catch (error) {
    console.error('Error fetching Shopify orders:', error);
    return { orders: [], hasNextPage: false, endCursor: null };
  }
}
