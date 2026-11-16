@echo off
setlocal
cd /d "%~dp0"
title Ipon

if not exist package.json (
  echo This file must sit inside the unzipped ipon folder, next to package.json.
  echo Move start-ipon.bat there and double-click it again.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Installing it with winget, this takes a minute...
  winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  echo.
  echo Done. Close this window and double-click start-ipon.bat again.
  pause
  exit /b 0
)

if not exist .env.local (
  echo Creating .env.local ...
  > .env.local echo VITE_SUPABASE_URL=https://abanaodgwmgrzvdvbpsq.supabase.co
  >> .env.local echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYW5hb2Rnd21ncnp2ZHZicHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNTAyMDgsImV4cCI6MjEwODgyNjIwOH0.MBfldhwPi81fYUZFqCmti4Wc5qqIJp88Qgz7_yz7_W8
)

if not exist node_modules (
  echo Installing packages, this takes a minute...
  call npm install
  if errorlevel 1 (
    echo npm install failed. Copy the messages above and send them to Claude.
    pause
    exit /b 1
  )
)

echo Starting Ipon at http://localhost:5173 - keep this window open while you use it.
start "" cmd /c "timeout /t 5 >nul & start http://localhost:5173"
call npm run dev
pause
