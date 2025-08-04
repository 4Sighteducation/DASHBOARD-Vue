# Build script for Vue Dashboard
Write-Host "Building Vue Dashboard..." -ForegroundColor Yellow

# Navigate to Vue dashboard directory
Set-Location "C:\Users\tonyd\OneDrive - 4Sight Education Ltd\Apps\DASHBOARD\DASHBOARD\DASHBOARD-Vue"

# Install dependencies if needed
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build the project
Write-Host "Running build..." -ForegroundColor Yellow
npm run build

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build completed successfully!" -ForegroundColor Green
    
    # List the built files
    Write-Host "`nBuilt files in dist folder:" -ForegroundColor Cyan
    Get-ChildItem -Path ".\dist" | Format-Table Name, Length, LastWriteTime
    
    Write-Host "`nNOTE: To deploy, upload the files in the dist folder to your CDN/GitHub" -ForegroundColor Yellow
    Write-Host "The App Loader is configured to load from: https://cdn.jsdelivr.net/gh/4Sighteducation/DASHBOARD-Vue@main/dist/" -ForegroundColor Yellow
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}