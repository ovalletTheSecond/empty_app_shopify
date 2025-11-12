# Promo Cart Manager - Shopify App

An intelligent Shopify app that automatically adds products to customer carts when they apply specific promo codes, and removes them when the promo code is changed or removed.

## Features

- 🎁 **Automatic Product Addition**: Automatically add gifts or bonus products when customers use specific promo codes
- 🔄 **Dynamic Cart Management**: Products are added when promo codes are applied and removed when codes change
- ⚙️ **Easy Configuration**: Simple admin interface to map promo codes to products
- 🎨 **Theme Integration**: Seamlessly integrates with any Shopify theme
- 📊 **Multiple Configurations**: Support for multiple promo code and product combinations
- ✅ **Variant Support**: Choose specific product variants to add to cart

## How It Works

1. **Merchant Configuration**:
   - Merchant logs into the app admin panel
   - Creates mappings between promo codes and products
   - Specifies which product (and optionally which variant) to add for each promo code

2. **Customer Experience**:
   - Customer shops normally on the store
   - When they apply a discount code at checkout
   - If the code matches a configured promo code, the associated product is automatically added to their cart
   - If they remove or change the discount code, the product is automatically removed

3. **Real-time Synchronization**:
   - The app monitors cart changes in real-time
   - Products are added/removed instantly without page refresh
   - Works with AJAX cart implementations

## Installation

### Prerequisites

- Shopify store (development store or production)
- Node.js 18.20+ or 20.10+
- Shopify CLI installed

### Setup Instructions

1. **Install the App**:
   ```bash
   npm install
   npm run setup
   ```

2. **Configure Database**:
   - The app uses SQLite by default for development
   - For production, update `prisma/schema.prisma` with your database provider

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Deploy the App**:
   ```bash
   npm run deploy
   ```

## Configuration Guide

### 1. Access the Admin Panel

After installing the app, access it from your Shopify Admin:
- Apps → Promo Cart Manager

### 2. Configure Promo Codes

Navigate to **Promo Code Config** in the app menu:

1. Enter your promo code (e.g., `SUMMER2024`, `FREEGIFT`)
2. Enter the Product ID of the product to add
3. Optionally, enter a specific Variant ID
4. Click "Save Configuration"

**Finding Product IDs**:
- Go to Products in Shopify Admin
- Click on the product
- The Product ID is in the URL: `/products/1234567890`
- You can also use the full GID format: `gid://shopify/Product/1234567890`

### 3. Theme Integration

**Option A: Theme App Extension (Recommended)**

1. Go to Online Store → Themes → Customize
2. In the theme editor, find "App embeds" in the left sidebar
3. Enable "Promo Cart Manager"
4. Save your theme

**Option B: Manual Code Integration**

1. Go to Online Store → Themes → Actions → Edit code
2. Open `theme.liquid`
3. Find the closing `</body>` tag
4. Copy the code from the **Setup Instructions** page in the app
5. Paste it just before `</body>`
6. Save the file

## API Endpoints

### GET /api/promo-config

Fetches active promo code configurations for a shop.

**Query Parameters**:
- `shop` (required): The shop domain

**Response**:
```json
{
  "configs": {
    "SUMMER2024": {
      "productId": "1234567890",
      "variantId": "9876543210"
    },
    "FREEGIFT": {
      "productId": "1111111111",
      "variantId": null
    }
  }
}
```

## Database Schema

### PromoCodeProduct

Stores the mappings between promo codes and products.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier (UUID) |
| shop | String | Shop domain |
| promoCode | String | Discount code (uppercase) |
| productId | String | Shopify product GID |
| variantId | String? | Optional variant GID |
| isActive | Boolean | Whether config is active |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

## Technical Details

### Frontend Integration

The theme extension uses vanilla JavaScript and monitors the Shopify Cart API for changes:

- Polls cart state every 3 seconds
- Checks for applied discount codes
- Adds/removes products using `/cart/add.js` and `/cart/change.js`
- Triggers `cart:refresh` events for theme compatibility

### Backend API

Built with Remix framework and Prisma ORM:

- RESTful API for configuration retrieval
- CORS enabled for storefront access
- Cached responses (5 minutes)
- GraphQL integration for product validation

## Use Cases

### 1. Free Gift with Purchase
Add a free gift product when customers use a specific promo code.

### 2. Bundle Promotions
Automatically add complementary products when promotional codes are applied.

### 3. Sample Products
Add sample/trial products when first-time customer codes are used.

### 4. Seasonal Campaigns
Add seasonal items automatically during holiday promotions.

### 5. Loyalty Rewards
Add bonus products for loyalty program member codes.

## Troubleshooting

### Product not being added

1. **Check Configuration**:
   - Verify the promo code is saved in the admin panel
   - Ensure the configuration is marked as "Active"
   - Confirm the Product ID is correct

2. **Check Product Availability**:
   - Product must be published and available
   - Product must be in stock
   - If using Variant ID, ensure the variant exists

3. **Check Theme Integration**:
   - Verify the theme extension is enabled OR manual code is added
   - Check browser console for JavaScript errors
   - Ensure your theme uses standard Shopify Cart API

### Product not being removed

1. **Verify Code Change**:
   - Ensure the discount code was actually removed/changed
   - Check that no other extensions are interfering with cart

2. **Check Browser Compatibility**:
   - Clear browser cache
   - Test in incognito/private mode

### Build Errors

If you encounter build errors:

```bash
# Clean build artifacts
rm -rf build node_modules/.cache

# Rebuild
npm run build
```

## Development

### Project Structure

```
app/
├── routes/
│   ├── app._index.tsx          # Home page
│   ├── app.promo-config.tsx    # Configuration UI
│   ├── app.setup.tsx           # Setup instructions
│   └── api.promo-config.tsx    # API endpoint
├── db.server.ts                # Database client
└── shopify.server.ts           # Shopify API client

extensions/
├── promo-cart-manager/         # Theme extension
│   ├── blocks/
│   │   └── promo-cart-manager.liquid
│   └── shopify.extension.toml

prisma/
├── schema.prisma               # Database schema
└── migrations/                 # Database migrations
```

### Running Tests

```bash
# Lint code
npm run lint

# Build project
npm run build
```

### Environment Variables

Required environment variables:

- `SHOPIFY_API_KEY`: Your Shopify API key
- `SHOPIFY_API_SECRET`: Your Shopify API secret
- `SHOPIFY_APP_URL`: Your app URL
- `SCOPES`: Shopify API scopes (default: `write_products`)

## Limitations

- Requires discount code to be applied to cart (not at checkout)
- Works with standard Shopify Cart API
- May not work with heavily customized checkouts
- Product must be available and in stock
- One product per promo code (multiple codes can be configured)

## Security

- API endpoint uses CORS headers for security
- Shop parameter validation
- GraphQL queries for product validation before saving
- SQL injection protection via Prisma ORM

## Performance

- API responses cached for 5 minutes
- Debounced cart monitoring (500ms)
- Efficient database queries with indexes
- Minimal JavaScript payload (<5KB gzipped)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the setup instructions in the app
3. Check browser console for error messages
4. Verify product IDs and promo codes are correct

## License

This project is part of a Shopify app template. See the main README for license information.

## Credits

Built with:
- [Remix](https://remix.run) - Full-stack web framework
- [Shopify App Remix](https://shopify.dev/docs/api/shopify-app-remix) - Shopify integration
- [Prisma](https://www.prisma.io/) - Database ORM
- [Polaris](https://polaris.shopify.com/) - UI components
