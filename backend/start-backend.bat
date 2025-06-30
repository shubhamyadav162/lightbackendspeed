@echo off
echo Starting LightSpeedPay Backend Server...
echo Port: 3100
echo Environment: Development

cd backend
echo Checking if .env.local exists...
if not exist ".env.local" (
    echo ERROR: .env.local file not found!
    echo Please ensure the environment file exists.
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install

echo Starting backend server on port 3100...
call npm run dev

pause 