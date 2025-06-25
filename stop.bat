@echo off
echo Stopping LightSpeedPay Integrated services...

:: This is safer than killing all node.exe processes
:: It will only kill cmd windows we started with "npm run" commands
echo Stopping Node.js processes...
taskkill /f /fi "WINDOWTITLE eq npm run dev*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq npm run workers*" >nul 2>&1

echo All services stopped! 