-- CreateTable
CREATE TABLE "user_meal_selection_sets" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT DEFAULT 'Current',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_meal_selection_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_meal_selection_items" (
    "id" TEXT NOT NULL,
    "selectionSetId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "slotIndex" INTEGER NOT NULL DEFAULT 0,
    "mealId" TEXT NOT NULL,
    "sourceMealAssignmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_meal_selection_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_meal_selection_sets_clientId_key" ON "user_meal_selection_sets"("clientId");

-- CreateIndex
CREATE INDEX "user_meal_selection_sets_clientId_idx" ON "user_meal_selection_sets"("clientId");

-- CreateIndex
CREATE INDEX "user_meal_selection_items_selectionSetId_idx" ON "user_meal_selection_items"("selectionSetId");

-- CreateIndex
CREATE INDEX "user_meal_selection_items_mealType_idx" ON "user_meal_selection_items"("mealType");

-- CreateIndex
CREATE UNIQUE INDEX "user_meal_selection_items_selectionSetId_mealType_slotIndex_key" ON "user_meal_selection_items"("selectionSetId", "mealType", "slotIndex");

-- AddForeignKey
ALTER TABLE "user_meal_selection_sets" ADD CONSTRAINT "user_meal_selection_sets_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_meal_selection_items" ADD CONSTRAINT "user_meal_selection_items_selectionSetId_fkey" FOREIGN KEY ("selectionSetId") REFERENCES "user_meal_selection_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_meal_selection_items" ADD CONSTRAINT "user_meal_selection_items_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_meal_selection_items" ADD CONSTRAINT "user_meal_selection_items_sourceMealAssignmentId_fkey" FOREIGN KEY ("sourceMealAssignmentId") REFERENCES "meal_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

