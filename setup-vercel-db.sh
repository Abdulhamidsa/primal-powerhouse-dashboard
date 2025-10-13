#!/bin/bash

# Vercel Database Setup Guide
# This script helps you set up PostgreSQL on Vercel

echo "🚀 Vercel PostgreSQL Setup Guide"
echo "================================="

echo ""
echo "Step 1: Install Vercel CLI (if not installed)"
echo "npm install -g vercel"

echo ""
echo "Step 2: Login to Vercel"
echo "vercel login"

echo ""
echo "Step 3: Link your project"
echo "vercel link"

echo ""
echo "Step 4: Add PostgreSQL Integration"
echo "Go to: https://vercel.com/dashboard"
echo "1. Select your project"
echo "2. Go to Settings > Integrations"
echo "3. Browse Marketplace and add 'Vercel Postgres'"
echo "4. Create a new database"

echo ""
echo "Step 5: Pull environment variables"
echo "vercel env pull .env.production"

echo ""
echo "Step 6: Update your schema and deploy"
echo "npx prisma generate"
echo "npx prisma db push"
echo "vercel --prod"

echo ""
echo "🔧 Manual Steps Required:"
echo "========================="
echo "1. Visit your Vercel dashboard"
echo "2. Navigate to Project > Settings > Integrations"
echo "3. Add PostgreSQL integration"
echo "4. Create a new database"
echo "5. The DATABASE_URL will be automatically added"
echo "6. Redeploy your project"

echo ""
echo "✅ After setup, your DATABASE_URL will look like:"
echo "postgresql://username:password@ep-cool-name-123456.us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require"