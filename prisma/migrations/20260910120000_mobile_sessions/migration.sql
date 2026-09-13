ALTER TABLE "clients" ADD COLUMN "authInvalidBefore" TIMESTAMP(3);
ALTER TABLE "messages" ADD COLUMN "clientTempId" TEXT;
CREATE UNIQUE INDEX "messages_conversationId_senderId_clientTempId_key" ON "messages"("conversationId", "senderId", "clientTempId");
CREATE TABLE "MobileSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "clientId" TEXT NOT NULL,
  "refreshHash" TEXT NOT NULL,
  "authenticatedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MobileSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MobileSession_refreshHash_key" ON "MobileSession"("refreshHash");
CREATE INDEX "MobileSession_clientId_idx" ON "MobileSession"("clientId");
CREATE TABLE "MobilePushDevice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MobilePushDevice_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MobileSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MobilePushDevice_token_key" ON "MobilePushDevice"("token");
CREATE TABLE "MobilePushDelivery" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "messageId" TEXT NOT NULL,
  "deviceToken" TEXT NOT NULL,
  "receiptId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "MobilePushDelivery_messageId_deviceToken_key" ON "MobilePushDelivery"("messageId", "deviceToken");
CREATE INDEX "MobilePushDelivery_status_createdAt_idx" ON "MobilePushDelivery"("status", "createdAt");
