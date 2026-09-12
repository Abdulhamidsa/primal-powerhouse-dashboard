-- CreateTable
CREATE TABLE "weekly_check_ins" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" DOUBLE PRECISION,
    "waistCm" DOUBLE PRECISION,
    "trainingAdherence" INTEGER NOT NULL,
    "nutritionAdherence" INTEGER NOT NULL,
    "energyRating" INTEGER NOT NULL,
    "sleepHours" DOUBLE PRECISION,
    "strengthUpdate" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weekly_check_ins_clientId_idx" ON "weekly_check_ins"("clientId");

-- CreateIndex
CREATE INDEX "weekly_check_ins_weekStartDate_idx" ON "weekly_check_ins"("weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_check_ins_clientId_weekStartDate_key" ON "weekly_check_ins"("clientId", "weekStartDate");

-- AddForeignKey
ALTER TABLE "weekly_check_ins" ADD CONSTRAINT "weekly_check_ins_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
