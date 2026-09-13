-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN "gender" "Gender",
ADD COLUMN "goalCalories" INTEGER,
ADD COLUMN "goalMacros" TEXT;

-- CreateTable
CREATE TABLE "health_metrics" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION NOT NULL,
    "bmr" INTEGER NOT NULL,
    "tdee" INTEGER NOT NULL,
    "recommendedCals" INTEGER NOT NULL,
    "bmiCategory" TEXT NOT NULL,
    "goal" TEXT,
    "macros" TEXT NOT NULL,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "health_metrics_clientId_idx" ON "health_metrics"("clientId");

-- CreateIndex
CREATE INDEX "health_metrics_recordedAt_idx" ON "health_metrics"("recordedAt");

-- AddForeignKey
ALTER TABLE "health_metrics" ADD CONSTRAINT "health_metrics_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE;
