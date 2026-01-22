# Apply Prisma migrations to production database
Write-Host "Applying migrations to production database..." -ForegroundColor Green

$productionDatabaseUrl = "postgres://postgres.ggexaunrsqhtvtfdhlfz:nRatIwFmzmkYXLV0@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"

# Set the environment variable
$env:DATABASE_URL = $productionDatabaseUrl

Write-Host "Database URL set" -ForegroundColor Yellow
Write-Host "Running Prisma migrations..." -ForegroundColor Yellow

# Run the migrations
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations applied successfully!" -ForegroundColor Green
    Write-Host "The feedback and workouts tables should now exist in your production database." -ForegroundColor Green
} else {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
}
