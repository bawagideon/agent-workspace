@echo off
title Gideon AI HQ — Personal AI Workforce Launcher
color 0A

echo ==============================================================================
echo 🏛️  GIDEON AI HQ V5.2 — STARTING LOCAL WORKFORCE OPERATING SYSTEM
echo ==============================================================================
echo.

cd /d "%~dp0"

:: 1. Verify OpenClaw Gateway
echo [1/3] Checking OpenClaw Gateway on port 18789...
powershell -Command "if (Test-NetConnection -ComputerName 127.0.0.1 -Port 18789 -InformationLevel Quiet) { Write-Host '✅ OpenClaw Gateway is ALIVE on port 18789.' -ForegroundColor Green } else { Write-Host '⚠️ OpenClaw Gateway is not detected. If needed, start it via: openclaw gateway start' -ForegroundColor Yellow }"

:: 2. Launch Gideon Headless Runner Daemon in a new window
echo [2/3] Launching Gideon Runner Daemon (Supabase + Realtime Queue + Policy)...
start "Gideon Runner Daemon (Background Worker)" cmd /k "title Gideon Runner Daemon && npm run runner:dev"

:: 3. Launch Gideon HQ Web Interface in a new window
echo [3/3] Launching Gideon HQ Web Dashboard on http://localhost:3000...
start "Gideon HQ Web Dashboard (Port 3000)" cmd /k "title Gideon HQ Web Dashboard && npm run dev"

echo.
echo ==============================================================================
echo 🎉 GIDEON AI HQ IS LIVE!
echo    - Dashboard: http://localhost:3000
echo    - Phone (Local Wi-Fi): Check local IP in Dashboard terminal (e.g. http://192.168.1.6:3000)
echo    - OpenClaw Bridge: Connected on 127.0.0.1:18789
echo ==============================================================================
echo.
pause
