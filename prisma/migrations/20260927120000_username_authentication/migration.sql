-- Add username-based client authentication without changing existing records.
ALTER TABLE "clients" ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "clients" ADD COLUMN "username" TEXT;
ALTER TABLE "clients" ADD COLUMN "usernameNormalized" TEXT;

CREATE UNIQUE INDEX "clients_usernameNormalized_key" ON "clients"("usernameNormalized");

ALTER TYPE "ClientSignupSource" ADD VALUE 'USERNAME_SIGNUP';

ALTER TABLE "email_verification_tokens" ADD COLUMN "targetEmail" TEXT;
