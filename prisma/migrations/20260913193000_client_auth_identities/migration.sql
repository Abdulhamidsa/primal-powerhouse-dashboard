-- CreateEnum
CREATE TYPE "ClientAuthProvider" AS ENUM ('GOOGLE');

-- CreateTable
CREATE TABLE "client_auth_identities" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "provider" "ClientAuthProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_auth_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_auth_identities_provider_providerAccountId_key" ON "client_auth_identities"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "client_auth_identities_clientId_idx" ON "client_auth_identities"("clientId");

-- CreateIndex
CREATE INDEX "client_auth_identities_provider_email_idx" ON "client_auth_identities"("provider", "email");

-- AddForeignKey
ALTER TABLE "client_auth_identities" ADD CONSTRAINT "client_auth_identities_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
