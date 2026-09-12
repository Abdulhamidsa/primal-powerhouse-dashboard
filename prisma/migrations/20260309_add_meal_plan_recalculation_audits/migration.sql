-- CreateTable
CREATE TABLE "meal_plan_recalculation_audits" (
    "id" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" TEXT,
    "mode" TEXT NOT NULL,
    "oldTargets" TEXT NOT NULL,
    "newTargets" TEXT NOT NULL,
    "projectedTotals" TEXT NOT NULL,
    "expectedAccuracyPercent" DOUBLE PRECISION NOT NULL,
    "hasBoundsClamping" BOOLEAN NOT NULL DEFAULT false,
    "deltas" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_plan_recalculation_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meal_plan_recalculation_audits_mealPlanId_idx" ON "meal_plan_recalculation_audits"("mealPlanId");

-- CreateIndex
CREATE INDEX "meal_plan_recalculation_audits_clientId_idx" ON "meal_plan_recalculation_audits"("clientId");

-- CreateIndex
CREATE INDEX "meal_plan_recalculation_audits_actorId_idx" ON "meal_plan_recalculation_audits"("actorId");

-- CreateIndex
CREATE INDEX "meal_plan_recalculation_audits_createdAt_idx" ON "meal_plan_recalculation_audits"("createdAt");
