-- AlterTable
ALTER TABLE "weekly_check_ins"
ADD COLUMN "stressRating" INTEGER,
ADD COLUMN "hungerRating" INTEGER,
ADD COLUMN "digestionRating" INTEGER,
ADD COLUMN "blockerText" TEXT;
