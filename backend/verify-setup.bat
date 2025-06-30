@echo off
echo ===============================================
echo LightSpeedPay Setup Verification
echo ===============================================

echo Checking environment files...

REM Check backend .env.local
if exist "backend\.env.local" (
    echo ✅ Backend .env.local found
) else (
    echo ❌ Backend .env.local missing
    goto :error
)

REM Check frontend .env.local  
if exist "frontend\.env.local" (
    echo ✅ Frontend .env.local found
) else (
    echo ❌ Frontend .env.local missing
    goto :error
)

echo.
echo Checking backend configuration...
findstr "NEXT_PUBLIC_SUPABASE_URL" backend\.env.local >nul
if %errorlevel%==0 (
    echo ✅ Backend Supabase URL configured
) else (
    echo ❌ Backend Supabase URL missing
    goto :error
)

findstr "PORT=3100" backend\.env.local >nul
if %errorlevel%==0 (
    echo ✅ Backend port configured (3100)
) else (
    echo ❌ Backend port not set to 3100
    goto :error
)

echo.
echo Checking frontend configuration...
findstr "VITE_SUPABASE_URL" frontend\.env.local >nul
if %errorlevel%==0 (
    echo ✅ Frontend Supabase URL configured
) else (
    echo ❌ Frontend Supabase URL missing
    goto :error
)

findstr "VITE_API_BASE_URL=http://localhost:3100" frontend\.env.local >nul
if %errorlevel%==0 (
    echo ✅ Frontend API URL configured
) else (
    echo ❌ Frontend API URL not pointing to backend
    goto :error
)

echo.
echo Checking Next.js configuration...
if exist "backend\next.config.js" (
    echo ✅ Next.js config found
) else (
    echo ❌ Next.js config missing
    goto :error
)

echo.
echo ===============================================
echo ✅ ALL CHECKS PASSED!
echo ===============================================
echo Your setup is ready to run!
echo.
echo Run 'start-both.bat' to start both servers
echo Or run individual servers with:
echo - start-backend.bat
echo - start-frontend.bat
echo.
echo Expected URLs:
echo Backend:  http://localhost:3100
echo Frontend: http://localhost:5173
echo ===============================================
pause
exit /b 0

:error
echo.
echo ===============================================
echo ❌ SETUP VERIFICATION FAILED!
echo ===============================================
echo Please fix the issues above and run again.
echo.
echo Check SETUP_INSTRUCTIONS.md for help.
echo ===============================================
pause
exit /b 1 