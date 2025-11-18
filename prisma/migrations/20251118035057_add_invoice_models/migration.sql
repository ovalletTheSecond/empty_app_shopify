-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "companyName" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'FR',
    "legalForm" TEXT,
    "shareCapital" TEXT,
    "siren" TEXT,
    "siret" TEXT,
    "rcs" TEXT,
    "tvaIntracom" TEXT,
    "ossEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ossNumber" TEXT,
    "franchiseEnBase" BOOLEAN NOT NULL DEFAULT false,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'FAC',
    "invoiceFormat" TEXT NOT NULL DEFAULT '{PREFIX}-{YYYY}-{NNNN}',
    "currentYear" INTEGER NOT NULL DEFAULT 2025,
    "currentSequence" INTEGER NOT NULL DEFAULT 0,
    "autoGenerateOnPaid" BOOLEAN NOT NULL DEFAULT false,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'FR',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "pdfTheme" TEXT NOT NULL DEFAULT 'Standard',
    "storageProvider" TEXT NOT NULL DEFAULT 'local',
    "storageBucket" TEXT,
    "storageRegion" TEXT,
    "paymentTerms" TEXT,
    "latePenaltyRate" TEXT,
    "latePenaltyAmount" TEXT NOT NULL DEFAULT '40',
    "legalChecklistConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "legalChecklistDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT,
    "orderName" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerAddress" TEXT,
    "customerPostalCode" TEXT,
    "customerCity" TEXT,
    "customerCountry" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "sellerAddress" TEXT,
    "sellerSiren" TEXT,
    "sellerSiret" TEXT,
    "sellerRcs" TEXT,
    "sellerTvaIntracom" TEXT,
    "sellerLegalForm" TEXT,
    "sellerCapital" TEXT,
    "totalHt" REAL NOT NULL,
    "totalTva" REAL NOT NULL,
    "totalTtc" REAL NOT NULL,
    "ossApplied" BOOLEAN NOT NULL DEFAULT false,
    "franchiseEnBase" BOOLEAN NOT NULL DEFAULT false,
    "pdfUrl" TEXT,
    "pdfPath" TEXT,
    "pdfGenerated" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "legalMentions" TEXT,
    "paymentTerms" TEXT,
    "paymentStatus" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "sku" TEXT,
    "productTitle" TEXT NOT NULL,
    "variantTitle" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPriceHt" REAL NOT NULL,
    "taxRate" REAL NOT NULL,
    "taxAmount" REAL NOT NULL,
    "totalHt" REAL NOT NULL,
    "totalTtc" REAL NOT NULL,
    "lineOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OssSale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerCountry" TEXT NOT NULL,
    "baseHt" REAL NOT NULL,
    "taxRate" REAL NOT NULL,
    "taxAmount" REAL NOT NULL,
    "totalTtc" REAL NOT NULL,
    "saleDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OssThreshold" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "countryCode" TEXT NOT NULL,
    "totalSalesHt" REAL NOT NULL DEFAULT 0,
    "totalSalesTtc" REAL NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "thresholdReached" BOOLEAN NOT NULL DEFAULT false,
    "thresholdDate" DATETIME,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BatchJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "orderIds" TEXT,
    "filters" TEXT,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "resultUrl" TEXT,
    "resultPath" TEXT,
    "errorLog" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");

-- CreateIndex
CREATE INDEX "Invoice_shop_idx" ON "Invoice"("shop");

-- CreateIndex
CREATE INDEX "Invoice_orderId_idx" ON "Invoice"("orderId");

-- CreateIndex
CREATE INDEX "Invoice_customerCountry_idx" ON "Invoice"("customerCountry");

-- CreateIndex
CREATE INDEX "Invoice_issuedAt_idx" ON "Invoice"("issuedAt");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "OssSale_shop_year_quarter_idx" ON "OssSale"("shop", "year", "quarter");

-- CreateIndex
CREATE INDEX "OssSale_shop_customerCountry_year_idx" ON "OssSale"("shop", "customerCountry", "year");

-- CreateIndex
CREATE INDEX "OssSale_invoiceId_idx" ON "OssSale"("invoiceId");

-- CreateIndex
CREATE INDEX "OssThreshold_shop_year_idx" ON "OssThreshold"("shop", "year");

-- CreateIndex
CREATE UNIQUE INDEX "OssThreshold_shop_year_countryCode_key" ON "OssThreshold"("shop", "year", "countryCode");

-- CreateIndex
CREATE INDEX "BatchJob_shop_idx" ON "BatchJob"("shop");

-- CreateIndex
CREATE INDEX "BatchJob_status_idx" ON "BatchJob"("status");

-- CreateIndex
CREATE INDEX "BatchJob_createdAt_idx" ON "BatchJob"("createdAt");
