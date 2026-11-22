@echo off
title Clinic Patient Manager
cd /d "%~dp0"
echo.
echo  Clinic Patient Manager
echo  ----------------------
where node >nul 2>nul
if errorlevel 1 (
  echo  Node.js is not installed. Opening nodejs.org - install the LTS version, then double-click this file again.
  start "" https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo  First run: installing, this takes a few minutes...
  call npm install
  if errorlevel 1 (
    echo  Install failed. See the messages above.
    pause
    exit /b 1
  )
)
echo  Starting... your browser will open at http://localhost:3000
echo  Keep this window open while you use the app. Close it to stop.
start "" /b powershell -NoProfile -Command "Start-Sleep 10; Start-Process http://localhost:3000"
call npm run dev
pause
