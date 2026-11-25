@echo off
setlocal
cd /d "%~dp0"
title LightViana DMX - Windows Host Server
color 0B
echo ============================================================
echo   LightViana DMX - Windows Host ^& Android Wi-Fi Bridge
echo ============================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERROR] Node.js not found. Please install Node.js 22+ from https://nodejs.org/
  echo Tip: You can still open "index.html" (or "dist\index.html"^) directly in Chrome/Edge for standalone mode!
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)

if not exist "dist\index.html" (
  echo Building standalone ^& production bundle...
  call npm run build
)

echo.
echo Starting LightViana DMX Server on port 3000 (0.0.0.0)...
echo Tip: If your Android tablet cannot connect over Wi-Fi, allow TCP port 3000 in Windows Defender Firewall.
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"
set NODE_ENV=production
if exist "node_modules\.bin\tsx.cmd" (
  call "node_modules\.bin\tsx.cmd" server.ts
) else (
  node server.ts
)
pause
