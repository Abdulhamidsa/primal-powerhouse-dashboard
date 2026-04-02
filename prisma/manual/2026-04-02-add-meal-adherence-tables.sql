CREATE TABLE IF NOT EXISTS "meal_completions" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "mealId" TEXT NOT NULL,
  "dayDate" TIMESTAMP(3) NOT NULL,
  "mealType" "MealType" NOT NULL,
  "slotIndex" INTEGER NOT NULL DEFAULT 0,
  "sourceMealAssignmentId" TEXT,
  "portionSnapshot" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "caloriesSnapshot" DOUBLE PRECISION NOT NULL,
  "proteinSnapshot" DOUBLE PRECISION NOT NULL,
  "carbsSnapshot" DOUBLE PRECISION NOT NULL,
  "fatSnapshot" DOUBLE PRECISION NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meal_completions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "meal_completions_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "meal_completions_mealId_fkey"
    FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "meal_completions_clientId_dayDate_mealType_slotIndex_key"
  ON "meal_completions"("clientId", "dayDate", "mealType", "slotIndex");

CREATE INDEX IF NOT EXISTS "meal_completions_clientId_idx"
  ON "meal_completions"("clientId");

CREATE INDEX IF NOT EXISTS "meal_completions_dayDate_idx"
  ON "meal_completions"("dayDate");

CREATE INDEX IF NOT EXISTS "meal_completions_mealId_idx"
  ON "meal_completions"("mealId");

CREATE TABLE IF NOT EXISTS "daily_intake_overrides" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "dayDate" TIMESTAMP(3) NOT NULL,
  "calories" DOUBLE PRECISION NOT NULL,
  "protein" DOUBLE PRECISION NOT NULL,
  "carbs" DOUBLE PRECISION NOT NULL,
  "fat" DOUBLE PRECISION NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_intake_overrides_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "daily_intake_overrides_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "daily_intake_overrides_clientId_dayDate_key"
  ON "daily_intake_overrides"("clientId", "dayDate");

CREATE INDEX IF NOT EXISTS "daily_intake_overrides_clientId_idx"
  ON "daily_intake_overrides"("clientId");

CREATE INDEX IF NOT EXISTS "daily_intake_overrides_dayDate_idx"
  ON "daily_intake_overrides"("dayDate");
