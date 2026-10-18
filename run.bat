@echo off
echo Cleaning up any existing processes on ports 4567 and 4568...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4567 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4568 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>nul

echo Starting backend and frontend services...
start "Tuition Agent Backend (Port 4568)" cmd /k "cd /d %~dp0backend && npm run start:dev"
start "Tuition Agent Frontend (Port 4567)" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Both services are starting in dedicated windows.
echo Backend: http://localhost:4568
echo Frontend: http://localhost:4567
timeout /t 5 /nobreak >nul
start http://localhost:4567

