# Vercel PostgreSQL Database Setup Script
# Run this after creating a Vercel project and PostgreSQL integration

Write-Host "Setting up Vercel PostgreSQL Database..." -ForegroundColor Green

# Step 1: Install Vercel CLI if not installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Step 2: Login to Vercel
Write-Host "Logging into Vercel..." -ForegroundColor Yellow
vercel login

# Step 3: Initialize Vercel project (if not already done)
Write-Host "Initializing Vercel project..." -ForegroundColor Yellow
vercel link

# Step 4: Add PostgreSQL integration
Write-Host "Adding PostgreSQL integration..." -ForegroundColor Yellow
Write-Host "Please run this command in your Vercel dashboard or CLI:" -ForegroundColor Cyan
Write-Host "vercel integration add postgres" -ForegroundColor Cyan

# Step 5: Pull environment variables
Write-Host "Pulling environment variables from Vercel..." -ForegroundColor Yellow
vercel env pull .env.production

# Step 6: Generate Prisma client for PostgreSQL
Write-Host "Generating Prisma client for PostgreSQL..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://username:password@host:5432/database"
npx prisma generate

# Step 7: Deploy database schema
Write-Host "Deploying database schema..." -ForegroundColor Yellow
npx prisma db push --force-reset

# Step 8: Seed the database
Write-Host "Seeding the database..." -ForegroundColor Yellow
npx prisma db seed

# Step 9: Deploy to Vercel
Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host "Setup complete! Your app should now be running with PostgreSQL on Vercel." -ForegroundColor Green

# Manual steps reminder
Write-Host "`nMANUAL STEPS REQUIRED:" -ForegroundColor Red
Write-Host "1. Go to your Vercel dashboard" -ForegroundColor Yellow
Write-Host "2. Navigate to your project > Settings > Integrations" -ForegroundColor Yellow
Write-Host "3. Add PostgreSQL integration" -ForegroundColor Yellow
Write-Host "4. The DATABASE_URL will be automatically added to your environment variables" -ForegroundColor Yellow
Write-Host "5. Redeploy your project" -ForegroundColor Yellow