# PowerShell script to clear Next.js cache and rebuild
Write-Output "Clearing Next.js cache..."
npx rimraf .next

Write-Output "Clearing browser build artifacts..."
npx rimraf .vercel
npx rimraf out

Write-Output "Reinstalling dependencies..."
npm install

Write-Output "Building application..."
npm run build

Write-Output "Starting development server..."
npm run dev
