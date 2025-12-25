-- Supabase Database Schema Setup
-- Run this in your Supabase SQL Editor

-- Create ENUMS (required by Prisma)
CREATE TYPE "Role" AS ENUM ('COACH', 'ADMIN');
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAUSED');
CREATE TYPE "ActivityLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH');
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');
CREATE TYPE "WorkoutType" AS ENUM ('STRENGTH_TRAINING', 'CARDIO', 'FUNCTIONAL', 'FLEXIBILITY', 'SPORTS_SPECIFIC');
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "VideoCategory" AS ENUM ('STRENGTH_TRAINING', 'CARDIO', 'MOBILITY', 'FUNCTIONAL', 'YOGA', 'PILATES', 'WARM_UP', 'COOL_DOWN', 'REHABILITATION', 'SPORTS_SPECIFIC');
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- Create User table (mapped to "users" in Prisma)
CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COACH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "clients" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentWeight" DOUBLE PRECISION,
    "targetWeight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "age" INTEGER,
    "activityLevel" "ActivityLevel",
    "dietaryRestrictions" TEXT,
    "goals" TEXT,
    "notes" TEXT,
    "lastSession" TIMESTAMP(3),
    "nextSession" TIMESTAMP(3),
    "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "progressPhotos" TEXT,
    "coachId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create Meal table (mapped to "meals" in Prisma)
CREATE TABLE "meals" (
    "id" TEXT PRIMARY KEY,
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
    "coachId" TEXT NOT NULL,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE
);

-- Create Video table (mapped to "videos" in Prisma)
CREATE TABLE "videos" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "VideoCategory" NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "duration" INTEGER NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "equipment" TEXT,
    "muscleGroups" TEXT,
    "tags" TEXT,
    "instructions" TEXT,
    "tips" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "coachId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create MealPlan table (mapped to "meal_plans" in Prisma)
CREATE TABLE "meal_plans" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE
);

-- Create MealAssignment table (mapped to "meal_assignments" in Prisma)
CREATE TABLE "meal_assignments" (
    "id" TEXT PRIMARY KEY,
    "dayOfWeek" INTEGER NOT NULL,
    "mealType" "MealType" NOT NULL,
    "portion" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "scheduledTime" TEXT,
    "notes" TEXT,
    "mealPlanId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("mealPlanId") REFERENCES "meal_plans"("id") ON DELETE CASCADE,
    FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE
);

-- Create VideoAssignment table (mapped to "video_assignments" in Prisma)
CREATE TABLE "video_assignments" (
    "id" TEXT PRIMARY KEY,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "scheduledTime" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "clientId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE,
    FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "meals_type_idx" ON "meals"("type");
CREATE INDEX "clients_coachId_idx" ON "clients"("coachId");
CREATE INDEX "video_assignments_clientId_idx" ON "video_assignments"("clientId");
CREATE INDEX "meal_assignments_mealPlanId_idx" ON "meal_assignments"("mealPlanId");

-- Insert sample coach user
INSERT INTO "users" ("id", "name", "email", "password", "role") VALUES 
('coach-1', 'Mike Johnson', 'coach@fitness.com', '$2b$10$Q82SY.sGM5HvD2u2BMjeC.CXTiDd1t8uFgWQuq/eQ4zLwGrb1Nilm', 'COACH');

-- Insert your personal account as a client
INSERT INTO "clients" ("id", "name", "email", "password", "coachId") VALUES 
('client-1', 'Abdulhamid Alsaadi', 'aboood7000syw@gmail.com', '$2b$10$tZFgUUz.iuEpD3b35jPNTexpucgLT7BCUloR73teWxVZLdSSz0beC', 'coach-1');

-- Insert sample meals
INSERT INTO "meals" ("id", "name", "type", "calories", "protein", "carbs", "fat", "coachId", "ingredients", "instructions", "prepTime", "cookTime", "tags") VALUES 
('meal-1', 'Grilled Chicken Breast', 'LUNCH', 165, 31.0, 0.0, 3.6, 'coach-1', '["Chicken breast", "Olive oil", "Salt", "Pepper"]', '["Season chicken with salt and pepper", "Heat olive oil in pan", "Cook chicken 6-7 minutes per side"]', 5, 15, '["high-protein", "low-carb"]'),
('meal-2', 'Oatmeal with Berries', 'BREAKFAST', 320, 12.0, 54.0, 8.0, 'coach-1', '["Oats", "Mixed berries", "Milk", "Honey"]', '["Cook oats with milk", "Add berries and honey"]', 2, 5, '["high-fiber", "antioxidants"]'),
('meal-3', 'Protein Smoothie', 'SNACK', 280, 25.0, 35.0, 6.0, 'coach-1', '["Protein powder", "Banana", "Milk", "Peanut butter"]', '["Blend all ingredients until smooth"]', 3, 0, '["post-workout", "high-protein"]');

-- Insert sample videos
INSERT INTO "videos" ("id", "title", "description", "category", "difficulty", "duration", "videoUrl", "coachId", "muscleGroups", "equipment", "tags") VALUES 
('video-1', 'Push-up Fundamentals', 'Master the perfect push-up form', 'STRENGTH_TRAINING', 'BEGINNER', 600, 'https://www.youtube.com/watch?v=IODxDxX7oi4', 'coach-1', '["Chest", "Shoulders", "Triceps"]', '["None"]', '["bodyweight", "upper-body"]'),
('video-2', 'Squat Technique', 'Learn proper squat form for leg development', 'STRENGTH_TRAINING', 'BEGINNER', 480, 'https://www.youtube.com/watch?v=YaXPRqUwItQ', 'coach-1', '["Legs", "Glutes"]', '["None"]', '["bodyweight", "lower-body"]'),
('video-3', 'Plank Hold Challenge', 'Core strengthening exercise', 'STRENGTH_TRAINING', 'INTERMEDIATE', 300, 'https://www.youtube.com/watch?v=pSHjTRCQxIw', 'coach-1', '["Core"]', '["None"]', '["core", "isometric"]');

-- Create sample meal plan and assignments
INSERT INTO "meal_plans" ("id", "name", "startDate", "clientId") VALUES 
('plan-1', 'Weekly Nutrition Plan', CURRENT_TIMESTAMP, 'client-1');

INSERT INTO "meal_assignments" ("id", "dayOfWeek", "mealType", "mealPlanId", "mealId", "scheduledTime") VALUES 
('assignment-1', 1, 'BREAKFAST', 'plan-1', 'meal-2', '08:00'),
('assignment-2', 1, 'LUNCH', 'plan-1', 'meal-1', '12:00'),
('assignment-3', 1, 'SNACK', 'plan-1', 'meal-3', '15:00');

-- Create sample video assignments
INSERT INTO "video_assignments" ("id", "clientId", "videoId", "scheduledTime") VALUES 
('vassign-1', 'client-1', 'video-1', '09:00'),
('vassign-2', 'client-1', 'video-2', '10:00'),
('vassign-3', 'client-1', 'video-3', '11:00');