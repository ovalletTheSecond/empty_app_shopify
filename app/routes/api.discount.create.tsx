import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  const formData = await request.json();
  const {
    code,
    discountType,
    discountValue,
    startsAt,
    endsAt,
    usageLimit,
    appliesOncePerCustomer,
    combineWithProductDiscounts,
    combineWithShippingDiscounts,
    combineWithOrderDiscounts,
    minPurchaseAmount,
    customerEligibility,
  } = formData;

  try {
    // First, check if discount code already exists
    const checkResponse = await admin.graphql(
      `#graphql
      query getDiscountCodeByCode($query: String!) {
        codeDiscountNodes(first: 1, query: $query) {
          edges {
            node {
              id
              codeDiscount {
                ... on DiscountCodeBasic {
                  title
                  codes(first: 1) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      {
        variables: {
          query: `title:${code}`,
        },
      }
    );

    const checkData = await checkResponse.json();
    
    if (checkData.data?.codeDiscountNodes?.edges?.length > 0) {
      return json({
        success: false,
        alreadyExists: true,
        existingDiscount: checkData.data.codeDiscountNodes.edges[0].node,
        error: `Discount code "${code}" already exists`,
      });
    }

    // Create discount code using GraphQL
    const response = await admin.graphql(
      `#graphql
      mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode {
            id
            codeDiscount {
              ... on DiscountCodeBasic {
                title
                codes(first: 1) {
                  edges {
                    node {
                      code
                    }
                  }
                }
                startsAt
                endsAt
                customerSelection {
                  __typename
                }
                usageLimit
                appliesOncePerCustomer
                combinesWith {
                  productDiscounts
                  shippingDiscounts
                  orderDiscounts
                }
              }
            }
          }
          userErrors {
            field
            message
            code
          }
        }
      }`,
      {
        variables: {
          basicCodeDiscount: {
            title: code,
            code: code,
            startsAt: startsAt || new Date().toISOString(),
            endsAt: endsAt || null,
            customerSelection: {
              all: customerEligibility === "all" || !customerEligibility,
            },
            customerGets: {
              value: {
                [discountType === "percentage" ? "percentage" : "discountAmount"]: 
                  discountType === "percentage" 
                    ? parseFloat(discountValue) / 100 
                    : { 
                        amount: parseFloat(discountValue),
                        appliesOnEachItem: false
                      }
              },
              items: {
                all: true,
              },
            },
            appliesOncePerCustomer: appliesOncePerCustomer || false,
            usageLimit: usageLimit ? parseInt(usageLimit) : null,
            combinesWith: {
              productDiscounts: combineWithProductDiscounts ?? true,
              shippingDiscounts: combineWithShippingDiscounts ?? true,
              orderDiscounts: combineWithOrderDiscounts ?? true,
            },
            ...(minPurchaseAmount && {
              minimumRequirement: {
                subtotal: {
                  greaterThanOrEqualToSubtotal: parseFloat(minPurchaseAmount),
                },
              },
            }),
          },
        },
      }
    );

    const data = await response.json();

    if (data.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
      return json({
        success: false,
        errors: data.data.discountCodeBasicCreate.userErrors,
        data: data.data,
      });
    }

    return json({
      success: true,
      discount: data.data?.discountCodeBasicCreate?.codeDiscountNode,
      data: data.data,
    });
  } catch (error: any) {
    return json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
};
