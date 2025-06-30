@echo off
echo ===============================================
echo Starting LightSpeedPay Full Stack Application
echo ===============================================
echo Backend: http://localhost:3100
echo Frontend: http://localhost:5173
echo ===============================================

echo Checking environment files...

if not exist "backend\.env.local" (
    echo ERROR: Backend .env.local file not found!
    echo Please ensure backend environment file exists.
    pause
    exit /b 1
)

if not exist "frontend\.env.local" (
    echo ERROR: Frontend .env.local file not found!
    echo Please ensure frontend environment file exists.
    pause
    exit /b 1
)

echo All environment files found!
echo Starting both servers...

echo Starting Backend Server...
start "LightSpeedPay Backend" cmd /k "cd backend && npm install && npm run dev"

timeout /t 5 /nobreak >nul

echo Starting Frontend Dashboard...
start "LightSpeedPay Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo ===============================================
echo Both servers are starting...
echo Backend: http://localhost:3100
echo Frontend: http://localhost:5173
echo ===============================================
echo Press any key to exit...
pause >nul 