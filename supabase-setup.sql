-- Supabase Database Schema Setup
-- Run this in your Supabase SQL Editor

-- Create User table
CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Meal table
CREATE TABLE "Meal" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "ingredients" TEXT[],
    "instructions" TEXT[],
    "prepTime" INTEGER,
    "cookTime" INTEGER,
    "difficulty" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Video table
CREATE TABLE "Video" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "duration" INTEGER,
    "difficulty" TEXT,
    "muscleGroups" TEXT[],
    "equipment" TEXT[],
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create MealAssignment table
CREATE TABLE "MealAssignment" (
    "id" SERIAL PRIMARY KEY,
    "clientId" INTEGER NOT NULL,
    "mealId" INTEGER NOT NULL,
    "scheduledTime" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE
);

-- Create VideoAssignment table
CREATE TABLE "VideoAssignment" (
    "id" SERIAL PRIMARY KEY,
    "clientId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "scheduledTime" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "Meal_type_idx" ON "Meal"("type");
CREATE INDEX "Video_muscleGroups_idx" ON "Video" USING GIN("muscleGroups");
CREATE INDEX "MealAssignment_clientId_idx" ON "MealAssignment"("clientId");
CREATE INDEX "MealAssignment_scheduledTime_idx" ON "MealAssignment"("scheduledTime");
CREATE INDEX "VideoAssignment_clientId_idx" ON "VideoAssignment"("clientId");
CREATE INDEX "VideoAssignment_scheduledTime_idx" ON "VideoAssignment"("scheduledTime");

-- Insert sample admin user
INSERT INTO "User" ("name", "email", "password", "role") VALUES 
('Mike Johnson', 'coach@fitness.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'COACH');

-- Insert your personal account
INSERT INTO "User" ("name", "email", "password", "role") VALUES 
('Abdulhamid Alsaadi', 'aboood7000syw@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'CLIENT');

-- Insert sample meals
INSERT INTO "Meal" ("name", "type", "calories", "protein", "carbs", "fat", "description", "ingredients", "instructions", "prepTime", "cookTime", "difficulty", "tags") VALUES 
('Grilled Chicken Breast', 'LUNCH', 165, 31.0, 0.0, 3.6, 'Lean protein source perfect for muscle building', ARRAY['Chicken breast', 'Olive oil', 'Salt', 'Pepper'], ARRAY['Season chicken with salt and pepper', 'Heat olive oil in pan', 'Cook chicken 6-7 minutes per side'], 5, 15, 'EASY', ARRAY['high-protein', 'low-carb']),
('Oatmeal with Berries', 'BREAKFAST', 320, 12.0, 54.0, 8.0, 'Nutritious breakfast with complex carbs', ARRAY['Oats', 'Mixed berries', 'Milk', 'Honey'], ARRAY['Cook oats with milk', 'Add berries and honey'], 2, 5, 'EASY', ARRAY['high-fiber', 'antioxidants']),
('Protein Smoothie', 'SNACK', 280, 25.0, 35.0, 6.0, 'Post-workout recovery drink', ARRAY['Protein powder', 'Banana', 'Milk', 'Peanut butter'], ARRAY['Blend all ingredients until smooth'], 3, 0, 'EASY', ARRAY['post-workout', 'high-protein']);

-- Insert sample videos
INSERT INTO "Video" ("title", "description", "url", "thumbnail", "duration", "difficulty", "muscleGroups", "equipment", "tags") VALUES 
('Push-up Fundamentals', 'Master the perfect push-up form', 'https://www.youtube.com/watch?v=IODxDxX7oi4', '', 600, 'BEGINNER', ARRAY['Chest', 'Shoulders', 'Triceps'], ARRAY['None'], ARRAY['bodyweight', 'upper-body']),
('Squat Technique', 'Learn proper squat form for leg development', 'https://www.youtube.com/watch?v=YaXPRqUwItQ', '', 480, 'BEGINNER', ARRAY['Legs', 'Glutes'], ARRAY['None'], ARRAY['bodyweight', 'lower-body']),
('Plank Hold Challenge', 'Core strengthening exercise', 'https://www.youtube.com/watch?v=pSHjTRCQxIw', '', 300, 'INTERMEDIATE', ARRAY['Core'], ARRAY['None'], ARRAY['core', 'isometric']);

-- Create sample assignments
INSERT INTO "MealAssignment" ("clientId", "mealId", "scheduledTime") VALUES 
((SELECT id FROM "User" WHERE email = 'aboood7000syw@gmail.com'), 1, CURRENT_TIMESTAMP + INTERVAL '1 hour'),
((SELECT id FROM "User" WHERE email = 'aboood7000syw@gmail.com'), 2, CURRENT_TIMESTAMP + INTERVAL '1 day'),
((SELECT id FROM "User" WHERE email = 'aboood7000syw@gmail.com'), 3, CURRENT_TIMESTAMP + INTERVAL '2 hours');

INSERT INTO "VideoAssignment" ("clientId", "videoId", "scheduledTime") VALUES 
((SELECT id FROM "User" WHERE email = 'aboood7000syw@gmail.com'), 1, CURRENT_TIMESTAMP + INTERVAL '30 minutes'),
((SELECT id FROM "User" WHERE email = 'aboood7000syw@gmail.com'), 2, CURRENT_TIMESTAMP + INTERVAL '1 day'),
((SELECT id FROM "User" WHERE email = 'aboood7000syw@gmail.com'), 3, CURRENT_TIMESTAMP + INTERVAL '2 days');