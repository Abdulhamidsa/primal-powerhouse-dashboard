-- CreateEnum
CREATE TYPE "DailyCheckInCompliance" AS ENUM ('ON_PLAN', 'PARTIAL', 'OFF_PLAN');

-- CreateEnum
CREATE TYPE "DailyCheckInEnergy" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- CreateTable
CREATE TABLE "daily_check_ins" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dayDate" TIMESTAMP(3) NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "compliance" "DailyCheckInCompliance",
    "energy" "DailyCheckInEnergy",
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_check_ins_clientId_idx" ON "daily_check_ins"("clientId");

-- CreateIndex
CREATE INDEX "daily_check_ins_dayDate_idx" ON "daily_check_ins"("dayDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_check_ins_clientId_dayDate_key" ON "daily_check_ins"("clientId", "dayDate");

-- AddForeignKey
ALTER TABLE "daily_check_ins" ADD CONSTRAINT "daily_check_ins_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;