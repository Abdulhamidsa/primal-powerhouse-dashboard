#!/bin/bash

echo "🔍 Vercel Environment Variable Checker"
echo "======================================"
echo ""

echo "📋 REQUIRED Environment Variables for Vercel:"
echo "=============================================="
echo ""

echo "1. DATABASE_URL"
echo "   - Should start with: postgresql:// or postgres://"
echo "   - Example: postgresql://user:pass@host:5432/dbname"
echo "   - Get this from: Vercel Dashboard → Project → Settings → Integrations → Vercel Postgres"
echo ""

echo "2. JWT_SECRET"
echo "   - Should be a long random string (32+ characters)"
echo "   - Current: xY9mK2pL7qW3eR6tU4nS8aD1fG5hJ9vCzB8nM5pQ2wE3rT6yI1oP4aS7dF0gH3jK"
echo ""

echo "3. NEXTAUTH_URL"
echo "   - Should be: https://primal-powerhouse-dashboardsssssss.vercel.app"
echo ""

echo "4. NODE_ENV"
echo "   - Should be: production"
echo ""

echo ""
echo "🔧 How to Check/Fix on Vercel:"
echo "=============================="
echo ""

echo "1. Go to: https://vercel.com/dashboard"
echo "2. Select your project: primal-powerhouse-dashboardsssssss"
echo "3. Go to: Settings → Environment Variables"
echo "4. Check that all variables above are set for 'Production' environment"
echo "5. If DATABASE_URL is missing, you need to:"
echo "   - Go to Settings → Integrations"
echo "   - Add 'Vercel Postgres' integration"
echo "   - Create/connect a database"
echo "   - The DATABASE_URL will be auto-added"
echo ""

echo "6. After updating variables, redeploy:"
echo "   - Go to Deployments tab"
echo "   - Click the 3 dots on latest deployment"
echo "   - Click 'Redeploy'"
echo ""

echo ""
echo "🧪 Test Your Fix:"
echo "================="
echo ""

echo "After redeployment, test login at:"
echo "https://primal-powerhouse-dashboardsssssss.vercel.app/user/login"
echo ""

echo "Josefine's credentials:"
echo "- Email: josefine@example.com"
echo "- Password: josefine123!"
echo ""

echo "If still failing, check Vercel function logs:"
echo "- Go to Deployment → Functions tab"
echo "- Click on the failing function"
echo "- Check the logs for the actual error"