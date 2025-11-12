import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { generateInvoiceCSV, generateInvoiceFilename } from "../utils/invoice.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const orderId = params.orderId;
  
  if (!orderId) {
    return new Response("Order ID is required", { status: 400 });
  }
  
  try {
    // Fetch the order data
    const response = await admin.graphql(
      `#graphql
        query getOrder($id: ID!) {
          order(id: $id) {
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
        }`,
      {
        variables: {
          id: `gid://shopify/Order/${orderId}`,
        },
      }
    );
    
    const data = await response.json();
    const order = data.data?.order;
    
    if (!order) {
      return new Response("Order not found", { status: 404 });
    }
    
    // Generate the CSV invoice
    const csvContent = generateInvoiceCSV(order);
    const filename = generateInvoiceFilename(order.name);
    
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return new Response("Error generating invoice", { status: 500 });
  }
};
