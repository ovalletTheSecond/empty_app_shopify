import {useEffect, useState} from 'react';
import {
  reactExtension,
  useApi,
  AdminAction,
  BlockStack,
  Button,
  Text,
} from '@shopify/ui-extensions-react/admin';

// The target used here must match the target used in the extension's toml file (./shopify.extension.toml)
const TARGET = 'admin.discount-details.action.render';

export default reactExtension(TARGET, () => <App />);

function App() {
  // The useApi hook provides access to several useful APIs like i18n, close, and data.
  const {i18n, close, data} = useApi(TARGET);
  console.log({data});
  const [discountCode, setDiscountCode] = useState('');
  // Use direct API calls to fetch data from Shopify.
  // See https://shopify.dev/docs/api/admin-graphql for more information about Shopify's GraphQL API
  useEffect(() => {
    (async function getDiscountInfo() {
      const getDiscountQuery = {
        query: `query CodeDiscountNode($id: ID!) {
          codeDiscountNode(id: $id) {
            codeDiscount {
              ... on DiscountCodeBasic {
                title
                codes(first: 1) {
                  nodes {
                    code
                  }
                }
              }
            }
          }
        }`,
        variables: {id: data.selected[0].id},
      };

      const res = await fetch("shopify:admin/api/graphql.json", {
        method: "POST",
        body: JSON.stringify(getDiscountQuery),
      });

      if (!res.ok) {
        console.error('Network error');
      }

      const discountData = await res.json();
      const code = discountData?.data?.codeDiscountNode?.codeDiscount?.codes?.nodes?.[0]?.code || 
                   discountData?.data?.codeDiscountNode?.codeDiscount?.title || 
                   'Unknown';
      setDiscountCode(code);
    })();
  }, [data.selected]);
  return (
    // The AdminAction component provides an API for setting the title and actions of the Action extension wrapper.
    <AdminAction
      primaryAction={
        <Button
          onPress={() => {
            // Open the app's duplicate page to create child codes
            window.open(`/app/promo/duplicate`, '_blank');
            close();
          }}
        >
          Create Child Codes
        </Button>
      }
      secondaryAction={
        <Button
          onPress={() => {
            console.log('closing');
            close();
          }}
        >
          Close
        </Button>
      }
    >
      <BlockStack>
        {/* Set the translation values for each supported language in the locales directory */}
        <Text fontWeight="bold">Create Child Discount Codes</Text>
        <Text>Selected discount code: {discountCode}</Text>
        <Text>Click "Create Child Codes" to open the code duplicator and generate multiple child codes that inherit this discount's settings.</Text>
      </BlockStack>
    </AdminAction>
  );
}