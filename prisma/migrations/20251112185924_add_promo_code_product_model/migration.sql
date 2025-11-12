-- CreateTable
CREATE TABLE "PromoCodeProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "promoCode" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "PromoCodeProduct_shop_idx" ON "PromoCodeProduct"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCodeProduct_shop_promoCode_key" ON "PromoCodeProduct"("shop", "promoCode");
