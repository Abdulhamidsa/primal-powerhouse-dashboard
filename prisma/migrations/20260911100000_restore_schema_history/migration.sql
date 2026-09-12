BEGIN;
-- Recover schema changes that were missing from versioned migration history.
-- Do not deploy to an existing production schema without drift reconciliation.
-- Abort instead of discarding any historical compliance values.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "daily_check_ins" WHERE "compliance" IS NOT NULL) THEN
    RAISE EXCEPTION 'Legacy daily check-in compliance data requires an explicit preservation migration before schema recovery.';
  END IF;
END $$;

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('CONTACTED', 'HAD_MEETING', 'MADE_DEAL', 'CONVERTED');

-- CreateEnum
CREATE TYPE "PrivacyExportStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PrivacyExportFormat" AS ENUM ('JSON', 'JSON_AND_CSV');

-- CreateEnum
CREATE TYPE "DeletionRequestStatus" AS ENUM ('REQUESTED', 'ANONYMIZED', 'FINALIZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DailyNutritionStatus" AS ENUM ('ON_PLAN', 'PARTIAL', 'OFF_PLAN');

-- CreateEnum
CREATE TYPE "DailyTrainingStatus" AS ENUM ('DONE', 'PARTIAL', 'MISSED');

-- CreateEnum
CREATE TYPE "DailyCheckInHunger" AS ENUM ('SATISFIED', 'MODERATE', 'HUNGRY');

-- CreateEnum
CREATE TYPE "DailyCheckInSleep" AS ENUM ('POOR', 'OKAY', 'GOOD', 'GREAT');

-- CreateEnum
CREATE TYPE "IngredientMacroRefreshStatus" AS ENUM ('PENDING', 'RUNNING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "IngredientMacroRefreshScope" AS ENUM ('ALL', 'TEMPLATES_ONLY');

-- CreateEnum
CREATE TYPE "WorkoutSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ExerciseFeedbackType" AS ENUM ('TOO_EASY', 'FELT_GOOD', 'TOO_HEAVY', 'FORM_ISSUE', 'PAIN_DISCOMFORT');

-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'CORE', 'ABS', 'OBLIQUES', 'GLUTES', 'QUADRICEPS', 'HAMSTRINGS', 'CALVES', 'ADDUCTORS', 'ABDUCTORS', 'LEGS');

-- CreateEnum
CREATE TYPE "Equipment" AS ENUM ('DUMBBELL', 'BARBELL', 'KETTLEBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'BAND', 'TRX', 'MEDICINE_BALL', 'BOX', 'EZ_BAR', 'TRAP_BAR');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('MANUAL', 'AI_GENERATED', 'CLONED');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TrainingDayType" AS ENUM ('WORKOUT', 'REST');

-- CreateEnum
CREATE TYPE "PlanDayStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED', 'MISSED');

-- CreateEnum
CREATE TYPE "TrainingSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PerceivedDifficulty" AS ENUM ('EASY', 'GOOD', 'HARD', 'VERY_HARD');

-- AlterEnum
ALTER TYPE "ClientStatus" ADD VALUE 'ARCHIVED';

-- DropForeignKey
ALTER TABLE "public"."health_metrics" DROP CONSTRAINT "health_metrics_clientId_fkey";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "anonymizedAt" TIMESTAMP(3),
ADD COLUMN     "consentAnalytics" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentMarketingNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentMessageNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentOptionalTracking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dailyCheckinsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dailyWeightEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletionScheduledFor" TIMESTAMP(3),
ADD COLUMN     "dietaryRestrictionsEncrypted" TEXT,
ADD COLUMN     "goalsEncrypted" TEXT,
ADD COLUMN     "motivationalMessageEncrypted" TEXT,
ADD COLUMN     "notesEncrypted" TEXT,
ADD COLUMN     "nutritionTrackingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phoneEncrypted" TEXT,
ADD COLUMN     "privacyUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "progressPhotosEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "weeklyCheckinsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "weightChartEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "workoutTrackingEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "daily_check_ins" DROP COLUMN "compliance",
ADD COLUMN     "hunger" "DailyCheckInHunger",
ADD COLUMN     "note" TEXT,
ADD COLUMN     "sleep" "DailyCheckInSleep";

-- AlterTable
ALTER TABLE "feedback" ADD COLUMN     "messageEncrypted" TEXT;

-- AlterTable
ALTER TABLE "health_metrics" ADD COLUMN     "notesEncrypted" TEXT;

-- AlterTable
ALTER TABLE "weekly_check_ins" ADD COLUMN     "blockerTextEncrypted" TEXT,
ADD COLUMN     "notesEncrypted" TEXT,
ADD COLUMN     "strengthUpdateEncrypted" TEXT;

-- DropEnum
DROP TYPE "public"."DailyCheckInCompliance";

-- CreateTable
CREATE TABLE "client_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'CONTACTED',
    "subscriptionType" TEXT,
    "notes" TEXT,
    "convertedClientId" TEXT,
    "credentialEmail" TEXT,
    "credentialPasswordEncrypted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_feature_visibility" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dailyCheckinsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weeklyCheckinsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dailyWeightEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weightChartEnabled" BOOLEAN NOT NULL DEFAULT true,
    "progressPhotosEnabled" BOOLEAN NOT NULL DEFAULT true,
    "nutritionTrackingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "workoutTrackingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_feature_visibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_presences" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "conversationId" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_presences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_delivery_logs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "subscriptionCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "staleCount" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "payloadJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods_backup_before_cleanup" (
    "id" TEXT,
    "name" TEXT,
    "category" TEXT,
    "state" "FoodState",
    "caloriesKcal" DOUBLE PRECISION,
    "proteinG" DOUBLE PRECISION,
    "carbsG" DOUBLE PRECISION,
    "fatG" DOUBLE PRECISION,
    "fiberG" DOUBLE PRECISION,
    "source" "FoodSource",
    "isActive" BOOLEAN,
    "sourceRef" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "baseUnit" "FoodBaseUnit",
    "gramsPerUnit" DOUBLE PRECISION,
    "displayUnitLabel" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3)
);

-- CreateTable
CREATE TABLE "foods_copy1" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "state" "FoodState" NOT NULL,
    "caloriesKcal" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "fiberG" DOUBLE PRECISION,
    "source" "FoodSource" NOT NULL DEFAULT 'SYSTEM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sourceRef" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "baseUnit" "FoodBaseUnit" NOT NULL DEFAULT 'HUNDRED_G',
    "gramsPerUnit" DOUBLE PRECISION,
    "displayUnitLabel" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foods_copy1_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals_copy1" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MealType" NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "fiber" DOUBLE PRECISION,
    "ingredients" TEXT,
    "instructions" TEXT,
    "prepTime" INTEGER,
    "cookTime" INTEGER,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT,
    "imageUrl" TEXT,
    "isPersonalized" BOOLEAN NOT NULL DEFAULT false,
    "originalMealId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coachId" TEXT NOT NULL,
    "clientId" TEXT,
    "spices" TEXT,

    CONSTRAINT "meals_copy1_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_completions" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "dayDate" TIMESTAMP(3) NOT NULL,
    "mealType" "MealType" NOT NULL,
    "slotIndex" INTEGER NOT NULL DEFAULT 0,
    "sourceMealAssignmentId" TEXT,
    "portionSnapshot" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "caloriesSnapshot" DOUBLE PRECISION NOT NULL,
    "proteinSnapshot" DOUBLE PRECISION NOT NULL,
    "carbsSnapshot" DOUBLE PRECISION NOT NULL,
    "fatSnapshot" DOUBLE PRECISION NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_intake_overrides" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dayDate" TIMESTAMP(3) NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_intake_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_nutrition_logs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dayDate" TIMESTAMP(3) NOT NULL,
    "status" "DailyNutritionStatus" NOT NULL,
    "note" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_nutrition_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_training_logs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dayDate" TIMESTAMP(3) NOT NULL,
    "status" "DailyTrainingStatus" NOT NULL,
    "note" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_training_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_export_jobs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "PrivacyExportStatus" NOT NULL DEFAULT 'PENDING',
    "format" "PrivacyExportFormat" NOT NULL DEFAULT 'JSON_AND_CSV',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "downloadTokenHash" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "downloadedAt" TIMESTAMP(3),
    "payloadJson" TEXT,
    "csvBundleJson" TEXT,
    "storageKey" TEXT,
    "error" TEXT,

    CONSTRAINT "privacy_export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_requests" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "DeletionRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 30,
    "scheduledHardDeleteAt" TIMESTAMP(3) NOT NULL,
    "anonymizedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "reason" TEXT,
    "metadata" TEXT,

    CONSTRAINT "deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "targetUserId" TEXT,
    "action" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_macro_refresh_jobs" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" "IngredientMacroRefreshStatus" NOT NULL DEFAULT 'PENDING',
    "scope" "IngredientMacroRefreshScope" NOT NULL DEFAULT 'ALL',
    "affectedMealsCount" INTEGER NOT NULL DEFAULT 0,
    "processedMealsCount" INTEGER NOT NULL DEFAULT 0,
    "failedMealsCount" INTEGER NOT NULL DEFAULT 0,
    "nextOffset" INTEGER NOT NULL DEFAULT 0,
    "failedMealErrorsJson" TEXT,
    "error" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredient_macro_refresh_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coachId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_plan_exercises" (
    "id" TEXT NOT NULL,
    "workoutPlanId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "targetSets" INTEGER NOT NULL DEFAULT 3,
    "minReps" INTEGER NOT NULL DEFAULT 8,
    "maxReps" INTEGER NOT NULL DEFAULT 12,
    "suggestedWeightKg" DOUBLE PRECISION,
    "restSeconds" INTEGER NOT NULL DEFAULT 120,
    "notes" TEXT,

    CONSTRAINT "workout_plan_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_plan_assignments" (
    "id" TEXT NOT NULL,
    "workoutPlanId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "workout_plan_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "planAssignmentId" TEXT NOT NULL,
    "status" "WorkoutSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_logs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "planExerciseId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "feedback" "ExerciseFeedbackType",
    "feedbackNote" TEXT,

    CONSTRAINT "exercise_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "set_logs" (
    "id" TEXT NOT NULL,
    "exerciseLogId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "set_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "muscleGroup" "MuscleGroup" NOT NULL,
    "muscleGroupSecondary" "MuscleGroup",
    "equipment" "Equipment",
    "videoUrl" TEXT,
    "imageUrl" TEXT,
    "instructions" TEXT,
    "defaultSets" INTEGER,
    "defaultReps" INTEGER,
    "defaultRestSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coachId" TEXT NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT,
    "difficulty" "DifficultyLevel",
    "sourceType" "SourceType" NOT NULL DEFAULT 'MANUAL',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPromptSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coachId" TEXT NOT NULL,

    CONSTRAINT "workout_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_template_exercises" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL DEFAULT 3,
    "reps" INTEGER NOT NULL DEFAULT 8,
    "restSeconds" INTEGER NOT NULL DEFAULT 120,
    "targetRpe" DOUBLE PRECISION,
    "targetTempo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workoutTemplateId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,

    CONSTRAINT "workout_template_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_training_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "sourceType" "SourceType" NOT NULL DEFAULT 'MANUAL',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPromptSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,

    CONSTRAINT "client_training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plan_days" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "TrainingDayType" NOT NULL DEFAULT 'WORKOUT',
    "workoutTemplateId" TEXT,
    "title" TEXT,
    "note" TEXT,
    "status" "PlanDayStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planId" TEXT NOT NULL,

    CONSTRAINT "training_plan_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" TEXT NOT NULL,
    "status" "TrainingSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "planDayId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "workoutTemplateId" TEXT,
    "perceivedDifficulty" "PerceivedDifficulty",
    "overallFeedback" TEXT,
    "caloriesBurned" DOUBLE PRECISION,
    "sourceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coachId" TEXT NOT NULL,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_session_exercises" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "exerciseNameSnapshot" TEXT NOT NULL,
    "muscleGroupSnapshot" "MuscleGroup",
    "equipmentSnapshot" TEXT,
    "notesSnapshot" TEXT,
    "plannedSets" INTEGER NOT NULL,
    "plannedReps" INTEGER NOT NULL,
    "plannedRestSeconds" INTEGER NOT NULL,
    "targetRpeSnapshot" DOUBLE PRECISION,
    "targetTempoSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT,

    CONSTRAINT "training_session_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_session_sets" (
    "id" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "plannedReps" INTEGER NOT NULL,
    "plannedWeightKg" DOUBLE PRECISION,
    "plannedRestSeconds" INTEGER NOT NULL,
    "actualReps" INTEGER,
    "actualWeightKg" DOUBLE PRECISION,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionExerciseId" TEXT NOT NULL,

    CONSTRAINT "training_session_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rest_timers" (
    "id" TEXT NOT NULL,
    "sessionSetId" TEXT NOT NULL,
    "plannedSeconds" INTEGER NOT NULL,
    "actualSeconds" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rest_timers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_feature_visibility_clientId_key" ON "client_feature_visibility"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_presences_clientId_key" ON "conversation_presences"("clientId");

-- CreateIndex
CREATE INDEX "conversation_presences_conversationId_lastSeenAt_idx" ON "conversation_presences"("conversationId", "lastSeenAt");

-- CreateIndex
CREATE INDEX "conversation_presences_lastSeenAt_idx" ON "conversation_presences"("lastSeenAt");

-- CreateIndex
CREATE INDEX "push_subscriptions_clientId_idx" ON "push_subscriptions"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_clientId_endpoint_key" ON "push_subscriptions"("clientId", "endpoint");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_clientId_createdAt_idx" ON "notification_delivery_logs"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_source_createdAt_idx" ON "notification_delivery_logs"("source", "createdAt");

-- CreateIndex
CREATE INDEX "meal_completions_clientId_idx" ON "meal_completions"("clientId");

-- CreateIndex
CREATE INDEX "meal_completions_dayDate_idx" ON "meal_completions"("dayDate");

-- CreateIndex
CREATE INDEX "meal_completions_mealId_idx" ON "meal_completions"("mealId");

-- CreateIndex
CREATE UNIQUE INDEX "meal_completions_clientId_dayDate_mealType_slotIndex_key" ON "meal_completions"("clientId", "dayDate", "mealType", "slotIndex");

-- CreateIndex
CREATE INDEX "daily_intake_overrides_clientId_idx" ON "daily_intake_overrides"("clientId");

-- CreateIndex
CREATE INDEX "daily_intake_overrides_dayDate_idx" ON "daily_intake_overrides"("dayDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_intake_overrides_clientId_dayDate_key" ON "daily_intake_overrides"("clientId", "dayDate");

-- CreateIndex
CREATE INDEX "daily_nutrition_logs_clientId_idx" ON "daily_nutrition_logs"("clientId");

-- CreateIndex
CREATE INDEX "daily_nutrition_logs_dayDate_idx" ON "daily_nutrition_logs"("dayDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_nutrition_logs_clientId_dayDate_key" ON "daily_nutrition_logs"("clientId", "dayDate");

-- CreateIndex
CREATE INDEX "daily_training_logs_clientId_idx" ON "daily_training_logs"("clientId");

-- CreateIndex
CREATE INDEX "daily_training_logs_dayDate_idx" ON "daily_training_logs"("dayDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_training_logs_clientId_dayDate_key" ON "daily_training_logs"("clientId", "dayDate");

-- CreateIndex
CREATE INDEX "privacy_export_jobs_clientId_idx" ON "privacy_export_jobs"("clientId");

-- CreateIndex
CREATE INDEX "privacy_export_jobs_expiresAt_idx" ON "privacy_export_jobs"("expiresAt");

-- CreateIndex
CREATE INDEX "deletion_requests_clientId_idx" ON "deletion_requests"("clientId");

-- CreateIndex
CREATE INDEX "deletion_requests_scheduledHardDeleteAt_idx" ON "deletion_requests"("scheduledHardDeleteAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_targetUserId_idx" ON "audit_logs"("targetUserId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "ingredient_macro_refresh_jobs_foodId_idx" ON "ingredient_macro_refresh_jobs"("foodId");

-- CreateIndex
CREATE INDEX "ingredient_macro_refresh_jobs_status_idx" ON "ingredient_macro_refresh_jobs"("status");

-- CreateIndex
CREATE INDEX "ingredient_macro_refresh_jobs_requestedAt_idx" ON "ingredient_macro_refresh_jobs"("requestedAt");

-- CreateIndex
CREATE INDEX "exercises_coachId_idx" ON "exercises"("coachId");

-- CreateIndex
CREATE INDEX "exercises_muscleGroup_idx" ON "exercises"("muscleGroup");

-- CreateIndex
CREATE INDEX "workout_templates_coachId_idx" ON "workout_templates"("coachId");

-- CreateIndex
CREATE INDEX "workout_templates_difficulty_idx" ON "workout_templates"("difficulty");

-- CreateIndex
CREATE INDEX "workout_template_exercises_workoutTemplateId_idx" ON "workout_template_exercises"("workoutTemplateId");

-- CreateIndex
CREATE INDEX "workout_template_exercises_exerciseId_idx" ON "workout_template_exercises"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "workout_template_exercises_workoutTemplateId_order_key" ON "workout_template_exercises"("workoutTemplateId", "order");

-- CreateIndex
CREATE INDEX "client_training_plans_clientId_idx" ON "client_training_plans"("clientId");

-- CreateIndex
CREATE INDEX "client_training_plans_coachId_idx" ON "client_training_plans"("coachId");

-- CreateIndex
CREATE INDEX "client_training_plans_startDate_endDate_idx" ON "client_training_plans"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "client_training_plans_status_idx" ON "client_training_plans"("status");

-- CreateIndex
CREATE INDEX "training_plan_days_planId_date_idx" ON "training_plan_days"("planId", "date");

-- CreateIndex
CREATE INDEX "training_plan_days_date_idx" ON "training_plan_days"("date");

-- CreateIndex
CREATE INDEX "training_plan_days_status_idx" ON "training_plan_days"("status");

-- CreateIndex
CREATE UNIQUE INDEX "training_plan_days_planId_date_key" ON "training_plan_days"("planId", "date");

-- CreateIndex
CREATE INDEX "training_sessions_clientId_idx" ON "training_sessions"("clientId");

-- CreateIndex
CREATE INDEX "training_sessions_coachId_idx" ON "training_sessions"("coachId");

-- CreateIndex
CREATE INDEX "training_sessions_planDayId_idx" ON "training_sessions"("planDayId");

-- CreateIndex
CREATE INDEX "training_sessions_status_idx" ON "training_sessions"("status");

-- CreateIndex
CREATE INDEX "training_sessions_startedAt_idx" ON "training_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "training_sessions_completedAt_idx" ON "training_sessions"("completedAt");

-- CreateIndex
CREATE INDEX "training_session_exercises_sessionId_idx" ON "training_session_exercises"("sessionId");

-- CreateIndex
CREATE INDEX "training_session_exercises_exerciseId_idx" ON "training_session_exercises"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "training_session_exercises_sessionId_order_key" ON "training_session_exercises"("sessionId", "order");

-- CreateIndex
CREATE INDEX "training_session_sets_sessionExerciseId_idx" ON "training_session_sets"("sessionExerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "training_session_sets_sessionExerciseId_setNumber_key" ON "training_session_sets"("sessionExerciseId", "setNumber");

-- CreateIndex
CREATE UNIQUE INDEX "rest_timers_sessionSetId_key" ON "rest_timers"("sessionSetId");

-- AddForeignKey
ALTER TABLE "client_feature_visibility" ADD CONSTRAINT "client_feature_visibility_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_presences" ADD CONSTRAINT "conversation_presences_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_presences" ADD CONSTRAINT "conversation_presences_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery_logs" ADD CONSTRAINT "notification_delivery_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_metrics" ADD CONSTRAINT "health_metrics_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_completions" ADD CONSTRAINT "meal_completions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_completions" ADD CONSTRAINT "meal_completions_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_intake_overrides" ADD CONSTRAINT "daily_intake_overrides_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_nutrition_logs" ADD CONSTRAINT "daily_nutrition_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_training_logs" ADD CONSTRAINT "daily_training_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privacy_export_jobs" ADD CONSTRAINT "privacy_export_jobs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plan_exercises" ADD CONSTRAINT "workout_plan_exercises_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plan_exercises" ADD CONSTRAINT "workout_plan_exercises_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plan_assignments" ADD CONSTRAINT "workout_plan_assignments_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plan_assignments" ADD CONSTRAINT "workout_plan_assignments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_planAssignmentId_fkey" FOREIGN KEY ("planAssignmentId") REFERENCES "workout_plan_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_planExerciseId_fkey" FOREIGN KEY ("planExerciseId") REFERENCES "workout_plan_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_exerciseLogId_fkey" FOREIGN KEY ("exerciseLogId") REFERENCES "exercise_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_templates" ADD CONSTRAINT "workout_templates_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_template_exercises" ADD CONSTRAINT "workout_template_exercises_workoutTemplateId_fkey" FOREIGN KEY ("workoutTemplateId") REFERENCES "workout_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_template_exercises" ADD CONSTRAINT "workout_template_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_training_plans" ADD CONSTRAINT "client_training_plans_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_training_plans" ADD CONSTRAINT "client_training_plans_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan_days" ADD CONSTRAINT "training_plan_days_workoutTemplateId_fkey" FOREIGN KEY ("workoutTemplateId") REFERENCES "workout_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan_days" ADD CONSTRAINT "training_plan_days_planId_fkey" FOREIGN KEY ("planId") REFERENCES "client_training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_planDayId_fkey" FOREIGN KEY ("planDayId") REFERENCES "training_plan_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_workoutTemplateId_fkey" FOREIGN KEY ("workoutTemplateId") REFERENCES "workout_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_session_exercises" ADD CONSTRAINT "training_session_exercises_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_session_exercises" ADD CONSTRAINT "training_session_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_session_sets" ADD CONSTRAINT "training_session_sets_sessionExerciseId_fkey" FOREIGN KEY ("sessionExerciseId") REFERENCES "training_session_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rest_timers" ADD CONSTRAINT "rest_timers_sessionSetId_fkey" FOREIGN KEY ("sessionSetId") REFERENCES "training_session_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
