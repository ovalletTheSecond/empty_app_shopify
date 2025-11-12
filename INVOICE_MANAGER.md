# Gestionnaire de factures / Invoice Manager

This Shopify app now includes a comprehensive invoice management system that allows you to generate CSV invoices for your orders.

## Features / Fonctionnalités

### 1. Single Invoice Generation / Génération de facture unique

Generate an invoice for a single order using its order ID.

**Access:** Navigate to "Test facture unique" in the app navigation or go to `/app/invoice-demo`

**How to use / Comment utiliser:**
1. Find an order in your Shopify admin
2. Copy the order ID (numeric ID or full GID format like `gid://shopify/Order/5678901234`)
3. Paste it in the order ID field on the test page
4. Click "Generate Invoice" / "Générer la facture"
5. The CSV file will be downloaded automatically

**API Endpoint:**
```
GET /api/invoice/:orderId
```
Where `:orderId` is the numeric order ID (e.g., `5678901234`)

### 2. Bulk Invoice Generation / Génération de factures multiples

Generate invoices for multiple orders at once with advanced filtering.

**Access:** Navigate to "Gestionnaire de factures" in the app navigation or go to `/app/invoices`

**Features:**
- **Search by order number** / Rechercher par numéro de commande
- **Filter by status** / Filtrer par statut:
  - All / Tous
  - Open / Ouvert
  - Closed / Fermé
  - Cancelled / Annulé
- **Set result limit** / Définir la limite de résultats: 25, 50, 100, or 250 orders
- **Select individual orders** / Sélectionner des commandes individuelles
- **Select all orders** / Tout sélectionner
- **Bulk invoice generation** / Génération groupée de factures

**How to use / Comment utiliser:**
1. Go to the Invoice Manager page
2. Apply filters to find the orders you want
3. Click "Search" / "Rechercher"
4. Select the orders using checkboxes
5. Click "Generate X Invoice(s)" / "Générer X facture(s)"
6. A CSV file will be downloaded with all selected invoices

## CSV Format / Format CSV

The generated invoices are in CSV format with the following structure:

### Header Section / Section d'en-tête
- Invoice title / Titre de facture
- Order number / Numéro de commande
- Order date / Date de commande

### Customer Information / Informations client
- Customer name / Nom du client
- Customer email / Email du client

### Shipping Address / Adresse de livraison
- Address line 1 / Adresse ligne 1
- Address line 2 / Adresse ligne 2
- City, Province, Postal Code / Ville, Province, Code postal
- Country / Pays

### Line Items / Articles
Table with columns:
- Description
- Quantity / Quantité
- Unit Price / Prix unitaire
- Total

### Totals / Totaux
- Subtotal / Sous-total
- Total

### Special Features / Fonctionnalités spéciales
- **Bilingual format** / Format bilingue: French and English labels
- **Proper CSV escaping** / Échappement CSV approprié: Handles special characters, commas, quotes
- **Multiple invoices in one file** / Plusieurs factures dans un fichier: When generating multiple invoices, they are separated by a line of equals signs

## Technical Details / Détails techniques

### Files Created / Fichiers créés

1. **`app/utils/invoice.server.ts`**: Core invoice generation utilities
   - `generateInvoiceCSV()`: Converts order data to CSV format
   - `generateInvoiceFilename()`: Creates appropriate filename
   - Type definitions for order data

2. **`app/routes/api.invoice.$orderId.tsx`**: API endpoint for single invoice
   - Fetches order data from Shopify GraphQL API
   - Generates and returns CSV file

3. **`app/routes/app.invoice-demo.tsx`**: Single invoice test page
   - Simple UI for testing single invoice generation
   - Instructions for users

4. **`app/routes/app.invoices.tsx`**: Bulk invoice manager
   - Advanced filtering UI
   - Order selection with checkboxes
   - Bulk invoice generation

### Shopify API Scopes / Portées de l'API Shopify

The app requires the following scope:
- `read_orders`: To fetch order data for invoice generation

This has been added to `shopify.app.toml`.

### GraphQL Queries / Requêtes GraphQL

The app uses the following order fields:
- `id`, `name`, `createdAt`
- `totalPriceSet` with currency
- `customer` (firstName, lastName, email)
- `lineItems` with pricing
- `shippingAddress`

## Installation / Installation

The invoice manager is already integrated into the app. After deploying the app:

1. Make sure to update your app scopes by running:
   ```bash
   npm run deploy
   ```

2. Reinstall the app on your test store if needed to get the new `read_orders` scope

## Usage Examples / Exemples d'utilisation

### Example 1: Single Order Invoice / Facture pour une seule commande

1. Go to an order page in Shopify admin: `admin.shopify.com/store/YOUR_STORE/orders/5678901234`
2. Copy the order ID: `5678901234`
3. Open the app and go to "Test facture unique"
4. Paste the ID and click generate
5. Download the CSV file

### Example 2: All Open Orders / Toutes les commandes ouvertes

1. Go to "Gestionnaire de factures"
2. Select "Open" / "Ouvert" from the status dropdown
3. Click "Search" / "Rechercher"
4. Click "Select All" / "Tout sélectionner"
5. Click "Generate X Invoice(s)" / "Générer X facture(s)"
6. Download the combined CSV file

### Example 3: Specific Orders by Number / Commandes spécifiques par numéro

1. Go to "Gestionnaire de factures"
2. Enter an order number in the search field (e.g., "#1001")
3. Click "Search" / "Rechercher"
4. Select the orders you want
5. Generate invoices

## Troubleshooting / Dépannage

### Order not found / Commande introuvable
- Verify the order ID is correct
- Make sure the order exists in your store
- Check that the app has the `read_orders` scope

### No orders displayed / Aucune commande affichée
- Check your filters (status, search query)
- Increase the limit to show more results
- Verify orders exist in your store

### CSV file not downloading / Fichier CSV ne se télécharge pas
- Check browser popup blocker settings
- Try a different browser
- Check the browser console for errors

## Future Enhancements / Améliorations futures

Potential improvements that could be added:
- PDF invoice generation
- Custom invoice templates
- Email invoice sending
- Invoice history/storage
- More filter options (date range, customer, product)
- Custom field mapping
- Multi-currency support
- Tax breakdown details

## Support

For issues or questions about the invoice manager, please refer to the Shopify App development documentation or contact support.
