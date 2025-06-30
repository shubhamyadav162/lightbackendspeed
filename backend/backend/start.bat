@echo off
echo Starting LightSpeedPay Integrated...

:: Check if .env file exists
if not exist .env (
  echo Error: .env file not found!
  echo Please create a .env file with the required environment variables.
  exit /b 1
)

:: Start Next.js development server
echo Starting Next.js development server...
start cmd /k "npm run dev"

:: Wait a bit to allow the Next.js server to start
timeout /t 5 /nobreak

:: Start worker processes
echo Starting worker processes...
start cmd /k "npm run workers"

echo All services started!
echo Access the application at: http://localhost:3000
echo.
echo Press Ctrl+C in the terminal windows to stop individual services
echo or run stop.bat to stop all services
echo. 