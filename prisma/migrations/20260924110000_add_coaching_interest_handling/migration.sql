ALTER TABLE "messages"
ADD COLUMN "coachingInterestHandledAt" TIMESTAMP(3),
ADD COLUMN "coachingInterestHandledById" TEXT;

CREATE INDEX "messages_clientTempId_coachingInterestHandledAt_idx"
ON "messages"("clientTempId", "coachingInterestHandledAt");
