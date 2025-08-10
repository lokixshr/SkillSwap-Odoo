#!/usr/bin/env powershell

Write-Host "=== SkillSwap Firebase Deployment Script ===" -ForegroundColor Green
Write-Host "This script will build your project and deploy it to Firebase Hosting" -ForegroundColor Yellow
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

# Check if Firebase CLI is installed
try {
    firebase --version | Out-Null
    Write-Host "✓ Firebase CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Firebase CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "  npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged into Firebase
try {
    $firebaseUser = firebase projects:list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ You are not logged into Firebase. Please login first:" -ForegroundColor Red
        Write-Host "  firebase login" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✓ Firebase CLI is authenticated" -ForegroundColor Green
} catch {
    Write-Host "✗ Error checking Firebase authentication" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Step 1: Installing Dependencies ===" -ForegroundColor Cyan
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Step 2: Building Project ===" -ForegroundColor Cyan
try {
    # Clean previous build
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Host "✓ Cleaned previous build" -ForegroundColor Green
    }
    
    # Build the project
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    
    # Verify build output
    if (-not (Test-Path "dist/index.html")) {
        throw "Build output missing - no index.html found in dist/"
    }
    
    Write-Host "✓ Project built successfully" -ForegroundColor Green
    
    # Show build info
    $distSize = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum
    $distSizeMB = [math]::Round($distSize / 1MB, 2)
    Write-Host "  Build size: $distSizeMB MB" -ForegroundColor Gray
    
} catch {
    Write-Host "✗ Build failed: $_" -ForegroundColor Red
    Write-Host "Please check the build logs above for errors." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Step 3: Deploying to Firebase ===" -ForegroundColor Cyan
try {
    # Deploy to Firebase
    firebase deploy --only hosting
    if ($LASTEXITCODE -ne 0) {
        throw "Firebase deployment failed"
    }
    
    Write-Host "✓ Deployment completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Deployment failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Deployment Summary ===" -ForegroundColor Green
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host "✓ Project built" -ForegroundColor Green  
Write-Host "✓ Deployed to Firebase Hosting" -ForegroundColor Green
Write-Host ""

# Get project info
try {
    $firebaserc = Get-Content ".firebaserc" | ConvertFrom-Json
    $projectId = $firebaserc.projects.default
    Write-Host "🚀 Your app is live at: https://$projectId.web.app" -ForegroundColor Cyan
    Write-Host "🔗 Firebase Console: https://console.firebase.google.com/project/$projectId" -ForegroundColor Cyan
} catch {
    Write-Host "✓ Deployment completed! Check your Firebase console for the live URL." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Tips for Future Deployments ===" -ForegroundColor Yellow
Write-Host "• Use 'npm run firebase:build' for quick build + deploy" -ForegroundColor Gray
Write-Host "• Use 'npm run build' to test builds locally with 'npm run preview'" -ForegroundColor Gray
Write-Host "• Your latest changes are now live on Firebase!" -ForegroundColor Gray
Write-Host ""
