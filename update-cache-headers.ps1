#!/usr/bin/env pwsh

# Script to add cache headers to all remaining API routes
$apiDir = "c:\Users\alsaa\Desktop\check-again\primal-powerhouse-dashboard\primal-powerhouse-dashboard\src\app\api"

# List of routes to update (those with GET handlers that return personalized data)
$routesToUpdate = @(
    "workouts\route.ts",
    "workouts\[id]\route.ts",
    "videos\route.ts",
    "videos\[id]\route.ts",
    "schedule\route.ts",
    "user\coach\route.ts",
    "user\feedback\route.ts",
    "user-dashboard\videos\route.ts",
    "dashboard\stats\route.ts",
    "clients\route.ts",
    "clients\[id]\route.ts",
    "admin\check-auth\route.ts",
    "meals\route.ts",
    "meal-plans\route.ts",
    "meal-assignments\route.ts"
)

foreach ($file in $routesToUpdate) {
    $filePath = Join-Path $apiDir $file
    if (Test-Path $filePath) {
        Write-Host "Updating $file..."
        
        # Read the file
        $content = Get-Content $filePath -Raw
        
        # Check if already has import
        if ($content -notmatch "from '@/lib/cacheHeaders'") {
            # Add import after other imports
            $content = $content -replace "(import.*?from '@/lib/prisma';)", "`$1`nimport { jsonWithCache } from '@/lib/cacheHeaders';"
            
            # Replace NextResponse.json( with jsonWithCache(
            $content = $content -replace "(\s+)return NextResponse\.json\(", "`$1return jsonWithCache("
            
            # Write back
            Set-Content $filePath $content
            Write-Host "  OK Updated"
        }
        else {
            Write-Host "  Skip Already updated"
        }
    }
    else {
        Write-Host "  Missing File not found: $filePath"
    }
}

Write-Host "Done!"
