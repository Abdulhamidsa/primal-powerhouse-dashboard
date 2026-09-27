CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "actionUrl" TEXT,
    "metadataJson" TEXT,
    "channels" TEXT[] NOT NULL DEFAULT ARRAY['IN_APP']::TEXT[],
    "readAt" TIMESTAMP(3),
    "source" TEXT,
    "sourceId" TEXT,
    "dedupeKey" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_clientId_createdAt_idx" ON "notifications"("clientId", "createdAt");
CREATE INDEX "notifications_clientId_readAt_idx" ON "notifications"("clientId", "readAt");
CREATE INDEX "notifications_clientId_dedupeKey_idx" ON "notifications"("clientId", "dedupeKey");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
