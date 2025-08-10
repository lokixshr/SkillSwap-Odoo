#!/usr/bin/env powershell

Write-Host "=== SkillSwap Connection System Repair ===" -ForegroundColor Green
Write-Host "This script will diagnose and fix connection & notification issues" -ForegroundColor Yellow
Write-Host ""

# Function to check Firebase connection
function Test-FirebaseConnection {
    Write-Host "Testing Firebase connection..." -ForegroundColor Cyan
    
    try {
        # Check if Firebase CLI is available
        $firebaseVersion = firebase --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Firebase CLI is available ($firebaseVersion)" -ForegroundColor Green
        } else {
            Write-Host "✗ Firebase CLI not found" -ForegroundColor Red
            return $false
        }

        # Check project configuration
        if (Test-Path ".firebaserc") {
            $firebaserc = Get-Content ".firebaserc" | ConvertFrom-Json
            $projectId = $firebaserc.projects.default
            Write-Host "✓ Firebase project configured: $projectId" -ForegroundColor Green
        } else {
            Write-Host "✗ No Firebase configuration found" -ForegroundColor Red
            return $false
        }

        return $true
    } catch {
        Write-Host "✗ Error checking Firebase setup: $_" -ForegroundColor Red
        return $false
    }
}

# Function to check environment variables
function Test-EnvironmentVariables {
    Write-Host "Checking environment variables..." -ForegroundColor Cyan
    
    if (-not (Test-Path ".env")) {
        Write-Host "✗ .env file not found" -ForegroundColor Red
        return $false
    }

    $envContent = Get-Content ".env"
    $requiredVars = @("VITE_API_KEY", "VITE_AUTH_DOMAIN", "VITE_PROJECT_ID")
    $missingVars = @()

    foreach ($var in $requiredVars) {
        $found = $false
        foreach ($line in $envContent) {
            if ($line -match "^$var=") {
                $found = $true
                break
            }
        }
        if (-not $found) {
            $missingVars += $var
        }
    }

    if ($missingVars.Count -eq 0) {
        Write-Host "✓ All required environment variables are present" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ Missing environment variables: $($missingVars -join ', ')" -ForegroundColor Red
        return $false
    }
}

# Function to check and fix package dependencies
function Test-Dependencies {
    Write-Host "Checking dependencies..." -ForegroundColor Cyan
    
    if (-not (Test-Path "package.json")) {
        Write-Host "✗ package.json not found" -ForegroundColor Red
        return $false
    }

    try {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        
        # Check critical dependencies
        $criticalDeps = @("firebase", "@supabase/supabase-js", "react", "react-dom")
        $missing = @()
        
        foreach ($dep in $criticalDeps) {
            if (-not ($packageJson.dependencies.$dep)) {
                $missing += $dep
            }
        }
        
        if ($missing.Count -eq 0) {
            Write-Host "✓ All critical dependencies are present" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ Missing dependencies: $($missing -join ', ')" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ Error reading package.json: $_" -ForegroundColor Red
        return $false
    }
}

# Function to build and test
function Test-Build {
    Write-Host "Testing build process..." -ForegroundColor Cyan
    
    try {
        # Clean previous build
        if (Test-Path "dist") {
            Remove-Item -Recurse -Force "dist"
        }
        
        # Attempt build
        Write-Host "  Running build..." -ForegroundColor Gray
        $buildOutput = npm run build 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Build completed successfully" -ForegroundColor Green
            
            # Check if critical files exist
            if (Test-Path "dist/index.html") {
                Write-Host "✓ Build output contains index.html" -ForegroundColor Green
                return $true
            } else {
                Write-Host "✗ Build output missing index.html" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "✗ Build failed" -ForegroundColor Red
            Write-Host "Build errors:" -ForegroundColor Yellow
            Write-Host $buildOutput -ForegroundColor Gray
            return $false
        }
    } catch {
        Write-Host "✗ Build error: $_" -ForegroundColor Red
        return $false
    }
}

# Function to apply fixes
function Apply-ConnectionFixes {
    Write-Host "Applying connection system fixes..." -ForegroundColor Cyan
    
    # Create backup
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = "backup_$timestamp"
    
    try {
        Write-Host "  Creating backup..." -ForegroundColor Gray
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        
        # Backup critical files
        $filesToBackup = @(
            "src/services/connectionsService.ts",
            "src/services/notificationsService.ts",
            "src/hooks/useNotifications.ts",
            "src/components/NotificationCenter.tsx"
        )
        
        foreach ($file in $filesToBackup) {
            if (Test-Path $file) {
                $backupPath = Join-Path $backupDir $file
                $backupParent = Split-Path $backupPath -Parent
                New-Item -ItemType Directory -Path $backupParent -Force | Out-Null
                Copy-Item $file $backupPath -Force
            }
        }
        
        Write-Host "✓ Backup created in $backupDir" -ForegroundColor Green
        
        # Replace NotificationCenter with fixed version
        if (Test-Path "src/components/NotificationCenterFixed.tsx") {
            Copy-Item "src/components/NotificationCenterFixed.tsx" "src/components/NotificationCenter.tsx" -Force
            Write-Host "✓ Updated NotificationCenter with fixed version" -ForegroundColor Green
        }
        
        return $true
    } catch {
        Write-Host "✗ Error applying fixes: $_" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "Starting diagnostic tests..." -ForegroundColor Cyan
Write-Host ""

$allTestsPassed = $true

# Run tests
$firebaseOk = Test-FirebaseConnection
$envOk = Test-EnvironmentVariables  
$depsOk = Test-Dependencies

if (-not $firebaseOk -or -not $envOk -or -not $depsOk) {
    $allTestsPassed = $false
    Write-Host ""
    Write-Host "=== CRITICAL ISSUES FOUND ===" -ForegroundColor Red
    
    if (-not $firebaseOk) {
        Write-Host "• Firebase CLI setup issues" -ForegroundColor Red
        Write-Host "  Solution: Run 'npm install -g firebase-tools' and 'firebase login'" -ForegroundColor Yellow
    }
    
    if (-not $envOk) {
        Write-Host "• Environment configuration issues" -ForegroundColor Red
        Write-Host "  Solution: Check your .env file and ensure all Firebase config vars are set" -ForegroundColor Yellow
    }
    
    if (-not $depsOk) {
        Write-Host "• Missing dependencies" -ForegroundColor Red
        Write-Host "  Solution: Run 'npm install' to install missing packages" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "=== Basic Setup: OK ===" -ForegroundColor Green
    
    # Apply fixes
    $fixesApplied = Apply-ConnectionFixes
    
    if ($fixesApplied) {
        Write-Host ""
        Write-Host "Testing build after fixes..." -ForegroundColor Cyan
        $buildOk = Test-Build
        
        if ($buildOk) {
            Write-Host ""
            Write-Host "=== ALL SYSTEMS GO! ===" -ForegroundColor Green
            Write-Host "✓ Connection system fixes applied" -ForegroundColor Green
            Write-Host "✓ Build test passed" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Yellow
            Write-Host "1. Run: npm run dev (to test locally)" -ForegroundColor Gray
            Write-Host "2. Test connection requests between users" -ForegroundColor Gray
            Write-Host "3. Run: ./deploy-to-firebase.ps1 (to deploy)" -ForegroundColor Gray
        } else {
            Write-Host ""
            Write-Host "=== BUILD ISSUES DETECTED ===" -ForegroundColor Red
            Write-Host "Fixes were applied but build still fails. Check the errors above." -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "=== FIX APPLICATION FAILED ===" -ForegroundColor Red
        Write-Host "Could not apply automatic fixes. Manual intervention required." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Connection System Issues Summary ===" -ForegroundColor Cyan
Write-Host "The main issues you reported were:" -ForegroundColor Gray
Write-Host "1. Connection requests not being received" -ForegroundColor Gray
Write-Host "2. Notifications not working properly" -ForegroundColor Gray
Write-Host "3. Different behavior between npm dev and Firebase deployment" -ForegroundColor Gray
Write-Host ""
Write-Host "Our fixes address:" -ForegroundColor Yellow
Write-Host "• Improved error handling in connection service" -ForegroundColor Gray
Write-Host "• Fixed notification component to use correct hooks" -ForegroundColor Gray
Write-Host "• LinkedIn-like connection workflow" -ForegroundColor Gray
Write-Host "• Consistent build process for Firebase deployment" -ForegroundColor Gray
Write-Host ""

if ($allTestsPassed -and $buildOk) {
    Write-Host "🎉 Your connection system should now work like LinkedIn!" -ForegroundColor Green
    Write-Host "🔧 Remember to test thoroughly before going live" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Manual fixes may be needed. Check the issues above." -ForegroundColor Yellow
}

Write-Host ""
