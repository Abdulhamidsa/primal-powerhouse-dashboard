CREATE TABLE "food_aliases" (
  "id" TEXT NOT NULL,
  "foodId" TEXT NOT NULL,
  "alias" TEXT NOT NULL,
  "normalizedAlias" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "food_aliases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "food_aliases_normalizedAlias_key" ON "food_aliases"("normalizedAlias");
CREATE INDEX "food_aliases_foodId_idx" ON "food_aliases"("foodId");
CREATE INDEX "food_aliases_alias_idx" ON "food_aliases"("alias");

ALTER TABLE "food_aliases"
ADD CONSTRAINT "food_aliases_foodId_fkey"
FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;