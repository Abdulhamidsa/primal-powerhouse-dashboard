CREATE UNIQUE INDEX "notifications_clientId_dedupeKey_key"
ON "notifications"("clientId", "dedupeKey");
