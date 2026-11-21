@echo off
echo ========================================================
echo   GeoForge AI - Autonomous Drone Surveillance System
echo ========================================================
echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8000...
start cmd /k "cd backend && python run.py"

timeout /t 2 >nul

echo [2/2] Starting React + Vite Frontend on http://localhost:5173...
start cmd /k "cd frontend && npm run dev"

echo.
echo GeoForge AI is launching!
echo Backend API Docs: http://localhost:8000/docs
echo Frontend Dashboard: http://localhost:5173
echo ========================================================
pause
