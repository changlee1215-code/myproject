@echo off
setlocal
cd /d "%~dp0"

:: PATH check
if exist "C:\Program Files\nodejs\npm.cmd" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ========================================================
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js LTS from:
    echo https://nodejs.org
    echo ========================================================
    pause
    exit /b
)

echo ========================================================
echo Starting TRAFFIC INSIGHT Dashboard...
echo ========================================================
echo.

if not exist "node_modules\" (
    echo [INFO] First time run: Installing dependencies...
    echo Please wait 1-2 minutes...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed. Please check internet connection.
        pause
        exit /b
    )
    echo.
    echo [OK] Installation complete!
    echo.
)

echo [INFO] Starting local dev server...
echo.

call npm run dev -- --open

pause
