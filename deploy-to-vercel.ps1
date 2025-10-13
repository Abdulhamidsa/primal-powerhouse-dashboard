# Deploy to Vercel - Clean Single Schema Approach
# Run this script to deploy to production

# 🚀 Deploying to Vercel (Clean Single Schema Approach)..." -ForegroundColor Green

Write-Host "✨ Smart deployment with automatic schema switching!" -ForegroundColor Cyan

# Step 1: Deploy to Vercel (Vercel will automatically run build:vercel)
Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "The build process will automatically switch to PostgreSQL" -ForegroundColor Gray
vercel --prod

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🔧 Post-deployment checklist:" -ForegroundColor Yellow
Write-Host "1. Add required environment variables in Vercel dashboard" -ForegroundColor Cyan
Write-Host "2. Run the SQL setup script in Supabase SQL Editor" -ForegroundColor Cyan
Write-Host "3. Test your deployed application" -ForegroundColor Cyan
Write-Host "4. Check API endpoints are working" -ForegroundColor Cyan

Write-Host "📄 Local schema remains SQLite for development" -ForegroundColor Green