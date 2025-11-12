# Promo Cart Manager - Theme Integration

This extension automatically adds products to the cart when specific promo codes are applied and removes them when the promo code is removed.

## Installation Instructions

### Option 1: Theme App Extension (Recommended)

1. Install this app in your Shopify store
2. Configure your promo codes and products in the app admin panel
3. The theme extension will be automatically available in your theme editor
4. Enable the extension block in your theme

### Option 2: Manual Integration

If you prefer manual integration or need more control, add the following code to your theme:

#### Step 1: Add the JavaScript snippet

Add this code snippet to your theme's `theme.liquid` file, just before the closing `</body>` tag:

```liquid
<script>
(function() {
  const SHOP_DOMAIN = '{{ shop.permanent_domain }}';
  const API_ENDPOINT = 'https://YOUR_APP_URL/api/promo-config?shop=' + SHOP_DOMAIN;
  let promoConfigs = {};
  let currentPromoCode = null;
  let addedProductId = null;

  // Fetch promo configurations from the app
  async function loadPromoConfigs() {
    try {
      const response = await fetch(API_ENDPOINT);
      const data = await response.json();
      promoConfigs = data.configs || {};
      console.log('Promo configs loaded:', promoConfigs);
    } catch (error) {
      console.error('Error loading promo configs:', error);
    }
  }

  // Get current cart state
  async function getCart() {
    try {
      const response = await fetch('/cart.js');
      return await response.json();
    } catch (error) {
      console.error('Error fetching cart:', error);
      return null;
    }
  }

  // Add product to cart
  async function addProductToCart(variantId, quantity = 1) {
    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: variantId,
          quantity: quantity,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding product to cart:', error);
      return null;
    }
  }

  // Remove product from cart
  async function removeProductFromCart(lineItemKey) {
    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: lineItemKey,
          quantity: 0,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error removing product from cart:', error);
      return null;
    }
  }

  // Check and handle promo code changes
  async function handlePromoCodeChange() {
    const cart = await getCart();
    if (!cart) return;

    // Get the applied discount code
    const appliedPromoCode = cart.cart_level_discount_applications?.[0]?.title?.toUpperCase() || null;

    // If promo code hasn't changed, do nothing
    if (appliedPromoCode === currentPromoCode) return;

    console.log('Promo code changed from', currentPromoCode, 'to', appliedPromoCode);

    // Remove previously added product if promo code was removed or changed
    if (currentPromoCode && addedProductId) {
      const lineItem = cart.items.find(item => 
        item.product_id.toString() === addedProductId.toString()
      );
      if (lineItem) {
        await removeProductFromCart(lineItem.key);
        console.log('Removed product:', addedProductId);
      }
      addedProductId = null;
    }

    // Add new product if new promo code matches configuration
    if (appliedPromoCode && promoConfigs[appliedPromoCode]) {
      const config = promoConfigs[appliedPromoCode];
      const variantId = config.variantId || config.productId;
      
      const result = await addProductToCart(variantId);
      if (result) {
        addedProductId = config.productId;
        console.log('Added product:', addedProductId);
      }
    }

    currentPromoCode = appliedPromoCode;
  }

  // Monitor cart updates
  function monitorCart() {
    // Check on page load
    handlePromoCodeChange();

    // Monitor for cart updates (using AJAX API events if available)
    document.addEventListener('cart:updated', handlePromoCodeChange);
    
    // Poll for changes every 2 seconds as a fallback
    setInterval(handlePromoCodeChange, 2000);
  }

  // Initialize
  loadPromoConfigs().then(() => {
    monitorCart();
  });
})();
</script>
```

#### Step 2: Update the API URL

Replace `YOUR_APP_URL` in the code above with your actual app URL (you can find this in the app settings).

### Configuration

1. Go to the app admin panel
2. Navigate to "Promo Code Config"
3. Add your promo code and the product ID that should be added to the cart
4. Optionally specify a variant ID
5. Save the configuration

### How It Works

1. When a customer applies a discount code at checkout
2. The script checks if the code matches any configured promo codes
3. If it matches, the associated product is automatically added to the cart
4. If the customer removes or changes the discount code, the product is automatically removed

### Limitations

- Works with Shopify Ajax Cart API
- Requires the discount code to be applied to the cart
- Product must be available and in stock
- May not work with custom checkout implementations

### Support

For support, please contact the app developer or visit the app documentation.
