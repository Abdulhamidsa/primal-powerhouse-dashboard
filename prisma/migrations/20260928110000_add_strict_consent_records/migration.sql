CREATE TYPE "ConsentRecordCategory" AS ENUM (
  'POLICY_ACKNOWLEDGEMENT',
  'OPTIONAL_CONSENT',
  'NOTIFICATION_PREFERENCE',
  'AGE_DECLARATION'
);

CREATE TYPE "ConsentRecordAction" AS ENUM (
  'ACKNOWLEDGED',
  'GRANTED',
  'WITHDRAWN',
  'ENABLED',
  'DISABLED',
  'DECLARED',
  'DECLINED'
);

CREATE TABLE "consent_records" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "category" "ConsentRecordCategory" NOT NULL,
  "type" TEXT NOT NULL,
  "action" "ConsentRecordAction" NOT NULL,
  "version" TEXT,
  "source" TEXT,
  "platform" TEXT,
  "metadataJson" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "client_notification_preferences" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "coachMessagePushEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "client_notification_preferences_pkey" PRIMARY KEY ("id")
);

INSERT INTO "client_notification_preferences" ("id", "clientId", "coachMessagePushEnabled", "createdAt", "updatedAt")
SELECT
  'legacy-' || "id",
  "id",
  "consentMessageNotifications",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "clients";

CREATE UNIQUE INDEX "client_notification_preferences_clientId_key"
  ON "client_notification_preferences"("clientId");
CREATE INDEX "consent_records_clientId_category_type_occurredAt_idx"
  ON "consent_records"("clientId", "category", "type", "occurredAt");
CREATE INDEX "consent_records_clientId_occurredAt_idx"
  ON "consent_records"("clientId", "occurredAt");

ALTER TABLE "consent_records"
  ADD CONSTRAINT "consent_records_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_notification_preferences"
  ADD CONSTRAINT "client_notification_preferences_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
