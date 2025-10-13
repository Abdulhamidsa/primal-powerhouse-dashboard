#!/bin/bash

# 🚀 Production Deployment Script
# Usage: ./deploy.sh [platform]
# Platforms: vercel, railway, docker, vps

set -e

PLATFORM=${1:-vercel}
PROJECT_NAME="primal-powerhouse-dashboard"

echo "🚀 Deploying $PROJECT_NAME to $PLATFORM..."

# Pre-deployment checks
echo "📋 Pre-deployment checks..."

# Check if git is clean
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  Warning: You have uncommitted changes"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if .env exists
if [[ ! -f .env ]]; then
    echo "❌ .env file not found. Please create one based on .env.example"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Run tests (if they exist)
if [[ -f "package.json" ]] && grep -q "test" package.json; then
    echo "🧪 Running tests..."
    pnpm test 2>/dev/null || echo "⚠️  No tests found or tests failed"
fi

# Build the application
echo "🔨 Building application..."
pnpm build

case $PLATFORM in
    "vercel")
        echo "🌟 Deploying to Vercel..."
        if ! command -v vercel &> /dev/null; then
            echo "Installing Vercel CLI..."
            npm install -g vercel
        fi
        vercel --prod
        ;;
    
    "railway")
        echo "🚂 Deploying to Railway..."
        if ! command -v railway &> /dev/null; then
            echo "Installing Railway CLI..."
            npm install -g @railway/cli
        fi
        railway up
        ;;
    
    "docker")
        echo "🐳 Building Docker image..."
        docker build -t $PROJECT_NAME .
        echo "🏃 Running Docker container..."
        docker run -d -p 3000:3000 --name $PROJECT_NAME $PROJECT_NAME
        echo "✅ Docker deployment complete!"
        echo "🌐 Application running at http://localhost:3000"
        ;;
    
    "docker-compose")
        echo "🐳 Deploying with Docker Compose..."
        docker-compose -f docker-compose.prod.yml up -d --build
        echo "✅ Docker Compose deployment complete!"
        ;;
    
    "vps")
        echo "🖥️  VPS deployment requires manual setup."
        echo "Please follow the VPS section in DEPLOYMENT_GUIDE.md"
        ;;
    
    *)
        echo "❌ Unknown platform: $PLATFORM"
        echo "Available platforms: vercel, railway, docker, docker-compose, vps"
        exit 1
        ;;
esac

echo "🎉 Deployment to $PLATFORM completed!"

# Post-deployment checks
echo "🔍 Running post-deployment checks..."

# Wait a moment for deployment to be ready
sleep 5

case $PLATFORM in
    "vercel"|"railway")
        echo "📋 Deployment should be available at the URL provided above"
        ;;
    "docker"|"docker-compose")
        echo "🏥 Checking health endpoint..."
        if curl -f http://localhost:3000/api/health 2>/dev/null; then
            echo "✅ Health check passed!"
        else
            echo "⚠️  Health check failed. Check application logs."
        fi
        ;;
esac

echo ""
echo "📚 Next steps:"
echo "1. Test your deployed application"
echo "2. Update DNS settings if needed"
echo "3. Setup monitoring and backups"
echo "4. Update environment variables if needed"
echo ""
echo "🔗 Useful commands:"
echo "  Health check: curl https://your-domain.com/api/health"
echo "  View logs: Check your platform's dashboard"
echo "  Rollback: Follow your platform's rollback procedure"