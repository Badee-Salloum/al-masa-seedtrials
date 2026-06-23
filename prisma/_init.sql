-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TECHNICIAN', 'ENGINEER', 'MANAGER', 'OWNER');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('ACCEPT', 'REJECT');

-- CreateEnum
CREATE TYPE "TrialState" AS ENUM ('DRAFT', 'IN_TRIAL', 'REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'STATE_CHANGE', 'FIELD_EDIT', 'ACCEPT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TECHNICIAN',
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "dateStart" DATE,
    "dateEnd" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeedCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SeedCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ref" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nursery" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "location" TEXT,
    "areaHectare" DECIMAL(10,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nursery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultCode" TEXT,
    "salePrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saleOk" BOOLEAN NOT NULL DEFAULT true,
    "purchaseOk" BOOLEAN NOT NULL DEFAULT false,
    "productType" TEXT NOT NULL DEFAULT 'consu',
    "descriptionSale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trial" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "seedName" TEXT NOT NULL,
    "state" "TrialState" NOT NULL DEFAULT 'DRAFT',
    "categoryId" TEXT,
    "seasonId" TEXT,
    "countryId" TEXT,
    "supplierId" TEXT,
    "germinationRate" DECIMAL(5,2),
    "purity" DECIMAL(5,2),
    "npkN" DECIMAL(6,2),
    "npkP" DECIMAL(6,2),
    "npkK" DECIMAL(6,2),
    "shelfLife" INTEGER,
    "supplierBatchNumber" TEXT,
    "dateStart" DATE,
    "dateEnd" DATE,
    "managerId" TEXT,
    "decisionDate" TIMESTAMP(3),
    "decisionUserId" TEXT,
    "rejectionReason" TEXT,
    "analysisNote" TEXT,
    "recommendation" "Recommendation",
    "analyzedById" TEXT,
    "analyzedAt" TIMESTAMP(3),
    "productId" TEXT,
    "avgGermination" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avgGrowth" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "avgProduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" TEXT NOT NULL,
    "trialId" TEXT NOT NULL,
    "nurseryId" TEXT NOT NULL,
    "seasonId" TEXT,
    "distributedQty" DECIMAL(12,2),
    "distributionDate" DATE,
    "technicianId" TEXT,
    "avgGermination" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avgGrowth" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "avgProduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Followup" (
    "id" TEXT NOT NULL,
    "distributionId" TEXT NOT NULL,
    "trialId" TEXT NOT NULL,
    "nurseryId" TEXT,
    "seasonId" TEXT,
    "measurementDate" DATE NOT NULL,
    "germinationRate" DECIMAL(5,2),
    "growthCm" DECIMAL(8,2),
    "productionQty" DECIMAL(12,2),
    "notes" TEXT,
    "recordedById" TEXT,
    "imageUrl" TEXT,
    "labResultUrl" TEXT,
    "labResultFilename" TEXT,
    "reportPdfUrl" TEXT,
    "reportPdfFilename" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Followup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowupAttachment" (
    "id" TEXT NOT NULL,
    "followupId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT,
    "size" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowupAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "logDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "resModel" TEXT NOT NULL,
    "resId" TEXT NOT NULL,
    "resName" TEXT,
    "trialId" TEXT,
    "action" "AuditAction" NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "description" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialCounter" (
    "year" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrialCounter_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "_NurseryTechnicians" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NurseryTechnicians_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Season_name_key" ON "Season"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SeedCategory_name_key" ON "SeedCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Trial_code_key" ON "Trial"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Trial_productId_key" ON "Trial"("productId");

-- CreateIndex
CREATE INDEX "Trial_state_idx" ON "Trial"("state");

-- CreateIndex
CREATE INDEX "Trial_seasonId_idx" ON "Trial"("seasonId");

-- CreateIndex
CREATE INDEX "Trial_dateStart_idx" ON "Trial"("dateStart");

-- CreateIndex
CREATE INDEX "Distribution_nurseryId_idx" ON "Distribution"("nurseryId");

-- CreateIndex
CREATE UNIQUE INDEX "Distribution_trialId_nurseryId_key" ON "Distribution"("trialId", "nurseryId");

-- CreateIndex
CREATE INDEX "Followup_trialId_idx" ON "Followup"("trialId");

-- CreateIndex
CREATE INDEX "Followup_distributionId_idx" ON "Followup"("distributionId");

-- CreateIndex
CREATE INDEX "Followup_measurementDate_idx" ON "Followup"("measurementDate");

-- CreateIndex
CREATE INDEX "FollowupAttachment_followupId_idx" ON "FollowupAttachment"("followupId");

-- CreateIndex
CREATE INDEX "AuditLog_logDate_idx" ON "AuditLog"("logDate");

-- CreateIndex
CREATE INDEX "AuditLog_trialId_idx" ON "AuditLog"("trialId");

-- CreateIndex
CREATE INDEX "AuditLog_resModel_resId_idx" ON "AuditLog"("resModel", "resId");

-- CreateIndex
CREATE INDEX "_NurseryTechnicians_B_index" ON "_NurseryTechnicians"("B");

-- AddForeignKey
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SeedCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_decisionUserId_fkey" FOREIGN KEY ("decisionUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_analyzedById_fkey" FOREIGN KEY ("analyzedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_trialId_fkey" FOREIGN KEY ("trialId") REFERENCES "Trial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "Nursery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "Distribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_trialId_fkey" FOREIGN KEY ("trialId") REFERENCES "Trial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowupAttachment" ADD CONSTRAINT "FollowupAttachment_followupId_fkey" FOREIGN KEY ("followupId") REFERENCES "Followup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_trialId_fkey" FOREIGN KEY ("trialId") REFERENCES "Trial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NurseryTechnicians" ADD CONSTRAINT "_NurseryTechnicians_A_fkey" FOREIGN KEY ("A") REFERENCES "Nursery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NurseryTechnicians" ADD CONSTRAINT "_NurseryTechnicians_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

