# 🚀 Production Deployment Script (PowerShell)
# Usage: .\deploy.ps1 [platform]
# Platforms: vercel, railway, docker, vps

param(
    [Parameter(Position=0)]
    [string]$Platform = "vercel"
)

$ProjectName = "primal-powerhouse-dashboard"

Write-Host "🚀 Deploying $ProjectName to $Platform..." -ForegroundColor Green

# Pre-deployment checks
Write-Host "📋 Pre-deployment checks..." -ForegroundColor Yellow

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found. Please create one based on .env.example" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install

# Generate Prisma client
Write-Host "🗄️ Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
pnpm build

switch ($Platform) {
    "vercel" {
        Write-Host "🌟 Deploying to Vercel..." -ForegroundColor Green
        if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
            Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
        }
        vercel --prod
    }
    
    "railway" {
        Write-Host "🚂 Deploying to Railway..." -ForegroundColor Green
        if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
            Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
            npm install -g @railway/cli
        }
        railway up
    }
    
    "docker" {
        Write-Host "🐳 Building Docker image..." -ForegroundColor Green
        docker build -t $ProjectName .
        Write-Host "🏃 Running Docker container..." -ForegroundColor Green
        docker run -d -p 3000:3000 --name $ProjectName $ProjectName
        Write-Host "✅ Docker deployment complete!" -ForegroundColor Green
        Write-Host "🌐 Application running at http://localhost:3000" -ForegroundColor Cyan
    }
    
    "docker-compose" {
        Write-Host "🐳 Deploying with Docker Compose..." -ForegroundColor Green
        docker-compose -f docker-compose.prod.yml up -d --build
        Write-Host "✅ Docker Compose deployment complete!" -ForegroundColor Green
    }
    
    "vps" {
        Write-Host "🖥️ VPS deployment requires manual setup." -ForegroundColor Yellow
        Write-Host "Please follow the VPS section in DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow
    }
    
    default {
        Write-Host "❌ Unknown platform: $Platform" -ForegroundColor Red
        Write-Host "Available platforms: vercel, railway, docker, docker-compose, vps" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "🎉 Deployment to $Platform completed!" -ForegroundColor Green

# Post-deployment info
Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Cyan
Write-Host "1. Test your deployed application"
Write-Host "2. Update DNS settings if needed"  
Write-Host "3. Setup monitoring and backups"
Write-Host "4. Update environment variables if needed"
Write-Host ""
Write-Host "🔗 Useful commands:" -ForegroundColor Cyan
Write-Host "  Health check: Invoke-WebRequest https://your-domain.com/api/health"
Write-Host "  View logs: Check your platform's dashboard"
Write-Host "  Rollback: Follow your platform's rollback procedure"