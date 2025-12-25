# Production Migration Script
# This script applies pending database migrations to production

Write-Host "🔄 Deploying Database Migrations to Production..." -ForegroundColor Cyan

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: DATABASE_URL environment variable is not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set your production DATABASE_URL:" -ForegroundColor Yellow
    Write-Host '  $env:DATABASE_URL="your-production-database-url"' -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can find this in your Vercel dashboard:" -ForegroundColor Yellow
    Write-Host "  1. Go to your project settings" -ForegroundColor Yellow
    Write-Host "  2. Navigate to Environment Variables" -ForegroundColor Yellow
    Write-Host "  3. Copy the DATABASE_URL value" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ DATABASE_URL is set" -ForegroundColor Green
Write-Host ""

# Show what will be migrated
Write-Host "📋 Checking migration status..." -ForegroundColor Cyan
npx prisma migrate status

Write-Host ""
Write-Host "⚠️  WARNING: This will apply migrations to your PRODUCTION database!" -ForegroundColor Yellow
Write-Host "Database: $($env:DATABASE_URL.Split('@')[1].Split('/')[0])" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Do you want to continue? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Migration cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Applying migrations..." -ForegroundColor Cyan

# Apply migrations
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migrations applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 Generating Prisma Client..." -ForegroundColor Cyan
    npx prisma generate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Done! Your production database is now up to date." -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Test the login at: https://app.primalpowerhouse.com/api/health" -ForegroundColor White
        Write-Host "  2. Try logging in at: https://app.primalpowerhouse.com/user/login" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Red
    exit 1
}
