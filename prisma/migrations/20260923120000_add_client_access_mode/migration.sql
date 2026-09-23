-- Add explicit product experience access mode without changing existing client data.
CREATE TYPE "ClientAccessMode" AS ENUM ('SELF_SERVICE', 'COACHING');

ALTER TABLE "clients" ADD COLUMN "accessMode" "ClientAccessMode" NOT NULL DEFAULT 'COACHING';
