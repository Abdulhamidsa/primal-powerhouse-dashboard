CREATE TYPE "SideType" AS ENUM ('SALAD', 'SOUP');

CREATE TABLE "side_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SideType" NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiber" DOUBLE PRECISION,
    "ingredients" TEXT,
    "spices" TEXT,
    "instructions" TEXT,
    "foodOrigin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mealAssignmentId" TEXT,
    "coachId" TEXT NOT NULL,
    "clientId" TEXT,

    CONSTRAINT "side_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "side_items_mealAssignmentId_key" ON "side_items"("mealAssignmentId");
CREATE INDEX "side_items_type_idx" ON "side_items"("type");
CREATE INDEX "side_items_coachId_idx" ON "side_items"("coachId");
CREATE INDEX "side_items_clientId_idx" ON "side_items"("clientId");

ALTER TABLE "side_items" ADD CONSTRAINT "side_items_mealAssignmentId_fkey"
FOREIGN KEY ("mealAssignmentId") REFERENCES "meal_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "side_items" ADD CONSTRAINT "side_items_coachId_fkey"
FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "side_items" ADD CONSTRAINT "side_items_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;