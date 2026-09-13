-- CreateEnum
CREATE TYPE "ClientServiceTier" AS ENUM ('FREE_PROGRAM', 'SELF_GUIDED_PAID', 'COACHING');

-- CreateEnum
CREATE TYPE "ClientSignupSource" AS ENUM ('ADMIN_CREATED', 'SELF_SIGNUP');

-- CreateEnum
CREATE TYPE "ProgramEnrollmentStatus" AS ENUM ('READY', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OnboardingGoal" AS ENUM ('LOSE_FAT', 'BUILD_MUSCLE', 'GENERAL_FITNESS');

-- CreateEnum
CREATE TYPE "OnboardingExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN "serviceTier" "ClientServiceTier" NOT NULL DEFAULT 'COACHING',
ADD COLUMN "signupSource" "ClientSignupSource" NOT NULL DEFAULT 'ADMIN_CREATED',
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL DEFAULT 42,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_enrollments" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "status" "ProgramEnrollmentStatus" NOT NULL DEFAULT 'READY',
    "startedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "upgradedAt" TIMESTAMP(3),
    "goal" "OnboardingGoal",
    "experienceLevel" "OnboardingExperienceLevel",
    "trainingDaysPerWeek" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "programs_slug_key" ON "programs"("slug");

-- CreateIndex
CREATE INDEX "programs_isActive_idx" ON "programs"("isActive");

-- CreateIndex
CREATE INDEX "program_enrollments_clientId_idx" ON "program_enrollments"("clientId");

-- CreateIndex
CREATE INDEX "program_enrollments_programId_idx" ON "program_enrollments"("programId");

-- CreateIndex
CREATE INDEX "program_enrollments_status_idx" ON "program_enrollments"("status");

-- CreateIndex
CREATE INDEX "program_enrollments_clientId_status_idx" ON "program_enrollments"("clientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_tokenHash_key" ON "email_verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_clientId_idx" ON "email_verification_tokens"("clientId");

-- CreateIndex
CREATE INDEX "email_verification_tokens_expiresAt_idx" ON "email_verification_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_clientId_idx" ON "password_reset_tokens"("clientId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expiresAt_idx" ON "password_reset_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "users_isSystem_idx" ON "users"("isSystem");

-- CreateIndex
CREATE INDEX "clients_serviceTier_idx" ON "clients"("serviceTier");

-- CreateIndex
CREATE INDEX "clients_signupSource_idx" ON "clients"("signupSource");

-- CreateIndex
CREATE INDEX "clients_emailVerifiedAt_idx" ON "clients"("emailVerifiedAt");

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
