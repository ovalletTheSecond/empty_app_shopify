# Discount Code Multiplier

A Shopify app for efficiently creating and managing multiple promo codes.

## Features

- **Create Parent Codes**: Create base promo codes that serve as templates
- **Duplicate Codes**: Generate multiple unique codes from a parent code
- **Custom Prefixes**: Add custom prefixes to generated codes
- **Flexible Length**: Set the length of the random code portion
- **CSV Export**: Export generated codes to CSV for easy import
- **Client-Side Storage**: All data stored locally in browser (no backend required)

## How to Use

### 1. Create a Parent Code

Navigate to **Create Parent Code** and fill in:
- **Code**: The base code name (e.g., SUMMER2024)
- **Description**: Optional description for the code
- **Discount Value**: The percentage discount (e.g., 20 for 20%)

Click **Create Parent Code** to save.

### 2. Duplicate Codes

Navigate to **Duplicate Codes** and:
- Select a parent code from the dropdown
- Enter the number of codes to generate
- (Optional) Add a prefix (e.g., SALE)
- Set the code length (number of random characters)
- (Optional) Override the parent description
- Click **Generate Codes**

The app will create unique codes like:
- `SALE7A8B9C0D`
- `SALE1E2F3G4H`
- `SALE5I6J7K8L`

### 3. Export to CSV

After generating codes, click **Export as CSV** to download a CSV file containing:
- Code
- Parent Code
- Prefix
- Description
- Discount Value

This CSV can be used to bulk import codes into Shopify or for record-keeping.

### 4. Manage Parent Codes

Navigate to **Manage Codes** to:
- View all created parent codes
- See when each code was created
- Delete individual codes
- Clear all codes at once

## Technical Details

- **Framework**: Remix (Shopify App Template)
- **UI Components**: Shopify Polaris
- **Storage**: Browser localStorage
- **No Backend**: All operations happen client-side

## Notes

- Data is stored in browser localStorage and persists across sessions
- Clearing browser data will delete all stored codes
- Each generated code is guaranteed to be unique within its generation batch
- The app requires access to the Shopify Admin to function

## Admin Action Extension

The app includes an admin action extension that can be deployed to add a link to the discount code pages in Shopify Admin. When deployed, this provides quick access to the promo code manager directly from the Shopify discount code interface.
