Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  GeoForge AI - Autonomous Drone Surveillance System" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1/2] Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python run.py"

Start-Sleep -Seconds 2

Write-Host "[2/2] Launching React Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "Both services launched successfully in independent processes!" -ForegroundColor Cyan
Write-Host "Backend API Docs: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "Frontend App:     http://localhost:5173" -ForegroundColor Gray
