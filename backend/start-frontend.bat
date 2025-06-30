@echo off
echo Starting LightSpeedPay Frontend Dashboard...
echo Port: 5173
echo Environment: Development

cd frontend
echo Checking if .env.local exists...
if not exist ".env.local" (
    echo ERROR: .env.local file not found!
    echo Please ensure the environment file exists.
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install

echo Starting frontend server on port 5173...
call npm run dev

pause 