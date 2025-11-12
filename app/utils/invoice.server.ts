/**
 * Invoice utility functions for generating CSV invoices from Shopify orders
 */

export interface OrderData {
  id: string;
  name: string;
  createdAt: string;
  totalPriceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        originalUnitPriceSet: {
          shopMoney: {
            amount: string;
            currencyCode: string;
          };
        };
      };
    }>;
  };
  shippingAddress?: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
  };
}

/**
 * Escapes a CSV field value
 */
function escapeCsvField(field: string | null | undefined): string {
  if (field == null) return "";
  const stringField = String(field);
  if (stringField.includes(",") || stringField.includes('"') || stringField.includes("\n")) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

/**
 * Generates a CSV invoice from order data
 */
export function generateInvoiceCSV(order: OrderData): string {
  const lines: string[] = [];
  
  // Header information
  lines.push("FACTURE / INVOICE");
  lines.push("");
  
  // Order details
  lines.push(`Numéro de commande / Order Number,${escapeCsvField(order.name)}`);
  lines.push(`Date / Date,${escapeCsvField(new Date(order.createdAt).toLocaleDateString())}`);
  lines.push("");
  
  // Customer information
  if (order.customer) {
    lines.push("INFORMATIONS CLIENT / CUSTOMER INFORMATION");
    const fullName = [order.customer.firstName, order.customer.lastName]
      .filter(Boolean)
      .join(" ");
    if (fullName) {
      lines.push(`Nom / Name,${escapeCsvField(fullName)}`);
    }
    if (order.customer.email) {
      lines.push(`Email / Email,${escapeCsvField(order.customer.email)}`);
    }
  }
  
  // Shipping address
  if (order.shippingAddress) {
    lines.push("ADRESSE DE LIVRAISON / SHIPPING ADDRESS");
    if (order.shippingAddress.address1) {
      lines.push(`Adresse / Address,${escapeCsvField(order.shippingAddress.address1)}`);
    }
    if (order.shippingAddress.address2) {
      lines.push(`Adresse (suite) / Address (line 2),${escapeCsvField(order.shippingAddress.address2)}`);
    }
    const cityProvinceZip = [
      order.shippingAddress.city,
      order.shippingAddress.province,
      order.shippingAddress.zip,
    ]
      .filter(Boolean)
      .join(", ");
    if (cityProvinceZip) {
      lines.push(`Ville, Province, Code Postal / City, Province, Postal Code,${escapeCsvField(cityProvinceZip)}`);
    }
    if (order.shippingAddress.country) {
      lines.push(`Pays / Country,${escapeCsvField(order.shippingAddress.country)}`);
    }
  }
  
  lines.push("");
  
  // Line items header
  lines.push("ARTICLES / ITEMS");
  lines.push("Description,Quantité / Quantity,Prix Unitaire / Unit Price,Total");
  
  // Line items
  let subtotal = 0;
  for (const { node: item } of order.lineItems.edges) {
    const unitPrice = parseFloat(item.originalUnitPriceSet.shopMoney.amount);
    const total = unitPrice * item.quantity;
    subtotal += total;
    
    lines.push(
      [
        escapeCsvField(item.title),
        item.quantity.toString(),
        `${unitPrice.toFixed(2)} ${item.originalUnitPriceSet.shopMoney.currencyCode}`,
        `${total.toFixed(2)} ${item.originalUnitPriceSet.shopMoney.currencyCode}`,
      ].join(",")
    );
  }
  
  lines.push("");
  
  // Total
  const currency = order.totalPriceSet.shopMoney.currencyCode;
  const total = parseFloat(order.totalPriceSet.shopMoney.amount);
  
  lines.push(`Sous-total / Subtotal,,,${subtotal.toFixed(2)} ${currency}`);
  lines.push(`TOTAL,,,${total.toFixed(2)} ${currency}`);
  
  return lines.join("\n");
}

/**
 * Generates a filename for an invoice
 */
export function generateInvoiceFilename(orderName: string): string {
  const sanitizedOrderName = orderName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const timestamp = new Date().toISOString().split("T")[0];
  return `invoice_${sanitizedOrderName}_${timestamp}.csv`;
}
