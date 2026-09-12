-- Add spices column to meals for richer seasoning metadata
ALTER TABLE "meals"
ADD COLUMN IF NOT EXISTS "spices" TEXT;
