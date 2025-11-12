import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Shop parameter is required" }, { status: 400 });
  }

  try {
    const promoConfigs = await prisma.promoCodeProduct.findMany({
      where: {
        shop: shop,
        isActive: true,
      },
      select: {
        promoCode: true,
        productId: true,
        variantId: true,
      },
    });

    // Transform the data to be more frontend-friendly
    const configMap = promoConfigs.reduce((acc, config) => {
      acc[config.promoCode] = {
        productId: config.productId.replace("gid://shopify/Product/", ""),
        variantId: config.variantId?.replace("gid://shopify/ProductVariant/", "") || null,
      };
      return acc;
    }, {} as Record<string, { productId: string; variantId: string | null }>);

    return json(
      { configs: configMap },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "public, max-age=300",
        },
      }
    );
  } catch (error: any) {
    console.error("Error fetching promo configs:", error);
    return json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};

// Handle OPTIONS request for CORS preflight
export const OPTIONS = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
