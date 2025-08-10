# SkillSwap Supabase + Docker Setup Script

Write-Host "🚀 Setting up SkillSwap with Supabase + Docker..." -ForegroundColor Green

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
Write-Host "Checking docker-compose..." -ForegroundColor Yellow
try {
    docker-compose version | Out-Null
    Write-Host "✅ docker-compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ docker-compose is not available. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created from .env.example" -ForegroundColor Green
    Write-Host "⚠️ Please update your Firebase credentials in .env file" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Stop any existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans

# Start Supabase services
Write-Host "Starting Supabase services with Docker..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be ready
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check if services are running
Write-Host "Checking service status..." -ForegroundColor Yellow
$services = @("db", "kong", "auth", "rest", "realtime", "studio", "meta")
$allRunning = $true

foreach ($service in $services) {
    $status = docker-compose ps --services --filter "status=running" | Select-String -Pattern $service
    if ($status) {
        Write-Host "✅ $service is running" -ForegroundColor Green
    } else {
        Write-Host "❌ $service is not running" -ForegroundColor Red
        $allRunning = $false
    }
}

if ($allRunning) {
    Write-Host ""
    Write-Host "🎉 Supabase setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services available at:" -ForegroundColor Cyan
    Write-Host "  🔗 Supabase Studio (Dashboard): http://localhost:3001" -ForegroundColor White
    Write-Host "  🔗 Supabase API: http://localhost:8000" -ForegroundColor White
    Write-Host "  🔗 PostgreSQL Database: localhost:5432" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Update your .env file with Firebase credentials" -ForegroundColor White
    Write-Host "  2. Run 'npm run dev' to start your React application" -ForegroundColor White
    Write-Host "  3. Visit http://localhost:3001 to access Supabase Studio" -ForegroundColor White
    Write-Host ""
    Write-Host "To stop services: docker-compose down" -ForegroundColor Yellow
    Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Some services failed to start. Check logs:" -ForegroundColor Red
    Write-Host "docker-compose logs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
