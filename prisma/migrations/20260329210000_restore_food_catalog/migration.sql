-- Restore catalog schema omitted from historical migrations.
-- Existing deployments must review schema drift before applying.
CREATE TYPE "FoodState" AS ENUM ('RAW', 'DRY', 'AS_SOLD', 'COOKED');

CREATE TYPE "FoodSource" AS ENUM ('SYSTEM', 'CUSTOM');

CREATE TYPE "FoodBaseUnit" AS ENUM ('HUNDRED_G', 'UNIT');

CREATE TABLE "foods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "state" "FoodState" NOT NULL,
    "caloriesKcal" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "fiberG" DOUBLE PRECISION,
    "source" "FoodSource" NOT NULL DEFAULT 'SYSTEM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sourceRef" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "baseUnit" "FoodBaseUnit" NOT NULL DEFAULT 'HUNDRED_G',
    "gramsPerUnit" DOUBLE PRECISION,
    "displayUnitLabel" TEXT,
    "display_name" TEXT,
    "canonical_name" TEXT,
    "duplicate_group" TEXT,
    "needs_review" BOOLEAN NOT NULL DEFAULT false,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "foods_name_idx" ON "foods"("name");

CREATE INDEX "foods_category_idx" ON "foods"("category");

CREATE INDEX "foods_isActive_idx" ON "foods"("isActive");

ALTER TABLE "foods" ADD CONSTRAINT "foods_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
