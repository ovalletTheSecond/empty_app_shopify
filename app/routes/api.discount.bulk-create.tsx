import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  const formData = await request.json();
  const {
    parentCode,
    parentDiscountId,
    codes,
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
    batchIndex = 0,
    batchSize = 50,
  } = formData;

  const results: any[] = [];
  const errors: any[] = [];
  const skipped: any[] = [];

  try {
    // Process only the current batch
    const startIdx = batchIndex * batchSize;
    const endIdx = Math.min(startIdx + batchSize, codes.length);
    const batchCodes = codes.slice(startIdx, endIdx);

    // Check existing discount codes first
    const checkPromises = batchCodes.map(async (code: string) => {
      try {
        const checkResponse = await admin.graphql(
          `#graphql
          query getDiscountCodeByCode($query: String!) {
            codeDiscountNodes(first: 1, query: $query) {
              edges {
                node {
                  id
                  codeDiscount {
                    ... on DiscountCodeBasic {
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
              query: `title:"${parentCode} - Child: ${code}"`,
            },
          }
        );
        
        const checkData = await checkResponse.json();
        return {
          code,
          exists: checkData.data?.codeDiscountNodes?.edges?.length > 0,
        };
      } catch (error) {
        return { code, exists: false };
      }
    });

    const existenceChecks = await Promise.all(checkPromises);
    const existingCodes = existenceChecks.filter(c => c.exists).map(c => c.code);
    const newCodes = existenceChecks.filter(c => !c.exists).map(c => c.code);

    // Add existing codes to skipped
    existingCodes.forEach(code => {
      skipped.push({
        code,
        reason: "Already exists",
      });
    });

    // Create only new discount codes
    for (const code of newCodes) {
      try {
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
                title: `${parentCode} - Child: ${code}`,
                code: code,
                startsAt: startsAt || new Date().toISOString(),
                endsAt: endsAt || null,
                customerSelection: {
                  all: true,
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
          errors.push({
            code,
            errors: data.data.discountCodeBasicCreate.userErrors,
          });
        } else {
          results.push({
            code,
            discount: data.data?.discountCodeBasicCreate?.codeDiscountNode,
          });
        }
      } catch (error: any) {
        errors.push({
          code,
          error: error.message,
        });
      }
    }

    const totalBatches = Math.ceil(codes.length / batchSize);
    const hasMore = batchIndex + 1 < totalBatches;

    return json({
      success: true,
      created: results.length,
      failed: errors.length,
      skipped: skipped.length,
      results,
      errors,
      skippedCodes: skipped,
      batchInfo: {
        currentBatch: batchIndex + 1,
        totalBatches,
        processedCodes: endIdx,
        totalCodes: codes.length,
        hasMore,
        nextBatchIndex: hasMore ? batchIndex + 1 : null,
      },
    });
  } catch (error: any) {
    return json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
};
